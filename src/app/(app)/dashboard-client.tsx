"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
  getWeekSummaryAction,
  updateLogEntryQuantityAction,
  type DaySummary,
  type LogEntryDisplay,
  type WeekSummary,
} from "@/lib/nutrition/actions";
import { getWeekDates, getWeekStartKey, shiftDateKey, todayDateKey } from "@/lib/nutrition/date";
import type { MealType } from "@/generated/prisma/client";
import { MealFoodPicker } from "./meal-food-picker";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
};

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function NutrientBar({
  label,
  unit,
  consumed,
  goal,
}: {
  label: string;
  unit: string;
  consumed: number;
  goal?: number;
}) {
  const pct = goal ? Math.max(0, Math.min(100, (consumed / goal) * 100)) : 0;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium whitespace-nowrap">
        {consumed}
        {goal !== undefined ? ` / ${goal}` : ""} {unit}
      </span>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {goal !== undefined && (
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  onChanged,
}: {
  entry: LogEntryDisplay;
  onChanged: () => void;
}) {
  const isRecipe = Boolean(entry.recipe);
  const name = entry.food?.name ?? entry.recipe?.name ?? "";
  const unit = isRecipe ? "porciones" : "g";

  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const calories = round(entry.calories);

  function save() {
    const value = Number(quantity);
    if (!value || value <= 0) return;
    setError(null);
    startTransition(async () => {
      const outcome = await updateLogEntryQuantityAction(entry.id, value);
      if (outcome.ok) {
        setEditing(false);
        onChanged();
      } else {
        setError(outcome.message);
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const outcome = await deleteLogEntryAction(entry.id);
      if (outcome.ok) {
        onChanged();
      } else {
        setError(outcome.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1 border-b py-2 last:border-b-0">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate">{name}</p>
          <p className="text-muted-foreground">
            {editing ? (
              <span className="inline-flex items-center gap-1">
                <Input
                  className="h-6 w-20"
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                {unit}
              </span>
            ) : (
              `${entry.quantity} ${unit} · ${calories} kcal`
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function WeekStrip({
  weekStartKey,
  selectedDateKey,
  onSelect,
  onShiftWeek,
}: {
  weekStartKey: string;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
  onShiftWeek: (weeks: number) => void;
}) {
  const dates = getWeekDates(weekStartKey);
  const today = todayDateKey();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Semana anterior"
        onClick={() => onShiftWeek(-1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {dates.map((dateKey, i) => {
          const dayNum = Number(dateKey.slice(8, 10));
          const isSelected = dateKey === selectedDateKey;
          const isToday = dateKey === today;
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelect(dateKey)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
                !isSelected && isToday && "ring-1 ring-inset ring-primary/50",
              )}
            >
              <span className="text-[10px] uppercase opacity-70">{WEEKDAY_LABELS[i]}</span>
              <span className="font-medium">{dayNum}</span>
            </button>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Semana siguiente"
        onClick={() => onShiftWeek(1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function WeeklySummaryCard({ weekSummary }: { weekSummary: WeekSummary | null }) {
  if (!weekSummary) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { goal, days, average } = weekSummary;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen semanal</CardTitle>
        {!goal && (
          <CardDescription>
            Todavía no definiste una meta.{" "}
            <Link href="/goals" className="underline">
              Definirla
            </Link>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {average ? (
          <div className="flex flex-col gap-3">
            <NutrientBar
              label="Calorías (prom.)"
              unit="kcal"
              consumed={round(average.calories)}
              goal={goal?.calories}
            />
            <div className="grid grid-cols-3 gap-3">
              <NutrientBar
                label="Proteína (prom.)"
                unit="g"
                consumed={round(average.protein)}
                goal={goal?.protein}
              />
              <NutrientBar
                label="Carbohidratos (prom.)"
                unit="g"
                consumed={round(average.carbs)}
                goal={goal?.carbs}
              />
              <NutrientBar
                label="Grasa (prom.)"
                unit="g"
                consumed={round(average.fat)}
                goal={goal?.fat}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin registros esta semana.</p>
        )}

        {goal && (
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => {
              const pct = Math.max(
                0,
                Math.min(100, round((day.totals.calories / goal.calories) * 100)),
              );
              return (
                <div key={day.dateKey} className="flex flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-muted/50">
                    {day.hasEntries ? (
                      <div
                        className="w-full rounded-md bg-primary"
                        style={{ height: `${pct}%` }}
                      />
                    ) : (
                      <div className="h-1 w-full rounded-md bg-border" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{WEEKDAY_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
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
  const [weekSummaryEntry, setWeekSummaryEntry] = useState<{
    key: string;
    data: WeekSummary;
  } | null>(null);
  const [openMealType, setOpenMealType] = useState<MealType | null>(null);
  const [pending, startTransition] = useTransition();
  const dayRequestRef = useRef(0);
  const weekRequestRef = useRef(0);

  const weekStartKey = getWeekStartKey(dateKey);
  const weekSummary = weekSummaryEntry?.key === weekStartKey ? weekSummaryEntry.data : null;

  function refreshDay() {
    const requestId = ++dayRequestRef.current;
    startTransition(async () => {
      const result = await getDaySummaryAction(dateKey);
      if (dayRequestRef.current === requestId) {
        setSummary(result);
      }
    });
  }

  function refreshWeek() {
    const requestId = ++weekRequestRef.current;
    const key = weekStartKey;
    getWeekSummaryAction(key).then((result) => {
      if (weekRequestRef.current === requestId) {
        setWeekSummaryEntry({ key, data: result });
      }
    });
  }

  function refreshAll() {
    refreshDay();
    refreshWeek();
  }

  useEffect(() => {
    refreshDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  useEffect(() => {
    refreshWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartKey]);

  if (!summary) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <WeekStrip
        weekStartKey={weekStartKey}
        selectedDateKey={dateKey}
        onSelect={setDateKey}
        onShiftWeek={(weeks) => setDateKey((d) => shiftDateKey(d, weeks * 7))}
      />

      <WeeklySummaryCard weekSummary={weekSummary} />

      <Card>
        <CardHeader>
          <CardTitle>Totales del día</CardTitle>
          <CardDescription>
            {dateKey}
            {!summary?.goal && (
              <>
                {" · "}Todavía no definiste una meta.{" "}
                <Link href="/goals" className="underline">
                  Definirla
                </Link>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary && (
            <div className="flex flex-col gap-3">
              <NutrientBar
                label="Calorías"
                unit="kcal"
                consumed={round(summary.totals.calories)}
                goal={summary.goal?.calories}
              />
              <div className="grid grid-cols-3 gap-3">
                <NutrientBar
                  label="Proteína"
                  unit="g"
                  consumed={round(summary.totals.protein)}
                  goal={summary.goal?.protein}
                />
                <NutrientBar
                  label="Carbohidratos"
                  unit="g"
                  consumed={round(summary.totals.carbs)}
                  goal={summary.goal?.carbs}
                />
                <NutrientBar
                  label="Grasa"
                  unit="g"
                  consumed={round(summary.totals.fat)}
                  goal={summary.goal?.fat}
                />
              </div>
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
                <EntryRow key={entry.id} entry={entry} onChanged={refreshAll} />
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
          onAdded={refreshAll}
        />
      )}

      {pending && <p className="text-center text-xs text-muted-foreground">Actualizando...</p>}
    </div>
  );
}
