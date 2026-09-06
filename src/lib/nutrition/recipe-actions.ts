"use server";

import type { Recipe } from "@/generated/prisma/client";
import { runAction, type ActionResult } from "@/lib/action-result";
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

const RECIPE_SAVE_ERROR = "No pudimos guardar la receta. Prueba de nuevo.";

export async function createRecipeAction(
  input: RecipeInput,
): Promise<ActionResult<RecipeWithIngredients>> {
  return runAction(() => createRecipe(input), RECIPE_SAVE_ERROR);
}

export async function updateRecipeAction(
  id: string,
  input: RecipeInput,
): Promise<ActionResult<RecipeWithIngredients>> {
  return runAction(() => updateRecipe(id, input), RECIPE_SAVE_ERROR);
}

export async function deleteRecipeAction(id: string): Promise<ActionResult<void>> {
  return runAction(() => deleteRecipe(id), "No pudimos eliminar la receta. Prueba de nuevo.");
}
