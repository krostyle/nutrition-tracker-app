"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Calculator, Flag, Ruler, Target } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TabIconBadge,
  floatingTabLabelClass,
  floatingTabListClass,
  floatingTabTriggerClass,
} from "@/components/ui/floating-tab-bar";
import { getGoalAction } from "@/lib/nutrition/actions";
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
import type { BodyMeasurement, Goal, GoalType, Profile } from "@/generated/prisma/client";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

const GOAL_FIELDS = [
  { key: "calories", label: "Calorías", unit: "kcal" },
  { key: "protein", label: "Proteína", unit: "g" },
  { key: "carbs", label: "Carbohidratos", unit: "g" },
  { key: "fat", label: "Grasa", unit: "g" },
] as const;

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GOAL_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!goal) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no tienes una meta — aplica la recomendación de arriba para definirla.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {GOAL_FIELDS.map((field) => (
        <div key={field.key}>
          <p className="text-xs text-muted-foreground">{field.label}</p>
          <p className="text-sm font-medium">
            {round(goal[field.key])} {field.unit}
          </p>
        </div>
      ))}
    </div>
  );
}

type GoalValues = { calories: number; protein: number; carbs: number; fat: number };

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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recomendación</CardTitle>
          <CardDescription>Grasa corporal estimada: {round(r.bodyFatPercent)}%</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Metabolismo basal: {round(r.bmr)} kcal · Gasto total estimado: {round(r.tdee)} kcal
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Calorías</p>
              <p className="text-sm font-medium">{recommended.calories} kcal</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Proteína</p>
              <p className="text-sm font-medium">{recommended.protein} g</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carbohidratos</p>
              <p className="text-sm font-medium">{recommended.carbs} g</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grasa</p>
              <p className="text-sm font-medium">{recommended.fat} g</p>
            </div>
          </div>
          {alreadyApplied ? (
            <p className="text-sm text-muted-foreground">Esta es tu meta actual.</p>
          ) : (
            <Button size="sm" disabled={pending} onClick={apply}>
              {pending ? "Aplicando..." : "Aplicar como meta"}
            </Button>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm text-muted-foreground">
        <h3 className="text-sm font-medium text-foreground">Cómo se calcula</h3>
        <div>
          <p className="font-medium text-foreground">1. Metabolismo basal (BMR)</p>
          <p>
            Fórmula de Mifflin-St Jeor, la más usada para estimar cuántas calorías quema tu
            cuerpo en reposo a partir de tu peso, estatura, edad y sexo.
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground">2. Gasto total (TDEE)</p>
          <p>
            Tu metabolismo basal multiplicado por un factor según tu nivel de actividad (de 1.2
            si eres sedentario a 1.9 si eres muy activo).
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground">3. Calorías objetivo</p>
          <p>
            Tu gasto total ajustado según tu objetivo: −500 kcal para bajar grasa, sin cambio
            para mantener, +300 kcal para subir músculo.
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground">4. Proteína y grasa</p>
          <p>
            Se fijan en gramos por kilo de tu peso actual (2.0 g/kg de proteína, 0.8 g/kg de
            grasa) para cuidar tu masa muscular mientras cambias de peso.
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground">5. Carbohidratos</p>
          <p>Lo que queda de las calorías objetivo después de restar proteína y grasa.</p>
        </div>
        <div>
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

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  LOSE_FAT: "Bajar grasa",
  MAINTAIN: "Mantener",
  GAIN_MUSCLE: "Subir músculo",
};

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
        age: profile.age,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label>Objetivo</Label>
        <Select
          items={GOAL_TYPE_LABELS}
          value={goalType}
          onValueChange={(v) => {
            setGoalType(v as GoalType);
            setSaved(false);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {pending ? "Guardando..." : saved ? "Guardado" : "Guardar"}
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
            {pending ? "Guardando..." : "Agregar medición"}
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
    <div className="flex flex-col gap-4">
      {showProgress && (
        <div className="rounded-lg border px-3 py-2 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span>{currentWeight} kg</span>
            <span className="text-muted-foreground">→</span>
            <span>{targetWeight} kg</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {diff > 0
              ? `Faltan ${Math.abs(diff)} kg para bajar`
              : diff < 0
                ? `Faltan ${Math.abs(diff)} kg para subir`
                : "¡Llegaste a tu peso objetivo!"}
          </p>
        </div>
      )}

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
        <div className="flex flex-col gap-2">
          {history.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium">{new Date(m.date).toISOString().slice(0, 10)}</span>
              <span className="text-muted-foreground">
                {m.weightKg}kg · cuello {m.neckCm}cm · cintura {m.waistCm}cm
                {m.hipCm !== null ? ` · cadera ${m.hipCm}cm` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <AddMeasurementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        needsHip={needsHip}
        onAdded={handleAdded}
      />
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
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Nutrición</CardTitle>
        <CardDescription>
          Define tu objetivo y registra tu progreso para recibir una recomendación de calorías y
          macros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meta">
          <div className="hidden sm:block">
            <TabsList className="w-full">
              <TabsTrigger value="meta">Meta diaria</TabsTrigger>
              <TabsTrigger value="recomendacion">Recomendación</TabsTrigger>
              <TabsTrigger value="objetivo">Objetivo</TabsTrigger>
              <TabsTrigger value="progreso">Progreso</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="meta" className="pb-28 sm:pb-0">
            <div>
              <h3 className="mb-2 text-sm font-medium">Meta actual</h3>
              <CurrentGoalPanel key={goalKey} />
            </div>
          </TabsContent>
          <TabsContent value="recomendacion" className="pb-28 sm:pb-0">
            <RecommendationTab key={refreshKey} onApplied={handleGoalApplied} />
          </TabsContent>
          <TabsContent value="objetivo" className="pb-28 sm:pb-0">
            {profileLoaded && <ObjectiveTab profile={profile} onSaved={handleChanged} />}
          </TabsContent>
          <TabsContent value="progreso" className="pb-28 sm:pb-0">
            <MeasurementsTab profile={profile} onSaved={handleChanged} />
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
            </TabsList>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
