import { supabase } from "@/lib/supabase";

export async function ensureTrial() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return;

  try {
    await supabase.rpc("start_trial_15d", { _user_id: data.user.id });
  } catch (rpcError) {
    console.warn("ensureTrial: start_trial_15d failed", rpcError);
  }
}
