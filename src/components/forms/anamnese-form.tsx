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
import { generateTrailContent } from "@/lib/trail/generator";
import {
  anamneseSchema,
  calculateAge,
  type AnamneseFormData
} from "@/schemas/anamnese";
import type { Json } from "@/types/database";

const draftStorageKey = "operacao12s:anamnese-draft";

const goalOptions = [
  "Emagrecer",
  "Reduzir gordura abdominal",
  "Melhorar saúde",
  "Ter mais energia",
  "Sair do efeito sanfona",
  "Criar rotina alimentar",
  "Melhorar relação com a comida"
];

const difficultyOptions = [
  "Ansiedade",
  "Vontades de doces",
  "Beliscar durante o dia",
  "Sentir muita fome à noite",
  "Finais de semana",
  "Eventos sociais (festas, aniversários)",
  "Falta de rotina",
  "Comer fora",
  "Começo bem, mas depois abandono"
];

const dietOptions = [
  "Vegetariano",
  "Vegano",
  "Ovolactovegetariano",
  "Carnívora",
  "Intolerância à lactose",
  "Intolerância ao glúten"
];

const allergyOptions = ["Corante", "Ovo", "Glúten", "APLV", "Outro"];

const healthOptions = [
  { label: "Nenhuma" },
  { label: "Diabetes", helper: "Açúcar no sangue" },
  { label: "Hipertensão", helper: "Alteração de pressão arterial" },
  { label: "Dislipidemia", helper: "Colesterol ruim" },
  { label: "Hipotireoidismo" },
  { label: "Hipertireoidismo" },
  { label: "Ansiedade" },
  { label: "Outro" }
];

const measurementQuestions = {
  weightKg: {
    title: "Qual é o seu peso atualizado?",
    helper: "Informe em kg. Exemplo: 82.5"
  },
  neckCm: {
    title: "Qual a circunferência do pescoço?",
    helper: "Meça ao redor do pescoço, mantendo a fita reta e sem apertar."
  },
  armCm: {
    title: "Qual a circunferência do braço?",
    helper: "Meça o braço relaxado, no ponto médio entre ombro e cotovelo."
  },
  waistCm: {
    title: "Qual a circunferência da cintura?",
    helper: "Meça na região mais estreita do tronco, com a fita paralela ao chão."
  },
  abdomenCm: {
    title: "Qual a circunferência do abdômen?",
    helper: "Meça na altura do umbigo, sem prender a respiração."
  },
  thighCm: {
    title: "Qual a circunferência da coxa?",
    helper: "Meça a coxa em pé, no ponto médio entre quadril e joelho."
  },
  calfCm: {
    title: "Qual a circunferência da panturrilha?",
    helper: "Meça a região mais larga da panturrilha."
  }
} as const;

type QuestionKey =
  | "birthDate"
  | "heightCm"
  | "biologicalSex"
  | "mainGoals"
  | "mainDifficulties"
  | "weightLossHistory"
  | "activityLevel"
  | "activityDescription"
  | "sleepHours"
  | "sleepQuality"
  | "foodPreferences"
  | "dislikedFoods"
  | "foodAllergies"
  | "foodAllergyOther"
  | "healthConditions"
  | "healthConditionOther"
  | "motivation"
  | "weekendDifficulty"
  | "weekendDifficultyReason"
  | "sweetsDifficulty"
  | "nightHunger"
  | keyof typeof measurementQuestions;

