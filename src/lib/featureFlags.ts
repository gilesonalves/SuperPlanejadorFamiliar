export const FEATURE_FLAG_KEYS = [
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
  CARDS_MODULE: getEnvBoolean("FEATURE_CARDS_MODULE", true),
  CATEGORY_LIMITS: getEnvBoolean("FEATURE_CATEGORY_LIMITS", true),
  GOALS: getEnvBoolean("FEATURE_GOALS", true),
  CASH_FORECAST: getEnvBoolean("FEATURE_CASH_FORECAST", true),
  REPORTS: getEnvBoolean("FEATURE_REPORTS", true),
  EXPORTS: getEnvBoolean("FEATURE_EXPORTS", true),
  MULTI_PROFILE: getEnvBoolean("FEATURE_MULTI_PROFILE", true),
});

export const DEFAULT_FEATURE_FLAGS = getDefaultFlags();

export async function getUserFlags(): Promise<FeatureFlags> {
  return getDefaultFlags();
}
