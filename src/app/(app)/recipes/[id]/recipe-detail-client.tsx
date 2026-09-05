"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteRecipeAction, getRecipeDetailAction, type RecipeDetail } from "@/lib/nutrition/recipe-actions";

const NUTRIENT_LABELS = [
  { key: "calories", label: "Calorías", unit: "kcal" },
  { key: "protein", label: "Proteína", unit: "g" },
  { key: "carbs", label: "Carbohidratos", unit: "g" },
  { key: "fat", label: "Grasa", unit: "g" },
] as const;

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function RecipeDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<RecipeDetail | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getRecipeDetailAction(id).then(setDetail);
  }, [id]);

  function handleDelete() {
    startTransition(async () => {
      await deleteRecipeAction(id);
      router.push("/recipes");
    });
  }

  if (detail === undefined) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (detail === null) {
    return <p className="text-sm text-muted-foreground">No se encontró la receta.</p>;
  }

  const { recipe, calculation } = detail;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="truncate">{recipe.name}</CardTitle>
          <CardDescription>{recipe.servings} porciones</CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            render={<Link href={`/recipes/${id}/edit`} />}
            nativeButton={false}
            size="sm"
            variant="outline"
          >
            Editar
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 text-sm font-medium">Ingredientes</h3>
          <div className="flex flex-col gap-1">
            {recipe.ingredients.map((ingredient) => (
              <p key={ingredient.id} className="text-sm">
                {ingredient.food.name} — {ingredient.grams}g
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Total receta</h3>
            {NUTRIENT_LABELS.map(({ key, label, unit }) => (
              <p key={key} className="text-sm text-muted-foreground">
                {label}: {round(calculation.total[key])} {unit}
              </p>
            ))}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Por porción</h3>
            {NUTRIENT_LABELS.map(({ key, label, unit }) => (
              <p key={key} className="text-sm text-muted-foreground">
                {label}: {round(calculation.perServing[key])} {unit}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
