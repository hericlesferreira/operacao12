"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, FileText, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPostLoginRedirectPath } from "@/lib/auth/redirect";
import {
  type MealPlanCode,
  operation12sMealPlans
} from "@/lib/calculations/metabolic";
import { supabase } from "@/lib/supabase/client";

type MealPlanState = {
  loading: boolean;
  hasAnamnese: boolean;
  calculatedPlanCode: string | null;
  approvedPlanCode: string | null;
  curationStatus: string | null;
  cutTargetCalories: number | null;
  totalEnergyExpenditure: number | null;
  reviewReasons: string[];
};

export function MealPlanContent() {
  const [state, setState] = useState<MealPlanState>({
    loading: true,
    hasAnamnese: false,
    calculatedPlanCode: null,
    approvedPlanCode: null,
    curationStatus: null,
    cutTargetCalories: null,
    totalEnergyExpenditure: null,
    reviewReasons: []
  });

  useEffect(() => {
    async function loadMealPlan() {
      if (!supabase) {
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

      const redirectPath = await getPostLoginRedirectPath(user.id);

      if (redirectPath === "/admin") {
        window.location.replace("/admin");
        return;
      }

      const [{ data: anamnese }, { data: calculation }, { data: curation }] =
        await Promise.all([
          supabase
            .from("anamneses")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("metabolic_calculations")
            .select(
              "cut_target_calories, indicated_plan_code, total_energy_expenditure, review_reasons"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("plan_curations")
            .select("status, approved_plan_code")
            .eq("user_id", user.id)
            .maybeSingle()
        ]);

      setState({
        loading: false,
        hasAnamnese: Boolean(anamnese),
        calculatedPlanCode: calculation?.indicated_plan_code ?? null,
        approvedPlanCode: curation?.approved_plan_code ?? null,
        curationStatus: curation?.status ?? null,
        cutTargetCalories: calculation?.cut_target_calories ?? null,
        totalEnergyExpenditure: calculation?.total_energy_expenditure ?? null,
        reviewReasons: calculation?.review_reasons ?? []
      });
    }

    void loadMealPlan();
  }, []);

  const selectedPlanCode = state.approvedPlanCode ?? state.calculatedPlanCode;
  const plan =
    isMealPlanCode(selectedPlanCode) ? operation12sMealPlans[selectedPlanCode] : null;
  const isApproved = state.curationStatus === "aprovado" && Boolean(state.approvedPlanCode);
  const sourceLabel = isApproved ? "Plano aprovado pelo nutri" : "Plano indicado automaticamente";
  const approvalMessage = isApproved
    ? "Plano e trilha aprovados pelo nutri."
    : "Você já pode seguir este plano e esta trilha, mas eles ainda podem sofrer alterações pois estão pendentes de aprovação do nutri.";

  if (state.loading) {
    return <Card>Carregando plano alimentar...</Card>;
  }

  if (!state.hasAnamnese || !plan) {
    return (
      <Card className="max-w-3xl">
        <h2 className="text-2xl font-bold">Plano ainda não liberado</h2>
        <p className="mt-3 leading-7 text-graphite">
          Responda o Questionário Operação 12S para gerar a indicação inicial do plano alimentar.
        </p>
        <Link href="/onboarding/anamnese">
          <Button className="mt-6" variant="secondary">
            Iniciar Operação 12S
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <Card className="bg-coal text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime">
          {sourceLabel}
        </p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{plan.title}</h2>
        <div className="mt-5 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white">
          {approvalMessage}
        </div>
        <p className="mt-3 max-w-2xl leading-7 text-white/78">
          Este é o PDF de teste liberado para validar a entrega automática do plano.
          Depois, substituímos esses arquivos pelos PDFs finais.
        </p>
        <a href={plan.pdfUrl} rel="noreferrer" target="_blank">
          <Button className="mt-6 bg-lime text-coal hover:bg-lime/80">
            <Download className="mr-2 h-4 w-4" />
            Abrir PDF do plano
          </Button>
        </a>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <Target className="h-6 w-6 text-cocoa" />
          <p className="mt-4 text-sm text-graphite">Plano</p>
          <strong className="mt-1 block text-2xl">{plan.code}</strong>
        </Card>
        <Card>
          <Flame className="h-6 w-6 text-cocoa" />
          <p className="mt-4 text-sm text-graphite">Calorias do plano</p>
          <strong className="mt-1 block text-2xl">{plan.calories} kcal</strong>
        </Card>
        <Card>
          <FileText className="h-6 w-6 text-cocoa" />
          <p className="mt-4 text-sm text-graphite">Meta calculada</p>
          <strong className="mt-1 block text-2xl">
            {state.cutTargetCalories ? `${state.cutTargetCalories} kcal` : "-"}
          </strong>
        </Card>
      </div>

      {state.reviewReasons.length ? (
        <Card className="border-cocoa/40 bg-linen">
          <h3 className="text-xl font-bold">Atenção</h3>
          <p className="mt-2 text-sm leading-6 text-graphite">
            A indicação automática trouxe pontos que podem pedir revisão
            profissional antes de virar orientação definitiva.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-graphite">
            {state.reviewReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function isMealPlanCode(value: string | null): value is MealPlanCode {
  return value === "A" || value === "B" || value === "C" || value === "D";
}
