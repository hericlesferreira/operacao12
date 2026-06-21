import { z } from "zod";

export const anamneseSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo."),
  age: z.coerce.number().int().min(16, "Idade minima: 16 anos."),
  biologicalSex: z.enum(["homem", "mulher", "indefinido"], {
    required_error: "Selecione o sexo biologico."
  }),
  weightKg: z.coerce
    .number()
    .min(35, "Peso minimo: 35 kg.")
    .max(250, "Peso maximo: 250 kg."),
  heightCm: z.coerce
    .number()
    .min(130, "Altura minima: 130 cm.")
    .max(230, "Altura maxima: 230 cm."),
  mainGoal: z.string().min(3, "Informe o objetivo principal."),
  weightLossHistory: z.string().optional(),
  mainDifficulty: z.string().optional(),
  activityLevel: z.enum(["sedentario", "baixo", "moderado", "alto", "muito_alto"], {
    required_error: "Selecione o nivel de atividade."
  }),
  sleepHours: z.string().optional(),
  sleepQuality: z.string().optional(),
  healthConditions: z.array(z.string()).min(1, "Selecione pelo menos uma opcao."),
  foodPreference: z.string().min(1, "Selecione uma preferencia alimentar."),
  motivation: z.coerce
    .number()
    .int()
    .min(0, "Motivacao minima: 0.")
    .max(10, "Motivacao maxima: 10."),
  weekendDifficulty: z.boolean().default(false),
  sweetsDifficulty: z.boolean().default(false),
  nightHunger: z.boolean().default(false)
});

export type AnamneseFormData = z.infer<typeof anamneseSchema>;
