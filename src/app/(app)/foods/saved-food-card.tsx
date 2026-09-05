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
import { MacroRow, NutritionFacts, scaleToServing } from "./nutrition-facts";

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{food.name}</DialogTitle>
            <DialogDescription>
              {food.brand ? `${food.brand} · Valores nutricionales` : "Valores nutricionales"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">Por 100g</h4>
              <NutritionFacts values={food} />
            </div>
            {food.servingSize !== null && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                  Por porción {food.servingLabel ? `(${food.servingLabel})` : ""}
                </h4>
                <NutritionFacts values={scaleToServing(food, food.servingSize)} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
