"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPostLoginRedirectPath } from "@/lib/auth/redirect";
import { supabase } from "@/lib/supabase/client";

type AuthCardProps = {
  mode: "login" | "signup";
  signupAccessCode?: string;
};

export function AuthCard({ mode, signupAccessCode }: AuthCardProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function redirectActiveSession() {
      if (isSignup || !supabase) {
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      router.replace(await getPostLoginRedirectPath(session.user.id));
      router.refresh();
    }

    void redirectActiveSession();
  }, [isSignup, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;
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

      const response = await fetch("/api/admin/create-participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signup-access-code": signupAccessCode ?? ""
        },
        body: JSON.stringify({
          fullName,
          whatsapp,
          email,
          password
        })
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(translateAuthError(result.error ?? "Nao foi possivel criar o usuario."));
        setIsSubmitting(false);
        return;
      }

      setSuccess(result.message ?? "Participante cadastrado com sucesso.");
      form.reset();
      setIsSubmitting(false);
      return;
    }

    if (!supabase) {
      setError("Supabase nao esta configurado neste ambiente.");
      setIsSubmitting(false);
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(translateAuthError(signInError.message));
      setIsSubmitting(false);
      return;
    }

    if (signInData.user) {
      router.replace(await getPostLoginRedirectPath(signInData.user.id));
      router.refresh();
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Operacao 12S
        </p>
        <h1 className="mt-2 text-3xl font-bold text-coal">
          {isSignup ? "Cadastrar participante" : "Entrar na plataforma"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-graphite">
          {isSignup
            ? "Crie o acesso do participante e envie as credenciais pelo WhatsApp."
            : "Acesse seu mapa, plano alimentar indicado e proximos passos da operacao."}
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
              ? "Cadastrar participante"
              : "Entrar"}
        </Button>
      </form>

      {isSignup ? (
        <p className="mt-5 text-center text-sm text-graphite">
          Ja tem conta?{" "}
          <Link className="font-semibold text-command hover:underline" href="/auth/login">
            Entrar
          </Link>
        </p>
      ) : (
        <p className="mt-5 text-center text-sm text-graphite">
          Seu acesso e criado pela equipe e enviado pelo WhatsApp.
        </p>
      )}
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
