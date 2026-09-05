-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('LOSE_FAT', 'MAINTAIN', 'GAIN_MUSCLE');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "age" INTEGER NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "neckCm" DOUBLE PRECISION NOT NULL,
    "waistCm" DOUBLE PRECISION NOT NULL,
    "hipCm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyMeasurement_date_idx" ON "BodyMeasurement"("date");
