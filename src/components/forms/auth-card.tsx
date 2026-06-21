"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

type AuthCardProps = {
  mode: "login" | "signup";
};

export function AuthCard({ mode }: AuthCardProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabase) {
      setError("Supabase nao esta configurado neste ambiente.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }

    setIsSubmitting(true);

    if (isSignup) {
      const fullName = String(formData.get("fullName") ?? "").trim();
      const whatsapp = String(formData.get("whatsapp") ?? "").trim();

      if (!fullName) {
        setError("Informe seu nome completo.");
        setIsSubmitting(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirmado`,
          data: {
            full_name: fullName,
            whatsapp
          }
        }
      });

      if (signUpError) {
        setError(translateAuthError(signUpError.message));
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          whatsapp: whatsapp || null,
          role: "participant"
        });
      }

      if (!data.session) {
        setSuccess(
          "Cadastro criado. Enviamos um e-mail de confirmacao; abra o link antes de fazer login."
        );
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(translateAuthError(signInError.message));
      setIsSubmitting(false);
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      router.push(profile?.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Operacao 12S
        </p>
        <h1 className="mt-2 text-3xl font-bold text-coal">
          {isSignup ? "Criar conta" : "Entrar na plataforma"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-graphite">
          {isSignup
            ? "Comece pela anamnese inicial para receber uma direcao adequada ao seu perfil."
            : "Acesse sua trilha, plano alimentar, aulas e proximos passos da operacao."}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {isSignup ? (
          <>
            <Input name="fullName" placeholder="Nome completo" required />
            <Input name="whatsapp" placeholder="WhatsApp" />
          </>
        ) : null}
        <Input name="email" placeholder="E-mail" required type="email" />
        <Input
          minLength={6}
          name="password"
          placeholder="Senha"
          required
          type="password"
        />

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-lg bg-lime/25 px-3 py-2 text-sm text-coal">
            {success}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? "Processando..."
            : isSignup
              ? "Criar minha conta"
              : "Entrar"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-graphite">
        {isSignup ? "Ja tem conta?" : "Ainda nao tem conta?"}{" "}
        <Link
          className="font-semibold text-command hover:underline"
          href={isSignup ? "/auth/login" : "/auth/cadastro"}
        >
          {isSignup ? "Entrar" : "Criar cadastro"}
        </Link>
      </p>
    </Card>
  );
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de fazer login.";
  }

  if (normalized.includes("user already registered")) {
    return "Este e-mail ja possui cadastro. Use a tela de login.";
  }

  if (normalized.includes("password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  return message;
}
