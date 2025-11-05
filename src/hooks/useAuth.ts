import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureTrial } from "@/lib/ensureTrial";

/**
 * Hook de autenticação.
 * - Busca sessão atual e escuta mudanças.
 * - Garante (idempotente) que o usuário tem trial de 15 dias ao logar.
 * - Expõe `trialEnsuredAt` para que outros hooks/UI possam reagir
 *   e refazer o fetch dos entitlements após o ensureTrial concluir.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // marca quando o ensureTrial terminou pela última vez (Date.now())
  const [trialEnsuredAt, setTrialEnsuredAt] = useState<number | null>(null);

  // evita rodar ensureTrial repetidamente para o mesmo user no mesmo ciclo
  const ensuredUserIds = useRef<Set<string>>(new Set());

  // pega sessão atual + escuta mudanças
  useEffect(() => {
    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setUser(data.session?.user ?? null);
      })
      .catch((e) => {
        console.error("[useAuth] getSession failed:", e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // garante trial quando há usuário
  useEffect(() => {
    (async () => {
      if (!user) return;

      // não rodar 2x para o mesmo id neste ciclo de vida
      if (ensuredUserIds.current.has(user.id)) return;
      ensuredUserIds.current.add(user.id);

      try {
        await ensureTrial(supabase, user.id);
        setTrialEnsuredAt(Date.now()); // sinaliza para a UI/hooks que terminou
      } catch (error) {
        console.error("[useAuth] ensureTrial failed:", error);
        ensuredUserIds.current.delete(user.id);
      }
    })();
  }, [user]);

  return { user, loading, trialEnsuredAt };
}

/* ======================
 * Ações de autenticação
 * ====================== */

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Login com e-mail/senha.
 * - Em caso de sucesso, roda ensureTrial e sinaliza com trialEnsuredAt via hook
 *   (o hook também rodará por conta do onAuthStateChange, então aqui é redundante
 *   mas ajuda na experiência imediatamente após o login via senha).
 */
export async function signInEmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error && data.user) {
    ensureTrial(supabase, data.user.id).catch((err) => {
      console.error("[ensureTrial after signInEmailPassword]", err);
    });
  }
  return error?.message ?? null;
}

/**
 * Login com Google (OAuth).
 * - Usa o origin atual para redireciono pós-login.
 *   Se você tiver uma rota específica para callback, ajuste aqui.
 */
export async function signInWithGoogle() {
  const redirectTo = window.location.origin; // ajuste se tiver /login-callback
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return error?.message ?? null;
}

/**
 * Cadastro com e-mail/senha.
 * - Em caso de sucesso, dispara ensureTrial para o novo usuário.
 */
export async function signUpEmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (!error && data?.user?.id) {
    ensureTrial(supabase, data.user.id).catch((err) => {
      console.error("[ensureTrial after signUpEmailPassword]", err);
    });
  }
  return error?.message ?? null;
}

/**
 * Envia e-mail de reset de senha.
 * - A URL de redirect deve existir no Supabase (Auth → URL Configuration → Redirect URLs).
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });
  return error?.message ?? null;
}
