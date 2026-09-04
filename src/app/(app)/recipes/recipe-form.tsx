"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchLocalFoodsAction } from "@/lib/nutrition/actions";
import type { Food } from "@/generated/prisma/client";
import type { RecipeIngredientInput, RecipeInput } from "@/lib/nutrition/recipes-repo";

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

function IngredientPicker({ onAdd }: { onAdd: (food: Food) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const found = await searchLocalFoodsAction(value.trim());
      setResults(found);
    }, 400);
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Buscar alimento guardado..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      {results.length > 0 && (
        <div className="flex flex-col rounded-lg border">
          {results.map((food) => (
            <button
              type="button"
              key={food.id}
              className="border-b px-2 py-1 text-left text-sm last:border-b-0 hover:bg-muted"
              onClick={() => {
                onAdd(food);
                setQuery("");
                setResults([]);
              }}
            >
              {food.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: RecipeFormInitial;
  submitLabel: string;
  onSubmit: (input: RecipeInput) => Promise<void>;
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addIngredient(food: Food) {
    setIngredients((prev) => [...prev, { foodId: food.id, foodName: food.name, grams: "100" }]);
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
      try {
        await onSubmit(input);
      } catch {
        setError("No se pudo guardar la receta.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <Label>Ingredientes</Label>
        {ingredients.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no agregaste ingredientes.</p>
        )}
        {ingredients.map((row, index) => (
          <div key={`${row.foodId}-${index}`} className="flex items-center gap-2">
            <span className="flex-1 text-sm">{row.foodName}</span>
            <Input
              className="w-24"
              type="number"
              step="any"
              value={row.grams}
              onChange={(e) => updateGrams(index, e.target.value)}
            />
            <span className="text-xs text-muted-foreground">g</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => removeIngredient(index)}
            >
              Quitar
            </Button>
          </div>
        ))}
        <IngredientPicker onAdd={addIngredient} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!canSubmit || pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
