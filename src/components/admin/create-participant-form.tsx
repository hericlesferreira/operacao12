"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

type CreateParticipantFormProps = {
  onCreated?: () => void;
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

    if (!supabase) {
      setError("Supabase não está configurado.");
      setIsSubmitting(false);
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      setError("Sua sessão expirou. Faça login novamente.");
      setIsSubmitting(false);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/participants", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: String(formData.get("fullName") ?? ""),
        whatsapp: String(formData.get("whatsapp") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      })
    });

    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(result.error ?? "Não foi possível cadastrar o participante.");
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setSuccess(result.message ?? "Participante cadastrado.");
    setIsSubmitting(false);
    onCreated?.();
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
