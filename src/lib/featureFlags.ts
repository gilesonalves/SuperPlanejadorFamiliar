import { supabase } from "@/lib/supabase";

export type Tier = "free" | "trial" | "pro" | "premium";

export const FEATURE_FLAG_KEYS = [
  "OPEN_FINANCE",
  "CARDS_MODULE",
  "CATEGORY_LIMITS",
  "GOALS",
  "CASH_FORECAST",
  "REPORTS",
  "EXPORTS",
  "MULTI_PROFILE",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

const truthyPattern = /^(1|true|on|yes)$/i;

const getEnvBoolean = (key: string, fallback: boolean): boolean => {
  const raw = import.meta.env?.[key as keyof ImportMetaEnv];
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    if (raw.length === 0) return fallback;
    return truthyPattern.test(raw.trim());
  }
  return fallback;
};

export const getDefaultFlags = (): FeatureFlags => ({
  OPEN_FINANCE: getEnvBoolean("FEATURE_OPEN_FINANCE", false),
  CARDS_MODULE: getEnvBoolean("FEATURE_CARDS_MODULE", false),
  CATEGORY_LIMITS: getEnvBoolean("FEATURE_CATEGORY_LIMITS", true),
  GOALS: getEnvBoolean("FEATURE_GOALS", false),
  CASH_FORECAST: getEnvBoolean("FEATURE_CASH_FORECAST", false),
  REPORTS: getEnvBoolean("FEATURE_REPORTS", false),
  EXPORTS: getEnvBoolean("FEATURE_EXPORTS", true),
  MULTI_PROFILE: getEnvBoolean("FEATURE_MULTI_PROFILE", false),
});

export const DEFAULT_FEATURE_FLAGS = getDefaultFlags();

type EntitlementRow = {
  user_id?: string | null;
  flags?: Partial<Record<FeatureFlagKey, unknown>> | null;
};

const normalizeFlags = (
  defaults: FeatureFlags,
  overrides?: Partial<Record<FeatureFlagKey, unknown>> | null,
): FeatureFlags => {
  if (!overrides) return { ...defaults };

  return FEATURE_FLAG_KEYS.reduce<FeatureFlags>((acc, key) => {
    const raw = overrides[key];
    if (typeof raw === "boolean") {
      acc[key] = raw;
    } else if (typeof raw === "string") {
      acc[key] = truthyPattern.test(raw.trim());
    } else if (typeof raw === "number") {
      acc[key] = raw === 1;
    }
    return acc;
  }, { ...defaults });
};

export async function getUserFlags(userId?: string): Promise<FeatureFlags> {
  const defaults = getDefaultFlags();

  try {
    const resolvedUserId =
      userId ??
      (await supabase.auth.getUser()).data.user?.id ??
      undefined;

    if (!resolvedUserId) {
      return defaults;
    }

    const { data, error } = await supabase
      .from("user_entitlements")
      .select("user_id, flags")
      .eq("user_id", resolvedUserId)
      .maybeSingle<EntitlementRow>();

    if (error) {
      console.warn("featureFlags:getUserFlags", error.message);
      return defaults;
    }

    return normalizeFlags(defaults, data?.flags ?? undefined);
  } catch (error) {
    console.warn("featureFlags:getUserFlags", error);
    return defaults;
  }
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

const mapPlanToTier = (planId?: string | null): Tier | null => {
  if (!planId) return null;
  const normalized = planId.trim().toLowerCase();
  if (normalized === "premium") return "premium";
  if (normalized === "pro") return "pro";
  if (normalized.includes("premium")) return "premium";
  if (normalized.includes("pro")) return "pro";
  return null;
};

type SubscriptionRow = {
  plan_id: string | null;
  status: string | null;
  current_period_end: string | null;
};

type EntitlementTierRow = {
  plan_tier: string | null;
  trial_ends_at: string | null;
};

export async function getEffectiveTier(): Promise<Tier> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[featureFlags] auth error:", authError);
      return "free";
    }

    const userId = authData.user?.id;
    if (!userId) {
      return "free";
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_end")
      .eq("user_id", userId)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle<SubscriptionRow>();

    if (subscriptionError && subscriptionError.code !== "PGRST116") {
      console.error("[featureFlags] subscriptions error:", subscriptionError);
    }

    const now = new Date();
    const subTier = (() => {
      if (!subscription) return null;
      const status = subscription.status ?? "";
      if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
        return null;
      }
      const endDate = subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null;
      if (endDate && endDate <= now) {
        return null;
      }
      return mapPlanToTier(subscription.plan_id);
    })();

    if (subTier) {
      return subTier;
    }

    const { data: entitlements, error: entitlementsError } = await supabase
      .from("user_entitlements")
      .select("plan_tier, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle<EntitlementTierRow>();

    if (entitlementsError && entitlementsError.code !== "PGRST116") {
      console.error("[featureFlags] entitlements error:", entitlementsError);
    }

    if (entitlements) {
      const tier = entitlements.plan_tier?.toLowerCase();
      if (tier === "premium" || tier === "pro") {
        return tier;
      }
      if (tier === "trial") {
        const endsAt = entitlements.trial_ends_at ? new Date(entitlements.trial_ends_at) : null;
        if (endsAt && endsAt > now) {
          return "trial";
        }
      }
    }

    return "free";
  } catch (error) {
    console.error("[featureFlags] getEffectiveTier unexpected error:", error);
    return "free";
  }
}

export async function canUsePremium(): Promise<boolean> {
  const tier = await getEffectiveTier();
  return tier === "trial" || tier === "pro" || tier === "premium";
}
