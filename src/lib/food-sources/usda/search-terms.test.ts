import { describe, expect, it } from "vitest";
import { toEnglishSearchTerm } from "./search-terms";

describe("toEnglishSearchTerm", () => {
  it("traduce los términos exactos del caso reportado", () => {
    expect(toEnglishSearchTerm("manzana")).toBe("apple");
    expect(toEnglishSearchTerm("naranja")).toBe("orange");
    expect(toEnglishSearchTerm("platano")).toBe("banana");
  });

  it("ignora mayúsculas y tildes", () => {
    expect(toEnglishSearchTerm("Plátano")).toBe("banana");
    expect(toEnglishSearchTerm("SANDÍA")).toBe("watermelon");
  });

  it("resuelve el plural simple quitando la 's' o 'es' final", () => {
    expect(toEnglishSearchTerm("plátanos")).toBe("banana");
    expect(toEnglishSearchTerm("manzanas")).toBe("apple");
    expect(toEnglishSearchTerm("naranjas")).toBe("orange");
  });

  it("devuelve null para un término sin traducción conocida", () => {
    expect(toEnglishSearchTerm("coca cola")).toBeNull();
    expect(toEnglishSearchTerm("nutella")).toBeNull();
  });

  it("devuelve null para un texto vacío", () => {
    expect(toEnglishSearchTerm("   ")).toBeNull();
  });
});
