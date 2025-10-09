import { useEffect, useState } from "react";
import { getUserFlags, DEFAULT_FEATURE_FLAGS, type FeatureFlags } from "@/lib/featureFlags";
import { useAuth } from "@/hooks/useAuth";

export function useFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getUserFlags(user?.id)
      .then((fetched) => {
        if (active) setFlags(fetched);
      })
      .catch(() => {
        if (active) setFlags(DEFAULT_FEATURE_FLAGS);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  return { flags, loading };
}
