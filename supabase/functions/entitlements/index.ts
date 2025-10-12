import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

type Tier = "free" | "trial" | "pro" | "premium";
type Entitlements = {
  tier: Tier;
  features: string[];
  trial_expires_at?: string | null;
};

const FEATURE_MAP: Record<Tier, string[]> = {
  free: ["basic"],
  trial: ["basic", "reports", "dashboards", "autosuggestions"],
  pro: ["basic", "reports", "dashboards", "autosuggestions"],
  premium: ["basic", "reports", "dashboards", "autosuggestions", "priority_support"],
};

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, plan_id, current_period_end")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: trial } = await supabase
      .from("user_trials")
      .select("expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const now = new Date();
    const trialActive =
      !!trial?.expires_at && new Date(trial.expires_at) > now;

    let tier: Tier = "free";

    if (trialActive) {
      tier = "trial";
    } else if (sub?.status === "active" || sub?.status === "trialing") {
      if (sub.plan_id === "premium") {
        tier = "premium";
      } else if (sub.plan_id === "pro") {
        tier = "pro";
      }
    }

    const body: Entitlements = {
      tier,
      features: FEATURE_MAP[tier],
      trial_expires_at: trial?.expires_at ?? null,
    };

    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }
});
