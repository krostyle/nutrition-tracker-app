"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
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

// Profile.birthDate se guarda como medianoche UTC (columna @db.Date). Para
// que el calendario muestre y devuelva el mismo día sin importar la zona
// horaria del navegador, se trabaja con un "Date local" cuyos componentes
// año/mes/día coinciden con los UTC guardados, y se convierte de vuelta a
// medianoche UTC recién al guardar.
function utcToLocalCalendarDate(utcDate: Date): Date {
  return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
}

function localCalendarDateToUtc(localDate: Date): Date {
  return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
}

export function ProfileSettingsClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sex, setSex] = useState<Sex>("MALE");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
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
        setBirthDate(utcToLocalCalendarDate(p.birthDate));
        setHeightCm(String(p.heightCm));
        setActivityLevel(p.activityLevel);
      }
      setLoaded(true);
    });
  }, []);

  const canSubmit = birthDate !== undefined && heightCm.trim() !== "" && Number(heightCm) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const outcome = await saveProfileAction({
        sex,
        birthDate: localCalendarDateToUtc(birthDate),
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
              <PopoverTrigger
                id="profile-birthdate"
                className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                {birthDate ? (
                  format(birthDate, "d 'de' MMMM 'de' yyyy", { locale: es })
                ) : (
                  <span className="text-muted-foreground">Elegir fecha</span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={es}
                  captionLayout="dropdown"
                  startMonth={new Date(1920, 0)}
                  endMonth={new Date()}
                  defaultMonth={birthDate ?? new Date(1993, 0)}
                  disabled={{ after: new Date() }}
                  selected={birthDate}
                  onSelect={(date) => {
                    if (date) {
                      setBirthDate(date);
                      setSaved(false);
                    }
                    setBirthDateOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
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
            <Label>Nivel de actividad</Label>
            <Select
              items={ACTIVITY_LABELS}
              value={activityLevel}
              onValueChange={(v) => {
                setActivityLevel(v as ActivityLevel);
                setSaved(false);
              }}
            >
              <SelectTrigger className="w-full">
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
            {pending && <Spinner className="size-4" />}
            {pending ? "Guardando" : saved ? "Guardado" : "Guardar"}
          </Button>
        </form>
      )}
    </div>
  );
}
