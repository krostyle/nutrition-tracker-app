import { Beef, Candy, Droplet, Droplets, Flame, Leaf, Wheat } from "lucide-react";

export const MACROS = [
  { key: "calories", label: "Calorías", unit: "kcal", icon: Flame },
  { key: "protein", label: "Proteína", unit: "g", icon: Beef },
  { key: "carbs", label: "Carbohidratos", unit: "g", icon: Wheat },
  { key: "fat", label: "Grasa", unit: "g", icon: Droplet },
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

export function NutritionFacts({ values }: { values: NutrientValues }) {
  return (
    <div className="flex flex-col rounded-lg border">
      {[...MACROS, ...EXTRA_NUTRIENTS].map(({ key, label, unit, icon: Icon }) => {
        const value = values[key];
        if (value === null || value === undefined) return null;
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

export function scaleToServing(values: NutrientValues, servingSize: number): NutrientValues {
  const factor = servingSize / 100;
  const scaled: NutrientValues = {};
  for (const { key } of [...MACROS, ...EXTRA_NUTRIENTS]) {
    const value = values[key];
    if (value !== null && value !== undefined) scaled[key] = value * factor;
  }
  return scaled;
}
