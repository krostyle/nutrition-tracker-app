"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Barcode, Bookmark, Search, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  createManualFoodAction,
  saveOffFoodAction,
  saveUsdaFoodAction,
} from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import type { Food } from "@/generated/prisma/client";
import {
  BarcodePickerTab,
  ManualPickerTab,
  SavedFoodsPickerTab,
  SearchByNamePickerTab,
  type FoodPick,
} from "../food-picker-tabs";

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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePick(pick: FoodPick) {
    setError(null);
    if (pick.kind === "existing") {
      onPicked(pick.food, 100);
      onOpenChange(false);
      return;
    }
    startTransition(async () => {
      const outcome =
        pick.kind === "OFF" ? await saveOffFoodAction(pick.result) : await saveUsdaFoodAction(pick.result);
      if (outcome.ok) {
        onPicked(outcome.data, 100);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar ingrediente</DialogTitle>
          <DialogDescription>Busca un alimento o cárgalo a mano.</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {pending && <p className="text-sm text-muted-foreground">Guardando...</p>}

        <Tabs defaultValue="saved">
          <div className="hidden sm:block">
            <TabsList className="w-full">
              <TabsTrigger value="saved">Guardados</TabsTrigger>
              <TabsTrigger value="search">Buscar</TabsTrigger>
              <TabsTrigger value="barcode">Escanear</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="saved" className="pb-28 sm:pb-0">
            <SavedFoodsPickerTab onSelect={handlePick} />
          </TabsContent>
          <TabsContent value="search" className="pb-28 sm:pb-0">
            <SearchByNamePickerTab onSelect={handlePick} />
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
                <TabsTrigger value="manual" className={floatingTabTriggerClass}>
                  <TabIconBadge tint="violet" icon={SquarePen} className="size-6" />
                  <span className={floatingTabLabelClass}>Manual</span>
                </TabsTrigger>
              </TabsList>
            </div>,
            document.body,
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
