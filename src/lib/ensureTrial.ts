import type { SupabaseClient } from "@supabase/supabase-js";

type TrialRow = {
  plan_tier: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
};

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

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
    const { data: existing, error: selectError } = await supabase
      .from("user_entitlements")
      .select("plan_tier, trial_started_at, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle<TrialRow>();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("[ensureTrial] select error:", selectError);
      return;
    }

    if (existing) {
      const planTier = existing.plan_tier ?? null;
      const hasPayingTier =
        planTier !== null &&
        planTier !== "trial" &&
        planTier !== "free";

      if (hasPayingTier) {
        return;
      }

      const hasCompleteTrial =
        planTier === "trial" &&
        Boolean(existing.trial_started_at) &&
        Boolean(existing.trial_ends_at);

      if (hasCompleteTrial) {
        return;
      }
    }

    const now = new Date();
    const startedAt =
      existing?.trial_started_at ?? now.toISOString();
    const endsAt =
      existing?.trial_ends_at ??
      new Date(now.getTime() + FIFTEEN_DAYS_MS).toISOString();

    const { error: upsertError } = await supabase
      .from("user_entitlements")
      .upsert(
        {
          user_id: userId,
          plan_tier: "trial",
          trial_started_at: startedAt,
          trial_ends_at: endsAt,
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      console.error("[ensureTrial] upsert error:", upsertError);
    }
  } catch (error) {
    console.error("[ensureTrial] unexpected error:", error);
  }
}
