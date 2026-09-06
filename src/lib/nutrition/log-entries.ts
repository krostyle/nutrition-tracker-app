import { prisma } from "@/lib/prisma";
import type { Food, FoodLogEntry, MealType } from "@/generated/prisma/client";
import type { RecipeWithIngredients } from "./recipes-repo";

export type FoodLogEntryWithDetails = FoodLogEntry & {
  food: Food | null;
  recipe: RecipeWithIngredients | null;
};

const LOG_ENTRY_INCLUDE = {
  food: true,
  recipe: { include: { ingredients: { include: { food: true } } } },
} as const;

export async function listLogEntriesForDate(date: Date): Promise<FoodLogEntryWithDetails[]> {
  return prisma.foodLogEntry.findMany({
    where: { date },
    include: LOG_ENTRY_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
}

export async function listLogEntriesForDateRange(
  startDate: Date,
  endDate: Date,
): Promise<FoodLogEntryWithDetails[]> {
  return prisma.foodLogEntry.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: LOG_ENTRY_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
}

export type CreateLogEntryInput = {
  foodId?: string;
  recipeId?: string;
  quantity: number;
  mealType: MealType;
  date: Date;
};

function assertExactlyOneTarget(input: { foodId?: string; recipeId?: string }) {
  const hasFood = Boolean(input.foodId);
  const hasRecipe = Boolean(input.recipeId);
  if (hasFood === hasRecipe) {
    throw new Error("Una entrada debe referenciar exactamente un alimento o una receta");
  }
}

export async function createLogEntry(
  input: CreateLogEntryInput,
): Promise<FoodLogEntryWithDetails> {
  assertExactlyOneTarget(input);
  return prisma.foodLogEntry.create({ data: input, include: LOG_ENTRY_INCLUDE });
}

export async function updateLogEntryQuantity(
  id: string,
  quantity: number,
): Promise<FoodLogEntryWithDetails> {
  return prisma.foodLogEntry.update({
    where: { id },
    data: { quantity },
    include: LOG_ENTRY_INCLUDE,
  });
}

export async function deleteLogEntry(id: string): Promise<void> {
  await prisma.foodLogEntry.delete({ where: { id } });
}
