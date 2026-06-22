"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Ruler, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getPostLoginRedirectPath } from "@/lib/auth/redirect";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Assessment = Database["public"]["Tables"]["physical_assessments"]["Row"];

type AssessmentsState = {
  assessments: Assessment[];
  error: string | null;
  loading: boolean;
};

const assessmentWeeks = [0, 4, 8, 12];

const measureLabels: Array<{
  key: keyof Pick<
    Assessment,
    | "weight_kg"
    | "neck_cm"
    | "arm_cm"
    | "waist_cm"
    | "abdomen_cm"
    | "thigh_cm"
    | "calf_cm"
  >;
  label: string;
  suffix: string;
}> = [
  { key: "weight_kg", label: "Peso", suffix: "kg" },
  { key: "neck_cm", label: "Pescoço", suffix: "cm" },
  { key: "arm_cm", label: "Braço", suffix: "cm" },
  { key: "waist_cm", label: "Cintura", suffix: "cm" },
  { key: "abdomen_cm", label: "Abdômen", suffix: "cm" },
  { key: "thigh_cm", label: "Coxa", suffix: "cm" },
  { key: "calf_cm", label: "Panturrilha", suffix: "cm" }
];

export function AssessmentsContent() {
  const [state, setState] = useState<AssessmentsState>({
    assessments: [],
    error: null,
    loading: true
  });

  useEffect(() => {
    async function loadAssessments() {
      if (!supabase) {
        setState({
          assessments: [],
          error: "Supabase não está configurado.",
          loading: false
        });
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

      if (redirectPath !== "/dashboard") {
        window.location.replace(redirectPath);
        return;
      }

      const { data, error } = await supabase
        .from("physical_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("week", { ascending: true })
        .order("created_at", { ascending: true });

      setState({
        assessments: data ?? [],
        error: error?.message ?? null,
        loading: false
      });
    }

    void loadAssessments();
  }, []);

  const assessmentsByWeek = useMemo(() => {
    const grouped = new Map<number, Assessment>();

    for (const assessment of state.assessments) {
      grouped.set(assessment.week, assessment);
    }

    return grouped;
  }, [state.assessments]);

  if (state.loading) {
    return <Card>Carregando avaliações...</Card>;
  }

  if (state.error) {
    return (
      <Card className="max-w-3xl">
        <p className="text-sm font-semibold text-red-700">{state.error}</p>
      </Card>
    );
  }

  if (!state.assessments.length) {
    return (
      <Card className="max-w-3xl">
        <ClipboardCheck className="h-8 w-8 text-cocoa" />
        <h2 className="mt-4 text-2xl font-bold">Avaliação ainda não registrada</h2>
        <p className="mt-3 leading-7 text-graphite">
          Sua avaliação física inicial será exibida aqui depois que o Questionário
          Operação 12S for concluído.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Evolução física
        </p>
        <h2 className="mt-2 text-2xl font-bold">Avaliações da Operação 12S</h2>
        <p className="mt-3 max-w-3xl leading-7 text-graphite">
          A semana 0 é preenchida automaticamente com as medidas informadas no
          questionário. As próximas avaliações ficam planejadas para acompanhar a
          evolução ao longo das 12 semanas.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        {assessmentWeeks.map((week) => {
          const assessment = assessmentsByWeek.get(week);

          return (
            <Card
              className={assessment ? "border-cocoa/40" : "bg-linen/60"}
              key={week}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-cocoa">
                    Semana {week}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    {assessment ? "Registrada" : "Programada"}
                  </h3>
                </div>
                {assessment ? (
                  <Scale className="h-6 w-6 text-cocoa" />
                ) : (
                  <CalendarDays className="h-6 w-6 text-graphite/60" />
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-graphite">
                {assessment
                  ? `Registrada em ${formatDate(assessment.created_at)}`
                  : "Será usada para comparar sua evolução."}
              </p>
            </Card>
          );
        })}
      </div>

      {state.assessments.map((assessment) => (
        <Card key={assessment.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
                Semana {assessment.week}
              </p>
              <h3 className="mt-2 text-2xl font-bold">Medidas registradas</h3>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-linen px-3 py-2 text-sm font-semibold text-coal">
              <Ruler className="h-4 w-4 text-cocoa" />
              {formatDate(assessment.created_at)}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {measureLabels.map((measure) => (
              <div className="rounded-lg border border-coal/10 bg-linen/50 px-4 py-3" key={measure.key}>
                <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">
                  {measure.label}
                </span>
                <strong className="mt-1 block text-2xl">
                  {formatMeasure(assessment[measure.key], measure.suffix)}
                </strong>
              </div>
            ))}
          </div>

          {assessment.notes ? (
            <p className="mt-5 rounded-lg bg-linen px-4 py-3 text-sm leading-6 text-graphite">
              {assessment.notes}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function formatMeasure(value: number | null, suffix: string) {
  return value ? `${value} ${suffix}` : "-";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(new Date(value));
}
