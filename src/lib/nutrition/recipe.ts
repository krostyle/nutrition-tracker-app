import { aggregateNutrients, type AggregatedNutrients, type NutrientsPer100g } from "./aggregate";

export type RecipeIngredientNutrients = {
  nutrients: NutrientsPer100g;
  grams: number;
};

export type RecipeCalculationInput = {
  ingredients: RecipeIngredientNutrients[];
  servings: number;
};

export type RecipeCalculationResult = {
  total: AggregatedNutrients;
  perServing: AggregatedNutrients;
};

export function calculateRecipeNutrients(
  input: RecipeCalculationInput,
): RecipeCalculationResult {
  const total = aggregateNutrients(
    input.ingredients.map(({ nutrients, grams }) => ({ nutrients, factor: grams / 100 })),
  );

  const perServing = Object.fromEntries(
    Object.entries(total).map(([key, value]) => [key, value / input.servings]),
  ) as AggregatedNutrients;

  return { total, perServing };
}
