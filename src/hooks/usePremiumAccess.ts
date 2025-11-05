import { useEffect, useState } from "react";
import { getEffectiveTier } from "@/lib/featureFlags";
import { useAuth } from "@/hooks/useAuth";

const PREMIUM_TIERS = new Set(["trial", "pro", "premium"]);

export function usePremiumAccess() {
  const { user, trialEnsuredAt } = useAuth();
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let active = true;

    setState((prev) => ({ ...prev, loading: true }));
    getEffectiveTier()
      .then((tier) => {
        if (!active) return;
        setState({ loading: false, allowed: PREMIUM_TIERS.has(tier) });
      })
      .catch((error) => {
        if (!active) return;
        console.error("[usePremiumAccess] failed to resolve premium access:", error);
        setState({ loading: false, allowed: false });
      });

    return () => {
      active = false;
    };
  }, [user?.id, trialEnsuredAt]);

  return { loading: state.loading, allowed: state.allowed };
}
