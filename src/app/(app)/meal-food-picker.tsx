"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listFoodsAction,
  lookupBarcodeAction,
  searchFoodsAction,
  type ExternalFoodResult,
} from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import { addFoodToMealAction, searchLocalFoodsAction } from "@/lib/nutrition/actions";
import { getRecipeDetailAction, listRecipesAction } from "@/lib/nutrition/recipe-actions";
import type { Food, MealType, Recipe } from "@/generated/prisma/client";
import { MacroRow, NutritionFacts, scaleToServing, type NutrientValues } from "./foods/nutrition-facts";

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 800;
const LOCAL_DEBOUNCE_MS = 400;

type Candidate =
  | { kind: "existing"; foodId: string; food: Food }
  | { kind: "OFF" | "USDA"; result: ExternalFoodResult }
  | { kind: "recipe"; recipeId: string; name: string; perServing: NutrientValues };

function candidateName(candidate: Candidate): string {
  if (candidate.kind === "existing") return candidate.food.name;
  if (candidate.kind === "recipe") return candidate.name;
  return candidate.result.name;
}

function candidateValues(candidate: Candidate): NutrientValues {
  if (candidate.kind === "existing") return candidate.food;
  if (candidate.kind === "recipe") return candidate.perServing;
  return candidate.result;
}

function candidateBrand(candidate: Candidate): string | undefined {
  if (candidate.kind === "recipe") return undefined;
  return (candidate.kind === "existing" ? candidate.food.brand : candidate.result.brand) ?? undefined;
}

function candidateServingSize(candidate: Candidate): number | undefined {
  if (candidate.kind === "recipe") return undefined;
  return (
    (candidate.kind === "existing" ? candidate.food.servingSize : candidate.result.servingSize) ??
    undefined
  );
}

function candidateServingLabel(candidate: Candidate): string | undefined {
  if (candidate.kind === "recipe") return undefined;
  return (
    (candidate.kind === "existing" ? candidate.food.servingLabel : candidate.result.servingLabel) ??
    undefined
  );
}

function ResultRow({
  name,
  brand,
  values,
  badge,
  onSelect,
}: {
  name: string;
  brand?: string;
  values: NutrientValues;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-1 border-b px-2 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        {badge && <span className="shrink-0 text-xs text-muted-foreground">{badge}</span>}
      </div>
      {brand && <p className="truncate text-xs text-muted-foreground">{brand}</p>}
      <MacroRow values={values} />
    </button>
  );
}

function ConfirmQuantityFooter({
  candidate,
  pending,
  onConfirm,
}: {
  candidate: Candidate;
  pending: boolean;
  onConfirm: (quantity: number) => void;
}) {
  const isRecipe = candidate.kind === "recipe";
  const unit = isRecipe ? "porciones" : "g";
  const [quantity, setQuantity] = useState(isRecipe ? "1" : "100");
  const values = candidateValues(candidate);
  const brand = candidateBrand(candidate);
  const servingSize = candidateServingSize(candidate);
  const servingLabel = candidateServingLabel(candidate);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{candidateName(candidate)}</p>
        {brand && <p className="truncate text-xs text-muted-foreground">{brand}</p>}
      </div>

      <div>
        <h4 className="mb-1 text-xs font-medium text-muted-foreground">
          {isRecipe ? "Por porción" : "Por 100g"}
        </h4>
        <NutritionFacts values={values} />
      </div>

      {servingSize !== undefined && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">
            Por porción {servingLabel ? `(${servingLabel})` : ""}
          </h4>
          <NutritionFacts values={scaleToServing(values, servingSize)} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          className="w-20"
          type="number"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
        <Button
          size="sm"
          disabled={pending || !Number(quantity)}
          onClick={() => onConfirm(Number(quantity))}
        >
          {pending ? "Agregando..." : "Agregar"}
        </Button>
      </div>
    </div>
  );
}

