import { RecipesClient } from "./recipes-client";

export default function RecipesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <RecipesClient />
    </div>
  );
}
