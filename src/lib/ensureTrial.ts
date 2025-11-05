import type { SupabaseClient } from "@supabase/supabase-js";

const TRIAL_DURATION_DAYS = 15;

type EnsureTrialPayload = {
  plan_tier: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_days: number | null;
};

export async function ensureTrial(supabase: SupabaseClient, userId: string) {
  if (!supabase) {
    console.error("[ensureTrial] supabase client is required");
    return;
  }
  if (!userId) {
    console.error("[ensureTrial] userId is required");
    return;
  }

  try {
    const { data, error } = await supabase.rpc<EnsureTrialPayload[]>("ensure_trial", {
      p_user_id: userId,
      p_duration_days: TRIAL_DURATION_DAYS,
    });

    if (error) {
      console.error("[ensureTrial] rpc error:", error);
      return;
    }

    const payload = Array.isArray(data) ? data?.[0] : (data as EnsureTrialPayload | undefined);
    if (!payload) {
      console.warn("[ensureTrial] empty payload", { userId });
    }
  } catch (e) {
    console.error("[ensureTrial] unexpected", e);
  }
}
