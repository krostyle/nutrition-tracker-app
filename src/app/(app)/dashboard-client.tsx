"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createLogEntryAction,
  deleteLogEntryAction,
  getDaySummaryAction,
  searchLocalFoodsAction,
  updateLogEntryGramsAction,
  type DaySummary,
} from "@/lib/nutrition/actions";
import { shiftDateKey, todayDateKey } from "@/lib/nutrition/date";
import type { Food, FoodLogEntry, MealType } from "@/generated/prisma/client";

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
      <div className="flex-1">
        <p>{entry.food.name}</p>
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
      <div className="flex gap-1">
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

function AddEntryForm({
  dateKey,
  onAdded,
}: {
  dateKey: string;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState("100");
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const found = await searchLocalFoodsAction(value.trim());
      setResults(found);
    }, 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const value = Number(grams);
    if (!value || value <= 0) return;

    startTransition(async () => {
      await createLogEntryAction({
        foodId: selected.id,
        grams: value,
        mealType,
        dateKey,
      });
      setQuery("");
      setResults([]);
      setSelected(null);
      setGrams("100");
      onAdded();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar alimento guardado..."
          value={selected ? selected.name : query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
        >
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {MEAL_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {!selected && results.length > 0 && (
        <div className="flex flex-col rounded-lg border">
          {results.map((food) => (
            <button
              type="button"
              key={food.id}
              className="border-b px-2 py-1 text-left text-sm last:border-b-0 hover:bg-muted"
              onClick={() => {
                setSelected(food);
                setResults([]);
              }}
            >
              {food.name}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="flex items-center gap-2">
          <Input
            className="w-24"
            type="number"
            step="any"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">gramos</span>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Agregando..." : "Agregar"}
          </Button>
        </div>
      )}
    </form>
  );
}

export function DashboardClient() {
  const [dateKey, setDateKey] = useState(todayDateKey());
  const [summary, setSummary] = useState<DaySummary | null>(null);
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
          <CardHeader>
            <CardTitle className="text-base">{MEAL_LABELS[mealType]}</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar alimento</CardTitle>
        </CardHeader>
        <CardContent>
          <AddEntryForm dateKey={dateKey} onAdded={refresh} />
        </CardContent>
      </Card>

      {pending && <p className="text-center text-xs text-muted-foreground">Actualizando...</p>}
    </div>
  );
}
