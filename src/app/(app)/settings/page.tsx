import Link from "next/link";
import { ChevronRight, Target, User } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/profile",
    icon: User,
    title: "Mis datos",
    description: "Sexo, edad, estatura y nivel de actividad.",
  },
  {
    href: "/settings/nutrition",
    icon: Target,
    title: "Nutrición",
    description: "Meta diaria, objetivo y progreso.",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-8">
      <div className="flex w-full max-w-lg flex-col gap-3">
        <h1 className="text-lg font-semibold">Configuración</h1>
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border sm:divide-y-0 sm:gap-3 sm:overflow-visible sm:rounded-none sm:border-none">
          {SETTINGS_SECTIONS.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40 sm:rounded-xl sm:border sm:bg-card sm:p-4 sm:shadow-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
