import { prisma } from "@/lib/prisma";
import type { Goal } from "@/generated/prisma/client";

const GOAL_ID = "singleton";

export async function getGoal(): Promise<Goal | null> {
  return prisma.goal.findUnique({ where: { id: GOAL_ID } });
}

export type GoalInput = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export async function saveGoal(input: GoalInput): Promise<Goal> {
  return prisma.goal.upsert({
    where: { id: GOAL_ID },
    create: { id: GOAL_ID, ...input },
    update: input,
  });
}
