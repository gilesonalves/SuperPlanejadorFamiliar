import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type EntitlementLike = {
  plan_tier?: string | null;
  trial_ends_at?: string | null;
};

function parseIso(ts?: string | null): number | null {
  if (!ts) return null;
  const n = Date.parse(ts);
  return Number.isNaN(n) ? null : n;
}

export function isTrialActive(ent?: EntitlementLike): boolean {
  const ends = parseIso(ent?.trial_ends_at);
  return !!(ends && ends > Date.now());
}

export function getTrialDaysLeft(ent?: EntitlementLike): number {
  const ends = parseIso(ent?.trial_ends_at);
  if (!ends || ends <= Date.now()) return 0;
  const MS_PER_DAY = 86_400_000;
  return Math.max(0, Math.ceil((ends - Date.now()) / MS_PER_DAY));
}

/**
 * Retorna o "tier efetivo" considerando:
 * - Se trial está ativo => "trial" (libera tudo se você mapear trial como pro)
 * - Senão, se plan_tier for pago => retorna o plan_tier
 * - Senão => "free"
 */
export function getEffectiveTier(
  ent?: EntitlementLike,
): "free" | "trial" | "pro" | "premium" | string {
  const raw = ent?.plan_tier ?? null;
  const planTier =
    typeof raw === "string" ? raw.trim().toLowerCase() : "";

  // 1) Trial ativo sempre prevalece
  if (isTrialActive(ent)) return "trial";

  // 2) Plano pago (qualquer coisa diferente de free/trial)
  if (planTier && planTier !== "free" && planTier !== "trial") {
    return planTier;
  }

  // 3) Free (ou trial expirado)
  return "free";
}