type Question = {
  key: QuestionKey;
  title: string;
  helper?: string;
  fields: Array<keyof AnamneseFormData>;
  measurement?: boolean;
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
      mainGoals: [],
      mainDifficulties: [],
      foodPreferences: [],
      foodAllergies: [],
      healthConditions: [],
      motivation: 7,
      weekendDifficulty: "nao",
      sweetsDifficulty: "nao",
      nightHunger: "nao"
    }
  });

  const values = watch();
  const age = values.birthDate ? calculateAge(values.birthDate) : 0;
  const questions = useMemo(() => buildQuestions(values), [values]);
  const currentQuestion = questions[questionIndex] ?? questions[0];
  const progress = Math.round(((questionIndex + 1) / questions.length) * 100);

  const preview = useMemo(() => {
    const hasEnoughData =
      values.biologicalSex &&
      values.activityLevel &&
      age >= 16 &&
      values.weightKg &&
      values.heightCm;

    if (!hasEnoughData) {
      return null;
    }

    return calculateOperation12sMetabolism({
      biologicalSex: values.biologicalSex as BiologicalSex,
      activityLevel: values.activityLevel as ActivityLevel,
      age,
      weightKg: Number(values.weightKg),
      heightCm: Number(values.heightCm)
    });
  }, [age, values]);

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
        setFormError("Supabase não está configurado.");
        setIsSubmitting(false);
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setFormError(
          "Sua sessão expirou. Faça login novamente para finalizar a anamnese."
        );
        setIsSubmitting(false);
        return;
      }

      const userAge = calculateAge(data.birthDate);
      const metabolic = calculateOperation12sMetabolism({
        biologicalSex: data.biologicalSex,
        activityLevel: data.activityLevel,
        age: userAge,
        weightKg: data.weightKg,
        heightCm: data.heightCm
      });

      const {
        data: { fullName }
      } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => ({
          data: { fullName: profile?.full_name ?? user.email ?? "Participante" }
        }));

      const { data: anamnese, error: anamneseError } = await supabase
        .from("anamneses")
        .insert({
          user_id: user.id,
          full_name: fullName,
          age: userAge,
          biological_sex: data.biologicalSex,
          weight_kg: data.weightKg,
          height_cm: data.heightCm,
          main_goal: data.mainGoals.join(", "),
          weight_loss_history: data.weightLossHistory || null,
          main_difficulty: data.mainDifficulties.join(", "),
          activity_level: data.activityLevel,
          sleep_hours: data.sleepHours || null,
          sleep_quality: data.sleepQuality || null,
          health_conditions: [
            ...data.healthConditions,
            ...(data.healthConditionOther ? [`Outro: ${data.healthConditionOther}`] : [])
          ],
          food_preference: data.foodPreferences.join(", "),
          motivation: data.motivation,
          behavioral_answers: {
            birthDate: data.birthDate,
            weekendDifficulty: data.weekendDifficulty,
            weekendDifficultyReason: data.weekendDifficultyReason || null,
            sweetsDifficulty: data.sweetsDifficulty,
            nightHunger: data.nightHunger,
            activityDescription: data.activityDescription || null,
            dislikedFoods: data.dislikedFoods || null,
            foodAllergies: data.foodAllergies,
            foodAllergyOther: data.foodAllergyOther || null
          },
          raw_answers: data,
          completed_at: new Date().toISOString()
        })
        .select("*")
        .single();

      if (anamneseError || !anamnese) {
        setFormError(anamneseError?.message ?? "Não foi possível salvar a anamnese.");
        setIsSubmitting(false);
        return;
      }

      const { data: calculation, error: calculationError } = await supabase
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
        })
        .select("*")
        .single();

      if (calculationError || !calculation) {
        setFormError(calculationError?.message ?? "Não foi possível gerar o cálculo metabólico.");
        setIsSubmitting(false);
        return;
      }

      const { data: assessment, error: assessmentError } = await supabase
        .from("physical_assessments")
        .upsert({
          user_id: user.id,
          week: 0,
          weight_kg: data.weightKg,
          neck_cm: data.neckCm,
          arm_cm: data.armCm,
          waist_cm: data.waistCm,
          abdomen_cm: data.abdomenCm,
          thigh_cm: data.thighCm,
          calf_cm: data.calfCm
        }, {
          onConflict: "user_id,week"
        })
        .select("*")
        .single();

      if (assessmentError || !assessment) {
        setFormError(assessmentError?.message ?? "Não foi possível salvar a avaliação física.");
        setIsSubmitting(false);
        return;
      }

      const trailContent = generateTrailContent({
        anamnese,
        assessment,
        calculation,
        curation: null
      });

      const { error: trailError } = await supabase.from("operation_trails").insert({
        user_id: user.id,
        anamnese_id: anamnese.id,
        calculation_id: calculation.id,
        priorities: trailContent as unknown as Json,
        recommended_materials: [],
        generated_at: new Date().toISOString()
      });

      if (trailError) {
        setFormError(trailError.message);
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
          : "Não foi possível finalizar a anamnese."
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
              {currentQuestion.measurement ? (
                <MeasurementFrame helper={currentQuestion.helper}>
                  <QuestionField
                    questionKey={currentQuestion.key}
                    register={register}
                    values={values}
                  />
                </MeasurementFrame>
              ) : (
                <QuestionField
                  questionKey={currentQuestion.key}
                  register={register}
                  values={values}
                />
              )}
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
            Prévia
        </p>
        <h2 className="mt-2 text-xl font-bold">Cálculo da operação</h2>
        {preview?.indicatedPlan ? (
          <div className="mt-4 space-y-3 text-sm text-graphite">
            <p>Idade calculada: {age} anos</p>
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
            Preencha data de nascimento, estatura, peso e atividade para ver a
            prévia.
          </p>
        )}
      </Card>
    </div>
  );
}

