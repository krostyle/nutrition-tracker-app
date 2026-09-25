"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Barcode, Camera, Search, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeCameraScanner } from "@/components/barcode-camera-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
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
  saveExternalFoodAction,
  searchFoodsAction,
  type ExternalFoodResult,
  type SourceSearchResult,
} from "@/lib/food-sources/actions";
import type { ManualFoodInput } from "@/lib/food-sources/persist";
import { searchLocalFoodsAction } from "@/lib/nutrition/actions";
import type { Food } from "@/generated/prisma/client";
import { FoodResultCard } from "./food-result-card";
import { SavedFoodCard } from "./saved-food-card";

const SEARCH_DEBOUNCE_MS = 800;
const MIN_QUERY_LENGTH = 3;

function BarcodeTab() {
  const [scanning, setScanning] = useState(true);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ExternalFoodResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDetected(code: string) {
    setScanning(false);
    setResult(null);
    setNotFound(false);
    setError(null);
    startTransition(async () => {
      const lookup = await lookupBarcodeAction(code.trim());
      if (lookup.status === "found") {
        setResult(lookup.result);
      } else if (lookup.status === "not_found") {
        setNotFound(true);
      } else {
        setError(lookup.message);
      }
    });
  }

  function rescan() {
    setResult(null);
    setNotFound(false);
    setError(null);
    setScanning(true);
  }

  return (
    <div className="flex flex-col gap-4">
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
          {pending && <FoodCardSkeleton />}
          {!pending && notFound && (
            <p className="text-sm text-muted-foreground">
              No se encontró en Open Food Facts. Puedes cargarlo en la pestaña
              &quot;Manual&quot;.
            </p>
          )}
          {!pending && error && <p className="text-sm text-destructive">{error}</p>}
          {!pending && result && (
            <FoodResultCard
              key={result.externalId}
              result={result}
              onSave={() => saveExternalFoodAction(result)}
              defaultOpen
            />
          )}
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

function MergedSearchResults({ results }: { results: SourceSearchResult }) {
  if (!results.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Open Food Facts no está disponible en este momento.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {results.results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        results.results.map((result) => (
          <FoodResultCard
            key={result.externalId}
            result={result}
            onSave={() => saveExternalFoodAction(result)}
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

function UnifiedFoodsTab() {
  const [query, setQuery] = useState("");
  const [savedFoods, setSavedFoods] = useState<Food[] | null>(null);
  const [externalResults, setExternalResults] = useState<SourceSearchResult | null>(null);
  const [externalPending, startExternalTransition] = useTransition();
  const localDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const externalDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function loadLocal(term: string) {
    const trimmed = term.trim();
    const promise = trimmed ? searchLocalFoodsAction(trimmed) : listFoodsAction();
    promise.then(setSavedFoods);
  }

  function runExternalSearch(term: string) {
    startExternalTransition(async () => {
      const results = await searchFoodsAction(term.trim());
      setExternalResults(results);
    });
  }

  useEffect(() => {
    loadLocal("");
  }, []);

  function handleChange(value: string) {
    setQuery(value);

    if (localDebounceRef.current) clearTimeout(localDebounceRef.current);
    localDebounceRef.current = setTimeout(() => loadLocal(value), MY_FOODS_DEBOUNCE_MS);

    if (externalDebounceRef.current) clearTimeout(externalDebounceRef.current);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setExternalResults(null);
      return;
    }
    externalDebounceRef.current = setTimeout(() => runExternalSearch(value), SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (localDebounceRef.current) clearTimeout(localDebounceRef.current);
      if (externalDebounceRef.current) clearTimeout(externalDebounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar alimentos..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      {savedFoods === null ? (
        <SearchResultsSkeleton />
      ) : (
        <div className="flex flex-col gap-3">
          {savedFoods.map((food) => (
            <SavedFoodCard key={food.id} food={food} />
          ))}
          {externalPending && <SearchResultsSkeleton />}
          {!externalPending && externalResults && (
            <MergedSearchResults results={externalResults} />
          )}
          {!externalPending && !externalResults && savedFoods.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {query.trim() ? "Sin resultados." : "Todavía no guardaste ningún alimento."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const MY_FOODS_DEBOUNCE_MS = 400;

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
        {pending && <Spinner className="size-4" />}
        {pending ? "Guardando" : "Guardar alimento"}
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
        <Tabs defaultValue="search">
          <div className="hidden sm:block">
            <TabsList className="w-full">
              <TabsTrigger value="search">Buscar</TabsTrigger>
              <TabsTrigger value="barcode">Escanear</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
          </div>

          <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 sm:hidden">
            <TabsList
              className={cn(
                floatingTabListClass,
                "w-full max-w-sm border border-border/50 bg-popover shadow-lg ring-1 ring-foreground/10",
              )}
            >
              <TabsTrigger value="search" className={floatingTabTriggerClass}>
                <TabIconBadge tint="blue" icon={Search} />
                <span className={floatingTabLabelClass}>Buscar</span>
              </TabsTrigger>
              <TabsTrigger value="barcode" className={floatingTabTriggerClass}>
                <TabIconBadge tint="emerald" icon={Barcode} />
                <span className={floatingTabLabelClass}>Escanear</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className={floatingTabTriggerClass}>
                <TabIconBadge tint="violet" icon={SquarePen} />
                <span className={floatingTabLabelClass}>Manual</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="search" className="pb-28 sm:pb-0">
            <UnifiedFoodsTab />
          </TabsContent>
          <TabsContent value="barcode" className="pb-28 sm:pb-0">
            <BarcodeTab />
          </TabsContent>
          <TabsContent value="manual" className="pb-28 sm:pb-0">
            <ManualTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
