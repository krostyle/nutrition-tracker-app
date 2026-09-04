import type { NormalizedNutrients } from "../types";

export type UsdaFoodNutrient = {
  nutrientId: number;
  value: number;
};

export type UsdaFood = {
  fdcId?: number;
  description?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

export type { NormalizedNutrients };

const NUTRIENT_ID = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sugar: 2000,
  saturatedFat: 1258,
  sodium: 1093,
} as const;

function findValue(nutrients: UsdaFoodNutrient[], nutrientId: number): number | undefined {
  return nutrients.find((n) => n.nutrientId === nutrientId)?.value;
}

export function normalizeUsdaFood(food: UsdaFood): NormalizedNutrients | null {
  const nutrients = food.foodNutrients ?? [];
  const name = food.description;

  const calories = findValue(nutrients, NUTRIENT_ID.calories);
  const protein = findValue(nutrients, NUTRIENT_ID.protein);
  const carbs = findValue(nutrients, NUTRIENT_ID.carbs);
  const fat = findValue(nutrients, NUTRIENT_ID.fat);

  if (
    !name ||
    calories === undefined ||
    protein === undefined ||
    carbs === undefined ||
    fat === undefined
  ) {
    return null;
  }

  const result: NormalizedNutrients = { name, calories, protein, carbs, fat };

  const fiber = findValue(nutrients, NUTRIENT_ID.fiber);
  const sugar = findValue(nutrients, NUTRIENT_ID.sugar);
  const saturatedFat = findValue(nutrients, NUTRIENT_ID.saturatedFat);
  const sodium = findValue(nutrients, NUTRIENT_ID.sodium);

  if (fiber !== undefined) result.fiber = fiber;
  if (sugar !== undefined) result.sugar = sugar;
  if (saturatedFat !== undefined) result.saturatedFat = saturatedFat;
  if (sodium !== undefined) result.sodium = sodium;

  return result;
}
