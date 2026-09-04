"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ChefHat, LayoutDashboard, Search, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/foods", label: "Alimentos", icon: Search },
  { href: "/recipes", label: "Recetas", icon: ChefHat },
  { href: "/goals", label: "Metas", icon: Target },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
          N
        </span>
        <span className="text-sm font-semibold">Nutrition Tracker</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3">
        <UserButton />
        <span className="text-xs text-sidebar-foreground/70">Mi cuenta</span>
      </div>
    </aside>
  );
}
