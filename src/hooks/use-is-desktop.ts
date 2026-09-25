"use client";

import { useSyncExternalStore } from "react";

// Mismo breakpoint que el resto de la app usa para separar el layout
// mobile del desktop (clases `sm:`/`hidden sm:block`).
const QUERY = "(min-width: 640px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
