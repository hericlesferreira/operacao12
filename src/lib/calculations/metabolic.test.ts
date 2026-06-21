import { describe, expect, it } from "vitest";
import {
  calculateOperation12sMetabolism,
  selectOperation12sMealPlan
} from "./metabolic";

describe("calculateOperation12sMetabolism", () => {
  it("uses the validated male predictive equation and activity factor", () => {
    const result = calculateOperation12sMetabolism({
      biologicalSex: "homem",
      heightCm: 170,
      weightKg: 69.2,
      age: 30,
      activityLevel: "moderado"
    });

    expect(result.basalMetabolicRate).toBe(1667);
    expect(result.totalEnergyExpenditure).toBe(2584);
    expect(result.cutTargetCalories).toBe(2084);
    expect(result.indicatedPlan?.code).toBe("A");
    expect(result.estimatedDeficit).toBe(584);
  });

  it("uses the validated female predictive equation", () => {
    const result = calculateOperation12sMetabolism({
      biologicalSex: "mulher",
      heightCm: 160,
      weightKg: 60,
      age: 35,
      activityLevel: "baixo"
    });

    expect(result.basalMetabolicRate).toBe(1355);
    expect(result.totalEnergyExpenditure).toBe(1862);
    expect(result.cutTargetCalories).toBe(1362);
    expect(result.indicatedPlan?.code).toBe("D");
    expect(result.estimatedDeficit).toBe(462);
  });

  it("requires review when biological sex is undefined", () => {
    const result = calculateOperation12sMetabolism({
      biologicalSex: "indefinido",
      heightCm: 170,
      weightKg: 70,
      age: 30,
      activityLevel: "sedentario"
    });

    expect(result.basalMetabolicRate).toBeNull();
    expect(result.indicatedPlan).toBeNull();
    expect(result.reviewRecommended).toBe(true);
  });
});

describe("selectOperation12sMealPlan", () => {
  it.each([
    [2001, "A"],
    [1800, "B"],
    [1600, "C"],
    [1550, "D"]
  ] as const)("selects plan %s kcal target as %s", (target, planCode) => {
    expect(selectOperation12sMealPlan(target).code).toBe(planCode);
  });
});
