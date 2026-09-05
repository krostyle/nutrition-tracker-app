import { prisma } from "@/lib/prisma";
import type { Food } from "@/generated/prisma/client";

export async function searchLocalFoods(query: string): Promise<Food[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.food.findMany({
    where: { name: { contains: trimmed, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: 10,
  });
}

export async function listFoods(): Promise<Food[]> {
  return prisma.food.findMany({
    orderBy: { name: "asc" },
    take: 50,
  });
}
