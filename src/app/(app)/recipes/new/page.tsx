"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRecipeAction } from "@/lib/nutrition/recipe-actions";
import { RecipeForm } from "../recipe-form";

export default function NewRecipePage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Nueva receta</CardTitle>
        </CardHeader>
        <CardContent>
          <RecipeForm
            submitLabel="Crear receta"
            onSubmit={async (input) => {
              const outcome = await createRecipeAction(input);
              if (!outcome.ok) return outcome;
              router.push(`/recipes/${outcome.data.id}`);
              return { ok: true };
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
