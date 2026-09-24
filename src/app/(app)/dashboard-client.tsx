"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Coffee,
  Cookie,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { TabIconBadge, type TabTint } from "@/components/ui/floating-tab-bar";
import { MACRO_PERCENT_SEGMENTS } from "./foods/nutrition-facts";
import {
  deleteLogEntryAction,
  getDaySummaryAction,
  updateLogEntryMealTypeAction,
  updateLogEntryQuantityAction,
  type DaySummary,
  type LogEntryDisplay,
} from "@/lib/nutrition/actions";
import {
  getWeekDates,
  getWeekStartKey,
  parseDateKey,
  shiftDateKey,
  todayDateKey,
} from "@/lib/nutrition/date";
import type { MealType } from "@/generated/prisma/client";
import { MealFoodPicker } from "./meal-food-picker";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

const MEAL_META: Record<MealType, { label: string; icon: typeof Coffee; tint: TabTint }> = {
  BREAKFAST: { label: "Desayuno", icon: Coffee, tint: "amber" },
  LUNCH: { label: "Almuerzo", icon: Sun, tint: "emerald" },
  DINNER: { label: "Cena", icon: Moon, tint: "violet" },
  SNACK: { label: "Snack", icon: Cookie, tint: "rose" },
};

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
};

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const WEEKDAY_FULL_LABELS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatDateKeyLong(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const weekday = WEEKDAY_FULL_LABELS[date.getUTCDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getUTCDate()} de ${MONTH_LABELS[date.getUTCMonth()]}`;
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

const MACRO_TOTAL_ROWS = [
  { key: "protein", label: "Proteína" },
  { key: "carbs", label: "Carbohidratos" },
  { key: "fat", label: "Grasa" },
] as const;

function DayTotals({ dateKey, summary }: { dateKey: string; summary: DaySummary }) {
  const caloriesConsumed = round(summary.totals.calories);
  const caloriesGoal = summary.goal?.calories;
  const caloriesOver = caloriesGoal !== undefined && caloriesConsumed > caloriesGoal;
  const caloriesPct = caloriesGoal ? Math.min(100, (caloriesConsumed / caloriesGoal) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{formatDateKeyLong(dateKey)}</p>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl",
              caloriesOver && "text-destructive",
            )}
          >
            {caloriesConsumed}
          </span>
          <span className="text-sm text-muted-foreground">
            {caloriesGoal !== undefined ? `/ ${caloriesGoal} kcal` : "kcal hoy"}
          </span>
        </div>
        {caloriesGoal !== undefined && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                caloriesOver ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${caloriesPct}%` }}
            />
          </div>
        )}
        {!summary.goal && (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no definiste una meta.{" "}
            <Link href="/settings/nutrition" className="underline">
              Definirla
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {MACRO_TOTAL_ROWS.map(({ key, label }) => {
          const segment = MACRO_PERCENT_SEGMENTS.find((s) => s.key === key)!;
          const consumed = round(summary.totals[key]);
          const goal = summary.goal?.[key];
          const isOver = goal !== undefined && consumed > goal;
          const pct = goal ? Math.min(100, (consumed / goal) * 100) : 0;
          return (
            <div key={key} className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-xs text-muted-foreground">{label}</span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  isOver ? "text-destructive" : segment.textClass,
                )}
              >
                {consumed}
                {goal !== undefined ? `/${goal}` : ""} g
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                {goal !== undefined && (
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isOver ? "bg-destructive" : segment.barClass,
                    )}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type QuantityUnit = "grams" | "serving";

const CLICK_MOVE_THRESHOLD = 6;
const SWIPE_START_THRESHOLD = 10;
const SWIPE_MAX = 96;
const SWIPE_DELETE_THRESHOLD = 64;

type PointerTrack = {
  pointerId: number;
  startX: number;
  startY: number;
  isTouch: boolean;
  swiping: boolean;
};

function EntryRow({
  entry,
  mealType,
  onChanged,
}: {
  entry: LogEntryDisplay;
  mealType: MealType;
  onChanged: () => void;
}) {
  const isRecipe = Boolean(entry.recipe);
  const name = entry.food?.name ?? entry.recipe?.name ?? "";
  const displayUnit = isRecipe ? "porciones" : "g";
  const servingSize = entry.food?.servingSize ?? undefined;
  const servingLabel = entry.food?.servingLabel ?? undefined;
  const hasServing = !isRecipe && servingSize !== undefined;

  const [editing, setEditing] = useState(false);
  const [unit, setUnit] = useState<QuantityUnit>("grams");
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const trackRef = useRef<PointerTrack | null>(null);
  const movedRef = useRef(false);

  const calories = round(entry.calories);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entry.id,
    data: { mealType },
    disabled: editing,
  });

  function startEditing() {
    setUnit("grams");
    setQuantity(String(entry.quantity));
    setEditing(true);
  }

  function handleUnitChange(next: QuantityUnit) {
    setUnit(next);
    if (next === "serving" && servingSize) {
      setQuantity(String(round(entry.quantity / servingSize)));
    } else {
      setQuantity(String(entry.quantity));
    }
  }

  function save() {
    const value = Number(quantity);
    if (!value || value <= 0) return;
    const grams = !isRecipe && unit === "serving" ? value * (servingSize ?? 0) : value;
    setError(null);
    startTransition(async () => {
      const outcome = await updateLogEntryQuantityAction(entry.id, grams);
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
        setSwipeX(0);
        setError(outcome.message);
      }
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    movedRef.current = false;
    if (!editing) {
      trackRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        isTouch: e.pointerType === "touch",
        swiping: false,
      };
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const track = trackRef.current;
    if (!track || track.pointerId !== e.pointerId) return;
    const dx = e.clientX - track.startX;
    const dy = e.clientY - track.startY;

    if (Math.abs(dx) > CLICK_MOVE_THRESHOLD || Math.abs(dy) > CLICK_MOVE_THRESHOLD) {
      movedRef.current = true;
    }

    if (!track.isTouch || isDragging) return;

    if (!track.swiping) {
      if (Math.abs(dx) < SWIPE_START_THRESHOLD && Math.abs(dy) < SWIPE_START_THRESHOLD) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        trackRef.current = null;
        return;
      }
      track.swiping = true;
    }

    setSwipeX(Math.max(-SWIPE_MAX, Math.min(0, dx)));
  }

  function handlePointerUp(e: React.PointerEvent) {
    const track = trackRef.current;
    trackRef.current = null;
    if (track?.pointerId !== e.pointerId) return;
    if (track.swiping) {
      if (swipeX <= -SWIPE_DELETE_THRESHOLD) {
        remove();
      } else {
        setSwipeX(0);
      }
    }
  }

  function handlePointerCancel() {
    trackRef.current = null;
    setSwipeX(0);
  }

  function handleClick() {
    if (editing || movedRef.current) {
      movedRef.current = false;
      return;
    }
    startEditing();
  }

  return (
    <div className="group relative overflow-hidden">
      <div className="absolute inset-0 z-0 flex items-center justify-end bg-destructive px-4 text-destructive-foreground">
        <Trash2 className="size-4" />
      </div>
      <div
        ref={setNodeRef}
        {...attributes}
        role={undefined}
        {...listeners}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
        style={swipeX ? { transform: `translateX(${swipeX}px)` } : undefined}
        className={cn(
          "relative z-10 flex touch-none items-start gap-1 bg-card py-2.5 select-none group-first:pt-0 group-last:pb-0",
          !editing && "cursor-pointer",
          isDragging && "opacity-40",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate">{name}</p>
              {!editing && (
                <p className="text-muted-foreground">
                  {entry.quantity} {displayUnit} · {calories} kcal
                </p>
              )}
            </div>
            {editing && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation();
                  save();
                }}
              >
                Guardar
              </Button>
            )}
          </div>
          {editing && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-7 w-20"
                type="number"
                step="any"
                value={quantity}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {isRecipe ? (
                <span className="text-xs text-muted-foreground">porciones</span>
              ) : hasServing ? (
                <SegmentedToggle
                  options={[
                    { value: "grams", label: "gramos" },
                    { value: "serving", label: servingLabel ?? "porción" },
                  ]}
                  value={unit}
                  onChange={handleUnitChange}
                />
              ) : (
                <span className="text-xs text-muted-foreground">g</span>
              )}
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Eliminar ${name}`}
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            remove();
          }}
          className="hidden shrink-0 sm:inline-flex"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function MealSection({
  mealType,
  entries,
  onAdd,
  onChanged,
}: {
  mealType: MealType;
  entries: LogEntryDisplay[];
  onAdd: () => void;
  onChanged: () => void;
}) {
  const meta = MEAL_META[mealType];
  const { setNodeRef, isOver } = useDroppable({ id: mealType });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors sm:p-5",
        isOver && "border-primary ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TabIconBadge tint={meta.tint} icon={meta.icon} className="size-9" />
          <h3 className="font-medium">{meta.label}</h3>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={`Agregar a ${meta.label}`}
          onClick={onAdd}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {entries.length ? (
        <div className="flex flex-col divide-y divide-border">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} mealType={mealType} onChanged={onChanged} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {isOver ? "Soltar aquí" : "Sin entradas."}
        </p>
      )}
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

function DashboardSkeleton() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-11 w-40" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardClient() {
  const [dateKey, setDateKey] = useState(todayDateKey());
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [openMealType, setOpenMealType] = useState<MealType | null>(null);
  const [activeEntry, setActiveEntry] = useState<LogEntryDisplay | null>(null);
  const [pending, startTransition] = useTransition();
  const dayRequestRef = useRef(0);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const weekStartKey = getWeekStartKey(dateKey);

  function refreshDay() {
    const requestId = ++dayRequestRef.current;
    startTransition(async () => {
      const result = await getDaySummaryAction(dateKey);
      if (dayRequestRef.current === requestId) {
        setSummary(result);
      }
    });
  }

  useEffect(() => {
    refreshDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  if (!summary) {
    return <DashboardSkeleton />;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const entry = MEAL_TYPES.flatMap((mt) => summary!.entriesByMeal[mt]).find((e) => e.id === id);
    setActiveEntry(entry ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveEntry(null);
    if (!over) return;
    const fromMealType = active.data.current?.mealType as MealType | undefined;
    const toMealType = over.id as MealType;
    if (!fromMealType || fromMealType === toMealType) return;
    startTransition(async () => {
      const outcome = await updateLogEntryMealTypeAction(active.id as string, toMealType);
      if (outcome.ok) refreshDay();
    });
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <WeekStrip
        weekStartKey={weekStartKey}
        selectedDateKey={dateKey}
        onSelect={setDateKey}
        onShiftWeek={(weeks) => setDateKey((d) => shiftDateKey(d, weeks * 7))}
      />

      <DayTotals dateKey={dateKey} summary={summary} />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveEntry(null)}
      >
        <div className="flex flex-col gap-3">
          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={summary.entriesByMeal[mealType]}
              onAdd={() => setOpenMealType(mealType)}
              onChanged={refreshDay}
            />
          ))}
        </div>
        <DragOverlay>
          {activeEntry ? (
            <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
              {activeEntry.food?.name ?? activeEntry.recipe?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className="text-center text-xs text-muted-foreground">
        Arrastra un registro para moverlo a otra comida, tócalo para editarlo o deslízalo hacia la
        izquierda para eliminarlo.
      </p>

      {openMealType && (
        <MealFoodPicker
          open
          onOpenChange={(next) => {
            if (!next) setOpenMealType(null);
          }}
          mealLabel={MEAL_LABELS[openMealType]}
          mealType={openMealType}
          dateKey={dateKey}
          onAdded={refreshDay}
        />
      )}

      {pending && <p className="text-center text-xs text-muted-foreground">Actualizando...</p>}
    </div>
  );
}
