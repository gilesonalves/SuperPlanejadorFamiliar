import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(url, anon, {
  auth: {
    persistSession: true, // ✅ mantém sessão no localStorage
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Helpers de DEV no navegador (sem usar `any`)
 * - window.sb: acesso ao client
 * - window.getAccessToken(): Promise<string|null>
 */
declare global {
  interface Window {
    sb?: SupabaseClient;
    getAccessToken?: () => Promise<string | null>;
  }
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.sb = supabase;
  window.getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };
}
