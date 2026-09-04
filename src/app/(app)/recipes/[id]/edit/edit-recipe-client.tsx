"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  if (initial === null) {
    return <p className="text-sm text-muted-foreground">No se encontró la receta.</p>;
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Editar receta</CardTitle>
      </CardHeader>
      <CardContent>
        <RecipeForm
          initial={initial}
          submitLabel="Guardar cambios"
          onSubmit={async (input) => {
            await updateRecipeAction(id, input);
            router.push(`/recipes/${id}`);
          }}
        />
      </CardContent>
    </Card>
  );
}
