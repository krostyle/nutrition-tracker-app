"use client";

import { useState, useTransition } from "react";
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
import { MacroRow, NutritionFacts, scaleToServing } from "./nutrition-facts";

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
            {result.brand && (
              <p className="truncate text-xs text-muted-foreground">{result.brand}</p>
            )}
            <MacroRow values={result} />
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
            <DialogDescription>
              {result.brand ? `${result.brand} · Valores nutricionales` : "Valores nutricionales"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">Por 100g</h4>
              <NutritionFacts values={result} />
            </div>
            {result.servingSize !== undefined && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                  Por porción {result.servingLabel ? `(${result.servingLabel})` : ""}
                </h4>
                <NutritionFacts values={scaleToServing(result, result.servingSize)} />
              </div>
            )}
          </div>
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
