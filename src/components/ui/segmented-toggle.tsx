"use client";

import { cn } from "@/lib/utils";

// Selector de pocas opciones cortas (2-3) como botones en línea, en vez de
// un <Select> — en mobile un dropdown para esto se siente pesado y el
// popover no tiene dónde abrirse bien en pantallas chicas.
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-input">
      {options.map((option, i) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 px-2 py-2 text-sm transition-colors",
            i > 0 && "border-l border-input",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted/40",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
