"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type GenerateTrailButtonProps = {
  userId: string;
  disabled?: boolean;
};

export function GenerateTrailButton({ userId, disabled }: GenerateTrailButtonProps) {
  const [status, setStatus] = useState<{
    loading: boolean;
    message: string | null;
    error: string | null;
  }>({
    loading: false,
    message: null,
    error: null
  });

  async function handleGenerate() {
    if (!supabase) {
      setStatus({
        loading: false,
        message: null,
        error: "Supabase não está configurado."
      });
      return;
    }

    setStatus({ loading: true, message: null, error: null });

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      setStatus({
        loading: false,
        message: null,
        error: "Sessão expirada. Faça login novamente."
      });
      return;
    }

    const response = await fetch("/api/admin/generate-trail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });
    const data = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setStatus({
        loading: false,
        message: null,
        error: data.error ?? "Não foi possível gerar a trilha."
      });
      return;
    }

    setStatus({
      loading: false,
      message: data.message ?? "Trilha gerada com sucesso.",
      error: null
    });
  }

  return (
    <div>
      <Button disabled={disabled || status.loading} onClick={handleGenerate}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {status.loading ? "Gerando trilha..." : "Gerar trilha da Operação"}
      </Button>
      {status.message ? (
        <p className="mt-3 text-sm font-medium text-green-700">{status.message}</p>
      ) : null}
      {status.error ? (
        <p className="mt-3 text-sm font-medium text-red-700">{status.error}</p>
      ) : null}
    </div>
  );
}
