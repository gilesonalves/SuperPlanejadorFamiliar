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

const JSON_HEADERS = {
  "content-type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "missing_env" }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const accessToken = bearerMatch?.[1] ?? "";
    const lowerHost = new URL(req.url).hostname.toLowerCase();
    const isLocalHost =
      lowerHost === "localhost" ||
      lowerHost === "127.0.0.1" ||
      lowerHost.endsWith(".localhost");

    // Fallback "free" quando não houver Authorization ou quando for o ANON key
    if (!accessToken || accessToken === anonKey || (isLocalHost && !accessToken)) {
      const body: EntitlementsResponse = {
        tier: "free",
        features: FEATURE_MAP.free,
        trial_expires_at: null,
      };
      return new Response(JSON.stringify(body), { headers: JSON_HEADERS });
    }

    // Client no CONTEXTO DO USUÁRIO (RLS respeitado)
    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // 1) Descobre o usuário
    const { data: u, error: userErr } = await sbUser.auth.getUser();
    if (userErr || !u?.user?.id) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }
    const userId = u.user.id;

    // 2) Busca assinatura mais recente
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

    // 3) Busca trial
    const { data: ent, error: entErr } = await sbUser
      .from("user_entitlements")
      .select("plan_tier, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (entErr && entErr.code !== "PGRST116") {
      console.warn("[entitlements] user_entitlements error:", entErr);
    }

    // 4) Resolve tier efetivo
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
      else tier = "pro"; // fallback
    } else {
      const trialEnds = ent?.trial_ends_at ? Date.parse(ent.trial_ends_at) : 0;
      if (trialEnds && trialEnds > now) {
        tier = "trial";
      } else {
        tier = "free";
      }
    }

    const body: EntitlementsResponse = {
      tier,
      features: FEATURE_MAP[tier],
      trial_expires_at: ent?.trial_ends_at ?? null,
    };

    return new Response(JSON.stringify(body), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", details: String(err) }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
