-- AlterEnum
ALTER TYPE "MealType" ADD VALUE 'SNACK2';

-- CreateTable
CREATE TABLE "MealSettings" (
    "id" TEXT NOT NULL,
    "enabled" "MealType"[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealSettings_pkey" PRIMARY KEY ("id")
);
