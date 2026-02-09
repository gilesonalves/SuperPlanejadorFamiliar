import {
  DEFAULT_FEATURE_FLAGS,
} from "@/lib/featureFlags";

export function useFeatureFlags() {
  return {
    flags: DEFAULT_FEATURE_FLAGS,
    loading: false,
    refetch: async () => DEFAULT_FEATURE_FLAGS,
  };
}
