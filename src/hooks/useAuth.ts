import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureTrial } from "@/lib/ensureTrial";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const ensuredUserIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;

    // 1) pega a sessão atual (pós-OAuth/email)
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // 2) escuta mudanças (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (ensuredUserIds.current.has(user.id)) return;
    ensuredUserIds.current.add(user.id);

    ensureTrial(supabase, user.id).catch((error) => {
      console.warn("ensureTrial failed", error);
    });
  }, [user]);

  return { user, loading };
}

// Ações
export async function signOut() {
  await supabase.auth.signOut();
}

export async function signInEmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error && data.user) {
    await ensureTrial(supabase, data.user.id);
  }
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
