export type BiologicalSex = "homem" | "mulher" | "indefinido";

export type ActivityLevel =
  | "sedentario"
  | "baixo"
  | "moderado"
  | "alto"
  | "muito_alto";

export type MealPlanCode = "A" | "B" | "C" | "D";

export type MetabolicInput = {
  biologicalSex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  age: number;
  activityLevel: ActivityLevel;
};

export type MetabolicResult = {
  basalMetabolicRate: number | null;
  totalEnergyExpenditure: number | null;
  activityFactor: number;
  cutTargetCalories: number | null;
  indicatedPlan: {
    code: MealPlanCode;
    title: string;
    calories: number;
    pdfUrl: string;
  } | null;
  estimatedDeficit: number | null;
  reviewRecommended: boolean;
  reviewReasons: string[];
};

export const activityFactors: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  baixo: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muito_alto: 1.9
};

export const operation12sMealPlans: Record<
  MealPlanCode,
  { code: MealPlanCode; title: string; calories: number; pdfUrl: string }
> = {
  A: { code: "A", title: "Plano alimentar A", calories: 2000, pdfUrl: "/plans/plano-a.pdf" },
  B: { code: "B", title: "Plano alimentar B", calories: 1800, pdfUrl: "/plans/plano-b.pdf" },
  C: { code: "C", title: "Plano alimentar C", calories: 1600, pdfUrl: "/plans/plano-c.pdf" },
  D: { code: "D", title: "Plano alimentar D", calories: 1400, pdfUrl: "/plans/plano-d.pdf" }
};

export function calculateBasalMetabolicRate(input: MetabolicInput) {
  if (input.biologicalSex === "indefinido") {
    return null;
  }

  if (input.biologicalSex === "homem") {
    return 66 + 13.8 * input.weightKg + 5 * input.heightCm - 6.8 * input.age;
  }

  return 655 + 9.6 * input.weightKg + 1.8 * input.heightCm - 4.7 * input.age;
}

export function selectOperation12sMealPlan(cutTargetCalories: number) {
  if (cutTargetCalories > 1950) {
    return operation12sMealPlans.A;
  }

  if (cutTargetCalories > 1750 && cutTargetCalories < 1950) {
    return operation12sMealPlans.B;
  }

  if (cutTargetCalories > 1550 && cutTargetCalories < 1750) {
    return operation12sMealPlans.C;
  }

  return operation12sMealPlans.D;
}

export function calculateOperation12sMetabolism(
  input: MetabolicInput
): MetabolicResult {
  const activityFactor = activityFactors[input.activityLevel];
  const reviewReasons: string[] = [];
  const basalMetabolicRate = calculateBasalMetabolicRate(input);

  if (basalMetabolicRate === null) {
    reviewReasons.push("Sexo biologico indefinido para calculo preditivo.");

    return {
      basalMetabolicRate,
      totalEnergyExpenditure: null,
      activityFactor,
      cutTargetCalories: null,
      indicatedPlan: null,
      estimatedDeficit: null,
      reviewRecommended: true,
      reviewReasons
    };
  }

  const totalEnergyExpenditure = basalMetabolicRate * activityFactor;
  const cutTargetCalories = totalEnergyExpenditure - 500;
  const indicatedPlan = selectOperation12sMealPlan(cutTargetCalories);
  const estimatedDeficit = totalEnergyExpenditure - indicatedPlan.calories;

  if (input.biologicalSex === "mulher" && indicatedPlan.calories < 1200) {
    reviewReasons.push("Meta calorica abaixo do minimo automatico para mulheres.");
  }

  if (input.biologicalSex === "homem" && indicatedPlan.calories < 1500) {
    reviewReasons.push("Meta calorica abaixo do minimo automatico para homens.");
  }

  return {
    basalMetabolicRate: Math.round(basalMetabolicRate),
    totalEnergyExpenditure: Math.round(totalEnergyExpenditure),
    activityFactor,
    cutTargetCalories: Math.round(cutTargetCalories),
    indicatedPlan,
    estimatedDeficit: Math.round(estimatedDeficit),
    reviewRecommended: reviewReasons.length > 0,
    reviewReasons
  };
}
