"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-1">
      <AppSidebar open={open} onNavigate={() => setOpen(false)} />

      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">Nutrition Tracker</span>
        </div>

        <main className="flex flex-1 flex-col overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
