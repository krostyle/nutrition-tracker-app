"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipeDetailAction, updateRecipeAction } from "@/lib/nutrition/recipe-actions";
import { RecipeForm, type RecipeFormInitial } from "../../recipe-form";

export function EditRecipeClient({ id }: { id: string }) {
  const router = useRouter();
  const [initial, setInitial] = useState<RecipeFormInitial | null | undefined>(undefined);

  useEffect(() => {
    getRecipeDetailAction(id).then((detail) => {
      if (!detail) {
        setInitial(null);
        return;
      }
      setInitial({
        name: detail.recipe.name,
        servings: detail.recipe.servings,
        ingredients: detail.recipe.ingredients.map((i) => ({
          foodId: i.foodId,
          foodName: i.food.name,
          grams: i.grams,
        })),
      });
    });
  }, [id]);

  if (initial === undefined) {
    return (
      <div className="w-full max-w-lg sm:rounded-xl sm:border sm:bg-card sm:p-6 sm:shadow-sm">
        <Skeleton className="mb-6 h-7 w-32" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (initial === null) {
    return <p className="text-sm text-muted-foreground">No se encontró la receta.</p>;
  }

  return (
    <div className="w-full max-w-lg sm:rounded-xl sm:border sm:bg-card sm:p-6 sm:shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Editar receta</h1>
      <RecipeForm
        initial={initial}
        submitLabel="Guardar cambios"
        onSubmit={async (input) => {
          const outcome = await updateRecipeAction(id, input);
          if (!outcome.ok) return outcome;
          router.push(`/recipes/${id}`);
          return { ok: true };
        }}
      />
    </div>
  );
}
