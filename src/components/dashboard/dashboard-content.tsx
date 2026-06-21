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
};

export function DashboardContent() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    fullName: null,
    hasAnamnese: false,
    calculation: null
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

      const [{ data: profile }, { data: anamnese }, { data: calculation }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle(),
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
          : null
      });
    }

    void loadDashboard();
  }, []);

  const plan =
    state.calculation?.indicatedPlanCode &&
    state.calculation.indicatedPlanCode in operation12sMealPlans
      ? operation12sMealPlans[
          state.calculation.indicatedPlanCode as keyof typeof operation12sMealPlans
        ]
      : null;

  const cards = [
    { label: "Semana atual", value: "1", icon: CalendarDays },
    {
      label: "Meta calorica",
      value: state.calculation?.cutTargetCalories
        ? `${state.calculation.cutTargetCalories} kcal`
        : "Aguardando anamnese",
      icon: Flame
    },
    {
      label: "Plano indicado",
      value: plan ? `${plan.title} (${plan.calories} kcal)` : "Aguardando curadoria",
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
              ? "Carregando sua operacao..."
              : state.fullName
                ? `Bem-vindo, ${state.fullName}.`
                : "Bem-vindo a sua operacao."}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-graphite">
            {state.hasAnamnese
              ? "Sua anamnese foi registrada. A plataforma ja calculou seu ponto de partida e indicou o plano alimentar inicial."
              : "O proximo passo e concluir a anamnese para gerar calculos, plano indicado e trilha da operacao."}
          </p>
          <Link href="/onboarding/anamnese">
            <Button className="mt-6" variant="secondary">
              {state.hasAnamnese ? "Atualizar anamnese" : "Responder anamnese"}
            </Button>
          </Link>
        </Card>

        <Card>
          <FileDown className="h-8 w-8 text-cocoa" />
          <h2 className="mt-4 text-xl font-bold">Trilha da Operacao</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            {state.hasAnamnese
              ? "A proxima etapa e gerar o PDF com ponto de partida, estrategia alimentar e prioridades."
              : "A trilha em PDF sera liberada depois da anamnese e dos calculos."}
          </p>
          <Button className="mt-5 w-full" disabled>
            Baixar trilha
          </Button>
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
          <h2 className="text-xl font-bold">Revisao recomendada</h2>
          <p className="mt-2 text-sm leading-6 text-graphite">
            Este caso pede olhar profissional antes de tratar a indicacao como
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
