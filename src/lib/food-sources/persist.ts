import { prisma } from "@/lib/prisma";
import type { Food } from "@/generated/prisma/client";
import type { NormalizedNutrients } from "./types";

export async function persistExternalFood(
  source: "OFF",
  externalId: string,
  nutrients: NormalizedNutrients,
): Promise<Food> {
  const existing = await prisma.food.findUnique({
    where: { source_externalId: { source, externalId } },
  });
  if (existing) return existing;

  return prisma.food.create({
    data: {
      source,
      externalId,
      ...nutrients,
    },
  });
}

export type ManualFoodInput = NormalizedNutrients;

export async function createManualFood(input: ManualFoodInput): Promise<Food> {
  return prisma.food.create({
    data: {
      source: "MANUAL",
      externalId: null,
      ...input,
    },
  });
}
