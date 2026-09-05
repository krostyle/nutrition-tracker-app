"use server";

import type { Food, Goal, MealType } from "@/generated/prisma/client";
import type { ExternalFoodResult } from "@/lib/food-sources/actions";
import { createManualFood, persistExternalFood, type ManualFoodInput } from "@/lib/food-sources/persist";
import { searchLocalFoods } from "@/lib/food-sources/search-local";
import { aggregateNutrients, type AggregatedNutrients } from "./aggregate";
import { parseDateKey } from "./date";
import { getGoal, saveGoal, type GoalInput } from "./goal";
import {
  createLogEntry,
  deleteLogEntry,
  listLogEntriesForDate,
  updateLogEntryGrams,
  type FoodLogEntryWithFood,
} from "./log-entries";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export type DaySummary = {
  goal: Goal | null;
  totals: AggregatedNutrients;
  entriesByMeal: Record<MealType, FoodLogEntryWithFood[]>;
};

export async function getDaySummaryAction(dateKey: string): Promise<DaySummary> {
  const date = parseDateKey(dateKey);
  const [entries, goal] = await Promise.all([listLogEntriesForDate(date), getGoal()]);

  const totals = aggregateNutrients(
    entries.map((entry) => ({ nutrients: entry.food, grams: entry.grams })),
  );

  const entriesByMeal = Object.fromEntries(
    MEAL_TYPES.map((mealType) => [
      mealType,
      entries.filter((entry) => entry.mealType === mealType),
    ]),
  ) as Record<MealType, FoodLogEntryWithFood[]>;

  return { goal, totals, entriesByMeal };
}

export async function getGoalAction(): Promise<Goal | null> {
  return getGoal();
}

export async function saveGoalAction(input: GoalInput): Promise<Goal> {
  return saveGoal(input);
}

export type CreateEntryActionInput = {
  foodId: string;
  grams: number;
  mealType: MealType;
  dateKey: string;
};

export async function createLogEntryAction(
  input: CreateEntryActionInput,
): Promise<FoodLogEntryWithFood> {
  return createLogEntry({
    foodId: input.foodId,
    grams: input.grams,
    mealType: input.mealType,
    date: parseDateKey(input.dateKey),
  });
}

export async function updateLogEntryGramsAction(
  id: string,
  grams: number,
): Promise<FoodLogEntryWithFood> {
  return updateLogEntryGrams(id, grams);
}

export async function deleteLogEntryAction(id: string): Promise<void> {
  await deleteLogEntry(id);
}

export async function searchLocalFoodsAction(query: string): Promise<Food[]> {
  return searchLocalFoods(query);
}

export type AddFoodToMealInput =
  | { kind: "existing"; foodId: string }
  | { kind: "OFF" | "USDA"; result: ExternalFoodResult }
  | { kind: "manual"; input: ManualFoodInput };

export async function addFoodToMealAction(
  food: AddFoodToMealInput,
  grams: number,
  mealType: MealType,
  dateKey: string,
): Promise<FoodLogEntryWithFood> {
  let foodId: string;

  if (food.kind === "existing") {
    foodId = food.foodId;
  } else if (food.kind === "manual") {
    foodId = (await createManualFood(food.input)).id;
  } else {
    const { externalId, ...nutrients } = food.result;
    foodId = (await persistExternalFood(food.kind, externalId, nutrients)).id;
  }

  return createLogEntry({
    foodId,
    grams,
    mealType,
    date: parseDateKey(dateKey),
  });
}