function buildQuestions(values: Partial<AnamneseFormData>): Question[] {
  const questions: Question[] = [
    { key: "birthDate", title: "Qual é a sua data de nascimento?", fields: ["birthDate"] },
    { key: "heightCm", title: "Qual é a sua estatura?", helper: "Informe em centímetros, sem casa decimal. Exemplo: 170", fields: ["heightCm"] },
    { key: "biologicalSex", title: "Qual é o seu sexo?", fields: ["biologicalSex"] },
    { key: "mainGoals", title: "Quais são seus principais objetivos?", helper: "Selecione todas as opções que fazem sentido para você.", fields: ["mainGoals"] },
    { key: "mainDifficulties", title: "O que mais te atrapalha hoje?", helper: "Selecione todas as opções que fazem sentido para sua rotina.", fields: ["mainDifficulties"] },
    { key: "weightLossHistory", title: "Me conte mais sobre você e sua história com emagrecimento.", helper: "Fique à vontade para compartilhar seu contexto. Este campo ajuda a deixar a trilha mais humana.", fields: ["weightLossHistory"] },
    { key: "activityLevel", title: "Como está sua rotina de atividade física?", fields: ["activityLevel"] }
  ];

  if (values.activityLevel && values.activityLevel !== "sedentario") {
    questions.push({ key: "activityDescription", title: "Qual atividade física você realiza?", fields: ["activityDescription"] });
  }

  questions.push(
    { key: "sleepHours", title: "Quantas horas você costuma dormir por noite?", fields: ["sleepHours"] },
    { key: "sleepQuality", title: "Como você avalia a qualidade do seu sono?", fields: ["sleepQuality"] },
    { key: "foodPreferences", title: "Qual é o seu tipo de dieta usual?", helper: "Pode escolher mais de uma opção.", fields: ["foodPreferences"] },
    { key: "dislikedFoods", title: "Tem algum alimento que você não come ou não gosta de comer?", helper: "Se sim, escreva quais. Se não, pode deixar em branco.", fields: ["dislikedFoods"] },
    { key: "foodAllergies", title: "Você possui alguma alergia alimentar?", helper: "Selecione as opções que se aplicam.", fields: ["foodAllergies"] }
  );

  if (values.foodAllergies?.includes("Outro")) {
    questions.push({ key: "foodAllergyOther", title: "Qual outra alergia alimentar?", fields: ["foodAllergyOther"] });
  }

  questions.push({
    key: "healthConditions",
    title: "Existe alguma condição de saúde importante diagnosticada?",
    helper: "Selecione pelo menos uma opção.",
    fields: ["healthConditions"]
  });

  if (values.healthConditions?.includes("Outro")) {
    questions.push({ key: "healthConditionOther", title: "Qual outra condição de saúde?", fields: ["healthConditionOther"] });
  }

  questions.push(
    { key: "motivation", title: "De 1 a 10, qual sua motivação hoje?", fields: ["motivation"] },
    { key: "weekendDifficulty", title: "Final de semana costuma atrapalhar sua rotina?", fields: ["weekendDifficulty"] }
  );

  if (values.weekendDifficulty === "sim") {
    questions.push({ key: "weekendDifficultyReason", title: "Por que o final de semana atrapalha?", fields: ["weekendDifficultyReason"] });
  }

  questions.push(
    { key: "sweetsDifficulty", title: "Doces são uma dificuldade para você?", fields: ["sweetsDifficulty"] },
    { key: "nightHunger", title: "Você sente fome ou vontade de comer à noite?", fields: ["nightHunger"] },
    { key: "weightKg", title: measurementQuestions.weightKg.title, helper: measurementQuestions.weightKg.helper, fields: ["weightKg"], measurement: true },
    { key: "neckCm", title: measurementQuestions.neckCm.title, helper: measurementQuestions.neckCm.helper, fields: ["neckCm"], measurement: true },
    { key: "armCm", title: measurementQuestions.armCm.title, helper: measurementQuestions.armCm.helper, fields: ["armCm"], measurement: true },
    { key: "waistCm", title: measurementQuestions.waistCm.title, helper: measurementQuestions.waistCm.helper, fields: ["waistCm"], measurement: true },
    { key: "abdomenCm", title: measurementQuestions.abdomenCm.title, helper: measurementQuestions.abdomenCm.helper, fields: ["abdomenCm"], measurement: true },
    { key: "thighCm", title: measurementQuestions.thighCm.title, helper: measurementQuestions.thighCm.helper, fields: ["thighCm"], measurement: true },
    { key: "calfCm", title: measurementQuestions.calfCm.title, helper: measurementQuestions.calfCm.helper, fields: ["calfCm"], measurement: true }
  );

  return questions;
}

