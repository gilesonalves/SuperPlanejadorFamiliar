import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.5";

type Tier = "free" | "trial" | "pro" | "premium";
type EntitlementsResponse = {
  tier: Tier;
  features: string[];
  trial_expires_at: string | null;
};

// Mapa de recursos por tier (trial libera tudo do Premium)
const FEATURE_MAP: Record<Tier, string[]> = {
  free:    ["basic"],
  trial:   ["basic", "reports", "dashboards", "autosuggestions", "exports", "multi_profile", "priority_support"],
  pro:     ["basic", "reports", "dashboards", "autosuggestions", "exports", "multi_profile"],
  premium: ["basic", "reports", "dashboards", "autosuggestions", "exports", "multi_profile", "priority_support"],
};

const ALLOWED_ORIGINS = [
  "https://app.heygar.com.br",
  "http://localhost:8080",
];

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : "https://app.heygar.com.br";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "missing_env" }), {
        status: 500,
        headers: corsHeaders(origin),
      });
    }

    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const accessToken = bearerMatch?.[1] ?? "";

    const lowerHost = new URL(req.url).hostname.toLowerCase();
    const isLocalHost =
      lowerHost === "localhost" ||
      lowerHost === "127.0.0.1" ||
      lowerHost.endsWith(".localhost");

    if (!accessToken || accessToken === anonKey || (isLocalHost && !accessToken)) {
      const body: EntitlementsResponse = {
        tier: "free",
        features: FEATURE_MAP.free,
        trial_expires_at: null,
      };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: corsHeaders(origin),
      });
    }

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: u, error: userErr } = await sbUser.auth.getUser();
    if (userErr || !u?.user?.id) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: corsHeaders(origin),
      });
    }
    const userId = u.user.id;

    const { data: sub, error: subErr } = await sbUser
      .from("subscriptions")
      .select("status, plan_id, current_period_end")
      .eq("user_id", userId)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr && subErr.code !== "PGRST116") {
      console.warn("[entitlements] subscriptions error:", subErr);
    }

    const { data: ent, error: entErr } = await sbUser
      .from("user_entitlements")
      .select("plan_tier, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (entErr && entErr.code !== "PGRST116") {
      console.warn("[entitlements] user_entitlements error:", entErr);
    }

    const now = Date.now();
    let tier: Tier = "free";

    const hasActiveSub = sub?.status && ["active", "trialing"].includes(sub.status);
    const subNotExpired =
      hasActiveSub &&
      (sub?.current_period_end ? new Date(sub.current_period_end).getTime() > now : true);

    if (hasActiveSub && subNotExpired) {
      const plan = (sub?.plan_id ?? "").toLowerCase();
      if (plan.includes("premium")) tier = "premium";
      else if (plan.includes("pro")) tier = "pro";
      else tier = "pro";
    } else {
      const trialEnds = ent?.trial_ends_at ? Date.parse(ent.trial_ends_at) : 0;
      tier = trialEnds && trialEnds > now ? "trial" : "free";
    }

    const body: EntitlementsResponse = {
      tier,
      features: FEATURE_MAP[tier],
      trial_expires_at: ent?.trial_ends_at ?? null,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    const message = typeof err === "object" && err !== null && "message" in err
      ? String((err as { message?: unknown }).message)
      : String(err);

    return new Response(JSON.stringify({ error: message, code: "internal" }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
