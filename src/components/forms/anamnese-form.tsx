"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calculateOperation12sMetabolism,
  type ActivityLevel,
  type BiologicalSex
} from "@/lib/calculations/metabolic";
import { supabase } from "@/lib/supabase/client";
import { anamneseSchema, type AnamneseFormData } from "@/schemas/anamnese";

const steps = [
  "Dados basicos",
  "Objetivos e dores",
  "Atividade e sono",
  "Avaliacao alimentar e saude"
] as const;

const goalOptions = [
  "Emagrecer",
  "Reduzir gordura abdominal",
  "Melhorar saude",
  "Ter mais energia",
  "Sair do efeito sanfona",
  "Criar rotina alimentar",
  "Melhorar relacao com a comida"
];

const difficultyOptions = [
  "Ansiedade",
  "Doces",
  "Beliscos",
  "Fome a noite",
  "Final de semana",
  "Falta de rotina",
  "Comer fora",
  "Comeco bem e depois abandono"
];

const healthOptions = [
  "Nenhuma",
  "Diabetes",
  "Pre-diabetes",
  "Hipertensao",
  "Colesterol alterado",
  "Triglicerideos alterados",
  "Hipotireoidismo",
  "Uso de medicacao continua",
  "Transtorno alimentar relatado"
];

export function AnamneseForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch
  } = useForm<AnamneseFormData>({
    resolver: zodResolver(anamneseSchema),
    defaultValues: {
      biologicalSex: "mulher",
      activityLevel: "sedentario",
      foodPreference: "onivoro",
      mainGoals: [],
      mainDifficulties: [],
      healthConditions: ["Nenhuma"],
      motivation: 7,
      weekendDifficulty: false,
      sweetsDifficulty: false,
      nightHunger: false
    }
  });

  const preview = useMemo(() => {
    const values = watch();
    const hasEnoughData =
      values.biologicalSex &&
      values.activityLevel &&
      values.age &&
      values.weightKg &&
      values.heightCm;

    if (!hasEnoughData) {
      return null;
    }

    return calculateOperation12sMetabolism({
      biologicalSex: values.biologicalSex as BiologicalSex,
      activityLevel: values.activityLevel as ActivityLevel,
      age: Number(values.age),
      weightKg: Number(values.weightKg),
      heightCm: Number(values.heightCm)
    });
  }, [watch]);

  async function onSubmit(data: AnamneseFormData) {
    setFormError(null);
    setIsSubmitting(true);

    if (!supabase) {
      setFormError("Supabase nao esta configurado.");
      setIsSubmitting(false);
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const metabolic = calculateOperation12sMetabolism({
      biologicalSex: data.biologicalSex,
      activityLevel: data.activityLevel,
      age: data.age,
      weightKg: data.weightKg,
      heightCm: data.heightCm
    });

    const { data: anamnese, error: anamneseError } = await supabase
      .from("anamneses")
      .insert({
        user_id: user.id,
        full_name: data.fullName,
        age: data.age,
        biological_sex: data.biologicalSex,
        weight_kg: data.weightKg,
        height_cm: data.heightCm,
        main_goal: data.mainGoals.join(", "),
        weight_loss_history: data.weightLossHistory || null,
        main_difficulty: data.mainDifficulties.join(", "),
        activity_level: data.activityLevel,
        sleep_hours: data.sleepHours || null,
        sleep_quality: data.sleepQuality || null,
        health_conditions: data.healthConditions,
        food_preference: data.foodPreference,
        motivation: data.motivation,
        behavioral_answers: {
          weekendDifficulty: data.weekendDifficulty,
          sweetsDifficulty: data.sweetsDifficulty,
          nightHunger: data.nightHunger,
          activityDescription: data.activityDescription || null
        },
        raw_answers: data,
        completed_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (anamneseError || !anamnese) {
      setFormError(anamneseError?.message ?? "Nao foi possivel salvar a anamnese.");
      setIsSubmitting(false);
      return;
    }

    const { error: calculationError } = await supabase
      .from("metabolic_calculations")
      .insert({
        user_id: user.id,
        anamnese_id: anamnese.id,
        basal_metabolic_rate: metabolic.basalMetabolicRate,
        total_energy_expenditure: metabolic.totalEnergyExpenditure,
        activity_factor: metabolic.activityFactor,
        cut_target_calories: metabolic.cutTargetCalories,
        indicated_plan_code: metabolic.indicatedPlan?.code ?? null,
        estimated_deficit: metabolic.estimatedDeficit,
        review_status: metabolic.reviewRecommended
          ? "revisao_recomendada"
          : "sem_revisao",
        review_reasons: metabolic.reviewReasons
      });

    if (calculationError) {
      setFormError(calculationError.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Etapa {step + 1} de {steps.length}
        </p>
        <h2 className="mt-2 text-2xl font-bold">{steps[step]}</h2>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FieldError message={errors.fullName?.message} />
              <Input placeholder="Nome completo" {...register("fullName")} />
              <Input placeholder="Idade" type="number" {...register("age")} />
              <Input
                placeholder="Peso atual (kg)"
                step="0.1"
                type="number"
                {...register("weightKg")}
              />
              <Input
                placeholder="Altura (cm)"
                type="number"
                {...register("heightCm")}
              />
              <select
                className="h-11 rounded-lg border border-coal/15 bg-white px-3 text-sm"
                {...register("biologicalSex")}
              >
                <option value="mulher">Mulher</option>
                <option value="homem">Homem</option>
                <option value="indefinido">Prefiro revisar com a equipe</option>
              </select>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-coal">
                  Objetivos principais
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {goalOptions.map((option) => (
                    <label className="flex items-center gap-2 text-sm" key={option}>
                      <input
                        className="h-4 w-4"
                        type="checkbox"
                        value={option}
                        {...register("mainGoals")}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-coal">
                  Principais dores
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {difficultyOptions.map((option) => (
                    <label className="flex items-center gap-2 text-sm" key={option}>
                      <input
                        className="h-4 w-4"
                        type="checkbox"
                        value={option}
                        {...register("mainDifficulties")}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <textarea
                className="min-h-24 rounded-lg border border-coal/15 bg-white px-3 py-3 text-sm"
                placeholder="Conte rapidamente seu historico de emagrecimento."
                {...register("weightLossHistory")}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <select
                className="h-11 rounded-lg border border-coal/15 bg-white px-3 text-sm"
                {...register("activityLevel")}
              >
                <option value="sedentario">Nao pratico atividade fisica</option>
                <option value="baixo">1 a 2x por semana</option>
                <option value="moderado">3 a 4x por semana</option>
                <option value="alto">5x ou mais por semana</option>
                <option value="muito_alto">Atividade intensa/frequente</option>
              </select>
              {watch("activityLevel") !== "sedentario" ? (
                <Input
                  placeholder="Qual atividade fisica realiza?"
                  {...register("activityDescription")}
                />
              ) : null}
              <select
                className="h-11 rounded-lg border border-coal/15 bg-white px-3 text-sm"
                {...register("sleepHours")}
              >
                <option value="">Horas de sono</option>
                <option value="5 horas ou menos por noite">
                  5 horas ou menos por noite
                </option>
                <option value="6 horas por noite">6 horas por noite</option>
                <option value="7 horas por noite">7 horas por noite</option>
                <option value="8 horas ou mais por noite">
                  8 horas ou mais por noite
                </option>
              </select>
              <select
                className="h-11 rounded-lg border border-coal/15 bg-white px-3 text-sm"
                {...register("sleepQuality")}
              >
                <option value="">Qualidade do sono</option>
                <option value="bom">
                  Bom: nao levanta/desperta durante a noite
                </option>
                <option value="regular">
                  Regular: eventualmente desperta, mas volta a dormir normalmente
                </option>
                <option value="ruim">
                  Ruim: acorda sem motivo aparente ou tem dificuldade para adormecer
                </option>
              </select>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-coal">
                  Tipo de dieta usual
                </p>
                <select
                  className="mt-3 h-11 w-full rounded-lg border border-coal/15 bg-white px-3 text-sm"
                  {...register("foodPreference")}
                >
                  <option value="onivoro">Onivoro</option>
                  <option value="vegetariano">Vegetariano</option>
                  <option value="vegano">Vegano</option>
                  <option value="restricoes">Tenho restricoes alimentares</option>
                </select>
              </div>
              <div>
                <p className="text-sm font-semibold text-coal">Condicoes de saude</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {healthOptions.map((option) => (
                    <label className="flex items-center gap-2 text-sm" key={option}>
                      <input
                        className="h-4 w-4"
                        type="checkbox"
                        value={option}
                        {...register("healthConditions")}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <Input
                max={10}
                min={0}
                placeholder="Motivacao de 0 a 10"
                type="number"
                {...register("motivation")}
              />
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("weekendDifficulty")} />
                  Final de semana costuma atrapalhar
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("sweetsDifficulty")} />
                  Doces sao uma dificuldade importante
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("nightHunger")} />
                  Sinto fome ou vontade de comer a noite
                </label>
              </div>
            </div>
          ) : null}

          <ValidationSummary errors={errors} />
          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

          <div className="flex flex-wrap gap-3">
            {step > 0 ? (
              <Button onClick={() => setStep((current) => current - 1)} variant="ghost">
                Voltar
              </Button>
            ) : null}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((current) => current + 1)} variant="secondary">
                Continuar
              </Button>
            ) : (
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Salvando..." : "Finalizar anamnese"}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="h-fit">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
          Previa
        </p>
        <h2 className="mt-2 text-xl font-bold">Calculo da operacao</h2>
        {preview?.indicatedPlan ? (
          <div className="mt-4 space-y-3 text-sm text-graphite">
            <p>TMB: {preview.basalMetabolicRate} kcal</p>
            <p>GET: {preview.totalEnergyExpenditure} kcal</p>
            <p>Meta inicial: {preview.cutTargetCalories} kcal</p>
            <p>
              Plano indicado:{" "}
              <strong className="text-coal">{preview.indicatedPlan.title}</strong>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-graphite">
            Preencha dados basicos para visualizar a previa do calculo.
          </p>
        )}
      </Card>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="md:col-span-2 text-sm text-red-700">{message}</p>;
}

function ValidationSummary({
  errors
}: {
  errors: ReturnType<typeof useForm<AnamneseFormData>>["formState"]["errors"];
}) {
  const messages = Object.values(errors)
    .map((error) => error?.message)
    .filter(Boolean);

  if (!messages.length) {
    return null;
  }

  return (
    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {messages[0]}
    </div>
  );
}
