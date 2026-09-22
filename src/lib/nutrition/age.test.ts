import { describe, expect, it } from "vitest";
import { calculateAge } from "./age";

describe("calculateAge", () => {
  it("calcula la edad cuando ya pasó el cumpleaños este año", () => {
    const age = calculateAge(new Date("1993-09-12T00:00:00.000Z"), new Date("2026-09-22T00:00:00.000Z"));
    expect(age).toBe(33);
  });

  it("no suma el año todavía si el cumpleaños es justo hoy", () => {
    const age = calculateAge(new Date("1993-09-12T00:00:00.000Z"), new Date("2026-09-12T00:00:00.000Z"));
    expect(age).toBe(33);
  });

  it("resta un año si el cumpleaños de este año todavía no llega", () => {
    const age = calculateAge(new Date("1993-09-12T00:00:00.000Z"), new Date("2026-09-11T00:00:00.000Z"));
    expect(age).toBe(32);
  });
});
