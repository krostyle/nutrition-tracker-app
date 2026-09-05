import { describe, expect, it } from "vitest";
import {
  calculateBmr,
  calculateBodyFatPercent,
  calculateCalorieTarget,
  calculateMacros,
  calculateRecommendation,
  calculateTdee,
} from "./recommendation";

describe("calculateBmr", () => {
  it("calcula el metabolismo basal para un hombre (Mifflin-St Jeor)", () => {
    const bmr = calculateBmr({ sex: "MALE", weightKg: 80, heightCm: 180, age: 30 });
    expect(bmr).toBeCloseTo(1780, 5);
  });

  it("calcula el metabolismo basal para una mujer (Mifflin-St Jeor)", () => {
    const bmr = calculateBmr({ sex: "FEMALE", weightKg: 65, heightCm: 165, age: 28 });
    expect(bmr).toBeCloseTo(1380.25, 5);
  });
});

describe("calculateTdee", () => {
  it("multiplica el BMR según el nivel de actividad", () => {
    expect(calculateTdee({ bmr: 1000, activityLevel: "SEDENTARY" })).toBeCloseTo(1200, 5);
    expect(calculateTdee({ bmr: 1000, activityLevel: "LIGHT" })).toBeCloseTo(1375, 5);
    expect(calculateTdee({ bmr: 1000, activityLevel: "MODERATE" })).toBeCloseTo(1550, 5);
    expect(calculateTdee({ bmr: 1000, activityLevel: "ACTIVE" })).toBeCloseTo(1725, 5);
    expect(calculateTdee({ bmr: 1000, activityLevel: "VERY_ACTIVE" })).toBeCloseTo(1900, 5);
  });
});

describe("calculateCalorieTarget", () => {
  it("aplica déficit para bajar grasa", () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: "LOSE_FAT" })).toBe(2000);
  });

  it("mantiene el TDEE para mantener", () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: "MAINTAIN" })).toBe(2500);
  });

  it("aplica superávit para subir músculo", () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: "GAIN_MUSCLE" })).toBe(2800);
  });
});

describe("calculateMacros", () => {
  it("calcula proteína y grasa por kg de peso, y carbohidratos como el resto", () => {
    const macros = calculateMacros({ calories: 2500, weightKg: 80 });
    expect(macros.protein).toBeCloseTo(160, 5);
    expect(macros.fat).toBeCloseTo(64, 5);
    expect(macros.carbs).toBeCloseTo(321, 5);
  });
});

describe("calculateBodyFatPercent", () => {
  it("calcula el % de grasa corporal para un hombre (método Navy)", () => {
    const bf = calculateBodyFatPercent({
      sex: "MALE",
      waistCm: 85,
      neckCm: 38,
      heightCm: 180,
    });
    expect(bf).toBeCloseTo(16.1066, 3);
  });

  it("calcula el % de grasa corporal para una mujer (método Navy, usa cadera)", () => {
    const bf = calculateBodyFatPercent({
      sex: "FEMALE",
      waistCm: 80,
      hipCm: 100,
      neckCm: 34,
      heightCm: 165,
    });
    expect(bf).toBeCloseTo(31.4033, 3);
  });

  it("lanza un error si falta la cadera para una mujer", () => {
    expect(() =>
      calculateBodyFatPercent({ sex: "FEMALE", waistCm: 80, neckCm: 34, heightCm: 165 }),
    ).toThrow();
  });
});

describe("calculateRecommendation", () => {
  it("combina BMR, TDEE, % de grasa corporal y calorías/macros en un solo resultado", () => {
    const result = calculateRecommendation({
      sex: "MALE",
      age: 30,
      heightCm: 180,
      activityLevel: "MODERATE",
      goalType: "LOSE_FAT",
      weightKg: 80,
      neckCm: 38,
      waistCm: 85,
    });

    expect(result.bmr).toBeCloseTo(1780, 5);
    expect(result.tdee).toBeCloseTo(1780 * 1.55, 5);
    expect(result.calories).toBeCloseTo(1780 * 1.55 - 500, 5);
    expect(result.protein).toBeCloseTo(160, 5);
    expect(result.fat).toBeCloseTo(64, 5);
    expect(result.bodyFatPercent).toBeCloseTo(16.1066, 3);
  });
});
