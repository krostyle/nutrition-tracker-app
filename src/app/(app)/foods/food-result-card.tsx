"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";
import type { ExternalFoodResult } from "@/lib/food-sources/actions";
import { FoodNutritionDetail, MacroRow } from "./nutrition-facts";

export function FoodResultCard({
  result,
  onSave,
  defaultOpen = false,
}: {
  result: ExternalFoodResult;
  onSave: () => Promise<ActionResult<unknown>>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const outcome = await onSave();
      if (outcome.ok) {
        setSaved(true);
      } else {
        setError(outcome.message);
      }
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
        <CardHeader>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{result.name}</CardTitle>
            {result.brand && (
              <p className="truncate text-xs text-muted-foreground">{result.brand}</p>
            )}
            <MacroRow values={result} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {saved ? (
            <Button size="sm" disabled variant="outline">
              Guardado
            </Button>
          ) : (
            <Button size="sm" disabled={pending} onClick={handleSave}>
              {pending && <Spinner className="size-4" />}
              {pending ? "Guardando" : "Guardar"}
            </Button>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{result.name}</DialogTitle>
            <DialogDescription>
              {result.brand ? `${result.brand} · Valores nutricionales` : "Valores nutricionales"}
            </DialogDescription>
          </DialogHeader>
          <FoodNutritionDetail
            baseValues={result}
            servingSize={result.servingSize}
            servingLabel={result.servingLabel}
          />
          {saved ? (
            <Button disabled variant="outline" className="w-full">
              Guardado
            </Button>
          ) : (
            <Button disabled={pending} className="w-full" onClick={handleSave}>
              {pending && <Spinner className="size-4" />}
              {pending ? "Guardando" : "Guardar"}
            </Button>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
