import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setL] = useState(true);

  useEffect(() => {
    let alive = true;

    // 1) pega a sessão atual (pós-OAuth/email)
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(data.session?.user ?? null);
      setL(false);
    });

    // 2) escuta mudanças (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

// Ações
export async function signOut() {
  await supabase.auth.signOut();
}
export async function signInEmailPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  return error?.message ?? null;
}
export async function signUpEmailPassword(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  return error?.message ?? null;
}
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });
  return error?.message ?? null;
}
