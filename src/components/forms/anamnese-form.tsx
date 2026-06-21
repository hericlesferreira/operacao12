"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

const draftStorageKey = "operacao12s:anamnese-draft";

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

type QuestionKey =
  | "fullName"
  | "age"
  | "weightKg"
  | "heightCm"
  | "biologicalSex"
  | "mainGoals"
  | "mainDifficulties"
  | "weightLossHistory"
  | "activityLevel"
  | "activityDescription"
  | "sleepHours"
  | "sleepQuality"
  | "foodPreference"
  | "healthConditions"
  | "motivation"
  | "weekendDifficulty"
  | "sweetsDifficulty"
  | "nightHunger";

type Question = {
  key: QuestionKey;
  title: string;
  helper?: string;
  fields: Array<keyof AnamneseFormData>;
};

export function AnamneseForm() {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    trigger,
    watch
  } = useForm<AnamneseFormData>({
    resolver: zodResolver(anamneseSchema),
    shouldUnregister: false,
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

  const values = watch();
  const questions = useMemo(() => buildQuestions(values.activityLevel), [
    values.activityLevel
  ]);
  const currentQuestion = questions[questionIndex] ?? questions[0];
  const progress = Math.round(((questionIndex + 1) / questions.length) * 100);

  const preview = useMemo(() => {
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
  }, [values]);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftStorageKey);

    if (!savedDraft) {
      return;
    }

    try {
      reset(JSON.parse(savedDraft) as Partial<AnamneseFormData>);
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [reset]);

  useEffect(() => {
    const subscription = watch((draftValues) => {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draftValues));
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (questionIndex > questions.length - 1) {
      setQuestionIndex(questions.length - 1);
    }
  }, [questionIndex, questions.length]);

  async function goNext() {
    setFormError(null);
    const isCurrentValid = await trigger(currentQuestion.fields);

    if (!isCurrentValid) {
      return;
    }

    setQuestionIndex((current) => Math.min(current + 1, questions.length - 1));
  }

  async function onSubmit(data: AnamneseFormData) {
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (!supabase) {
        setFormError("Supabase nao esta configurado.");
        setIsSubmitting(false);
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setFormError(
          "Sua sessao expirou. Faca login novamente para finalizar a anamnese."
        );
        setIsSubmitting(false);
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

      window.localStorage.removeItem(draftStorageKey);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel finalizar a anamnese."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="min-h-[560px]">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">
              Pergunta {questionIndex + 1} de {questions.length}
            </p>
            <span className="text-sm font-semibold text-graphite">{progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-coal/10">
            <div
              className="h-full rounded-full bg-lime transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form
          className="flex min-h-[430px] flex-col justify-between"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-coal">
              {currentQuestion.title}
            </h2>
            {currentQuestion.helper ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite">
                {currentQuestion.helper}
              </p>
            ) : null}
            <div className="mt-8">
              <QuestionField
                questionKey={currentQuestion.key}
                register={register}
                values={values}
              />
            </div>
            <QuestionError question={currentQuestion} errors={errors} />
            {formError ? <p className="mt-4 text-sm text-red-700">{formError}</p> : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {questionIndex > 0 ? (
              <Button
                onClick={(event) => {
                  event.preventDefault();
                  setQuestionIndex((current) => Math.max(current - 1, 0));
                }}
                type="button"
                variant="ghost"
              >
                Voltar
              </Button>
            ) : null}
            {questionIndex < questions.length - 1 ? (
              <Button
                onClick={(event) => {
                  event.preventDefault();
                  void goNext();
                }}
                type="button"
                variant="secondary"
              >
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

function buildQuestions(activityLevel: AnamneseFormData["activityLevel"]): Question[] {
  const questions: Question[] = [
    {
      key: "fullName",
      title: "Qual e o seu nome completo?",
      fields: ["fullName"]
    },
    {
      key: "age",
      title: "Qual e a sua idade?",
      helper: "A Operacao 12S aceita participantes a partir de 16 anos.",
      fields: ["age"]
    },
    {
      key: "weightKg",
      title: "Qual e o seu peso atual?",
      helper: "Informe em kg. Exemplo: 82.5",
      fields: ["weightKg"]
    },
    {
      key: "heightCm",
      title: "Qual e a sua altura?",
      helper: "Informe em centimetros, sem casa decimal. Exemplo: 170",
      fields: ["heightCm"]
    },
    {
      key: "biologicalSex",
      title: "Qual sexo biologico devemos usar para o calculo?",
      fields: ["biologicalSex"]
    },
    {
      key: "mainGoals",
      title: "Quais sao seus principais objetivos?",
      helper: "Selecione todas as opcoes que fazem sentido para voce.",
      fields: ["mainGoals"]
    },
    {
      key: "mainDifficulties",
      title: "Quais sao suas principais dores hoje?",
      helper: "Isso ajuda a direcionar a trilha da operacao.",
      fields: ["mainDifficulties"]
    },
    {
      key: "weightLossHistory",
      title: "Como tem sido seu historico de emagrecimento?",
      helper: "Responda de forma breve. Este campo e opcional.",
      fields: ["weightLossHistory"]
    },
    {
      key: "activityLevel",
      title: "Como esta sua rotina de atividade fisica?",
      fields: ["activityLevel"]
    }
  ];

  if (activityLevel !== "sedentario") {
    questions.push({
      key: "activityDescription",
      title: "Qual atividade fisica voce realiza?",
      fields: ["activityDescription"]
    });
  }

  questions.push(
    {
      key: "sleepHours",
      title: "Quantas horas voce costuma dormir por noite?",
      fields: ["sleepHours"]
    },
    {
      key: "sleepQuality",
      title: "Como voce avalia a qualidade do seu sono?",
      fields: ["sleepQuality"]
    },
    {
      key: "foodPreference",
      title: "Qual e o seu tipo de dieta usual?",
      fields: ["foodPreference"]
    },
    {
      key: "healthConditions",
      title: "Existe alguma condicao de saude importante?",
      helper: "Selecione pelo menos uma opcao, mesmo que seja Nenhuma.",
      fields: ["healthConditions"]
    },
    {
      key: "motivation",
      title: "De 0 a 10, qual e sua motivacao hoje?",
      fields: ["motivation"]
    },
    {
      key: "weekendDifficulty",
      title: "Final de semana costuma atrapalhar sua rotina?",
      fields: ["weekendDifficulty"]
    },
    {
      key: "sweetsDifficulty",
      title: "Doces sao uma dificuldade importante para voce?",
      fields: ["sweetsDifficulty"]
    },
    {
      key: "nightHunger",
      title: "Voce sente fome ou vontade de comer a noite?",
      fields: ["nightHunger"]
    }
  );

  return questions;
}

function QuestionField({
  questionKey,
  register
}: {
  questionKey: QuestionKey;
  register: ReturnType<typeof useForm<AnamneseFormData>>["register"];
  values: AnamneseFormData;
}) {
  switch (questionKey) {
    case "fullName":
      return <Input autoFocus placeholder="Nome completo" {...register("fullName")} />;
    case "age":
      return <Input autoFocus placeholder="Idade" type="number" {...register("age")} />;
    case "weightKg":
      return (
        <Input
          autoFocus
          placeholder="Peso atual (kg)"
          step="0.1"
          type="number"
          {...register("weightKg")}
        />
      );
    case "heightCm":
      return (
        <Input
          autoFocus
          placeholder="Altura em centimetros"
          type="number"
          {...register("heightCm")}
        />
      );
    case "biologicalSex":
      return (
        <OptionGrid>
          <RadioOption label="Mulher" value="mulher" {...register("biologicalSex")} />
          <RadioOption label="Homem" value="homem" {...register("biologicalSex")} />
          <RadioOption
            label="Prefiro revisar com a equipe"
            value="indefinido"
            {...register("biologicalSex")}
          />
        </OptionGrid>
      );
    case "mainGoals":
      return (
        <OptionGrid>
          {goalOptions.map((option) => (
            <CheckboxOption
              key={option}
              label={option}
              value={option}
              {...register("mainGoals")}
            />
          ))}
        </OptionGrid>
      );
    case "mainDifficulties":
      return (
        <OptionGrid>
          {difficultyOptions.map((option) => (
            <CheckboxOption
              key={option}
              label={option}
              value={option}
              {...register("mainDifficulties")}
            />
          ))}
        </OptionGrid>
      );
    case "weightLossHistory":
      return (
        <textarea
          autoFocus
          className="min-h-36 w-full rounded-lg border border-coal/15 bg-white px-3 py-3 text-sm outline-none focus:border-coal focus:ring-2 focus:ring-coal/10"
          placeholder="Conte rapidamente seu historico de emagrecimento."
          {...register("weightLossHistory")}
        />
      );
    case "activityLevel":
      return (
        <OptionGrid>
          <RadioOption
            label="Nao pratico atividade fisica"
            value="sedentario"
            {...register("activityLevel")}
          />
          <RadioOption label="1 a 2x por semana" value="baixo" {...register("activityLevel")} />
          <RadioOption
            label="3 a 4x por semana"
            value="moderado"
            {...register("activityLevel")}
          />
          <RadioOption label="5x ou mais por semana" value="alto" {...register("activityLevel")} />
          <RadioOption
            label="Atividade intensa/frequente"
            value="muito_alto"
            {...register("activityLevel")}
          />
        </OptionGrid>
      );
    case "activityDescription":
      return (
        <Input
          autoFocus
          placeholder="Exemplo: musculacao, caminhada, corrida, funcional..."
          {...register("activityDescription")}
        />
      );
    case "sleepHours":
      return (
        <OptionGrid>
          <RadioOption
            label="5 horas ou menos por noite"
            value="5 horas ou menos por noite"
            {...register("sleepHours")}
          />
          <RadioOption
            label="6 horas por noite"
            value="6 horas por noite"
            {...register("sleepHours")}
          />
          <RadioOption
            label="7 horas por noite"
            value="7 horas por noite"
            {...register("sleepHours")}
          />
          <RadioOption
            label="8 horas ou mais por noite"
            value="8 horas ou mais por noite"
            {...register("sleepHours")}
          />
        </OptionGrid>
      );
    case "sleepQuality":
      return (
        <OptionGrid>
          <RadioOption
            label="Bom: nao levanta/desperta durante a noite"
            value="bom"
            {...register("sleepQuality")}
          />
          <RadioOption
            label="Regular: eventualmente desperta, mas volta a dormir normalmente"
            value="regular"
            {...register("sleepQuality")}
          />
          <RadioOption
            label="Ruim: acorda sem motivo aparente ou tem dificuldade para adormecer"
            value="ruim"
            {...register("sleepQuality")}
          />
        </OptionGrid>
      );
    case "foodPreference":
      return (
        <OptionGrid>
          <RadioOption label="Onivoro" value="onivoro" {...register("foodPreference")} />
          <RadioOption label="Vegetariano" value="vegetariano" {...register("foodPreference")} />
          <RadioOption label="Vegano" value="vegano" {...register("foodPreference")} />
          <RadioOption
            label="Tenho restricoes alimentares"
            value="restricoes"
            {...register("foodPreference")}
          />
        </OptionGrid>
      );
    case "healthConditions":
      return (
        <OptionGrid>
          {healthOptions.map((option) => (
            <CheckboxOption
              key={option}
              label={option}
              value={option}
              {...register("healthConditions")}
            />
          ))}
        </OptionGrid>
      );
    case "motivation":
      return (
        <Input
          autoFocus
          max={10}
          min={0}
          placeholder="Motivacao de 0 a 10"
          type="number"
          {...register("motivation")}
        />
      );
    case "weekendDifficulty":
      return <BooleanQuestion label="Sim, final de semana costuma atrapalhar" register={register("weekendDifficulty")} />;
    case "sweetsDifficulty":
      return <BooleanQuestion label="Sim, doces sao uma dificuldade importante" register={register("sweetsDifficulty")} />;
    case "nightHunger":
      return <BooleanQuestion label="Sim, sinto fome ou vontade de comer a noite" register={register("nightHunger")} />;
  }
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function RadioOption({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-coal/12 bg-white px-4 py-3 text-sm transition hover:border-coal/30">
      <input className="h-4 w-4" type="radio" {...props} />
      {label}
    </label>
  );
}

function CheckboxOption({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-coal/12 bg-white px-4 py-3 text-sm transition hover:border-coal/30">
      <input className="h-4 w-4" type="checkbox" {...props} />
      {label}
    </label>
  );
}

function BooleanQuestion({
  label,
  register
}: {
  label: string;
  register: ReturnType<typeof useForm<AnamneseFormData>>["register"] extends (
    name: infer _Name
  ) => infer Return
    ? Return
    : never;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-coal/12 bg-white px-4 py-3 text-sm transition hover:border-coal/30">
      <input className="h-4 w-4" type="checkbox" {...register} />
      {label}
    </label>
  );
}

function QuestionError({
  errors,
  question
}: {
  errors: ReturnType<typeof useForm<AnamneseFormData>>["formState"]["errors"];
  question: Question;
}) {
  const message = question.fields
    .map((field) => errors[field]?.message)
    .find(Boolean);

  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}
