"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { BarcodeCameraScanner } from "@/components/barcode-camera-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  listFoodsAction,
  lookupBarcodeAction,
  searchFoodsAction,
  type ExternalFoodResult,
} from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import { searchLocalFoodsAction } from "@/lib/nutrition/actions";
import type { Food } from "@/generated/prisma/client";
import { MacroRow, type NutrientValues } from "./foods/nutrition-facts";

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 800;
const LOCAL_DEBOUNCE_MS = 400;

// Un alimento elegido desde cualquier fuente. "existing" ya es un Food
// persistido; "OFF" todavía no existe en la BD — quien use este picker
// decide si/cuándo guardarlo (ver saveOffFoodAction).
export type FoodPick =
  | { kind: "existing"; foodId: string; food: Food }
  | { kind: "OFF"; result: ExternalFoodResult };

export function FoodResultRow({
  name,
  brand,
  values,
  onSelect,
}: {
  name: string;
  brand?: string;
  values: NutrientValues;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-1 border-b px-2 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
    >
      <span className="truncate font-medium">{name}</span>
      {brand && <p className="truncate text-xs text-muted-foreground">{brand}</p>}
      <MacroRow values={values} />
    </button>
  );
}

export function UnifiedFoodPickerTab({
  onSelect,
  onNavigate,
}: {
  onSelect: (pick: FoodPick) => void;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [savedFoods, setSavedFoods] = useState<Food[]>([]);
  const [offItems, setOffItems] = useState<ExternalFoodResult[]>([]);
  const [offNote, setOffNote] = useState<string | null>(null);
  const [offLoading, startOffTransition] = useTransition();
  const localDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function loadLocal(term: string) {
    const trimmed = term.trim();
    const promise = trimmed ? searchLocalFoodsAction(trimmed) : listFoodsAction();
    promise.then(setSavedFoods);
  }

  function runOffSearch(term: string) {
    startOffTransition(async () => {
      const results = await searchFoodsAction(term.trim());
      if (results.ok) {
        setOffItems(results.results);
        setOffNote(null);
      } else {
        setOffItems([]);
        setOffNote("Open Food Facts no está disponible en este momento.");
      }
    });
  }

  useEffect(() => {
    loadLocal("");
  }, []);

  function handleChange(value: string) {
    setQuery(value);

    if (localDebounceRef.current) clearTimeout(localDebounceRef.current);
    localDebounceRef.current = setTimeout(() => loadLocal(value), LOCAL_DEBOUNCE_MS);

    if (offDebounceRef.current) clearTimeout(offDebounceRef.current);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setOffItems([]);
      setOffNote(null);
      return;
    }
    offDebounceRef.current = setTimeout(() => runOffSearch(value), SEARCH_DEBOUNCE_MS);
  }

  const hasResults = savedFoods.length > 0 || offItems.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Buscar alimento..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="max-h-64 overflow-hidden rounded-lg border">
        <div className="flex max-h-64 flex-col overflow-y-auto">
          {savedFoods.map((food) => (
            <FoodResultRow
              key={food.id}
              name={food.name}
              brand={food.brand ?? undefined}
              values={food}
              onSelect={() => onSelect({ kind: "existing", foodId: food.id, food })}
            />
          ))}
          {offLoading && (
            <p className="p-2 text-sm text-muted-foreground">Buscando en Open Food Facts...</p>
          )}
          {!offLoading && offNote && <p className="p-2 text-sm text-muted-foreground">{offNote}</p>}
          {!offLoading &&
            offItems.map((result) => (
              <FoodResultRow
                key={result.externalId}
                name={result.name}
                brand={result.brand}
                values={result}
                onSelect={() => onSelect({ kind: "OFF", result })}
              />
            ))}
          {!offLoading && !hasResults && (
            <p className="p-2 text-sm text-muted-foreground">Sin resultados.</p>
          )}
        </div>
      </div>
      {onNavigate && (
        <Link
          href="/foods"
          onClick={onNavigate}
          className="text-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Gestionar mis alimentos guardados
        </Link>
      )}
    </div>
  );
}

export function BarcodePickerTab({ onSelect }: { onSelect: (pick: FoodPick) => void }) {
  const [scanning, setScanning] = useState(true);
  const [pending, startTransition] = useTransition();
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDetected(code: string) {
    setScanning(false);
    setNotFound(false);
    setError(null);
    startTransition(async () => {
      const lookup = await lookupBarcodeAction(code.trim());
      if (lookup.status === "found") {
        onSelect({ kind: "OFF", result: lookup.result });
      } else if (lookup.status === "not_found") {
        setNotFound(true);
      } else {
        setError(lookup.message);
      }
    });
  }

  function rescan() {
    setNotFound(false);
    setError(null);
    setScanning(true);
  }

  return (
    <div className="flex flex-col gap-2">
      {scanning ? (
        <BarcodeCameraScanner
          onDetected={handleDetected}
          onCancel={() => setScanning(false)}
          onError={(message) => {
            setScanning(false);
            setError(message);
          }}
        />
      ) : (
        <>
          {pending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Buscando...
            </p>
          )}
          {!pending && notFound && (
            <p className="text-sm text-muted-foreground">
              No se encontró en Open Food Facts. Puedes cargarlo en la pestaña &quot;Manual&quot;.
            </p>
          )}
          {!pending && error && <p className="text-sm text-destructive">{error}</p>}
          {!pending && (
            <Button type="button" variant="outline" onClick={rescan}>
              <Camera className="size-4" />
              Escanear otro código
            </Button>
          )}
        </>
      )}
    </div>
  );
}

const MANUAL_FIELDS = ["calories", "protein", "carbs", "fat"] as const;
const MANUAL_LABELS: Record<(typeof MANUAL_FIELDS)[number], string> = {
  calories: "Calorías (kcal)",
  protein: "Proteína (g)",
  carbs: "Carbohidratos (g)",
  fat: "Grasa (g)",
};

export function ManualPickerTab({
  pending,
  submitLabel = "Crear y agregar",
  gramsLabel = "Cantidad a agregar (g)",
  onSubmit,
}: {
  pending: boolean;
  submitLabel?: string;
  gramsLabel?: string;
  onSubmit: (input: ManualFoodInput, grams: number) => void;
}) {
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [grams, setGrams] = useState("100");

  const canSubmit =
    name.trim().length > 0 &&
    MANUAL_FIELDS.every((field) => values[field]?.trim()) &&
    Number(grams) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(
      {
        name: name.trim(),
        calories: Number(values.calories),
        protein: Number(values.protein),
        carbs: Number(values.carbs),
        fat: Number(values.fat),
      },
      Number(grams),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="picker-manual-name">Nombre</Label>
        <Input id="picker-manual-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {MANUAL_FIELDS.map((field) => (
        <div key={field} className="flex flex-col gap-1.5">
          <Label htmlFor={`picker-manual-${field}`}>{MANUAL_LABELS[field]}</Label>
          <Input
            id={`picker-manual-${field}`}
            type="number"
            step="any"
            value={values[field] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="picker-manual-grams">{gramsLabel}</Label>
        <Input
          id="picker-manual-grams"
          type="number"
          step="any"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={!canSubmit || pending}>
        {pending && <Spinner className="size-4" />}
        {pending ? "Guardando" : submitLabel}
      </Button>
    </form>
  );
}
