import type { NormalizedNutrients } from "../types";

export type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, number | undefined>;
  serving_size?: string;
  serving_quantity?: number;
};

export type { NormalizedNutrients };

const KJ_TO_KCAL = 1 / 4.184;

export function normalizeOffProduct(product: OffProduct): NormalizedNutrients | null {
  const n = product.nutriments ?? {};
  const name = product.product_name;

  const calories =
    n["energy-kcal_100g"] ??
    (n.energy_100g !== undefined ? n.energy_100g * KJ_TO_KCAL : undefined);
  const protein = n.proteins_100g;
  const carbs = n.carbohydrates_100g;
  const fat = n.fat_100g;

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

  if (n.fiber_100g !== undefined) result.fiber = n.fiber_100g;
  if (n.sugars_100g !== undefined) result.sugar = n.sugars_100g;
  if (n["saturated-fat_100g"] !== undefined) result.saturatedFat = n["saturated-fat_100g"];
  if (n.sodium_100g !== undefined) result.sodium = n.sodium_100g * 1000;

  if (product.serving_quantity !== undefined) {
    result.servingSize = product.serving_quantity;
    result.servingLabel = `${product.serving_quantity} g`;
  }

  if (product.brands) result.brand = product.brands.split(",")[0].trim();

  return result;
}
