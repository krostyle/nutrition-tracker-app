"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Calculator, Flag, Ruler, Target, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MacroHero, type MacroHeroValues } from "../../foods/nutrition-facts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TabIconBadge,
  floatingTabLabelClass,
  floatingTabListClass,
  floatingTabTriggerClass,
} from "@/components/ui/floating-tab-bar";
import {
  getEnabledMealTypesAction,
  getGoalAction,
  saveEnabledMealTypesAction,
} from "@/lib/nutrition/actions";
import { todayDateKey } from "@/lib/nutrition/date";
import {
  applyRecommendationAsGoalAction,
  createMeasurementAction,
  getProfileAction,
  getRecommendationAction,
  listMeasurementsAction,
  saveProfileAction,
  type RecommendationResult,
} from "@/lib/nutrition/profile-actions";
import type { BodyMeasurement, Goal, GoalType, MealType, Profile } from "@/generated/prisma/client";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

type GoalValues = MacroHeroValues;

function CurrentGoalPanel() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getGoalAction().then((g) => {
      setGoal(g);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-11 w-32" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no tienes una meta — aplica la recomendación en la pestaña &quot;Recomendación&quot;
        para definirla.
      </p>
    );
  }

  return (
    <MacroHero
      caption="kcal al día"
      calories={round(goal.calories)}
      protein={round(goal.protein)}
      carbs={round(goal.carbs)}
      fat={round(goal.fat)}
    />
  );
}

