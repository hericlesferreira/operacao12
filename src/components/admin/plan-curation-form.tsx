"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { operation12sMealPlans } from "@/lib/calculations/metabolic";
import { supabase } from "@/lib/supabase/client";

type PlanCurationFormProps = {
  userId: string;
  calculationId: string | null;
  suggestedPlanCode: string | null;
  initialApprovedPlanCode?: string | null;
  initialObservation?: string | null;
  initialStatus?: "pendente" | "aprovado" | "revisar";
};

export function PlanCurationForm({
  calculationId,
  initialApprovedPlanCode,
  initialObservation,
  initialStatus = "pendente",
  suggestedPlanCode,
  userId
}: PlanCurationFormProps) {
  const [status, setStatus] = useState(initialStatus);
  const [approvedPlanCode, setApprovedPlanCode] = useState(
    initialApprovedPlanCode ?? suggestedPlanCode ?? ""
  );
  const [adminObservation, setAdminObservation] = useState(initialObservation ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
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

      const response = await fetch("/api/admin/plan-curation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          calculationId,
          suggestedPlanCode,
          approvedPlanCode: approvedPlanCode || null,
          status,
          adminObservation
        })
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(result.error ?? "Não foi possível salvar a curadoria.");
        return;
      }

      setMessage(result.message ?? "Curadoria salva.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível salvar a curadoria."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-coal">Status da curadoria</span>
          <select
            className="h-11 rounded-lg border border-coal/15 bg-white px-3"
            onChange={(event) =>
              setStatus(event.target.value as "pendente" | "aprovado" | "revisar")
            }
            value={status}
          >
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="revisar">Revisar manualmente</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-coal">Plano aprovado</span>
          <select
            className="h-11 rounded-lg border border-coal/15 bg-white px-3"
            onChange={(event) => setApprovedPlanCode(event.target.value)}
            value={approvedPlanCode}
          >
            <option value="">Selecionar depois</option>
            {Object.values(operation12sMealPlans).map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.title} ({plan.calories} kcal)
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-coal">Observação interna</span>
        <textarea
          className="min-h-24 rounded-lg border border-coal/15 bg-white px-3 py-3"
          onChange={(event) => setAdminObservation(event.target.value)}
          placeholder="Exemplo: manter plano sugerido por enquanto; revisar após retorno."
          value={adminObservation}
        />
      </label>

      <div>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando..." : "Salvar curadoria"}
        </Button>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-lime/25 px-3 py-2 text-sm text-coal">{message}</p> : null}
    </form>
  );
}
