import { supabase } from "@/lib/supabase/client";

export async function getPostLoginRedirectPath(userId: string) {
  if (!supabase) {
    return "/dashboard";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, must_change_password")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    return "/admin";
  }

  if (profile?.must_change_password) {
    return "/perfil?primeiroAcesso=1";
  }

  return "/dashboard";
}
