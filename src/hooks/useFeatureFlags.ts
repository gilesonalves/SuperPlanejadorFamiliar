import { useCallback, useEffect, useState } from "react";
import {
  getUserFlags,
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
} from "@/lib/featureFlags";
import { useAuth } from "@/hooks/useAuth";

export function useFeatureFlags() {
  const { user, trialEnsuredAt } = useAuth(); // <- ouvir quando o ensureTrial terminar
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFlags = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);

      // Sem usuário logado: retorna defaults
      if (!user?.id) {
        if (!signal?.aborted) {
          setFlags(DEFAULT_FEATURE_FLAGS);
          setLoading(false);
        }
        return;
      }

      const fetched = await getUserFlags(user.id);
      if (!signal?.aborted) {
        setFlags(fetched);
      }
    } catch (_err) {
      if (!signal?.aborted) {
        setFlags(DEFAULT_FEATURE_FLAGS);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const ac = new AbortController();
    fetchFlags(ac.signal);
    return () => ac.abort();
    // dispara quando o usuário muda OU quando o ensureTrial finalizar
  }, [fetchFlags, user?.id, trialEnsuredAt]);

  return {
    flags,
    loading,
    refetch: () => fetchFlags(), // opcional: refetch manual
  };
}
