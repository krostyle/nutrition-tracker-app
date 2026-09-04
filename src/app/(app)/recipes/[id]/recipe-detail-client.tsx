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
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  if (detail === null) {
    return <p className="text-sm text-muted-foreground">No se encontró la receta.</p>;
  }

  const { recipe, calculation } = detail;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{recipe.name}</CardTitle>
          <CardDescription>{recipe.servings} porciones</CardDescription>
        </div>
        <div className="flex gap-2">
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
