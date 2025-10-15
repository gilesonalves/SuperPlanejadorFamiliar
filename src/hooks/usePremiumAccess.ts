import { useEffect, useState } from "react";
import { canUsePremium } from "@/lib/featureFlags";
import { useAuth } from "@/hooks/useAuth";

export function usePremiumAccess() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let active = true;

    setState((prev) => ({ ...prev, loading: true }));
    canUsePremium()
      .then((allowed) => {
        if (!active) return;
        setState({ loading: false, allowed });
      })
      .catch((error) => {
        if (!active) return;
        console.error("[usePremiumAccess] failed to resolve premium access:", error);
        setState({ loading: false, allowed: false });
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  return { loading: state.loading, allowed: state.allowed };
}
