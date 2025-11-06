import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";

const PREMIUM_TIERS = new Set(["trial", "pro", "premium"]);

export function usePremiumAccess() {
  const { user, trialEnsuredAt } = useAuth();
  const { loading, effectiveTier, trialExpiresAt } = useEntitlements();

  const allowed = PREMIUM_TIERS.has(
    typeof effectiveTier === "string" ? effectiveTier : "free",
  );

  useEffect(() => {
    if (loading || allowed) return;

    console.warn("[Gate] closed", {
      userId: user?.id ?? null,
      plan: effectiveTier,
      trialEndsAt: trialExpiresAt,
      now: new Date().toISOString(),
      gateKey: "premium",
    });
  }, [allowed, loading, user?.id, effectiveTier, trialExpiresAt, trialEnsuredAt]);

  return { loading, allowed };
}
