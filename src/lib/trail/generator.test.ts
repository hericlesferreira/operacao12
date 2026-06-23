import { describe, expect, it } from "vitest";
import { generateTrailContent } from "./generator";

type TrailInput = Parameters<typeof generateTrailContent>[0];
type TestAnamnese = TrailInput["anamnese"];
type TestCalculation = NonNullable<TrailInput["calculation"]>;

const baseAnamnese = {
  id: "anamnese-1",
  user_id: "user-1",
  full_name: "Participante Teste",
  age: 34,
  biological_sex: "mulher",
  weight_kg: 82,
  height_cm: 168,
  main_goal: "Emagrecer",
  main_difficulty: "Vontades de doces",
  weight_loss_history: null,
  activity_level: "sedentario",
  sleep_hours: "7 horas por noite",
  sleep_quality: "bom",
  health_conditions: ["Nenhuma"],
  food_preference: "Carnívora",
  motivation: 7,
  behavioral_answers: {
    activityDescription: null,
    foodAllergies: [],
    nightHunger: "nao",
    sweetsDifficulty: "sim",
    weekendDifficulty: "nao",
    weekendDifficultyReason: null
  },
  raw_answers: {},
  completed_at: "2026-06-23T12:00:00.000Z",
  created_at: "2026-06-23T12:00:00.000Z",
  updated_at: "2026-06-23T12:00:00.000Z"
};

const calculation = {
  indicated_plan_code: "C",
  cut_target_calories: 1650,
  review_reasons: []
};

describe("generateTrailContent", () => {
  it("builds a 12-week map prioritizing participant barriers", () => {
    const content = generateTrailContent({
      anamnese: {
        ...baseAnamnese,
        main_difficulty:
          "Vontades de doces, Sentir muita fome à noite, Finais de semana",
        motivation: 4,
        sleep_hours: "6 horas por noite",
        sleep_quality: "regular",
        behavioral_answers: {
          ...baseAnamnese.behavioral_answers,
          nightHunger: "sim",
          weekendDifficulty: "sim",
          weekendDifficultyReason: "Eventos sociais",
          sweetsDifficulty: "sim"
        }
      } as unknown as TestAnamnese,
      assessment: null,
      calculation: calculation as unknown as TestCalculation,
      curation: null
    });

    expect(content.mapSteps).toHaveLength(12);
    expect(content.mapSteps.slice(3, 7).map((step) => step.title)).toEqual([
      "Começo possível",
      "Noite",
      "Doces",
      "Eventos"
    ]);
    expect(content.priorities).toContain(
      "Começar com uma versão mínima do plano em vez de tentar mudar tudo de uma vez."
    );
  });

  it("uses the reported activity in the training step", () => {
    const content = generateTrailContent({
      anamnese: {
        ...baseAnamnese,
        activity_level: "moderado",
        behavioral_answers: {
          ...baseAnamnese.behavioral_answers,
          activityDescription: "musculação"
        }
      } as unknown as TestAnamnese,
      assessment: null,
      calculation: calculation as unknown as TestCalculation,
      curation: null
    });

    expect(content.mapSteps[1].title).toBe("Treino");
    expect(content.mapSteps[1].description).toContain("musculação");
  });
});
