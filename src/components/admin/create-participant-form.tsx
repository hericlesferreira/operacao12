"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

type CreateParticipantFormProps = {
  onCreated?: () => void;
};

type ApiResult = {
  error?: string;
  message?: string;
};

export function CreateParticipantForm({ onCreated }: CreateParticipantFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!supabase) {
        setError("Supabase não está configurado.");
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const form = event.currentTarget;
      const formData = new FormData(form);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20000);

      const response = await fetch("/api/admin/participants", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          fullName: String(formData.get("fullName") ?? ""),
          whatsapp: String(formData.get("whatsapp") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? "")
        })
      });

      window.clearTimeout(timeoutId);
      const result = await readApiResponse(response);

      if (!response.ok) {
        setError(result.error ?? "Não foi possível cadastrar o participante.");
        return;
      }

      form.reset();
      setSuccess(result.message ?? "Participante cadastrado.");
      onCreated?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof DOMException && caughtError.name === "AbortError"
          ? "O cadastro demorou demais para responder. Verifique as variáveis da Vercel e tente novamente."
          : caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível cadastrar o participante."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
      <Input name="fullName" placeholder="Nome completo" required />
      <Input name="whatsapp" placeholder="WhatsApp" />
      <Input name="email" placeholder="E-mail" required type="email" />
      <Input
        minLength={6}
        name="password"
        placeholder="Senha inicial"
        required
        type="text"
      />
      <div className="md:col-span-4">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Cadastrando..." : "Cadastrar participante"}
        </Button>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-4">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-lime/25 px-3 py-2 text-sm text-coal md:col-span-4">
          {success}
        </p>
      ) : null}
    </form>
  );
}

async function readApiResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as ApiResult;
  } catch {
    return { error: text };
  }
}
