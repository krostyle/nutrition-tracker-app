import { prisma } from "@/lib/prisma";
import type { MealType } from "@/generated/prisma/client";

const MEAL_SETTINGS_ID = "singleton";

// Comportamiento antes de que existiera esta configuración.
export const DEFAULT_ENABLED_MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export async function getEnabledMealTypes(): Promise<MealType[]> {
  const settings = await prisma.mealSettings.findUnique({ where: { id: MEAL_SETTINGS_ID } });
  return settings?.enabled ?? DEFAULT_ENABLED_MEALS;
}

export async function saveEnabledMealTypes(enabled: MealType[]): Promise<MealType[]> {
  const settings = await prisma.mealSettings.upsert({
    where: { id: MEAL_SETTINGS_ID },
    create: { id: MEAL_SETTINGS_ID, enabled },
    update: { enabled },
  });
  return settings.enabled;
}
