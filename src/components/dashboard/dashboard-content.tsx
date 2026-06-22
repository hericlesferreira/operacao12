"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, FileDown, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPostLoginRedirectPath } from "@/lib/auth/redirect";
import { operation12sMealPlans } from "@/lib/calculations/metabolic";
import { supabase } from "@/lib/supabase/client";

type DashboardState = {
  loading: boolean;
  fullName: string | null;
  hasAnamnese: boolean;
  calculation: {
    cutTargetCalories: number | null;
    indicatedPlanCode: string | null;
    totalEnergyExpenditure: number | null;
    reviewReasons: string[];
  } | null;
  curation: {
    status: string;
    approvedPlanCode: string | null;
  } | null;
  hasTrail: boolean;
};

export function DashboardContent() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    fullName: null,
    hasAnamnese: false,
    calculation: null,
    curation: null,
    hasTrail: false
  });

  useEffect(() => {
    async function loadDashboard() {
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

      const [
        { data: profile },
        { data: anamnese },
        { data: calculation },
        { data: curation },
        { data: trail }
      ] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
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
          .maybeSingle(),
        supabase
          .from("operation_trails")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      setState({
        loading: false,
        fullName: profile?.full_name ?? null,
        hasAnamnese: Boolean(anamnese),
        calculation: calculation
          ? {
              cutTargetCalories: calculation.cut_target_calories,
              indicatedPlanCode: calculation.indicated_plan_code,
              totalEnergyExpenditure: calculation.total_energy_expenditure,
              reviewReasons: calculation.review_reasons
            }
          : null,
        curation: curation
          ? {
              status: curation.status,
              approvedPlanCode: curation.approved_plan_code
            }
          : null,
        hasTrail: Boolean(trail)
      });
    }

    void loadDashboard();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("anamnese") !== "concluida") {
      return;
    }

    window.alert(
      "Anamnese concluída com sucesso!\n\nSeu plano alimentar e sua trilha da Operação já foram liberados automaticamente.\n\nVocê já pode seguir este plano e esta trilha, mas eles ainda podem sofrer alterações pois estão pendentes de aprovação do nutri."
    );

    params.delete("anamnese");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  const selectedPlanCode =
    state.curation?.approvedPlanCode ?? state.calculation?.indicatedPlanCode;
  const plan =
    selectedPlanCode && selectedPlanCode in operation12sMealPlans
      ? operation12sMealPlans[
          selectedPlanCode as keyof typeof operation12sMealPlans
        ]
      : null;

  const cards = [
    { label: "Semana atual", value: "1", icon: CalendarDays },
    {
      label: "Meta calórica",
      value: state.calculation?.cutTargetCalories
        ? `${state.calculation.cutTargetCalories} kcal`
        : "Aguardando anamnese",
      icon: Flame
    },
    {
      label: "Plano indicado",
      value:
        state.curation?.status === "aprovado" && plan
          ? `${plan.title} (${plan.calories} kcal)`
          : "Em análise",
      icon: Target
    }
  ];

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
            Ponto de partida
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {state.loading
              ? "Carregando sua operação..."
              : state.fullName
                ? `Bem-vindo, ${state.fullName}.`
                : "Bem-vindo à sua operação."}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-graphite">
            {state.hasAnamnese
              ? "Sua anamnese foi registrada. A equipe vai revisar a curadoria antes da entrega final do plano."
              : "O próximo passo é concluir a anamnese para gerar cálculos, plano indicado e trilha da operação."}
          </p>
          <Link href="/onboarding/anamnese">
            <Button className="mt-6" variant="secondary">
              {state.hasAnamnese ? "Atualizar anamnese" : "Responder anamnese"}
            </Button>
          </Link>
        </Card>

        <Card>
          <FileDown className="h-8 w-8 text-cocoa" />
          <h2 className="mt-4 text-xl font-bold">Trilha da Operação</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            {state.hasTrail
              ? "Sua trilha inicial já está disponível com ponto de partida, estratégia alimentar e prioridades."
              : state.hasAnamnese
                ? "A próxima etapa é a equipe liberar sua trilha com ponto de partida, estratégia alimentar e prioridades."
                : "A trilha será liberada depois da anamnese e dos cálculos."}
          </p>
          {state.hasTrail ? (
            <Link href="/trilha">
              <Button className="mt-5 w-full">Ver trilha</Button>
            </Link>
          ) : (
            <Button className="mt-5 w-full" disabled>
              Trilha em preparo
            </Button>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {cards.map((item) => (
          <Card key={item.label}>
            <item.icon className="h-6 w-6 text-cocoa" />
            <p className="mt-4 text-sm text-graphite">{item.label}</p>
            <strong className="mt-1 block text-2xl">{item.value}</strong>
          </Card>
        ))}
      </div>

      {state.calculation?.reviewReasons.length ? (
        <Card className="mt-5 border-cocoa/40 bg-linen">
          <h2 className="text-xl font-bold">Revisão recomendada</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            Este caso pede olhar profissional antes de tratar a indicação como
            definitiva.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-graphite">
            {state.calculation.reviewReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
