import { supabase } from "@/lib/supabase/client";

export async function getPostLoginRedirectPath(userId: string) {
  if (!supabase) {
    return "/dashboard";
  }

  const { data: profile, error } = await withTimeout(
    supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", userId)
      .maybeSingle(),
    3500
  );

  if (error) {
    const { data: fallbackProfile } = await withTimeout(
      supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
      2000
    );

    return fallbackProfile?.role === "admin" ? "/admin" : "/dashboard";
  }

  if (profile?.role === "admin") {
    return "/admin";
  }

  if (profile?.must_change_password) {
    return "/perfil?primeiroAcesso=1";
  }

  return "/dashboard";
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      window.setTimeout(
        () => resolve({ data: null, error: new Error("Tempo de resposta excedido.") } as T),
        timeoutMs
      )
    )
  ]);
}
