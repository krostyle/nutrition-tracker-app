/*
  Warnings:

  - You are about to drop the column `age` on the `Profile` table. All the data in the column is not being lost since it has been backfilled into `birthDate`.
  - Made the column `birthDate` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "birthDate" SET NOT NULL,
DROP COLUMN "age";
