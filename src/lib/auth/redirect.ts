import { supabase } from "@/lib/supabase/client";

export async function getPostLoginRedirectPath(userId: string) {
  if (!supabase) {
    return "/dashboard";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return profile?.role === "admin" ? "/admin" : "/dashboard";
}