function QuestionField({
  questionKey,
  register,
  values
}: {
  questionKey: QuestionKey;
  register: ReturnType<typeof useForm<AnamneseFormData>>["register"];
  values: Partial<AnamneseFormData>;
}) {
  switch (questionKey) {
    case "birthDate":
      return <Input autoFocus type="date" {...register("birthDate")} />;
    case "heightCm":
      return (
        <Input
          autoFocus
          inputMode="numeric"
          max={230}
          min={130}
          onKeyDown={(event) => {
            if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
              event.preventDefault();
            }
          }}
          placeholder="Exemplo: 170"
          step={1}
          type="number"
          {...register("heightCm")}
        />
      );
    case "biologicalSex":
      return (
        <OptionGrid>
          <RadioOption label="Feminino" value="mulher" {...register("biologicalSex")} />
          <RadioOption label="Masculino" value="homem" {...register("biologicalSex")} />
        </OptionGrid>
      );
    case "mainGoals":
      return <CheckboxList options={goalOptions} register={register("mainGoals")} />;
    case "mainDifficulties":
      return <CheckboxList options={difficultyOptions} register={register("mainDifficulties")} />;
    case "weightLossHistory":
      return <textarea autoFocus className="min-h-36 w-full rounded-lg border border-coal/15 bg-white px-3 py-3 text-sm outline-none focus:border-coal focus:ring-2 focus:ring-coal/10" placeholder="Conte com suas palavras..." {...register("weightLossHistory")} />;
    case "activityLevel":
      return (
        <OptionGrid>
          <RadioOption label="Não pratico atividade física" value="sedentario" {...register("activityLevel")} />
          <RadioOption label="1 a 2x por semana" value="baixo" {...register("activityLevel")} />
          <RadioOption label="3 a 4x por semana" value="moderado" {...register("activityLevel")} />
          <RadioOption label="5x ou mais por semana" value="alto" {...register("activityLevel")} />
        </OptionGrid>
      );
    case "activityDescription":
      return <Input autoFocus placeholder="Exemplo: musculação, caminhada, corrida..." {...register("activityDescription")} />;
    case "sleepHours":
      return (
        <OptionGrid>
          <RadioOption label="5 horas ou menos por noite" value="5 horas ou menos por noite" {...register("sleepHours")} />
          <RadioOption label="6 horas por noite" value="6 horas por noite" {...register("sleepHours")} />
          <RadioOption label="7 horas por noite" value="7 horas por noite" {...register("sleepHours")} />
          <RadioOption label="8 horas ou mais por noite" value="8 horas ou mais por noite" {...register("sleepHours")} />
        </OptionGrid>
      );
    case "sleepQuality":
      return (
        <OptionGrid>
          <RadioOption label="Bom: não levanta/desperta durante a noite" value="bom" {...register("sleepQuality")} />
          <RadioOption label="Regular: eventualmente desperta, mas volta a dormir normalmente" value="regular" {...register("sleepQuality")} />
          <RadioOption label="Ruim: acorda sem motivo aparente ou tem dificuldade para adormecer" value="ruim" {...register("sleepQuality")} />
        </OptionGrid>
      );
    case "foodPreferences":
      return <CheckboxList options={dietOptions} register={register("foodPreferences")} />;
    case "dislikedFoods":
      return <Input autoFocus placeholder="Exemplo: peixe, leite, ovo..." {...register("dislikedFoods")} />;
    case "foodAllergies":
      return <CheckboxList options={allergyOptions} register={register("foodAllergies")} />;
    case "foodAllergyOther":
      return <Input autoFocus placeholder="Qual alergia?" {...register("foodAllergyOther")} />;
    case "healthConditions":
      return (
        <OptionGrid>
          {healthOptions.map((option) => (
            <CheckboxOption key={option.label} label={option.label} helper={option.helper} value={option.label} {...register("healthConditions")} />
          ))}
        </OptionGrid>
      );
    case "healthConditionOther":
      return <Input autoFocus placeholder="Qual condição?" {...register("healthConditionOther")} />;
    case "motivation":
      return (
        <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <label key={value} className={`flex h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-bold transition ${Number(values.motivation) === value ? "border-coal bg-coal text-white" : "border-coal/12 bg-white text-coal hover:border-coal/30"}`}>
              <input className="sr-only" type="radio" value={value} {...register("motivation")} />
              {value}
            </label>
          ))}
        </div>
      );
    case "weekendDifficulty":
      return <YesNoOptions register={register("weekendDifficulty")} />;
    case "weekendDifficultyReason":
      return <Input autoFocus placeholder="Conte brevemente o principal motivo" {...register("weekendDifficultyReason")} />;
    case "sweetsDifficulty":
      return <YesNoUnknownOptions register={register("sweetsDifficulty")} />;
    case "nightHunger":
      return <YesNoUnknownOptions register={register("nightHunger")} />;
    case "weightKg":
      return <Input autoFocus step="0.1" type="number" placeholder="Peso em kg" {...register("weightKg")} />;
    case "neckCm":
    case "armCm":
    case "waistCm":
    case "abdomenCm":
    case "thighCm":
    case "calfCm":
      return <Input autoFocus step="0.1" type="number" placeholder="Medida em cm" {...register(questionKey)} />;
  }
}

