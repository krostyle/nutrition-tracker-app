import { prisma } from "@/lib/prisma";
import type { Food, FoodLogEntry, MealType } from "@/generated/prisma/client";

export type FoodLogEntryWithFood = FoodLogEntry & { food: Food };

export async function listLogEntriesForDate(date: Date): Promise<FoodLogEntryWithFood[]> {
  return prisma.foodLogEntry.findMany({
    where: { date },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });
}

export type CreateLogEntryInput = {
  foodId: string;
  grams: number;
  mealType: MealType;
  date: Date;
};

export async function createLogEntry(input: CreateLogEntryInput): Promise<FoodLogEntryWithFood> {
  return prisma.foodLogEntry.create({ data: input, include: { food: true } });
}

export async function updateLogEntryGrams(
  id: string,
  grams: number,
): Promise<FoodLogEntryWithFood> {
  return prisma.foodLogEntry.update({
    where: { id },
    data: { grams },
    include: { food: true },
  });
}

export async function deleteLogEntry(id: string): Promise<void> {
  await prisma.foodLogEntry.delete({ where: { id } });
}
