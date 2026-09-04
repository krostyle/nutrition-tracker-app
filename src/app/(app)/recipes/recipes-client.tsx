"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listRecipesAction } from "@/lib/nutrition/recipe-actions";
import type { Recipe } from "@/generated/prisma/client";

export function RecipesClient() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  useEffect(() => {
    listRecipesAction().then(setRecipes);
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recetas</CardTitle>
        <Button render={<Link href="/recipes/new" />} nativeButton={false} size="sm">
          Nueva receta
        </Button>
      </CardHeader>
      <CardContent>
        {recipes === null ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : recipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no creaste recetas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                {recipe.name}{" "}
                <span className="text-muted-foreground">
                  · {recipe.servings} porciones
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
