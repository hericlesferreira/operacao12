"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { operation12sMealPlans } from "@/lib/calculations/metabolic";
import { supabase } from "@/lib/supabase/client";
import type { Database, Json } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Anamnese = Database["public"]["Tables"]["anamneses"]["Row"];
type Calculation = Database["public"]["Tables"]["metabolic_calculations"]["Row"];
type Assessment = Database["public"]["Tables"]["physical_assessments"]["Row"];

type ParticipantDetailState = {
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  anamnese: Anamnese | null;
  calculation: Calculation | null;
  assessment: Assessment | null;
};

export function ParticipantDetail({ participantId }: { participantId: string }) {
  const [state, setState] = useState<ParticipantDetailState>({
    loading: true,
    error: null,
    profile: null,
    anamnese: null,
    calculation: null,
    assessment: null
  });

  useEffect(() => {
    async function loadParticipant() {
      if (!supabase) {
        setState((current) => ({
          ...current,
          loading: false,
          error: "Supabase não está configurado."
        }));
        return;
      }

      const [{ data: profile, error: profileError }, { data: anamneses }, { data: calculations }, { data: assessments }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", participantId)
            .maybeSingle(),
          supabase
            .from("anamneses")
            .select("*")
            .eq("user_id", participantId)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("metabolic_calculations")
            .select("*")
            .eq("user_id", participantId)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("physical_assessments")
            .select("*")
            .eq("user_id", participantId)
            .eq("week", 0)
            .maybeSingle()
        ]);

      if (profileError || !profile) {
        setState({
          loading: false,
          error: profileError?.message ?? "Participante não encontrado.",
          profile: null,
          anamnese: null,
          calculation: null,
          assessment: null
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        profile,
        anamnese: anamneses?.[0] ?? null,
        calculation: calculations?.[0] ?? null,
        assessment: assessments ?? null
      });
    }

    void loadParticipant();
  }, [participantId]);

  const plan =
    state.calculation?.indicated_plan_code &&
    state.calculation.indicated_plan_code in operation12sMealPlans
      ? operation12sMealPlans[
          state.calculation.indicated_plan_code as keyof typeof operation12sMealPlans
        ]
      : null;

  return (
    <div>
      <Link href="/admin/participantes">
        <Button className="mb-5 bg-white/10 text-white hover:bg-white/15" variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para participantes
        </Button>
      </Link>

      {state.loading ? (
        <Card className="bg-white text-coal">Carregando participante...</Card>
      ) : null}

      {state.error ? (
        <Card className="bg-white text-coal">
          <p className="text-red-700">{state.error}</p>
        </Card>
      ) : null}

      {!state.loading && !state.error && state.profile ? (
        <div className="grid gap-5">
          <Card className="bg-white text-coal">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
              Participante
            </p>
            <h2 className="mt-2 text-3xl font-bold">{state.profile.full_name}</h2>
            <div className="mt-4 grid gap-3 text-sm text-graphite md:grid-cols-3">
              <Info label="E-mail" value={state.profile.email} />
              <Info label="WhatsApp" value={state.profile.whatsapp ?? "-"} />
              <Info label="Status" value={state.profile.access_status} />
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="bg-white text-coal">
              <h3 className="text-xl font-bold">Cálculo e plano</h3>
              {state.calculation ? (
                <div className="mt-4 grid gap-3 text-sm text-graphite">
                  <Info label="Plano indicado" value={plan?.title ?? "-"} />
                  <Info label="Calorias do plano" value={plan ? `${plan.calories} kcal` : "-"} />
                  <Info
                    label="Meta calculada"
                    value={
                      state.calculation.cut_target_calories
                        ? `${state.calculation.cut_target_calories} kcal`
                        : "-"
                    }
                  />
                  <Info
                    label="GET"
                    value={
                      state.calculation.total_energy_expenditure
                        ? `${state.calculation.total_energy_expenditure} kcal`
                        : "-"
                    }
                  />
                  <Info
                    label="TMB"
                    value={
                      state.calculation.basal_metabolic_rate
                        ? `${state.calculation.basal_metabolic_rate} kcal`
                        : "-"
                    }
                  />
                  <Info label="Status de revisão" value={state.calculation.review_status} />
                  {state.calculation.review_reasons.length ? (
                    <div>
                      <span className="font-semibold text-coal">Motivos:</span>
                      <ul className="mt-1 list-disc pl-5">
                        {state.calculation.review_reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyText text="Cálculo ainda não gerado." />
              )}
            </Card>

            <Card className="bg-white text-coal">
              <h3 className="text-xl font-bold">Avaliação física inicial</h3>
              {state.assessment ? (
                <div className="mt-4 grid gap-3 text-sm text-graphite md:grid-cols-2">
                  <Info label="Peso" value={formatMeasure(state.assessment.weight_kg, "kg")} />
                  <Info label="Pescoço" value={formatMeasure(state.assessment.neck_cm, "cm")} />
                  <Info label="Braço" value={formatMeasure(state.assessment.arm_cm, "cm")} />
                  <Info label="Cintura" value={formatMeasure(state.assessment.waist_cm, "cm")} />
                  <Info label="Abdômen" value={formatMeasure(state.assessment.abdomen_cm, "cm")} />
                  <Info label="Coxa" value={formatMeasure(state.assessment.thigh_cm, "cm")} />
                  <Info label="Panturrilha" value={formatMeasure(state.assessment.calf_cm, "cm")} />
                </div>
              ) : (
                <EmptyText text="Avaliação física inicial ainda não registrada." />
              )}
            </Card>
          </div>

          <Card className="bg-white text-coal">
            <h3 className="text-xl font-bold">Anamnese</h3>
            {state.anamnese ? (
              <div className="mt-4 grid gap-4 text-sm text-graphite md:grid-cols-2">
                <Info label="Idade" value={`${state.anamnese.age} anos`} />
                <Info label="Sexo" value={state.anamnese.biological_sex} />
                <Info label="Altura" value={formatMeasure(state.anamnese.height_cm, "cm")} />
                <Info label="Objetivos" value={state.anamnese.main_goal} />
                <Info label="O que mais atrapalha" value={state.anamnese.main_difficulty ?? "-"} />
                <Info label="Atividade" value={state.anamnese.activity_level} />
                <Info label="Sono" value={state.anamnese.sleep_hours ?? "-"} />
                <Info label="Qualidade do sono" value={state.anamnese.sleep_quality ?? "-"} />
                <Info label="Dieta usual" value={state.anamnese.food_preference} />
                <Info label="Motivação" value={`${state.anamnese.motivation}/10`} />
                <Info
                  label="Condições de saúde"
                  value={
                    state.anamnese.health_conditions.length
                      ? state.anamnese.health_conditions.join(", ")
                      : "-"
                  }
                />
                <div className="md:col-span-2">
                  <Info
                    label="História com emagrecimento"
                    value={state.anamnese.weight_loss_history ?? "-"}
                  />
                </div>
                <div className="md:col-span-2">
                  <RawAnswers value={state.anamnese.behavioral_answers} />
                </div>
              </div>
            ) : (
              <EmptyText text="Anamnese ainda não respondida." />
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">
        {label}
      </span>
      <span className="mt-1 block text-coal">{value}</span>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="mt-4 text-sm text-graphite">{text}</p>;
}

function RawAnswers({ value }: { value: Json }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value).filter(([, entryValue]) =>
    Boolean(entryValue)
  );

  if (!entries.length) {
    return null;
  }

  return (
    <div>
      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-graphite/60">
        Respostas complementares
      </span>
      <div className="mt-2 grid gap-2">
        {entries.map(([key, entryValue]) => (
          <div className="rounded-lg bg-linen px-3 py-2" key={key}>
            <span className="font-semibold text-coal">{key}: </span>
            <span>{formatJsonValue(entryValue)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatJsonValue(value: Json | undefined) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatMeasure(value: number | null, suffix: string) {
  return value ? `${value} ${suffix}` : "-";
}
