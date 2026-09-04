"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createManualFoodAction,
  lookupBarcodeAction,
  saveOffFoodAction,
  saveUsdaFoodAction,
  searchFoodsAction,
  type ExternalFoodResult,
  type SearchFoodsResult,
} from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import { FoodResultCard } from "./food-result-card";

const SEARCH_DEBOUNCE_MS = 800;

function BarcodeTab() {
  const [barcode, setBarcode] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ExternalFoodResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    setResult(null);
    setNotFound(false);
    startTransition(async () => {
      const lookup = await lookupBarcodeAction(barcode.trim());
      if (lookup.found) {
        setResult(lookup.result);
      } else {
        setNotFound(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Código de barras"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {notFound && (
        <p className="text-sm text-muted-foreground">
          No se encontró en Open Food Facts. Podés cargarlo en la pestaña &quot;Alta
          manual&quot;.
        </p>
      )}

      {result && (
        <FoodResultCard result={result} source="OFF" onSave={() => saveOffFoodAction(result)} />
      )}
    </div>
  );
}

function SearchResultsColumn({
  title,
  source,
  state,
}: {
  title: string;
  source: "OFF" | "USDA";
  state: SearchFoodsResult["off"] | undefined;
}) {
  if (!state) return null;

  if (!state.ok) {
    return (
      <div className="flex-1">
        <h3 className="mb-2 text-sm font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Esta fuente no está disponible en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {state.results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {state.results.map((result) => (
            <FoodResultCard
              key={result.externalId}
              result={result}
              source={source}
              onSave={() =>
                source === "OFF" ? saveOffFoodAction(result) : saveUsdaFoodAction(result)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchTab() {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<SearchFoodsResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(term: string) {
    if (!term.trim()) return;
    startTransition(async () => {
      const searchResults = await searchFoodsAction(term.trim());
      setResults(searchResults);
    });
  }

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Nombre del alimento"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {results && (
        <div className="flex flex-col gap-6 sm:flex-row">
          <SearchResultsColumn title="Open Food Facts" source="OFF" state={results.off} />
          <SearchResultsColumn title="USDA FoodData Central" source="USDA" state={results.usda} />
        </div>
      )}
    </div>
  );
}

const MANUAL_REQUIRED_FIELDS = ["calories", "protein", "carbs", "fat"] as const;
const MANUAL_OPTIONAL_FIELDS = ["fiber", "sugar", "saturatedFat", "sodium"] as const;

const MANUAL_FIELD_LABELS: Record<
  (typeof MANUAL_REQUIRED_FIELDS)[number] | (typeof MANUAL_OPTIONAL_FIELDS)[number],
  string
> = {
  calories: "Calorías (kcal)",
  protein: "Proteína (g)",
  carbs: "Carbohidratos (g)",
  fat: "Grasa (g)",
  fiber: "Fibra (g)",
  sugar: "Azúcares (g)",
  saturatedFat: "Grasa saturada (g)",
  sodium: "Sodio (mg)",
};

function ManualTab() {
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    MANUAL_REQUIRED_FIELDS.every((field) => values[field]?.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const input: ManualFoodInput = {
      name: name.trim(),
      calories: Number(values.calories),
      protein: Number(values.protein),
      carbs: Number(values.carbs),
      fat: Number(values.fat),
      ...(values.fiber?.trim() ? { fiber: Number(values.fiber) } : {}),
      ...(values.sugar?.trim() ? { sugar: Number(values.sugar) } : {}),
      ...(values.saturatedFat?.trim()
        ? { saturatedFat: Number(values.saturatedFat) }
        : {}),
      ...(values.sodium?.trim() ? { sodium: Number(values.sodium) } : {}),
    };

    startTransition(async () => {
      await createManualFoodAction(input);
      setSaved(true);
    });
  }

  if (saved) {
    return <p className="text-sm text-muted-foreground">Alimento guardado.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manual-name">Nombre</Label>
        <Input
          id="manual-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {[...MANUAL_REQUIRED_FIELDS, ...MANUAL_OPTIONAL_FIELDS].map((field) => (
        <div key={field} className="flex flex-col gap-1.5">
          <Label htmlFor={`manual-${field}`}>
            {MANUAL_FIELD_LABELS[field]}
            {!MANUAL_REQUIRED_FIELDS.includes(
              field as (typeof MANUAL_REQUIRED_FIELDS)[number],
            ) && <span className="text-muted-foreground"> (opcional)</span>}
          </Label>
          <Input
            id={`manual-${field}`}
            type="number"
            step="any"
            value={values[field] ?? ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [field]: e.target.value }))
            }
          />
        </div>
      ))}

      <Button type="submit" disabled={!canSubmit || pending}>
        {pending ? "Guardando..." : "Guardar alimento"}
      </Button>
    </form>
  );
}

export function FoodsClient() {
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Buscar y agregar alimentos</CardTitle>
        <CardDescription>
          Por código de barras, por nombre, o cargado a mano.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="barcode">
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList>
              <TabsTrigger value="barcode">Código de barras</TabsTrigger>
              <TabsTrigger value="search">Buscar por nombre</TabsTrigger>
              <TabsTrigger value="manual">Alta manual</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="barcode">
            <BarcodeTab />
          </TabsContent>
          <TabsContent value="search">
            <SearchTab />
          </TabsContent>
          <TabsContent value="manual">
            <ManualTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
