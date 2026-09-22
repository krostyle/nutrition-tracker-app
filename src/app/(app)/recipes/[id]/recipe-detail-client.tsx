"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MacroHero } from "../../foods/nutrition-facts";
import { deleteRecipeAction, getRecipeDetailAction, type RecipeDetail } from "@/lib/nutrition/recipe-actions";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function RecipeDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<RecipeDetail | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecipeDetailAction(id).then(setDetail);
  }, [id]);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const outcome = await deleteRecipeAction(id);
      if (outcome.ok) {
        router.push("/recipes");
      } else {
        setError(outcome.message);
      }
    });
  }

  if (detail === undefined) {
    return (
      <div className="w-full max-w-lg sm:rounded-xl sm:border sm:bg-card sm:p-6 sm:shadow-sm">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-24" />
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  if (detail === null) {
    return <p className="text-sm text-muted-foreground">No se encontró la receta.</p>;
  }

  const { recipe, calculation } = detail;

  return (
    <div className="w-full max-w-lg sm:rounded-xl sm:border sm:bg-card sm:p-6 sm:shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{recipe.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{recipe.servings} porciones</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            render={<Link href={`/recipes/${id}/edit`} />}
            nativeButton={false}
            size="icon-sm"
            variant="ghost"
            aria-label="Editar receta"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Eliminar receta"
            disabled={pending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <MacroHero
        caption="kcal por porción"
        calories={round(calculation.perServing.calories)}
        protein={round(calculation.perServing.protein)}
        carbs={round(calculation.perServing.carbs)}
        fat={round(calculation.perServing.fat)}
      />

      <p className="mt-4 text-sm text-muted-foreground">
        Total de la receta: {round(calculation.total.calories)} kcal
      </p>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5">
        <h3 className="text-sm font-medium">Ingredientes</h3>
        <div className="flex flex-col divide-y divide-border">
          {recipe.ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0">
              <span className="min-w-0 truncate">{ingredient.food.name}</span>
              <span className="shrink-0 text-muted-foreground">{ingredient.grams} g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
