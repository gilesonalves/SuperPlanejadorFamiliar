import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getEffectiveTier } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth"; // ajuste o caminho se seu hook estiver em outro lugar

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

  const fetchEntitlements = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Se não há sessão, não é erro — apenas estado "free"
      if (!session?.access_token) {
        setState({
          loading: false,
          tier: "free",
          effectiveTier: "free",
          features: [],
          trialExpiresAt: null,
        });
        return;
      }

      const token = session.access_token;

      const response = await fetch("/functions/v1/entitlements", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 401/403: trata como "free", sem quebrar a UX
      if (response.status === 401 || response.status === 403) {
        setState({
          loading: false,
          tier: "free",
          effectiveTier: "free",
          features: [],
          trialExpiresAt: null,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load entitlements (${response.status})`);
      }

      const json = (await response.json()) as EntitlementsResponse;

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
      console.error("useEntitlements error", error);
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
    fetchEntitlements();
  }, [fetchEntitlements, user?.id, trialEnsuredAt]);

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
    refetch: fetchEntitlements, // opcional: expõe refetch manual
  };
}
