"use server";

import type { Recipe } from "@/generated/prisma/client";
import { calculateRecipeNutrients, type RecipeCalculationResult } from "./recipe";
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
  updateRecipe,
  type RecipeInput,
  type RecipeWithIngredients,
} from "./recipes-repo";

export async function listRecipesAction(): Promise<Recipe[]> {
  return listRecipes();
}

export type RecipeDetail = {
  recipe: RecipeWithIngredients;
  calculation: RecipeCalculationResult;
};

export async function getRecipeDetailAction(id: string): Promise<RecipeDetail | null> {
  const recipe = await getRecipe(id);
  if (!recipe) return null;

  const calculation = calculateRecipeNutrients({
    servings: recipe.servings,
    ingredients: recipe.ingredients.map((ingredient) => ({
      nutrients: ingredient.food,
      grams: ingredient.grams,
    })),
  });

  return { recipe, calculation };
}

export async function createRecipeAction(input: RecipeInput): Promise<RecipeWithIngredients> {
  return createRecipe(input);
}

export async function updateRecipeAction(
  id: string,
  input: RecipeInput,
): Promise<RecipeWithIngredients> {
  return updateRecipe(id, input);
}

export async function deleteRecipeAction(id: string): Promise<void> {
  await deleteRecipe(id);
}
