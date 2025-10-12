import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Tier = "free" | "trial" | "pro" | "premium";

type EntitlementsResponse = {
  tier: Tier;
  features: string[];
  trial_expires_at?: string | null;
};

type EntitlementsState = {
  loading: boolean;
  tier: Tier;
  features: string[];
  trialExpiresAt: string | null;
};

const initialState: EntitlementsState = {
  loading: true,
  tier: "free",
  features: [],
  trialExpiresAt: null,
};

export function useEntitlements() {
  const [state, setState] = useState<EntitlementsState>(initialState);

  useEffect(() => {
    let alive = true;

    async function fetchEntitlements() {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("/functions/v1/entitlements", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`Failed to load entitlements (${response.status})`);
        }

        const json = (await response.json()) as EntitlementsResponse;

        if (!alive) return;

        setState({
          loading: false,
          tier: json.tier,
          features: Array.isArray(json.features) ? json.features : [],
          trialExpiresAt: json.trial_expires_at ?? null,
        });
      } catch (error) {
        if (!alive) return;
        console.error("useEntitlements error", error);
        setState({
          loading: false,
          tier: "free",
          features: [],
          trialExpiresAt: null,
        });
      }
    }

    fetchEntitlements();

    return () => {
      alive = false;
    };
  }, []);

  const has = useMemo(
    () => (feature: string) => state.features.includes(feature),
    [state.features],
  );

  return {
    loading: state.loading,
    tier: state.tier,
    features: state.features,
    trialExpiresAt: state.trialExpiresAt,
    has,
  };
}
