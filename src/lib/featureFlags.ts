import { supabase } from "@/lib/supabase";

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
