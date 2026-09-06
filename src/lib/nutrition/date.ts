export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateKey(): string {
  return formatDateKey(new Date());
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function shiftDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Lunes de la semana que contiene dateKey.
export function getWeekStartKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay(); // 0=domingo..6=sábado
  const mondayOffset = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
}

// Los 7 dateKeys de la semana, lunes a domingo, a partir del lunes.
export function getWeekDates(weekStartKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDateKey(weekStartKey, i));
}