function RecommendationTab({ onApplied }: { onApplied: () => void }) {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [currentGoal, setCurrentGoal] = useState<GoalValues | null>(null);
  const [goalLoaded, setGoalLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecommendationAction().then(setResult);
    getGoalAction().then((g) => {
      setCurrentGoal(g ? { calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat } : null);
      setGoalLoaded(true);
    });
  }, []);

  if (!result || !goalLoaded) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (result.status === "missing_profile") {
    return (
      <p className="text-sm text-muted-foreground">
        Completa{" "}
        <Link href="/settings/profile" className="underline">
          Mis datos
        </Link>{" "}
        para ver una recomendación.
      </p>
    );
  }

  if (result.status === "missing_measurement") {
    return (
      <p className="text-sm text-muted-foreground">
        Carga al menos una medición en &quot;Progreso&quot; para ver una recomendación.
      </p>
    );
  }

  const r = result.recommendation;
  const recommended: GoalValues = {
    calories: round(r.calories),
    protein: round(r.protein),
    carbs: round(r.carbs),
    fat: round(r.fat),
  };
  const alreadyApplied =
    currentGoal !== null &&
    currentGoal.calories === recommended.calories &&
    currentGoal.protein === recommended.protein &&
    currentGoal.carbs === recommended.carbs &&
    currentGoal.fat === recommended.fat;

  function apply() {
    setError(null);
    startTransition(async () => {
      const outcome = await applyRecommendationAsGoalAction(recommended);
      if (outcome.ok) {
        setCurrentGoal(recommended);
        onApplied();
      } else {
        setError(outcome.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:rounded-xl sm:border sm:bg-card sm:p-5 sm:shadow-sm">
        <MacroHero caption="kcal al día" {...recommended} />
        <p className="text-sm text-muted-foreground">
          {round(r.bmr)} kcal en reposo (BMR) · {round(r.tdee)} kcal con tu actividad (TDEE) ·{" "}
          {round(r.bodyFatPercent)}% de grasa corporal estimada
        </p>
        {alreadyApplied ? (
          <p className="text-sm text-muted-foreground">Esta es tu meta actual.</p>
        ) : (
          <Button disabled={pending} onClick={apply} className="self-start">
            {pending && <Spinner className="size-4" />}
            {pending ? "Aplicando" : "Aplicar como meta"}
          </Button>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <h3 className="text-sm font-medium">Cómo se calcula</h3>
        <ol className="flex flex-col gap-3.5 text-sm text-muted-foreground">
          <li>
            <p className="font-medium text-foreground">1. Metabolismo basal (BMR)</p>
            <p>
              Fórmula de Mifflin-St Jeor, la más usada para estimar cuántas calorías quema tu
              cuerpo en reposo a partir de tu peso, estatura, edad y sexo.
            </p>
          </li>
          <li>
            <p className="font-medium text-foreground">2. Gasto total (TDEE)</p>
            <p>
              Tu metabolismo basal multiplicado por un factor según tu nivel de actividad (de 1.2
              si eres sedentario a 1.9 si eres muy activo).
            </p>
          </li>
          <li>
            <p className="font-medium text-foreground">3. Calorías objetivo</p>
            <p>
              Tu gasto total ajustado según tu objetivo: −500 kcal para bajar grasa, sin cambio
              para mantener, +300 kcal para subir músculo.
            </p>
          </li>
          <li>
            <p className="font-medium text-foreground">4. Proteína y grasa</p>
            <p>
              Se fijan en gramos por kilo de tu peso actual (2.0 g/kg de proteína, 0.8 g/kg de
              grasa) para cuidar tu masa muscular mientras cambias de peso.
            </p>
          </li>
          <li>
            <p className="font-medium text-foreground">5. Carbohidratos</p>
            <p>Lo que queda de las calorías objetivo después de restar proteína y grasa.</p>
          </li>
        </ol>
        <div className="border-t border-border pt-3.5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">% de grasa corporal</p>
          <p>
            Método Navy (EE.UU.): usa las circunferencias de cuello y cintura (más cadera en
            mujeres) junto a tu estatura — por eso se piden esas medidas en &quot;Progreso&quot;.
            Es solo referencial, no reemplaza una medición clínica.
          </p>
        </div>
      </div>
    </div>
  );
}

const GOAL_TYPE_OPTIONS = [
  { value: "LOSE_FAT", label: "Bajar grasa" },
  { value: "MAINTAIN", label: "Mantener" },
  { value: "GAIN_MUSCLE", label: "Subir músculo" },
] as const satisfies { value: GoalType; label: string }[];

function ObjectiveTab({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: () => void;
}) {
  const [goalType, setGoalType] = useState<GoalType>(profile?.goalType ?? "MAINTAIN");
  const [targetWeightKg, setTargetWeightKg] = useState(
    profile?.targetWeightKg != null ? String(profile.targetWeightKg) : "",
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    startTransition(async () => {
      const outcome = await saveProfileAction({
        sex: profile.sex,
        birthDate: profile.birthDate,
        heightCm: profile.heightCm,
        activityLevel: profile.activityLevel,
        goalType,
        targetWeightKg: targetWeightKg.trim() ? Number(targetWeightKg) : null,
      });
      if (outcome.ok) {
        setSaved(true);
        onSaved();
      } else {
        setError(outcome.message);
      }
    });
  }

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground">
        Completa primero{" "}
        <Link href="/settings/profile" className="underline">
          Mis datos
        </Link>{" "}
        para poder definir un objetivo.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label>Objetivo</Label>
        <SegmentedToggle
          options={GOAL_TYPE_OPTIONS}
          value={goalType}
          onChange={(v) => {
            setGoalType(v);
            setSaved(false);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="target-weight">
          Peso objetivo (kg) <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="target-weight"
          type="number"
          step="any"
          value={targetWeightKg}
          onChange={(e) => {
            setTargetWeightKg(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Spinner className="size-4" />}
        {pending ? "Guardando" : saved ? "Guardado" : "Guardar"}
      </Button>
    </form>
  );
}

function AddMeasurementDialog({
  open,
  onOpenChange,
  needsHip,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  needsHip: boolean;
  onAdded: () => void;
}) {
  const [weightKg, setWeightKg] = useState("");
  const [neckCm, setNeckCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    weightKg.trim() !== "" &&
    neckCm.trim() !== "" &&
    waistCm.trim() !== "" &&
    (!needsHip || hipCm.trim() !== "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const outcome = await createMeasurementAction({
        dateKey: todayDateKey(),
        weightKg: Number(weightKg),
        neckCm: Number(neckCm),
        waistCm: Number(waistCm),
        ...(needsHip ? { hipCm: Number(hipCm) } : {}),
      });
      if (!outcome.ok) {
        setError(outcome.message);
        return;
      }
      setWeightKg("");
      setNeckCm("");
      setWaistCm("");
      setHipCm("");
      onAdded();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva medición</DialogTitle>
          <DialogDescription>Se guarda con la fecha de hoy.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="measurement-weight">Peso (kg)</Label>
            <Input
              id="measurement-weight"
              type="number"
              step="any"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="measurement-neck">Cuello (cm)</Label>
            <Input
              id="measurement-neck"
              type="number"
              step="any"
              value={neckCm}
              onChange={(e) => setNeckCm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="measurement-waist">Cintura (cm)</Label>
            <Input
              id="measurement-waist"
              type="number"
              step="any"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
            />
          </div>
          {needsHip && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="measurement-hip">Cadera (cm)</Label>
              <Input
                id="measurement-hip"
                type="number"
                step="any"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" disabled={!canSubmit || pending}>
            {pending && <Spinner className="size-4" />}
            {pending ? "Guardando" : "Agregar medición"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MeasurementsTab({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: () => void;
}) {
  const [history, setHistory] = useState<BodyMeasurement[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const needsHip = profile?.sex === "FEMALE";

  function loadHistory() {
    listMeasurementsAction().then(setHistory);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function handleAdded() {
    loadHistory();
    onSaved();
    setDialogOpen(false);
  }

  const currentWeight = history?.[0]?.weightKg;
  const targetWeight = profile?.targetWeightKg ?? undefined;
  const showProgress = currentWeight != null && targetWeight != null;
  const diff = showProgress ? round(currentWeight - targetWeight) : 0;

  return (
    <div className="flex flex-col gap-6">
      {showProgress && (
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {currentWeight}
          </span>
          <span className="text-sm text-muted-foreground">
            kg ahora · meta {targetWeight} kg
            <br />
            {diff > 0
              ? `faltan ${Math.abs(diff)} kg para bajar`
              : diff < 0
                ? `faltan ${Math.abs(diff)} kg para subir`
                : "¡llegaste a tu peso objetivo!"}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Historial</h3>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            Agregar medición
          </Button>
        </div>

        {history === null ? (
          <Skeleton className="h-16 w-full" />
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no cargaste mediciones.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {history.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-0.5 py-2.5 text-sm first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium tabular-nums">
                  {new Date(m.date).toISOString().slice(0, 10)}
                </span>
                <span className="text-muted-foreground">
                  {m.weightKg}kg · cuello {m.neckCm}cm · cintura {m.waistCm}cm
                  {m.hipCm !== null ? ` · cadera ${m.hipCm}cm` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddMeasurementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        needsHip={needsHip}
        onAdded={handleAdded}
      />
    </div>
  );
}

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: "BREAKFAST", label: "Desayuno" },
  { value: "SNACK", label: "Snack 1" },
  { value: "LUNCH", label: "Almuerzo" },
  { value: "SNACK2", label: "Snack 2" },
  { value: "DINNER", label: "Cena" },
];

function MealsTab() {
  const [enabled, setEnabled] = useState<MealType[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEnabledMealTypesAction().then(setEnabled);
  }, []);

  function toggle(mealType: MealType, checked: boolean) {
    setEnabled((prev) => {
      if (!prev) return prev;
      return checked ? [...prev, mealType] : prev.filter((m) => m !== mealType);
    });
    setSaved(false);
  }

  function save() {
    if (!enabled) return;
    setError(null);
    startTransition(async () => {
      const outcome = await saveEnabledMealTypesAction(enabled);
      if (outcome.ok) {
        setEnabled(outcome.data);
        setSaved(true);
      } else {
        setError(outcome.message);
      }
    });
  }

  if (!enabled) {
    return <Skeleton className="h-56 w-full max-w-sm" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Elige qué comidas quieres registrar. Se muestran en el dashboard en este orden.
      </p>
      <div className="flex flex-col divide-y divide-border rounded-lg border">
        {MEAL_OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            htmlFor={`meal-${value}`}
            className="flex items-center justify-between gap-3 px-3 py-3 text-sm"
          >
            <span>{label}</span>
            <Switch
              id={`meal-${value}`}
              checked={enabled.includes(value)}
              onCheckedChange={(checked) => toggle(value, checked)}
            />
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button disabled={pending} onClick={save} className="self-start">
        {pending && <Spinner className="size-4" />}
        {pending ? "Guardando" : saved ? "Guardado" : "Guardar"}
      </Button>
    </div>
  );
}

export function NutritionClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [goalKey, setGoalKey] = useState(0);

  function loadProfile() {
    getProfileAction().then((p) => {
      setProfile(p);
      setProfileLoaded(true);
    });
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handleChanged() {
    loadProfile();
    setRefreshKey((k) => k + 1);
  }

  function handleGoalApplied() {
    setGoalKey((k) => k + 1);
  }

  return (
    <div className="w-full max-w-lg sm:rounded-xl sm:border sm:bg-card sm:p-6 sm:shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nutrición</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define tu objetivo y registra tu progreso para recibir una recomendación de calorías y
          macros.
        </p>
      </div>

      <Tabs defaultValue="meta">
        <div className="hidden sm:block">
          <TabsList className="w-full">
            <TabsTrigger value="meta">Meta diaria</TabsTrigger>
            <TabsTrigger value="recomendacion">Recomendación</TabsTrigger>
            <TabsTrigger value="objetivo">Objetivo</TabsTrigger>
            <TabsTrigger value="progreso">Progreso</TabsTrigger>
            <TabsTrigger value="comidas">Comidas</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="meta" className="pt-5 pb-28 sm:pb-0">
          <CurrentGoalPanel key={goalKey} />
        </TabsContent>
        <TabsContent value="recomendacion" className="pt-5 pb-28 sm:pb-0">
          <RecommendationTab key={refreshKey} onApplied={handleGoalApplied} />
        </TabsContent>
        <TabsContent value="objetivo" className="pt-5 pb-28 sm:pb-0">
          {profileLoaded && <ObjectiveTab profile={profile} onSaved={handleChanged} />}
        </TabsContent>
        <TabsContent value="progreso" className="pt-5 pb-28 sm:pb-0">
          <MeasurementsTab profile={profile} onSaved={handleChanged} />
        </TabsContent>
        <TabsContent value="comidas" className="pt-5 pb-28 sm:pb-0">
          <MealsTab />
        </TabsContent>

        <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 sm:hidden">
          <TabsList
            className={cn(
              floatingTabListClass,
              "w-full max-w-sm border border-border/50 bg-popover shadow-lg ring-1 ring-foreground/10",
            )}
          >
            <TabsTrigger value="meta" className={floatingTabTriggerClass}>
              <TabIconBadge tint="emerald" icon={Target} />
              <span className={floatingTabLabelClass}>Meta diaria</span>
            </TabsTrigger>
            <TabsTrigger value="recomendacion" className={floatingTabTriggerClass}>
              <TabIconBadge tint="amber" icon={Calculator} />
              <span className={floatingTabLabelClass}>Recomendación</span>
            </TabsTrigger>
            <TabsTrigger value="objetivo" className={floatingTabTriggerClass}>
              <TabIconBadge tint="blue" icon={Flag} />
              <span className={floatingTabLabelClass}>Objetivo</span>
            </TabsTrigger>
            <TabsTrigger value="progreso" className={floatingTabTriggerClass}>
              <TabIconBadge tint="violet" icon={Ruler} />
              <span className={floatingTabLabelClass}>Progreso</span>
            </TabsTrigger>
            <TabsTrigger value="comidas" className={floatingTabTriggerClass}>
              <TabIconBadge tint="rose" icon={UtensilsCrossed} />
              <span className={floatingTabLabelClass}>Comidas</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
