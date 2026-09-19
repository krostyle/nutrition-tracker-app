"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Food, FoodSource } from "@/generated/prisma/client";
import { FoodNutritionDetail, MacroRow } from "./nutrition-facts";

const SOURCE_LABELS: Record<FoodSource, string> = {
  OFF: "OFF",
  USDA: "USDA",
  MANUAL: "Manual",
};

export function SavedFoodCard({ food }: { food: Food }) {
  const [open, setOpen] = useState(false);

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
            <CardTitle className="truncate text-base">{food.name}</CardTitle>
            {food.brand && (
              <p className="truncate text-xs text-muted-foreground">{food.brand}</p>
            )}
            <MacroRow values={food} />
          </div>
          <Badge variant="secondary" className="shrink-0">
            {SOURCE_LABELS[food.source]}
          </Badge>
        </CardHeader>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{food.name}</DialogTitle>
            <DialogDescription>
              {food.brand ? `${food.brand} · Valores nutricionales` : "Valores nutricionales"}
            </DialogDescription>
          </DialogHeader>
          <FoodNutritionDetail
            baseValues={food}
            servingSize={food.servingSize ?? undefined}
            servingLabel={food.servingLabel ?? undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