function MeasurementFrame({
  children,
  helper
}: {
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-coal/20 bg-linen px-4 text-center text-sm text-graphite">
        Foto de referência da medida
      </div>
      <div>
        {helper ? <p className="mb-4 text-sm leading-6 text-graphite">{helper}</p> : null}
        {children}
      </div>
    </div>
  );
}

function CheckboxList({
  options,
  register
}: {
  options: string[];
  register: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <OptionGrid>
      {options.map((option) => (
        <CheckboxOption key={option} label={option} value={option} {...register} />
      ))}
    </OptionGrid>
  );
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
  helper,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { helper?: string; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-coal/12 bg-white px-4 py-3 text-sm transition hover:border-coal/30">
      <input className="mt-0.5 h-4 w-4" type="checkbox" {...props} />
      <span>
        <span className="block">{label}</span>
        {helper ? <span className="mt-1 block text-xs text-graphite/70">{helper}</span> : null}
      </span>
    </label>
  );
}

function YesNoOptions({
  register
}: {
  register: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <OptionGrid>
      <RadioOption label="Sim" value="sim" {...register} />
      <RadioOption label="Não" value="nao" {...register} />
    </OptionGrid>
  );
}

function YesNoUnknownOptions({
  register
}: {
  register: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <OptionGrid>
      <RadioOption label="Sim" value="sim" {...register} />
      <RadioOption label="Não" value="nao" {...register} />
      <RadioOption label="Não sei" value="nao_sei" {...register} />
    </OptionGrid>
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
