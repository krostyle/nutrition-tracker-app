"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Barcode, Bookmark, Search, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TabIconBadge,
  floatingTabLabelClass,
  floatingTabListClass,
  floatingTabTriggerClass,
} from "@/components/ui/floating-tab-bar";
import {
  createManualFoodAction,
  listFoodsAction,
  lookupBarcodeAction,
  saveOffFoodAction,
  saveUsdaFoodAction,
  searchFoodsAction,
  type ExternalFoodResult,
  type SearchFoodsResult,
} from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import { searchLocalFoodsAction } from "@/lib/nutrition/actions";
import type { Food } from "@/generated/prisma/client";
import { FoodResultCard } from "./food-result-card";
import { SavedFoodCard } from "./saved-food-card";

const SEARCH_DEBOUNCE_MS = 800;
const MIN_QUERY_LENGTH = 3;

function BarcodeTab() {
  const [barcode, setBarcode] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ExternalFoodResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    setResult(null);
    setNotFound(false);
    setError(null);
    startTransition(async () => {
      const lookup = await lookupBarcodeAction(barcode.trim());
      if (lookup.status === "found") {
        setResult(lookup.result);
      } else if (lookup.status === "not_found") {
        setNotFound(true);
      } else {
        setError(lookup.message);
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
          No se encontró en Open Food Facts. Podés cargarlo en la pestaña
          &quot;Manual&quot;.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {pending && <FoodCardSkeleton />}
      {!pending && result && (
        <FoodResultCard result={result} source="OFF" onSave={() => saveOffFoodAction(result)} />
      )}
    </div>
  );
}

const SOURCE_LABELS: Record<"OFF" | "USDA", string> = {
  OFF: "Open Food Facts",
  USDA: "USDA FoodData Central",
};

function MergedSearchResults({ results }: { results: SearchFoodsResult }) {
  const unavailable: ("OFF" | "USDA")[] = [];
  const items: { result: ExternalFoodResult; source: "OFF" | "USDA" }[] = [];

  (["OFF", "USDA"] as const).forEach((source) => {
    const state = results[source === "OFF" ? "off" : "usda"];
    if (!state.ok) {
      unavailable.push(source);
      return;
    }
    items.push(...state.results.map((result) => ({ result, source })));
  });

  return (
    <div className="flex flex-col gap-3">
      {unavailable.map((source) => (
        <p key={source} className="text-sm text-muted-foreground">
          {SOURCE_LABELS[source]} no está disponible en este momento.
        </p>
      ))}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        items.map(({ result, source }) => (
          <FoodResultCard
            key={`${source}-${result.externalId}`}
            result={result}
            source={source}
            onSave={() =>
              source === "OFF" ? saveOffFoodAction(result) : saveUsdaFoodAction(result)
            }
          />
        ))
      )}
    </div>
  );
}

function FoodCardSkeleton() {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-12 shrink-0" />
      </div>
      <Skeleton className="mt-3 h-7 w-20" />
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SearchTab() {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<SearchFoodsResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(term: string) {
    if (term.trim().length < MIN_QUERY_LENGTH) return;
    startTransition(async () => {
      const searchResults = await searchFoodsAction(term.trim());
      setResults(searchResults);
    });
  }

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      return;
    }
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

  const tooShort = query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH;

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

      {tooShort && (
        <p className="text-sm text-muted-foreground">Escribí al menos 3 caracteres.</p>
      )}

      {!tooShort && pending && <SearchResultsSkeleton />}
      {!tooShort && !pending && results && <MergedSearchResults results={results} />}
    </div>
  );
}

const MY_FOODS_DEBOUNCE_MS = 400;

function MyFoodsTab() {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load(term: string) {
    const trimmed = term.trim();
    const promise =
      trimmed.length >= MIN_QUERY_LENGTH ? searchLocalFoodsAction(trimmed) : listFoodsAction();
    promise.then(setFoods);
  }

  useEffect(() => {
    load("");
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value), MY_FOODS_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar en mis alimentos guardados..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      {foods === null ? (
        <SearchResultsSkeleton />
      ) : foods.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query.trim() ? "Sin resultados." : "Todavía no guardaste ningún alimento."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {foods.map((food) => (
            <SavedFoodCard key={food.id} food={food} />
          ))}
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
  const [error, setError] = useState<string | null>(null);

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
      ...(values.servingSize?.trim()
        ? { servingSize: Number(values.servingSize) }
        : {}),
      ...(values.servingLabel?.trim() ? { servingLabel: values.servingLabel.trim() } : {}),
    };

    setError(null);
    startTransition(async () => {
      const outcome = await createManualFoodAction(input);
      if (outcome.ok) {
        setSaved(true);
      } else {
        setError(outcome.message);
      }
    });
  }

  if (saved) {
    return <p className="text-sm text-muted-foreground">Alimento guardado.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manual-servingSize">
          Porción recomendada en gramos{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="manual-servingSize"
          type="number"
          step="any"
          value={values.servingSize ?? ""}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, servingSize: e.target.value }))
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manual-servingLabel">
          Descripción de la porción{" "}
          <span className="text-muted-foreground">(opcional, ej. &quot;1 taza&quot;)</span>
        </Label>
        <Input
          id="manual-servingLabel"
          value={values.servingLabel ?? ""}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, servingLabel: e.target.value }))
          }
        />
      </div>

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
          <div className="hidden sm:block">
            <TabsList className="w-full">
              <TabsTrigger value="barcode">Escanear</TabsTrigger>
              <TabsTrigger value="search">Buscar</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="mine">Guardados</TabsTrigger>
            </TabsList>
          </div>

          <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 sm:hidden">
            <TabsList
              className={cn(
                floatingTabListClass,
                "w-full max-w-sm border border-border/50 bg-popover shadow-lg ring-1 ring-foreground/10",
              )}
            >
              <TabsTrigger value="barcode" className={floatingTabTriggerClass}>
                <TabIconBadge tint="emerald" icon={Barcode} />
                <span className={floatingTabLabelClass}>Escanear</span>
              </TabsTrigger>
              <TabsTrigger value="search" className={floatingTabTriggerClass}>
                <TabIconBadge tint="blue" icon={Search} />
                <span className={floatingTabLabelClass}>Buscar</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className={floatingTabTriggerClass}>
                <TabIconBadge tint="violet" icon={SquarePen} />
                <span className={floatingTabLabelClass}>Manual</span>
              </TabsTrigger>
              <TabsTrigger value="mine" className={floatingTabTriggerClass}>
                <TabIconBadge tint="amber" icon={Bookmark} />
                <span className={floatingTabLabelClass}>Guardados</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="barcode" className="pb-28 sm:pb-0">
            <BarcodeTab />
          </TabsContent>
          <TabsContent value="search" className="pb-28 sm:pb-0">
            <SearchTab />
          </TabsContent>
          <TabsContent value="manual" className="pb-28 sm:pb-0">
            <ManualTab />
          </TabsContent>
          <TabsContent value="mine" className="pb-28 sm:pb-0">
            <MyFoodsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
