"use server";

import type { BodyMeasurement, Goal, Profile } from "@/generated/prisma/client";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createMeasurement, getLatestMeasurement, listMeasurements, type CreateMeasurementInput } from "./body-measurements";
import { saveGoal, type GoalInput } from "./goal";
import { getProfile, saveProfile, type ProfileInput } from "./profile";
import { calculateRecommendation, type Recommendation } from "./recommendation";

export async function getProfileAction(): Promise<Profile | null> {
  return getProfile();
}

export async function saveProfileAction(input: ProfileInput): Promise<ActionResult<Profile>> {
  return runAction(() => saveProfile(input), "No pudimos guardar los objetivos. Prueba de nuevo.");
}

export type CreateMeasurementActionInput = {
  dateKey: string;
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
};

export async function createMeasurementAction(
  input: CreateMeasurementActionInput,
): Promise<ActionResult<BodyMeasurement>> {
  const data: CreateMeasurementInput = {
    date: new Date(`${input.dateKey}T00:00:00.000Z`),
    weightKg: input.weightKg,
    neckCm: input.neckCm,
    waistCm: input.waistCm,
    hipCm: input.hipCm,
  };
  return runAction(() => createMeasurement(data), "No pudimos guardar la medición. Prueba de nuevo.");
}

export async function listMeasurementsAction(): Promise<BodyMeasurement[]> {
  return listMeasurements();
}

export type RecommendationResult =
  | { status: "missing_profile" }
  | { status: "missing_measurement" }
  | { status: "ok"; recommendation: Recommendation };

export async function getRecommendationAction(): Promise<RecommendationResult> {
  const [profile, measurement] = await Promise.all([getProfile(), getLatestMeasurement()]);

  if (!profile) return { status: "missing_profile" };
  if (!measurement) return { status: "missing_measurement" };

  const recommendation = calculateRecommendation({
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.heightCm,
    activityLevel: profile.activityLevel,
    goalType: profile.goalType,
    weightKg: measurement.weightKg,
    neckCm: measurement.neckCm,
    waistCm: measurement.waistCm,
    hipCm: measurement.hipCm ?? undefined,
  });

  return { status: "ok", recommendation };
}

export async function applyRecommendationAsGoalAction(
  input: GoalInput,
): Promise<ActionResult<Goal>> {
  return runAction(() => saveGoal(input), "No pudimos aplicar la recomendación. Prueba de nuevo.");
}
