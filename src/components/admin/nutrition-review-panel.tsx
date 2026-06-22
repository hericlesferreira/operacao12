"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { operation12sMealPlans } from "@/lib/calculations/metabolic";
import { supabase } from "@/lib/supabase/client";

type ReviewItem = {
  userId: string;
  fullName: string;
  email: string;
  calculationId: string;
  suggestedPlanCode: string | null;
  approvedPlanCode: string | null;
  curationStatus: "pendente" | "aprovado" | "revisar" | null;
  cutTargetCalories: number | null;
  reviewStatus: "sem_revisao" | "revisao_recomendada" | "revisao_necessaria" | null;
  createdAt: string;
};

type PlanCode = keyof typeof operation12sMealPlans;

export function NutritionReviewPanel() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadReviewItems();
  }, []);

  async function loadReviewItems() {
    if (!supabase) {
      setError("Supabase não está configurado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [{ data: profiles, error: profilesError }, { data: calculations }, { data: curations }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "participant"),
        supabase
          .from("metabolic_calculations")
          .select(
            "id, user_id, indicated_plan_code, cut_target_calories, review_status, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("plan_curations")
          .select("user_id, approved_plan_code, status")
      ]);

    if (profilesError) {
      setError(profilesError.message);
      setLoading(false);
      return;
    }

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const curationByUser = new Map((curations ?? []).map((curation) => [curation.user_id, curation]));
    const latestCalculationByUser = new Map<string, NonNullable<typeof calculations>[number]>();

    for (const calculation of calculations ?? []) {
      if (!latestCalculationByUser.has(calculation.user_id)) {
        latestCalculationByUser.set(calculation.user_id, calculation);
      }
    }

    const reviewItems: ReviewItem[] = [];

    for (const calculation of latestCalculationByUser.values()) {
        const profile = profileById.get(calculation.user_id);
        const curation = curationByUser.get(calculation.user_id);

        if (!profile) {
          continue;
        }

        const item: ReviewItem = {
          userId: calculation.user_id,
          fullName: profile.full_name,
          email: profile.email,
          calculationId: calculation.id,
          suggestedPlanCode: calculation.indicated_plan_code,
          approvedPlanCode: curation?.approved_plan_code ?? null,
          curationStatus: curation?.status ?? null,
          cutTargetCalories: calculation.cut_target_calories,
          reviewStatus: calculation.review_status,
          createdAt: calculation.created_at
        };

        if (item.curationStatus !== "aprovado") {
          reviewItems.push(item);
        }
      }

    setItems(reviewItems);
    setSelectedPlans(
      Object.fromEntries(
        reviewItems.map((item) => [
          item.userId,
          item.approvedPlanCode ?? item.suggestedPlanCode ?? ""
        ])
      )
    );
    setLoading(false);
  }

  async function approvePlan(item: ReviewItem) {
    const approvedPlanCode = selectedPlans[item.userId];

    if (!approvedPlanCode) {
      setError("Selecione um plano antes de aprovar.");
      return;
    }

    if (!supabase) {
      setError("Supabase não está configurado.");
      return;
    }

    setSavingId(item.userId);
    setError(null);
    setMessage(null);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      setSavingId(null);
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    const response = await fetch("/api/admin/plan-curation", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: item.userId,
        calculationId: item.calculationId,
        suggestedPlanCode: item.suggestedPlanCode,
        approvedPlanCode,
        status: "aprovado",
        adminObservation: "Aprovado pelo painel de revisão do nutri."
      })
    });
    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(result.error ?? "Não foi possível aprovar a indicação.");
      setSavingId(null);
      return;
    }

    setMessage(result.message ?? "Indicação aprovada.");
    setSavingId(null);
    await loadReviewItems();
  }

  const metrics = useMemo(
    () => ({
      pending: items.length,
      reviewRecommended: items.filter(
        (item) => item.reviewStatus === "revisao_recomendada"
      ).length
    }),
    [items]
  );

  return (
    <Card className="mt-5 bg-white text-coal">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
            Nutri
          </p>
          <h2 className="mt-1 text-xl font-bold">Revisão de indicações</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            Aprove a indicação automática ou troque a faixa calórica antes de
            marcar plano e trilha como revisados.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-56">
          <Metric label="Pendentes" value={metrics.pending} />
          <Metric label="Com alerta" value={metrics.reviewRecommended} />
        </div>
      </div>

      {loading ? <p className="mt-5 text-sm text-graphite">Carregando revisão...</p> : null}
      {error ? <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-5 rounded-lg bg-lime/25 px-3 py-2 text-sm text-coal">{message}</p> : null}

      {!loading && !items.length ? (
        <div className="mt-5 rounded-lg border border-coal/10 bg-linen/60 p-5 text-sm text-graphite">
          Nenhuma indicação pendente de aprovação no momento.
        </div>
      ) : null}

      {!loading && items.length ? (
        <div className="mt-5 grid gap-3">
          {items.map((item) => {
            const suggestedPlan = isPlanCode(item.suggestedPlanCode)
              ? operation12sMealPlans[item.suggestedPlanCode]
              : null;

            return (
              <div
                className="grid gap-4 rounded-lg border border-coal/10 bg-linen/40 p-4 lg:grid-cols-[1fr_190px_220px]"
                key={item.userId}
              >
                <div>
                  <strong className="block text-coal">{item.fullName}</strong>
                  <span className="mt-1 block text-sm text-graphite">{item.email}</span>
                  <div className="mt-3 grid gap-2 text-sm text-graphite sm:grid-cols-2">
                    <span>
                      Sugerido:{" "}
                      <strong className="text-coal">{suggestedPlan?.title ?? "-"}</strong>
                    </span>
                    <span>
                      Meta:{" "}
                      <strong className="text-coal">
                        {item.cutTargetCalories ? `${item.cutTargetCalories} kcal` : "-"}
                      </strong>
                    </span>
                  </div>
                </div>

                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-coal">Plano aprovado</span>
                  <select
                    className="h-11 rounded-lg border border-coal/15 bg-white px-3"
                    onChange={(event) =>
                      setSelectedPlans((current) => ({
                        ...current,
                        [item.userId]: event.target.value
                      }))
                    }
                    value={selectedPlans[item.userId] ?? ""}
                  >
                    <option value="">Selecionar</option>
                    {Object.values(operation12sMealPlans).map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.title}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button
                    disabled={savingId === item.userId}
                    onClick={() => void approvePlan(item)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {savingId === item.userId ? "Aprovando..." : "Aprovar"}
                  </Button>
                  <Link href={`/admin/participantes/${item.userId}`}>
                    <Button className="w-full" variant="ghost">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-linen px-3 py-2">
      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">
        {label}
      </span>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </div>
  );
}

function isPlanCode(value: string | null): value is PlanCode {
  return value === "A" || value === "B" || value === "C" || value === "D";
}
