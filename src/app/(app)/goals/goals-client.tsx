"use client";

import { useEffect, useState, useTransition } from "react";
import { Ruler, Target, UserRound } from "lucide-react";
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
import { getGoalAction, saveGoalAction } from "@/lib/nutrition/actions";
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
import type {
  ActivityLevel,
  BodyMeasurement,
  GoalType,
  Profile,
  Sex,
} from "@/generated/prisma/client";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

const GOAL_FIELDS = [
  { key: "calories", label: "Calorías (kcal)" },
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Carbohidratos (g)" },
  { key: "fat", label: "Grasa (g)" },
] as const;

function GoalForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const canSubmit = GOAL_FIELDS.every((field) => values[field.key]?.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    startTransition(async () => {
      const outcome = await saveGoalAction({
        calories: Number(values.calories),
        protein: Number(values.protein),
        carbs: Number(values.carbs),
        fat: Number(values.fat),
      });
      if (outcome.ok) {
        setSaved(true);
      } else {
        setError(outcome.message);
      }
    });
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        {GOAL_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {GOAL_FIELDS.map((field) => (
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
  );
}

function RecommendationPanel({ onApplied }: { onApplied: () => void }) {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecommendationAction().then(setResult);
  }, []);

  if (!result) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (result.status === "missing_profile") {
    return (
      <p className="text-sm text-muted-foreground">
        Completá la pestaña &quot;Objetivos&quot; para ver una recomendación.
      </p>
    );
  }

  if (result.status === "missing_measurement") {
    return (
      <p className="text-sm text-muted-foreground">
        Cargá al menos una medición en &quot;Medidas&quot; para ver una recomendación.
      </p>
    );
  }

  const r = result.recommendation;

  function apply() {
    setError(null);
    startTransition(async () => {
      const outcome = await applyRecommendationAsGoalAction({
        calories: round(r.calories),
        protein: round(r.protein),
        carbs: round(r.carbs),
        fat: round(r.fat),
      });
      if (outcome.ok) {
        setApplied(true);
        onApplied();
      } else {
        setError(outcome.message);
      }
    });
  }

  return (
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
            <p className="text-sm font-medium">{round(r.calories)} kcal</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Proteína</p>
            <p className="text-sm font-medium">{round(r.protein)} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Carbohidratos</p>
            <p className="text-sm font-medium">{round(r.carbs)} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grasa</p>
            <p className="text-sm font-medium">{round(r.fat)} g</p>
          </div>
        </div>
        <Button size="sm" disabled={pending} onClick={apply}>
          {pending ? "Aplicando..." : applied ? "Aplicada" : "Aplicar como meta"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

function MetaTab({ refreshKey }: { refreshKey: number }) {
  const [goalKey, setGoalKey] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <RecommendationPanel
        key={refreshKey}
        onApplied={() => setGoalKey((k) => k + 1)}
      />
      <div>
        <h3 className="mb-2 text-sm font-medium">Meta actual</h3>
        <GoalForm key={goalKey} />
      </div>
    </div>
  );
}

const SEX_LABELS: Record<Sex, string> = { MALE: "Hombre", FEMALE: "Mujer" };
const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentario (poco o nada de ejercicio)",
  LIGHT: "Liviano (ejercicio 1-3 días/semana)",
  MODERATE: "Moderado (ejercicio 3-5 días/semana)",
  ACTIVE: "Activo (ejercicio 6-7 días/semana)",
  VERY_ACTIVE: "Muy activo (ejercicio intenso a diario)",
};
const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  LOSE_FAT: "Bajar grasa",
  MAINTAIN: "Mantener",
  GAIN_MUSCLE: "Subir músculo",
};

function ObjectivesTab({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: () => void;
}) {
  const [sex, setSex] = useState<Sex>(profile?.sex ?? "MALE");
  const [age, setAge] = useState(profile ? String(profile.age) : "");
  const [heightCm, setHeightCm] = useState(profile ? String(profile.heightCm) : "");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel ?? "MODERATE",
  );
  const [goalType, setGoalType] = useState<GoalType>(profile?.goalType ?? "MAINTAIN");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = age.trim() !== "" && heightCm.trim() !== "" && Number(age) > 0 && Number(heightCm) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const outcome = await saveProfileAction({
        sex,
        age: Number(age),
        heightCm: Number(heightCm),
        activityLevel,
        goalType,
      });
      if (outcome.ok) {
        setSaved(true);
        onSaved();
      } else {
        setError(outcome.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label>Sexo biológico</Label>
        <Select
          items={SEX_LABELS}
          value={sex}
          onValueChange={(v) => {
            setSex(v as Sex);
            setSaved(false);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SEX_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-age">Edad</Label>
        <Input
          id="profile-age"
          type="number"
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-height">Estatura (cm)</Label>
        <Input
          id="profile-height"
          type="number"
          step="any"
          value={heightCm}
          onChange={(e) => {
            setHeightCm(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Nivel de actividad</Label>
        <Select
          items={ACTIVITY_LABELS}
          value={activityLevel}
          onValueChange={(v) => {
            setActivityLevel(v as ActivityLevel);
            setSaved(false);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <Button type="submit" disabled={!canSubmit || pending}>
        {pending ? "Guardando..." : saved ? "Guardado" : "Guardar"}
      </Button>
    </form>
  );
}

function MeasurementsTab({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: () => void;
}) {
  const [weightKg, setWeightKg] = useState("");
  const [neckCm, setNeckCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [pending, startTransition] = useTransition();
  const [history, setHistory] = useState<BodyMeasurement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsHip = profile?.sex === "FEMALE";

  function loadHistory() {
    listMeasurementsAction().then(setHistory);
  }

  useEffect(() => {
    loadHistory();
  }, []);

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
      loadHistory();
      onSaved();
    });
  }

  return (
    <div className="flex flex-col gap-6">
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

      <div>
        <h3 className="mb-2 text-sm font-medium">Historial</h3>
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
      </div>
    </div>
  );
}

export function GoalsClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Metas</CardTitle>
        <CardDescription>
          Definí tu perfil y tus medidas para recibir una recomendación de calorías y macros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meta">
          <div className="hidden sm:block">
            <TabsList className="w-full">
              <TabsTrigger value="meta">Meta</TabsTrigger>
              <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
              <TabsTrigger value="medidas">Medidas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="meta" className="pb-28 sm:pb-0">
            <MetaTab refreshKey={refreshKey} />
          </TabsContent>
          <TabsContent value="objetivos" className="pb-28 sm:pb-0">
            {profileLoaded && <ObjectivesTab profile={profile} onSaved={handleChanged} />}
          </TabsContent>
          <TabsContent value="medidas" className="pb-28 sm:pb-0">
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
                <span className={floatingTabLabelClass}>Meta</span>
              </TabsTrigger>
              <TabsTrigger value="objetivos" className={floatingTabTriggerClass}>
                <TabIconBadge tint="blue" icon={UserRound} />
                <span className={floatingTabLabelClass}>Objetivos</span>
              </TabsTrigger>
              <TabsTrigger value="medidas" className={floatingTabTriggerClass}>
                <TabIconBadge tint="violet" icon={Ruler} />
                <span className={floatingTabLabelClass}>Medidas</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