function SavedFoodsPickerTab({ onSelect }: { onSelect: (c: Candidate) => void }) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load(term: string) {
    const trimmed = term.trim();
    const promise = trimmed ? searchLocalFoodsAction(trimmed) : listFoodsAction();
    promise.then(setFoods);
  }

  useEffect(() => {
    load("");
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value), LOCAL_DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Buscar alimento guardado..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="flex max-h-52 flex-col overflow-y-auto rounded-lg border">
        {foods.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">Sin resultados.</p>
        ) : (
          foods.map((food) => (
            <ResultRow
              key={food.id}
              name={food.name}
              brand={food.brand ?? undefined}
              values={food}
              onSelect={() => onSelect({ kind: "existing", foodId: food.id, food })}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SearchByNamePickerTab({ onSelect }: { onSelect: (c: Candidate) => void }) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<{ result: ExternalFoodResult; source: "OFF" | "USDA" }[]>(
    [],
  );
  const [notes, setNotes] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(term: string) {
    if (term.trim().length < MIN_QUERY_LENGTH) return;
    startTransition(async () => {
      const results = await searchFoodsAction(term.trim());
      const nextItems: { result: ExternalFoodResult; source: "OFF" | "USDA" }[] = [];
      const nextNotes: string[] = [];
      if (results.off.ok) {
        nextItems.push(...results.off.results.map((result) => ({ result, source: "OFF" as const })));
      } else {
        nextNotes.push("Open Food Facts no está disponible en este momento.");
      }
      if (results.usda.ok) {
        nextItems.push(
          ...results.usda.results.map((result) => ({ result, source: "USDA" as const })),
        );
      } else {
        nextNotes.push("USDA FoodData Central no está disponible en este momento.");
      }
      setItems(nextItems);
      setNotes(nextNotes);
    });
  }

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setItems([]);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS);
  }

  const tooShort = query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH;

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Nombre del alimento"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      {tooShort && (
        <p className="text-sm text-muted-foreground">Escribí al menos 3 caracteres.</p>
      )}
      {!tooShort && notes.map((note) => (
        <p key={note} className="text-sm text-muted-foreground">
          {note}
        </p>
      ))}
      {!tooShort && (
        <div className="flex max-h-52 flex-col overflow-y-auto rounded-lg border">
          {pending ? (
            <p className="p-2 text-sm text-muted-foreground">Buscando...</p>
          ) : items.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            items.map(({ result, source }) => (
              <ResultRow
                key={`${source}-${result.externalId}`}
                name={result.name}
                brand={result.brand}
                values={result}
                badge={source}
                onSelect={() => onSelect({ kind: source, result })}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BarcodePickerTab({ onSelect }: { onSelect: (c: Candidate) => void }) {
  const [barcode, setBarcode] = useState("");
  const [pending, startTransition] = useTransition();
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<ExternalFoodResult | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    setResult(null);
    setNotFound(false);
    startTransition(async () => {
      const lookup = await lookupBarcodeAction(barcode.trim());
      if (lookup.found) {
        setResult(lookup.result);
      } else {
        setNotFound(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Código de barras"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Buscando..." : "Buscar"}
        </Button>
      </form>
      {notFound && (
        <p className="text-sm text-muted-foreground">
          No se encontró en Open Food Facts. Podés cargarlo en la pestaña &quot;Manual&quot;.
        </p>
      )}
      {result && (
        <div className="rounded-lg border">
          <ResultRow
            name={result.name}
            brand={result.brand}
            values={result}
            badge="OFF"
            onSelect={() => onSelect({ kind: "OFF", result })}
          />
        </div>
      )}
    </div>
  );
}

function RecipesPickerTab({ onSelect }: { onSelect: (c: Candidate) => void }) {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    listRecipesAction().then(setRecipes);
  }, []);

  async function handlePick(recipe: Recipe) {
    setLoadingId(recipe.id);
    const detail = await getRecipeDetailAction(recipe.id);
    setLoadingId(null);
    if (!detail) return;
    onSelect({
      kind: "recipe",
      recipeId: recipe.id,
      name: recipe.name,
      perServing: detail.calculation.perServing,
    });
  }

  return (
    <div className="flex max-h-60 flex-col overflow-y-auto rounded-lg border">
      {recipes === null ? (
        <p className="p-2 text-sm text-muted-foreground">Cargando...</p>
      ) : recipes.length === 0 ? (
        <p className="p-2 text-sm text-muted-foreground">Todavía no creaste recetas.</p>
      ) : (
        recipes.map((recipe) => (
          <button
            type="button"
            key={recipe.id}
            disabled={loadingId !== null}
            onClick={() => handlePick(recipe)}
            className="flex items-center justify-between gap-2 border-b px-2 py-2 text-left text-sm last:border-b-0 hover:bg-muted disabled:opacity-50"
          >
            <span className="min-w-0 flex-1 truncate font-medium">{recipe.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {loadingId === recipe.id ? "Cargando..." : `${recipe.servings} porciones`}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

const MANUAL_FIELDS = ["calories", "protein", "carbs", "fat"] as const;
const MANUAL_LABELS: Record<(typeof MANUAL_FIELDS)[number], string> = {
  calories: "Calorías (kcal)",
  protein: "Proteína (g)",
  carbs: "Carbohidratos (g)",
  fat: "Grasa (g)",
};

function ManualPickerTab({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (input: ManualFoodInput, grams: number) => void;
}) {
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [grams, setGrams] = useState("100");

  const canSubmit =
    name.trim().length > 0 &&
    MANUAL_FIELDS.every((field) => values[field]?.trim()) &&
    Number(grams) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(
      {
        name: name.trim(),
        calories: Number(values.calories),
        protein: Number(values.protein),
        carbs: Number(values.carbs),
        fat: Number(values.fat),
      },
      Number(grams),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="picker-manual-name">Nombre</Label>
        <Input id="picker-manual-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {MANUAL_FIELDS.map((field) => (
        <div key={field} className="flex flex-col gap-1.5">
          <Label htmlFor={`picker-manual-${field}`}>{MANUAL_LABELS[field]}</Label>
          <Input
            id={`picker-manual-${field}`}
            type="number"
            step="any"
            value={values[field] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="picker-manual-grams">Cantidad a agregar (g)</Label>
        <Input
          id="picker-manual-grams"
          type="number"
          step="any"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={!canSubmit || pending}>
        {pending ? "Agregando..." : "Crear y agregar"}
      </Button>
    </form>
  );
}

export function MealFoodPicker({
  open,
  onOpenChange,
  mealLabel,
  mealType,
  dateKey,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealLabel: string;
  mealType: MealType;
  dateKey: string;
  onAdded: () => void;
}) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setCandidate(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function confirmCandidate(quantity: number) {
    if (!candidate) return;
    startTransition(async () => {
      const input =
        candidate.kind === "existing"
          ? ({ kind: "existing", foodId: candidate.foodId } as const)
          : candidate.kind === "recipe"
            ? ({ kind: "recipe", recipeId: candidate.recipeId } as const)
            : ({ kind: candidate.kind, result: candidate.result } as const);
      await addFoodToMealAction(input, quantity, mealType, dateKey);
      reset();
      onAdded();
      onOpenChange(false);
    });
  }

  function confirmManual(input: ManualFoodInput, grams: number) {
    startTransition(async () => {
      await addFoodToMealAction({ kind: "manual", input }, grams, mealType, dateKey);
      onAdded();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar a {mealLabel}</DialogTitle>
          <DialogDescription>Buscá un alimento o cargalo a mano.</DialogDescription>
        </DialogHeader>

        {candidate ? (
          <div className="flex flex-col gap-2">
            <ConfirmQuantityFooter candidate={candidate} pending={pending} onConfirm={confirmCandidate} />
            <Button variant="outline" size="sm" onClick={reset}>
              Elegir otro
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="saved">
            <div className="-mx-1 overflow-x-auto px-1">
              <TabsList>
                <TabsTrigger value="saved">Guardados</TabsTrigger>
                <TabsTrigger value="search">Por nombre</TabsTrigger>
                <TabsTrigger value="barcode">Código de barras</TabsTrigger>
                <TabsTrigger value="recipes">Recetas</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="saved">
              <SavedFoodsPickerTab onSelect={setCandidate} />
            </TabsContent>
            <TabsContent value="search">
              <SearchByNamePickerTab onSelect={setCandidate} />
            </TabsContent>
            <TabsContent value="barcode">
              <BarcodePickerTab onSelect={setCandidate} />
            </TabsContent>
            <TabsContent value="recipes">
              <RecipesPickerTab onSelect={setCandidate} />
            </TabsContent>
            <TabsContent value="manual">
              <ManualPickerTab pending={pending} onSubmit={confirmManual} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
