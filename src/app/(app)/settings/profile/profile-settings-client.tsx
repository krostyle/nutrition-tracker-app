"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfileAction, saveProfileAction } from "@/lib/nutrition/profile-actions";
import type { ActivityLevel, Profile, Sex } from "@/generated/prisma/client";

const SEX_LABELS: Record<Sex, string> = { MALE: "Hombre", FEMALE: "Mujer" };
const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentario (poco o nada de ejercicio)",
  LIGHT: "Liviano (ejercicio 1-3 días/semana)",
  MODERATE: "Moderado (ejercicio 3-5 días/semana)",
  ACTIVE: "Activo (ejercicio 6-7 días/semana)",
  VERY_ACTIVE: "Muy activo (ejercicio intenso a diario)",
};

export function ProfileSettingsClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sex, setSex] = useState<Sex>("MALE");
  const [age, setAge] = useState("");
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
        setAge(String(p.age));
        setHeightCm(String(p.heightCm));
        setActivityLevel(p.activityLevel);
      }
      setLoaded(true);
    });
  }, []);

  const canSubmit =
    age.trim() !== "" && heightCm.trim() !== "" && Number(age) > 0 && Number(heightCm) > 0;

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
          {Array.from({ length: 3 }).map((_, i) => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-age">Edad</Label>
              <div className="relative">
                <Input
                  id="profile-age"
                  type="number"
                  className="pr-11 tabular-nums"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    setSaved(false);
                  }}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  años
                </span>
              </div>
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

          <Button type="submit" disabled={!canSubmit || pending} className="mt-1">
            {pending ? "Guardando..." : saved ? "Guardado" : "Guardar"}
          </Button>
        </form>
      )}
    </div>
  );
}
