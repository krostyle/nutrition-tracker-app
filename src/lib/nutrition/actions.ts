"use server";

import type { Food, Goal, MealType } from "@/generated/prisma/client";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { ExternalFoodResult } from "@/lib/food-sources/actions";
import { createManualFood, persistExternalFood, type ManualFoodInput } from "@/lib/food-sources/persist";
import { searchLocalFoods } from "@/lib/food-sources/search-local";
import { aggregateNutrients, type AggregatedNutrients, type WeightedNutrients } from "./aggregate";
import { parseDateKey } from "./date";
import { getGoal, saveGoal, type GoalInput } from "./goal";
import {
  createLogEntry,
  deleteLogEntry,
  listLogEntriesForDate,
  updateLogEntryQuantity,
  type FoodLogEntryWithDetails,
} from "./log-entries";
import { calculateRecipeNutrients } from "./recipe";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export type LogEntryDisplay = FoodLogEntryWithDetails & { calories: number };

export type DaySummary = {
  goal: Goal | null;
  totals: AggregatedNutrients;
  entriesByMeal: Record<MealType, LogEntryDisplay[]>;
};

function entryContribution(entry: FoodLogEntryWithDetails): WeightedNutrients {
  if (entry.food) {
    return { nutrients: entry.food, factor: entry.quantity / 100 };
  }

  const recipe = entry.recipe!;
  const { perServing } = calculateRecipeNutrients({
    servings: recipe.servings,
    ingredients: recipe.ingredients.map((ingredient) => ({
      nutrients: ingredient.food,
      grams: ingredient.grams,
    })),
  });
  return { nutrients: perServing, factor: entry.quantity };
}

export async function getDaySummaryAction(dateKey: string): Promise<DaySummary> {
  const date = parseDateKey(dateKey);
  const [entries, goal] = await Promise.all([listLogEntriesForDate(date), getGoal()]);

  const contributions = entries.map((entry) => ({ entry, contribution: entryContribution(entry) }));

  const totals = aggregateNutrients(contributions.map((c) => c.contribution));

  const displayEntries: LogEntryDisplay[] = contributions.map(({ entry, contribution }) => ({
    ...entry,
    calories: contribution.nutrients.calories * contribution.factor,
  }));

  const entriesByMeal = Object.fromEntries(
    MEAL_TYPES.map((mealType) => [
      mealType,
      displayEntries.filter((entry) => entry.mealType === mealType),
    ]),
  ) as Record<MealType, LogEntryDisplay[]>;

  return { goal, totals, entriesByMeal };
}

export async function getGoalAction(): Promise<Goal | null> {
  return getGoal();
}

export async function saveGoalAction(input: GoalInput): Promise<ActionResult<Goal>> {
  return runAction(() => saveGoal(input), "No pudimos guardar la meta. Probá de nuevo.");
}

export type CreateEntryActionInput = {
  foodId?: string;
  recipeId?: string;
  quantity: number;
  mealType: MealType;
  dateKey: string;
};

const LOG_ENTRY_ERROR = "No pudimos guardar el registro. Probá de nuevo.";

export async function createLogEntryAction(
  input: CreateEntryActionInput,
): Promise<ActionResult<FoodLogEntryWithDetails>> {
  return runAction(
    () =>
      createLogEntry({
        foodId: input.foodId,
        recipeId: input.recipeId,
        quantity: input.quantity,
        mealType: input.mealType,
        date: parseDateKey(input.dateKey),
      }),
    LOG_ENTRY_ERROR,
  );
}

export async function updateLogEntryQuantityAction(
  id: string,
  quantity: number,
): Promise<ActionResult<FoodLogEntryWithDetails>> {
  return runAction(() => updateLogEntryQuantity(id, quantity), LOG_ENTRY_ERROR);
}

export async function deleteLogEntryAction(id: string): Promise<ActionResult<void>> {
  return runAction(() => deleteLogEntry(id), "No pudimos eliminar el registro. Probá de nuevo.");
}

export async function searchLocalFoodsAction(query: string): Promise<Food[]> {
  return searchLocalFoods(query);
}

export type AddFoodToMealInput =
  | { kind: "existing"; foodId: string }
  | { kind: "OFF" | "USDA"; result: ExternalFoodResult }
  | { kind: "manual"; input: ManualFoodInput }
  | { kind: "recipe"; recipeId: string };

export async function addFoodToMealAction(
  food: AddFoodToMealInput,
  quantity: number,
  mealType: MealType,
  dateKey: string,
): Promise<ActionResult<FoodLogEntryWithDetails>> {
  return runAction(async () => {
    if (food.kind === "recipe") {
      return createLogEntry({
        recipeId: food.recipeId,
        quantity,
        mealType,
        date: parseDateKey(dateKey),
      });
    }

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
      quantity,
      mealType,
      date: parseDateKey(dateKey),
    });
  }, LOG_ENTRY_ERROR);
}
