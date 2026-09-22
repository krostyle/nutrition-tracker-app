"use client";

import { useRouter } from "next/navigation";
import { createRecipeAction } from "@/lib/nutrition/recipe-actions";
import { RecipeForm } from "../recipe-form";

export default function NewRecipePage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-8">
      <div className="w-full max-w-lg sm:rounded-xl sm:border sm:bg-card sm:p-6 sm:shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nueva receta</h1>
        <RecipeForm
          submitLabel="Crear receta"
          onSubmit={async (input) => {
            const outcome = await createRecipeAction(input);
            if (!outcome.ok) return outcome;
            router.push(`/recipes/${outcome.data.id}`);
            return { ok: true };
          }}
        />
      </div>
    </div>
  );
}
