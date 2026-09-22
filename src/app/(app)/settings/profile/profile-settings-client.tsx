"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfileAction, saveProfileAction } from "@/lib/nutrition/profile-actions";
import type { ActivityLevel, Profile, Sex } from "@/generated/prisma/client";

const SEX_OPTIONS = [
  { value: "MALE", label: "Hombre" },
  { value: "FEMALE", label: "Mujer" },
] as const satisfies { value: Sex; label: string }[];

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentario (poco o nada de ejercicio)",
  LIGHT: "Liviano (ejercicio 1-3 días/semana)",
  MODERATE: "Moderado (ejercicio 3-5 días/semana)",
  ACTIVE: "Activo (ejercicio 6-7 días/semana)",
  VERY_ACTIVE: "Muy activo (ejercicio intenso a diario)",
};

const TODAY = new Date().toISOString().slice(0, 10);

export function ProfileSettingsClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sex, setSex] = useState<Sex>("MALE");
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATE");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfileAction().then((p) => {
      setProfile(p);
      if (p) {
        setSex(p.sex);
        setBirthDate(p.birthDate.toISOString().slice(0, 10));
        setHeightCm(String(p.heightCm));
        setActivityLevel(p.activityLevel);
      }
      setLoaded(true);
    });
  }, []);

  const canSubmit = birthDate.trim() !== "" && heightCm.trim() !== "" && Number(heightCm) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const outcome = await saveProfileAction({
        sex,
        birthDate: new Date(`${birthDate}T00:00:00.000Z`),
        heightCm: Number(heightCm),
        activityLevel,
        goalType: profile?.goalType ?? "MAINTAIN",
        targetWeightKg: profile?.targetWeightKg ?? null,
      });
      if (outcome.ok) {
        setSaved(true);
      } else {
        setError(outcome.message);
      }
    });
  }

  return (
    <div className="w-full max-w-lg sm:rounded-xl sm:border sm:bg-card sm:p-6 sm:shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mis datos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se usan para calcular tu recomendación nutricional.
        </p>
      </div>

      {!loaded ? (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-5">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-1.5">
            <Label>Sexo biológico</Label>
            <SegmentedToggle
              options={SEX_OPTIONS}
              value={sex}
              onChange={(v) => {
                setSex(v);
                setSaved(false);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-birthdate">Fecha de nacimiento</Label>
            <Input
              id="profile-birthdate"
              type="date"
              max={TODAY}
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-height">Estatura</Label>
            <div className="relative">
              <Input
                id="profile-height"
                type="number"
                step="any"
                className="pr-11 tabular-nums"
                value={heightCm}
                onChange={(e) => {
                  setHeightCm(e.target.value);
                  setSaved(false);
                }}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                cm
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-activity">Nivel de actividad</Label>
            <select
              id="profile-activity"
              value={activityLevel}
              onChange={(e) => {
                setActivityLevel(e.target.value as ActivityLevel);
                setSaved(false);
              }}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={!canSubmit || pending} className="mt-1">
            {pending ? "Guardando..." : saved ? "Guardado" : "Guardar"}
          </Button>
        </form>
      )}
    </div>
  );
}
