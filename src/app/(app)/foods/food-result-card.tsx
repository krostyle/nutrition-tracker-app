"use client";

import { useState, useTransition } from "react";
import { Beef, Candy, Droplet, Droplets, Flame, Leaf, Wheat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExternalFoodResult } from "@/lib/food-sources/actions";

const MACROS = [
  { key: "calories", label: "Calorías", unit: "kcal", icon: Flame },
  { key: "protein", label: "Proteína", unit: "g", icon: Beef },
  { key: "carbs", label: "Carbohidratos", unit: "g", icon: Wheat },
  { key: "fat", label: "Grasa", unit: "g", icon: Droplet },
] as const;

const EXTRA_NUTRIENTS = [
  { key: "fiber", label: "Fibra", unit: "g", icon: Leaf },
  { key: "sugar", label: "Azúcares", unit: "g", icon: Candy },
  { key: "saturatedFat", label: "Grasa saturada", unit: "g", icon: Droplets },
  { key: "sodium", label: "Sodio", unit: "mg", icon: Droplets },
] as const;

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function MacroRow({ result }: { result: ExternalFoodResult }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {MACROS.map(({ key, unit, icon: Icon }) => (
        <span key={key} className="flex items-center gap-1">
          <Icon className="size-3.5" />
          {round(result[key])}
          {unit === "kcal" ? " kcal" : "g"}
        </span>
      ))}
    </div>
  );
}

function NutritionFacts({ result }: { result: ExternalFoodResult }) {
  return (
    <div className="flex flex-col rounded-lg border">
      {[...MACROS, ...EXTRA_NUTRIENTS].map(({ key, label, unit, icon: Icon }) => {
        const value = result[key];
        if (value === undefined) return null;
        return (
          <div
            key={key}
            className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-b-0"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4" />
              {label}
            </span>
            <span className="font-medium">
              {round(value)} {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function FoodResultCard({
  result,
  source,
  onSave,
}: {
  result: ExternalFoodResult;
  source: "OFF" | "USDA";
  onSave: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await onSave();
      setSaved(true);
    });
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="cursor-pointer transition-colors hover:bg-muted/40"
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{result.name}</CardTitle>
            <MacroRow result={result} />
          </div>
          <Badge variant="secondary" className="shrink-0">
            {source}
          </Badge>
        </CardHeader>
        <CardContent>
          {saved ? (
            <Button size="sm" disabled variant="outline">
              Guardado
            </Button>
          ) : (
            <Button size="sm" disabled={pending} onClick={handleSave}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{result.name}</DialogTitle>
            <DialogDescription>Valores nutricionales por 100g</DialogDescription>
          </DialogHeader>
          <NutritionFacts result={result} />
          {saved ? (
            <Button disabled variant="outline" className="w-full">
              Guardado
            </Button>
          ) : (
            <Button disabled={pending} className="w-full" onClick={handleSave}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
