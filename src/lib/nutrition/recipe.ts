import { aggregateNutrients, type AggregatedNutrients, type WeightedNutrients } from "./aggregate";

export type RecipeCalculationInput = {
  ingredients: WeightedNutrients[];
  servings: number;
};

export type RecipeCalculationResult = {
  total: AggregatedNutrients;
  perServing: AggregatedNutrients;
};

export function calculateRecipeNutrients(
  input: RecipeCalculationInput,
): RecipeCalculationResult {
  const total = aggregateNutrients(input.ingredients);

  const perServing = Object.fromEntries(
    Object.entries(total).map(([key, value]) => [key, value / input.servings]),
  ) as AggregatedNutrients;

  return { total, perServing };
}
