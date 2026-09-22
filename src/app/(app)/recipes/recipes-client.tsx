"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listRecipesAction } from "@/lib/nutrition/recipe-actions";
import type { Recipe } from "@/generated/prisma/client";

export function RecipesClient() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  useEffect(() => {
    listRecipesAction().then(setRecipes);
  }, []);

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recetas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tus recetas propias, con el cálculo nutricional listo para usar.
          </p>
        </div>
        <Button render={<Link href="/recipes/new" />} nativeButton={false} size="sm">
          Nueva receta
        </Button>
      </div>

      {recipes === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no creaste recetas.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border sm:divide-y-0 sm:gap-3">
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <div className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40 sm:rounded-xl sm:border sm:bg-card sm:px-4 sm:py-3.5 sm:shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ChefHat className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{recipe.name}</p>
                  <p className="text-sm text-muted-foreground">{recipe.servings} porciones</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
