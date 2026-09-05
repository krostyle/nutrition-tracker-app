import { prisma } from "@/lib/prisma";
import type { BodyMeasurement } from "@/generated/prisma/client";

export type CreateMeasurementInput = {
  date: Date;
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
};

export async function createMeasurement(
  input: CreateMeasurementInput,
): Promise<BodyMeasurement> {
  return prisma.bodyMeasurement.create({ data: input });
}

export async function listMeasurements(): Promise<BodyMeasurement[]> {
  return prisma.bodyMeasurement.findMany({ orderBy: { date: "desc" } });
}

export async function getLatestMeasurement(): Promise<BodyMeasurement | null> {
  return prisma.bodyMeasurement.findFirst({ orderBy: { date: "desc" } });
}
