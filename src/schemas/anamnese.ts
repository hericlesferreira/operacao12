import { z } from "zod";

export const anamneseSchema = z.object({
  birthDate: z
    .string()
    .min(1, "Informe sua data de nascimento.")
    .refine((value) => calculateAge(value) >= 16, "Idade minima: 16 anos."),
  biologicalSex: z.enum(["homem", "mulher", "indefinido"], {
    required_error: "Selecione o sexo biologico."
  }),
  weightKg: z.coerce
    .number()
    .min(35, "Peso minimo: 35 kg.")
    .max(250, "Peso maximo: 250 kg."),
  heightCm: z.coerce
    .number()
    .int("Informe a altura em centimetros, sem casas decimais.")
    .min(130, "Altura minima: 130 cm.")
    .max(230, "Altura maxima: 230 cm."),
  mainGoals: z.array(z.string()).min(1, "Selecione pelo menos um objetivo."),
  weightLossHistory: z.string().optional(),
  mainDifficulties: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma opcao."),
  activityLevel: z.enum(["sedentario", "baixo", "moderado", "alto", "muito_alto"], {
    required_error: "Selecione o nivel de atividade."
  }),
  activityDescription: z.string().optional(),
  sleepHours: z.string().optional(),
  sleepQuality: z.string().optional(),
  healthConditions: z.array(z.string()).min(1, "Selecione pelo menos uma opcao."),
  healthConditionOther: z.string().optional(),
  foodPreferences: z
    .array(z.string())
    .min(1, "Selecione pelo menos um tipo de dieta usual."),
  dislikedFoods: z.string().optional(),
  foodAllergies: z.array(z.string()).default([]),
  foodAllergyOther: z.string().optional(),
  motivation: z.coerce
    .number()
    .int()
    .min(1, "Motivacao minima: 1.")
    .max(10, "Motivacao maxima: 10."),
  weekendDifficulty: z.enum(["sim", "nao"]),
  weekendDifficultyReason: z.string().optional(),
  sweetsDifficulty: z.enum(["sim", "nao", "nao_sei"]),
  nightHunger: z.enum(["sim", "nao", "nao_sei"]),
  neckCm: z.coerce.number().positive("Informe a circunferencia do pescoco."),
  armCm: z.coerce.number().positive("Informe a circunferencia do braco."),
  waistCm: z.coerce.number().positive("Informe a circunferencia da cintura."),
  abdomenCm: z.coerce.number().positive("Informe a circunferencia do abdomen."),
  thighCm: z.coerce.number().positive("Informe a circunferencia da coxa."),
  calfCm: z.coerce.number().positive("Informe a circunferencia da panturrilha.")
}).superRefine((data, context) => {
  if (data.activityLevel !== "sedentario" && !data.activityDescription?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe qual atividade fisica voce realiza.",
      path: ["activityDescription"]
    });
  }

  if (data.foodAllergies.includes("Outro") && !data.foodAllergyOther?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe qual alergia alimentar.",
      path: ["foodAllergyOther"]
    });
  }

  if (data.healthConditions.includes("Outro") && !data.healthConditionOther?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe qual condicao de saude.",
      path: ["healthConditionOther"]
    });
  }

  if (data.weekendDifficulty === "sim" && !data.weekendDifficultyReason?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Conte rapidamente por que o final de semana atrapalha.",
      path: ["weekendDifficultyReason"]
    });
  }
});

export type AnamneseFormData = z.infer<typeof anamneseSchema>;

export function calculateAge(birthDate: string) {
  const parsedDate = new Date(`${birthDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const hasNotHadBirthdayThisYear =
    today.getMonth() < parsedDate.getMonth() ||
    (today.getMonth() === parsedDate.getMonth() &&
      today.getDate() < parsedDate.getDate());

  if (hasNotHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}
