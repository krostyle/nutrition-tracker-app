"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Barcode, Bookmark, ChefHat, Search, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TabIconBadge,
  floatingTabLabelClass,
  floatingTabListClass,
  floatingTabTriggerClass,
} from "@/components/ui/floating-tab-bar";
import type { ExternalFoodResult } from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import { addFoodToMealAction } from "@/lib/nutrition/actions";
import { getRecipeDetailAction, listRecipesAction } from "@/lib/nutrition/recipe-actions";
import type { Food, MealType, Recipe } from "@/generated/prisma/client";
import { FoodNutritionDetail, type NutrientValues } from "./foods/nutrition-facts";
import {
  BarcodePickerTab,
  ManualPickerTab,
  SavedFoodsPickerTab,
  SearchByNamePickerTab,
} from "./food-picker-tabs";

type Candidate =
  | { kind: "existing"; foodId: string; food: Food }
  | { kind: "OFF"; result: ExternalFoodResult }
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

      <FoodNutritionDetail
        baseValues={values}
        isRecipe={isRecipe}
        servingSize={servingSize}
        servingLabel={servingLabel}
        footer={(finalQuantity) => (
          <Button
            size="sm"
            disabled={pending || !finalQuantity}
            onClick={() => onConfirm(finalQuantity)}
          >
            {pending ? "Agregando..." : "Agregar"}
          </Button>
        )}
      />
    </div>
  );
}

function RecipesPickerTab({
  onSelect,
  onNavigate,
}: {
  onSelect: (c: Candidate) => void;
  onNavigate: () => void;
}) {
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
    <div className="flex flex-col gap-2">
      <div className="max-h-60 overflow-hidden rounded-lg border">
        <div className="flex max-h-60 flex-col overflow-y-auto">
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
      </div>
      <Link
        href="/recipes"
        onClick={onNavigate}
        className="text-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Crear o gestionar recetas
      </Link>
    </div>
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
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCandidate(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function confirmCandidate(quantity: number) {
    if (!candidate) return;
    setError(null);
    startTransition(async () => {
      const input =
        candidate.kind === "existing"
          ? ({ kind: "existing", foodId: candidate.foodId } as const)
          : candidate.kind === "recipe"
            ? ({ kind: "recipe", recipeId: candidate.recipeId } as const)
            : ({ kind: candidate.kind, result: candidate.result } as const);
      const outcome = await addFoodToMealAction(input, quantity, mealType, dateKey);
      if (outcome.ok) {
        reset();
        onAdded();
        onOpenChange(false);
      } else {
        setError(outcome.message);
      }
    });
  }

  function confirmManual(input: ManualFoodInput, grams: number) {
    setError(null);
    startTransition(async () => {
      const outcome = await addFoodToMealAction({ kind: "manual", input }, grams, mealType, dateKey);
      if (outcome.ok) {
        onAdded();
        onOpenChange(false);
      } else {
        setError(outcome.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar a {mealLabel}</DialogTitle>
          <DialogDescription>Busca un alimento o cárgalo a mano.</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {candidate ? (
          <div className="flex flex-col gap-2">
            <ConfirmQuantityFooter candidate={candidate} pending={pending} onConfirm={confirmCandidate} />
            <Button variant="outline" size="sm" onClick={reset}>
              Elegir otro
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="saved">
            <div className="hidden sm:block">
              <TabsList className="w-full">
                <TabsTrigger value="saved">Guardados</TabsTrigger>
                <TabsTrigger value="search">Buscar</TabsTrigger>
                <TabsTrigger value="barcode">Escanear</TabsTrigger>
                <TabsTrigger value="recipes">Recetas</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="saved" className="pb-28 sm:pb-0">
              <SavedFoodsPickerTab onSelect={setCandidate} onNavigate={() => handleOpenChange(false)} />
            </TabsContent>
            <TabsContent value="search" className="pb-28 sm:pb-0">
              <SearchByNamePickerTab onSelect={setCandidate} />
            </TabsContent>
            <TabsContent value="barcode" className="pb-28 sm:pb-0">
              <BarcodePickerTab onSelect={setCandidate} />
            </TabsContent>
            <TabsContent value="recipes" className="pb-28 sm:pb-0">
              <RecipesPickerTab onSelect={setCandidate} onNavigate={() => handleOpenChange(false)} />
            </TabsContent>
            <TabsContent value="manual" className="pb-28 sm:pb-0">
              <ManualPickerTab pending={pending} onSubmit={confirmManual} />
            </TabsContent>

            {createPortal(
              <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-60 flex justify-center px-4 sm:hidden">
                <TabsList
                  className={cn(
                    floatingTabListClass,
                    "w-full max-w-sm border border-border/50 bg-popover shadow-lg ring-1 ring-foreground/10",
                  )}
                >
                  <TabsTrigger value="saved" className={floatingTabTriggerClass}>
                    <TabIconBadge tint="amber" icon={Bookmark} className="size-6" />
                    <span className={floatingTabLabelClass}>Guardados</span>
                  </TabsTrigger>
                  <TabsTrigger value="search" className={floatingTabTriggerClass}>
                    <TabIconBadge tint="blue" icon={Search} className="size-6" />
                    <span className={floatingTabLabelClass}>Buscar</span>
                  </TabsTrigger>
                  <TabsTrigger value="barcode" className={floatingTabTriggerClass}>
                    <TabIconBadge tint="emerald" icon={Barcode} className="size-6" />
                    <span className={floatingTabLabelClass}>Escanear</span>
                  </TabsTrigger>
                  <TabsTrigger value="recipes" className={floatingTabTriggerClass}>
                    <TabIconBadge tint="rose" icon={ChefHat} className="size-6" />
                    <span className={floatingTabLabelClass}>Recetas</span>
                  </TabsTrigger>
                  <TabsTrigger value="manual" className={floatingTabTriggerClass}>
                    <TabIconBadge tint="violet" icon={SquarePen} className="size-6" />
                    <span className={floatingTabLabelClass}>Manual</span>
                  </TabsTrigger>
                </TabsList>
              </div>,
              document.body,
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
