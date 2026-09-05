/*
  Warnings:

  - You are about to drop the column `grams` on the `FoodLogEntry` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `FoodLogEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FoodLogEntry" DROP CONSTRAINT "FoodLogEntry_foodId_fkey";

-- AlterTable
ALTER TABLE "FoodLogEntry" DROP COLUMN "grams",
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "recipeId" TEXT,
ALTER COLUMN "foodId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "FoodLogEntry" ADD CONSTRAINT "FoodLogEntry_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogEntry" ADD CONSTRAINT "FoodLogEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
