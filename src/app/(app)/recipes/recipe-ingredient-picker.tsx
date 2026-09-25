"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Barcode, Search, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TabIconBadge,
  floatingTabLabelClass,
  floatingTabListClass,
  floatingTabTriggerClass,
} from "@/components/ui/floating-tab-bar";
import { createManualFoodAction, saveExternalFoodAction } from "@/lib/food-sources/actions";
import type { ExternalFoodResult } from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import type { Food } from "@/generated/prisma/client";
import { FoodNutritionDetail, type NutrientValues } from "../foods/nutrition-facts";
import {
  BarcodePickerTab,
  ManualPickerTab,
  UnifiedFoodPickerTab,
  type FoodPick,
} from "../food-picker-tabs";

type Candidate =
  | { kind: "existing"; food: Food }
  | { kind: "OFF" | "USDA"; result: ExternalFoodResult };

function candidateName(candidate: Candidate): string {
  return candidate.kind === "existing" ? candidate.food.name : candidate.result.name;
}

function candidateValues(candidate: Candidate): NutrientValues {
  return candidate.kind === "existing" ? candidate.food : candidate.result;
}

function candidateBrand(candidate: Candidate): string | undefined {
  return (candidate.kind === "existing" ? candidate.food.brand : candidate.result.brand) ?? undefined;
}

function candidateServingSize(candidate: Candidate): number | undefined {
  return (
    (candidate.kind === "existing" ? candidate.food.servingSize : candidate.result.servingSize) ??
    undefined
  );
}

function candidateServingLabel(candidate: Candidate): string | undefined {
  return (
    (candidate.kind === "existing" ? candidate.food.servingLabel : candidate.result.servingLabel) ??
    undefined
  );
}

// Igual que el selector de agregar a una comida, pero para elegir un
// ingrediente de receta: cualquier alimento encontrado por búsqueda,
// escaneo o cargado a mano se guarda en la librería antes de usarse
// (una receta solo puede referenciar alimentos ya persistidos).
export function RecipeIngredientPicker({
  open,
  onOpenChange,
  onPicked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPicked: (food: Food, grams: number) => void;
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

  function handlePick(pick: FoodPick) {
    setError(null);
    setCandidate(pick.kind === "existing" ? { kind: "existing", food: pick.food } : pick);
  }

  function confirmCandidate(grams: number) {
    if (!candidate) return;
    setError(null);
    if (candidate.kind === "existing") {
      onPicked(candidate.food, grams);
      reset();
      onOpenChange(false);
      return;
    }
    startTransition(async () => {
      const outcome = await saveExternalFoodAction(candidate.result);
      if (outcome.ok) {
        onPicked(outcome.data, grams);
        reset();
        onOpenChange(false);
      } else {
        setError(outcome.message);
      }
    });
  }

  function handleManualSubmit(input: ManualFoodInput, grams: number) {
    setError(null);
    startTransition(async () => {
      const outcome = await createManualFoodAction(input);
      if (outcome.ok) {
        onPicked(outcome.data, grams);
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
          <DialogTitle>Agregar ingrediente</DialogTitle>
          <DialogDescription>Busca un alimento o cárgalo a mano.</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {candidate ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{candidateName(candidate)}</p>
                {candidateBrand(candidate) && (
                  <p className="truncate text-xs text-muted-foreground">{candidateBrand(candidate)}</p>
                )}
              </div>
              <FoodNutritionDetail
                baseValues={candidateValues(candidate)}
                servingSize={candidateServingSize(candidate)}
                servingLabel={candidateServingLabel(candidate)}
                footer={(finalQuantity) => (
                  <Button
                    size="sm"
                    disabled={pending || !finalQuantity}
                    onClick={() => confirmCandidate(finalQuantity)}
                  >
                    {pending && <Spinner className="size-4" />}
                    {pending ? "Guardando" : "Agregar"}
                  </Button>
                )}
              />
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              Elegir otro
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="search">
            <div className="hidden sm:block">
              <TabsList className="w-full">
                <TabsTrigger value="search">Buscar</TabsTrigger>
                <TabsTrigger value="barcode">Escanear</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="search" className="pb-28 sm:pb-0">
              <UnifiedFoodPickerTab onSelect={handlePick} />
            </TabsContent>
            <TabsContent value="barcode" className="pb-28 sm:pb-0">
              <BarcodePickerTab onSelect={handlePick} />
            </TabsContent>
            <TabsContent value="manual" className="pb-28 sm:pb-0">
              <ManualPickerTab
                pending={pending}
                submitLabel="Crear ingrediente"
                gramsLabel="Cantidad inicial (g)"
                onSubmit={handleManualSubmit}
              />
            </TabsContent>

            {createPortal(
              <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-60 flex justify-center px-4 sm:hidden">
                <TabsList
                  className={cn(
                    floatingTabListClass,
                    "w-full max-w-sm border border-border/50 bg-popover shadow-lg ring-1 ring-foreground/10",
                  )}
                >
                  <TabsTrigger value="search" className={floatingTabTriggerClass}>
                    <TabIconBadge tint="blue" icon={Search} className="size-6" />
                    <span className={floatingTabLabelClass}>Buscar</span>
                  </TabsTrigger>
                  <TabsTrigger value="barcode" className={floatingTabTriggerClass}>
                    <TabIconBadge tint="emerald" icon={Barcode} className="size-6" />
                    <span className={floatingTabLabelClass}>Escanear</span>
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
