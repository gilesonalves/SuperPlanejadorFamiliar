import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Hook de autenticação.
 * - Busca sessão atual e escuta mudanças.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  return { user, loading };
}

/* ======================
 * Ações de autenticação
 * ====================== */

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Login com e-mail/senha.
 * - Em caso de sucesso, a sessão é persistida pelo Supabase client.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

/**
 * Cadastro com e-mail/senha.
 */
// src/hooks/useAuth.ts (exemplo)
// defina um tipo de resultado simples
type SignUpResult =
  | { ok: true }
  | { ok: false; message: string };

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<SignUpResult> {
  try {
    const redirectTo: string = import.meta.env.VITE_APP_ORIGIN ?? window.location.origin;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      // `error` já é tipado (AuthError) pelo SDK
      return { ok: false, message: error.message };
    }

    return { ok: true };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
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
