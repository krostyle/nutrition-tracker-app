"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Settings } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        {isHome ? (
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              N
            </span>
            Nutrition Tracker
          </span>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        )}

        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link
              label="Configuración"
              href="/goals"
              labelIcon={<Settings className="size-4" />}
            />
          </UserButton.MenuItems>
        </UserButton>
      </header>

      <main className="flex flex-1 flex-col overflow-x-hidden">{children}</main>
    </div>
  );
}
