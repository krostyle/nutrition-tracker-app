import { prisma } from "@/lib/prisma";
import type { ActivityLevel, GoalType, Profile, Sex } from "@/generated/prisma/client";

const PROFILE_ID = "singleton";

export async function getProfile(): Promise<Profile | null> {
  return prisma.profile.findUnique({ where: { id: PROFILE_ID } });
}

export type ProfileInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetWeightKg: number | null;
};

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  return prisma.profile.upsert({
    where: { id: PROFILE_ID },
    create: { id: PROFILE_ID, ...input },
    update: input,
  });
}
