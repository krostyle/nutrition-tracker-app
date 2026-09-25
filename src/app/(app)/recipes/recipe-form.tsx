"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { Food } from "@/generated/prisma/client";
import type { RecipeIngredientInput, RecipeInput } from "@/lib/nutrition/recipes-repo";
import { RecipeIngredientPicker } from "./recipe-ingredient-picker";

type IngredientRow = {
  foodId: string;
  foodName: string;
  grams: string;
};

export type RecipeFormInitial = {
  name: string;
  servings: number;
  ingredients: { foodId: string; foodName: string; grams: number }[];
};

export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: RecipeFormInitial;
  submitLabel: string;
  onSubmit: (input: RecipeInput) => Promise<{ ok: true } | { ok: false; message: string }>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [servings, setServings] = useState(String(initial?.servings ?? 1));
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initial?.ingredients.map((i) => ({
      foodId: i.foodId,
      foodName: i.foodName,
      grams: String(i.grams),
    })) ?? [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addIngredient(food: Food, grams: number) {
    setIngredients((prev) => [...prev, { foodId: food.id, foodName: food.name, grams: String(grams) }]);
  }

  function updateGrams(index: number, grams: string) {
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, grams } : row)));
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  const servingsNumber = Number(servings);
  const canSubmit =
    name.trim().length > 0 &&
    Number.isInteger(servingsNumber) &&
    servingsNumber > 0 &&
    ingredients.length > 0 &&
    ingredients.every((row) => Number(row.grams) > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    const input: RecipeInput = {
      name: name.trim(),
      servings: servingsNumber,
      ingredients: ingredients.map(
        (row): RecipeIngredientInput => ({
          foodId: row.foodId,
          grams: Number(row.grams),
        }),
      ),
    };

    startTransition(async () => {
      const outcome = await onSubmit(input);
      if (!outcome.ok) {
        setError(outcome.message);
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipe-name">Nombre</Label>
          <Input id="recipe-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipe-servings">Porciones</Label>
          <Input
            id="recipe-servings"
            type="number"
            min={1}
            step={1}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Ingredientes</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" />
              Agregar ingrediente
            </Button>
          </div>
          {ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no agregaste ingredientes.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-lg border">
              {ingredients.map((row, index) => (
                <div key={`${row.foodId}-${index}`} className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{row.foodName}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Input
                      className="w-16"
                      type="number"
                      step="any"
                      value={row.grams}
                      onChange={(e) => updateGrams(index, e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Quitar ${row.foodName}`}
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={!canSubmit || pending} className="mt-1">
          {pending && <Spinner className="size-4" />}
          {pending ? "Guardando" : submitLabel}
        </Button>
      </form>
      <RecipeIngredientPicker open={pickerOpen} onOpenChange={setPickerOpen} onPicked={addIngredient} />
    </>
  );
}
