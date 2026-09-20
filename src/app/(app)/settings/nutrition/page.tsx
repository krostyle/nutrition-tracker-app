import { NutritionClient } from "./nutrition-client";

export default function NutritionSettingsPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-8">
      <NutritionClient />
    </div>
  );
}
