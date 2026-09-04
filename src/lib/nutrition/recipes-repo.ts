import { prisma } from "@/lib/prisma";
import type { Food, Recipe, RecipeIngredient } from "@/generated/prisma/client";

export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { food: Food })[];
};

export async function listRecipes(): Promise<Recipe[]> {
  return prisma.recipe.findMany({ orderBy: { name: "asc" } });
}

export async function getRecipe(id: string): Promise<RecipeWithIngredients | null> {
  return prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: { include: { food: true } } },
  });
}

export type RecipeIngredientInput = { foodId: string; grams: number };

export type RecipeInput = {
  name: string;
  servings: number;
  ingredients: RecipeIngredientInput[];
};

function assertHasIngredients(input: RecipeInput) {
  if (input.ingredients.length === 0) {
    throw new Error("Una receta requiere al menos un ingrediente");
  }
}

export async function createRecipe(input: RecipeInput): Promise<RecipeWithIngredients> {
  assertHasIngredients(input);

  return prisma.recipe.create({
    data: {
      name: input.name,
      servings: input.servings,
      ingredients: { create: input.ingredients },
    },
    include: { ingredients: { include: { food: true } } },
  });
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<RecipeWithIngredients> {
  assertHasIngredients(input);

  return prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    return tx.recipe.update({
      where: { id },
      data: {
        name: input.name,
        servings: input.servings,
        ingredients: { create: input.ingredients },
      },
      include: { ingredients: { include: { food: true } } },
    });
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  await prisma.recipe.delete({ where: { id } });
}
