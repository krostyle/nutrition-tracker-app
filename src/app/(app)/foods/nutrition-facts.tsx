"use client";

import { useState } from "react";
import { Beef, Candy, ChevronDown, ChevronUp, Droplet, Droplets, Flame, Leaf, Wheat } from "lucide-react";
import { Input } from "@/components/ui/input";

export const MACROS = [
  { key: "calories", label: "Calorías", short: "Cal.", unit: "kcal", icon: Flame },
  { key: "protein", label: "Proteína", short: "Prot.", unit: "g", icon: Beef },
  { key: "carbs", label: "Carbohidratos", short: "Carb.", unit: "g", icon: Wheat },
  { key: "fat", label: "Grasa", short: "Grasa", unit: "g", icon: Droplet },
] as const;

export const EXTRA_NUTRIENTS = [
  { key: "fiber", label: "Fibra", unit: "g", icon: Leaf },
  { key: "sugar", label: "Azúcares", unit: "g", icon: Candy },
  { key: "saturatedFat", label: "Grasa saturada", unit: "g", icon: Droplets },
  { key: "sodium", label: "Sodio", unit: "mg", icon: Droplets },
] as const;

export type NutrientKey = (typeof MACROS)[number]["key"] | (typeof EXTRA_NUTRIENTS)[number]["key"];
export type NutrientValues = Partial<Record<NutrientKey, number | null>>;

export function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function MacroRow({ values }: { values: NutrientValues }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {MACROS.map(({ key, unit, icon: Icon }) => {
        const value = values[key];
        if (value === null || value === undefined) return null;
        return (
          <span key={key} className="flex items-center gap-1">
            <Icon className="size-3.5" />
            {round(value)}
            {unit === "kcal" ? " kcal" : "g"}
          </span>
        );
      })}
    </div>
  );
}

export function scaleByFactor(values: NutrientValues, factor: number): NutrientValues {
  const scaled: NutrientValues = {};
  for (const { key } of [...MACROS, ...EXTRA_NUTRIENTS]) {
    const value = values[key];
    if (value !== null && value !== undefined) scaled[key] = value * factor;
  }
  return scaled;
}

export type MacroPercentages = { protein: number; carbs: number; fat: number };

export function macroPercentages(values: NutrientValues): MacroPercentages | null {
  const proteinKcal = (values.protein ?? 0) * 4;
  const carbsKcal = (values.carbs ?? 0) * 4;
  const fatKcal = (values.fat ?? 0) * 9;
  const total = proteinKcal + carbsKcal + fatKcal;
  if (total <= 0) return null;
  return {
    protein: round((proteinKcal / total) * 100),
    carbs: round((carbsKcal / total) * 100),
    fat: round((fatKcal / total) * 100),
  };
}

export const MACRO_PERCENT_SEGMENTS = [
  { key: "protein", label: "Proteína", barClass: "bg-blue-500", textClass: "text-blue-600 dark:text-blue-400" },
  { key: "carbs", label: "Carbohidratos", barClass: "bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
  { key: "fat", label: "Grasa", barClass: "bg-violet-500", textClass: "text-violet-600 dark:text-violet-400" },
] as const;

export function MacroPercentBar({ values }: { values: NutrientValues }) {
  const percentages = macroPercentages(values);
  if (!percentages) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {MACRO_PERCENT_SEGMENTS.map(({ key, barClass }) => {
          const value = percentages[key];
          if (value <= 0) return null;
          return <div key={key} className={barClass} style={{ width: `${value}%` }} />;
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {MACRO_PERCENT_SEGMENTS.map(({ key, label, textClass }) => (
          <span key={key} className={`font-medium ${textClass}`}>
            {label} {percentages[key]}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function ExtraNutrientsList({ values }: { values: NutrientValues }) {
  const rows = EXTRA_NUTRIENTS.filter(({ key }) => values[key] !== null && values[key] !== undefined);
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col rounded-lg border">
      {rows.map(({ key, label, unit, icon: Icon }) => (
        <div key={key} className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-b-0">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Icon className="size-4" />
            {label}
          </span>
          <span className="font-medium">
            {round(values[key]!)} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

type QuantityUnit = "grams" | "serving";

// baseValues: por 100g para alimento, por porción para receta (isRecipe).
// footer recibe la cantidad ya en la unidad que se persiste (gramos o porciones).
export function FoodNutritionDetail({
  baseValues,
  isRecipe = false,
  servingSize,
  servingLabel,
  footer,
}: {
  baseValues: NutrientValues;
  isRecipe?: boolean;
  servingSize?: number;
  servingLabel?: string;
  footer?: (finalQuantity: number) => React.ReactNode;
}) {
  const [unit, setUnit] = useState<QuantityUnit>(isRecipe ? "serving" : "grams");
  const [quantity, setQuantity] = useState(isRecipe ? "1" : "100");
  const [expanded, setExpanded] = useState(false);

  const quantityNumber = Number(quantity) || 0;

  const finalQuantity = isRecipe
    ? quantityNumber
    : unit === "grams"
      ? quantityNumber
      : quantityNumber * (servingSize ?? 0);

  const factor = isRecipe ? quantityNumber : finalQuantity / 100;
  const scaled = scaleByFactor(baseValues, factor);

  function handleUnitChange(next: QuantityUnit) {
    setUnit(next);
    setQuantity(next === "serving" ? "1" : "100");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2 text-center">
        {MACROS.map(({ key, short, unit: nutrientUnit, icon: Icon }) => (
          <div key={key} className="flex flex-col items-center gap-0.5 rounded-lg border p-2">
            <Icon className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              {round(scaled[key] ?? 0)}
              <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{nutrientUnit}</span>
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground">{short}</span>
          </div>
        ))}
      </div>

      <MacroPercentBar values={scaled} />

      <div className="flex items-center gap-2">
        <Input
          className="w-20"
          type="number"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        {isRecipe ? (
          <span className="text-sm text-muted-foreground">porciones</span>
        ) : servingSize !== undefined ? (
          <div className="flex overflow-hidden rounded-md border text-xs">
            <button
              type="button"
              onClick={() => handleUnitChange("grams")}
              className={`px-2.5 py-1.5 ${unit === "grams" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              gramos
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange("serving")}
              className={`px-2.5 py-1.5 ${unit === "serving" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {servingLabel ?? "porción"}
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">g</span>
        )}
      </div>

      {footer?.(finalQuantity)}

      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground"
        >
          Información nutricional completa
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {expanded && (
          <div className="mt-2">
            <ExtraNutrientsList values={scaled} />
          </div>
        )}
      </div>
    </div>
  );
}
