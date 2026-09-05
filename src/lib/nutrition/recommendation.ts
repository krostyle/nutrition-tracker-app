export type Sex = "MALE" | "FEMALE";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
export type GoalType = "LOSE_FAT" | "MAINTAIN" | "GAIN_MUSCLE";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const CALORIE_ADJUSTMENT: Record<GoalType, number> = {
  LOSE_FAT: -500,
  MAINTAIN: 0,
  GAIN_MUSCLE: 300,
};

const PROTEIN_G_PER_KG = 2.0;
const FAT_G_PER_KG = 0.8;

export type BmrInput = {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
};

// Mifflin-St Jeor
export function calculateBmr(input: BmrInput): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return input.sex === "MALE" ? base + 5 : base - 161;
}

export type TdeeInput = {
  bmr: number;
  activityLevel: ActivityLevel;
};

export function calculateTdee(input: TdeeInput): number {
  return input.bmr * ACTIVITY_MULTIPLIER[input.activityLevel];
}

export type CalorieTargetInput = {
  tdee: number;
  goalType: GoalType;
};

export function calculateCalorieTarget(input: CalorieTargetInput): number {
  return input.tdee + CALORIE_ADJUSTMENT[input.goalType];
}

export type MacrosInput = {
  calories: number;
  weightKg: number;
};

export type Macros = {
  protein: number;
  fat: number;
  carbs: number;
};

export function calculateMacros(input: MacrosInput): Macros {
  const protein = PROTEIN_G_PER_KG * input.weightKg;
  const fat = FAT_G_PER_KG * input.weightKg;
  const carbs = (input.calories - protein * 4 - fat * 9) / 4;
  return { protein, fat, carbs };
}

export type BodyFatInput = {
  sex: Sex;
  waistCm: number;
  neckCm: number;
  heightCm: number;
  hipCm?: number;
};

// Método Navy (circunferencias en cm)
export function calculateBodyFatPercent(input: BodyFatInput): number {
  if (input.sex === "MALE") {
    const denominator =
      1.0324 -
      0.19077 * Math.log10(input.waistCm - input.neckCm) +
      0.15456 * Math.log10(input.heightCm);
    return 495 / denominator - 450;
  }

  if (input.hipCm === undefined) {
    throw new Error("La cadera es obligatoria para calcular la grasa corporal en mujeres");
  }

  const denominator =
    1.29579 -
    0.35004 * Math.log10(input.waistCm + input.hipCm - input.neckCm) +
    0.221 * Math.log10(input.heightCm);
  return 495 / denominator - 450;
}

export type RecommendationInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
};

export type Recommendation = {
  bmr: number;
  tdee: number;
  bodyFatPercent: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export function calculateRecommendation(input: RecommendationInput): Recommendation {
  const bmr = calculateBmr(input);
  const tdee = calculateTdee({ bmr, activityLevel: input.activityLevel });
  const calories = calculateCalorieTarget({ tdee, goalType: input.goalType });
  const macros = calculateMacros({ calories, weightKg: input.weightKg });
  const bodyFatPercent = calculateBodyFatPercent(input);

  return { bmr, tdee, bodyFatPercent, calories, ...macros };
}
