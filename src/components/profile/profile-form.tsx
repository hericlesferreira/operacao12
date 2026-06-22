"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LockKeyhole, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

type ProfileState = {
  loading: boolean;
  fullName: string;
  email: string;
  whatsapp: string;
  mustChangePassword: boolean;
};

type ApiResult = {
  error?: string;
  message?: string;
};

export function ProfileForm() {
  const router = useRouter();
  const [state, setState] = useState<ProfileState>({
    loading: true,
    fullName: "",
    email: "",
    whatsapp: "",
    mustChangePassword: false
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFirstAccess, setIsFirstAccess] = useState(false);

  useEffect(() => {
    setIsFirstAccess(new URLSearchParams(window.location.search).get("primeiroAcesso") === "1");
    void loadProfile();
  }, []);

  async function loadProfile() {
    if (!supabase) {
      setError("Supabase não está configurado.");
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.replace("/auth/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, whatsapp, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setError(profileError?.message ?? "Não foi possível carregar seu perfil.");
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    setState({
      loading: false,
      fullName: profile.full_name,
      email: profile.email,
      whatsapp: profile.whatsapp ?? "",
      mustChangePassword: profile.must_change_password
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const needsPasswordChange = state.mustChangePassword || isFirstAccess;
    const changedPassword = Boolean(password);

    if (needsPasswordChange && !password) {
      setError("Para continuar, crie uma nova senha.");
      return;
    }

    if (password && password.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("A confirmação da senha não confere.");
      return;
    }

    if (!supabase) {
      setError("Supabase não está configurado.");
      return;
    }

    setSaving(true);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      setSaving(false);
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: state.fullName,
        email: state.email,
        whatsapp: state.whatsapp,
        password: password || undefined
      })
    });
    const result = (await response.json()) as ApiResult;

    setSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Não foi possível atualizar seu perfil.");
      return;
    }

    setMessage(result.message ?? "Perfil atualizado.");
    setPassword("");
    setConfirmPassword("");
    setState((current) => ({ ...current, mustChangePassword: false }));
    window.history.replaceState(null, "", "/perfil");

    if (changedPassword) {
      window.alert("Senha alterada com sucesso.");
      router.replace("/dashboard?senhaAlterada=1");
      router.refresh();
    }
  }

  if (state.loading) {
    return <Card>Carregando perfil...</Card>;
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      {state.mustChangePassword || isFirstAccess ? (
        <Card className="border-cocoa/40 bg-linen">
          <div className="flex gap-3">
            <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-cocoa" />
            <div>
              <h2 className="text-xl font-bold">Crie sua senha definitiva</h2>
              <p className="mt-2 text-sm leading-6 text-graphite">
                Este é seu primeiro acesso com uma senha temporária. Para continuar
                usando a plataforma, defina uma nova senha pessoal.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Meu Perfil
        </p>
        <h2 className="mt-2 text-2xl font-bold">Dados de acesso</h2>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-coal">Nome</span>
            <Input
              onChange={(event) =>
                setState((current) => ({ ...current, fullName: event.target.value }))
              }
              required
              value={state.fullName}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-coal">E-mail</span>
            <Input
              onChange={(event) =>
                setState((current) => ({ ...current, email: event.target.value }))
              }
              required
              type="email"
              value={state.email}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-coal">Telefone / WhatsApp</span>
            <Input
              onChange={(event) =>
                setState((current) => ({ ...current, whatsapp: event.target.value }))
              }
              value={state.whatsapp}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-coal">
                {state.mustChangePassword || isFirstAccess ? "Nova senha obrigatória" : "Nova senha"}
              </span>
              <Input
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                required={state.mustChangePassword || isFirstAccess}
                type="password"
                value={password}
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-coal">Confirmar nova senha</span>
              <Input
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required={state.mustChangePassword || isFirstAccess || Boolean(password)}
                type="password"
                value={confirmPassword}
              />
            </label>
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-lg bg-lime/25 px-3 py-2 text-sm text-coal">{message}</p> : null}

          <div className="grid gap-3 sm:flex">
            <Button disabled={saving} type="submit">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar perfil"}
            </Button>
            {!state.mustChangePassword && !isFirstAccess ? (
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto" variant="ghost">
                  Voltar ao dashboard
                </Button>
              </Link>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
