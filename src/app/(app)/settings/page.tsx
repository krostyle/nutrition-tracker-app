import Link from "next/link";
import { ChevronRight, Target, User } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/profile",
    icon: User,
    title: "Mis datos",
    description: "Sexo, edad, estatura y nivel de actividad.",
    tint: "bg-foreground/[0.06] text-foreground",
  },
  {
    href: "/settings/nutrition",
    icon: Target,
    title: "Nutrición",
    description: "Meta diaria, objetivo y progreso.",
    tint: "bg-primary/10 text-primary",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-4 sm:p-8">
      <div className="flex w-full max-w-lg flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tus datos y tus metas nutricionales.</p>
        </div>
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border sm:divide-y-0 sm:gap-3 sm:overflow-visible sm:rounded-none sm:border-none">
          {SETTINGS_SECTIONS.map(({ href, icon: Icon, title, description, tint }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40 sm:rounded-xl sm:border sm:bg-card sm:shadow-sm">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tint}`}>
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
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
