/*
  Warnings:

  - Added the required column `calories` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carbs` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fat` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protein` to the `Food` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "calories" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "carbs" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fiber" DOUBLE PRECISION,
ADD COLUMN     "protein" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "saturatedFat" DOUBLE PRECISION,
ADD COLUMN     "sodium" DOUBLE PRECISION,
ADD COLUMN     "sugar" DOUBLE PRECISION;
