import { useCallback, useEffect, useMemo, useState } from "react";
import { getEffectiveTier } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  fetchEntitlements,
  type FetchEntitlementsError,
} from "@/lib/fetchEntitlements";

export type Tier = "free" | "trial" | "pro" | "premium";

type EntitlementsResponse = {
  tier: Tier;
  features: string[];
  trial_expires_at?: string | null; // edge retorna esse campo
};

type EntitlementsState = {
  loading: boolean;
  tier: Tier;
  effectiveTier: Tier | string;
  features: string[];
  trialExpiresAt: string | null;
};

const initialState: EntitlementsState = {
  loading: true,
  tier: "free",
  effectiveTier: "free",
  features: [],
  trialExpiresAt: null,
};

export function useEntitlements() {
  const [state, setState] = useState<EntitlementsState>(initialState);

  // pegamos user e, principalmente, trialEnsuredAt, que sinaliza
  // quando o ensureTrial terminou e devemos refazer o fetch
  const { user, trialEnsuredAt } = useAuth();

  const loadEntitlements = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const json = await fetchEntitlements<EntitlementsResponse>(session?.access_token ?? null);

      const trialExpiresAt = json.trial_expires_at ?? null;
      const effectiveTier = getEffectiveTier({
        plan_tier: json.tier,
        trial_ends_at: trialExpiresAt,
      });

      setState({
        loading: false,
        tier: json.tier,
        effectiveTier,
        features: Array.isArray(json.features) ? json.features : [],
        trialExpiresAt,
      });
    } catch (error) {
      const typed = error as Partial<FetchEntitlementsError> | null | undefined;
      console.warn("[entitlements] fail", {
        kind: typeof typed?.kind === "string" ? typed.kind : "unknown",
        status: typeof typed?.status === "number" ? typed.status : undefined,
      });
      setState({
        loading: false,
        tier: "free",
        effectiveTier: "free",
        features: [],
        trialExpiresAt: null,
      });
    }
  }, []);

  // 1) carrega ao montar
  // 2) recarrega quando o usuário troca
  // 3) recarrega quando o ensureTrial terminar (trialEnsuredAt muda)
  useEffect(() => {
    loadEntitlements();
  }, [loadEntitlements, user?.id, trialEnsuredAt]);

  const has = useMemo(
    () => (feature: string) => state.features.includes(feature),
    [state.features],
  );

  return {
    loading: state.loading,
    tier: state.tier,
    effectiveTier: state.effectiveTier,
    features: state.features,
    trialExpiresAt: state.trialExpiresAt,
    has,
    refetch: loadEntitlements, // opcional: expõe refetch manual
  };
}
