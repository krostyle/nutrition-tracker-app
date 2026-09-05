"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGoalAction, saveGoalAction } from "@/lib/nutrition/actions";

const FIELDS = [
  { key: "calories", label: "Calorías (kcal)" },
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Carbohidratos (g)" },
  { key: "fat", label: "Grasa (g)" },
] as const;

export function GoalsClient() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getGoalAction().then((goal) => {
      if (goal) {
        setValues({
          calories: String(goal.calories),
          protein: String(goal.protein),
          carbs: String(goal.carbs),
          fat: String(goal.fat),
        });
      }
      setLoaded(true);
    });
  }, []);

  const canSubmit = FIELDS.every((field) => values[field.key]?.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      await saveGoalAction({
        calories: Number(values.calories),
        protein: Number(values.protein),
        carbs: Number(values.carbs),
        fat: Number(values.fat),
      });
      setSaved(true);
    });
  }

  if (!loaded) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Metas diarias</CardTitle>
        <CardDescription>Calorías y macros objetivo por día.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`goal-${field.key}`}>{field.label}</Label>
              <Input
                id={`goal-${field.key}`}
                type="number"
                step="any"
                value={values[field.key] ?? ""}
                onChange={(e) => {
                  setSaved(false);
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                }}
              />
            </div>
          ))}
          <Button type="submit" disabled={!canSubmit || pending}>
            {pending ? "Guardando..." : saved ? "Guardado" : "Guardar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
