import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type UseAuthReturn = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  supabaseAvailable: boolean;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseAvailable = Boolean(supabase);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) {
          return;
        }
        if (error) {
          setUser(null);
          return;
        }
        setUser(data.user ?? null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signOut, supabaseAvailable };
}
