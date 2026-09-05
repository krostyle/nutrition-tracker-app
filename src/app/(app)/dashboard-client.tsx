"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteLogEntryAction,
  getDaySummaryAction,
  updateLogEntryGramsAction,
  type DaySummary,
} from "@/lib/nutrition/actions";
import { shiftDateKey, todayDateKey } from "@/lib/nutrition/date";
import type { Food, FoodLogEntry, MealType } from "@/generated/prisma/client";
import { MealFoodPicker } from "./meal-food-picker";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
};

const NUTRIENT_LABELS = [
  { key: "calories", label: "Calorías", unit: "kcal" },
  { key: "protein", label: "Proteína", unit: "g" },
  { key: "carbs", label: "Carbohidratos", unit: "g" },
  { key: "fat", label: "Grasa", unit: "g" },
] as const;

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function EntryRow({
  entry,
  onChanged,
}: {
  entry: FoodLogEntry & { food: Food };
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [grams, setGrams] = useState(String(entry.grams));
  const [pending, startTransition] = useTransition();

  const calories = round((entry.food.calories * entry.grams) / 100);

  function save() {
    const value = Number(grams);
    if (!value || value <= 0) return;
    startTransition(async () => {
      await updateLogEntryGramsAction(entry.id, value);
      setEditing(false);
      onChanged();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteLogEntryAction(entry.id);
      onChanged();
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b py-2 text-sm last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate">{entry.food.name}</p>
        <p className="text-muted-foreground">
          {editing ? (
            <span className="inline-flex items-center gap-1">
              <Input
                className="h-6 w-20"
                type="number"
                step="any"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
              />
              g
            </span>
          ) : (
            `${entry.grams}g · ${calories} kcal`
          )}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {editing ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={save}>
            Guardar
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={pending} onClick={remove}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardClient() {
  const [dateKey, setDateKey] = useState(todayDateKey());
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [openMealType, setOpenMealType] = useState<MealType | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const result = await getDaySummaryAction(dateKey);
      setSummary(result);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  if (!summary) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setDateKey((d) => shiftDateKey(d, -1))}>
          ← Anterior
        </Button>
        <span className="text-sm font-medium">{dateKey}</span>
        <Button variant="outline" size="sm" onClick={() => setDateKey((d) => shiftDateKey(d, 1))}>
          Siguiente →
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Totales del día</CardTitle>
          {!summary?.goal && (
            <CardDescription>
              Todavía no definiste una meta.{" "}
              <Link href="/goals" className="underline">
                Definirla
              </Link>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {NUTRIENT_LABELS.map(({ key, label, unit }) => {
                const consumed = round(summary.totals[key]);
                const goalValue = summary.goal?.[key];
                return (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">
                      {consumed}
                      {goalValue !== undefined ? ` / ${goalValue}` : ""} {unit}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {MEAL_TYPES.map((mealType) => (
        <Card key={mealType}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{MEAL_LABELS[mealType]}</CardTitle>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={`Agregar a ${MEAL_LABELS[mealType]}`}
              onClick={() => setOpenMealType(mealType)}
            >
              <Plus className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {summary?.entriesByMeal[mealType].length ? (
              summary.entriesByMeal[mealType].map((entry) => (
                <EntryRow key={entry.id} entry={entry} onChanged={refresh} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin entradas.</p>
            )}
          </CardContent>
        </Card>
      ))}

      {openMealType && (
        <MealFoodPicker
          open
          onOpenChange={(next) => {
            if (!next) setOpenMealType(null);
          }}
          mealLabel={MEAL_LABELS[openMealType]}
          mealType={openMealType}
          dateKey={dateKey}
          onAdded={refresh}
        />
      )}

      {pending && <p className="text-center text-xs text-muted-foreground">Actualizando...</p>}
    </div>
  );
}
