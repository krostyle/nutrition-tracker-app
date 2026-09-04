import { describe, expect, it } from "vitest";
import { normalizeUsdaFood } from "./normalize";

describe("normalizeUsdaFood", () => {
  it("normaliza un alimento con todos los nutrientes presentes", () => {
    const result = normalizeUsdaFood({
      description: "Banana, raw",
      foodNutrients: [
        { nutrientId: 1008, value: 89 }, // energía (kcal)
        { nutrientId: 1003, value: 1.09 }, // proteína
        { nutrientId: 1005, value: 22.8 }, // carbohidratos
        { nutrientId: 1004, value: 0.33 }, // grasa
        { nutrientId: 1079, value: 2.6 }, // fibra
        { nutrientId: 2000, value: 12.2 }, // azúcares
        { nutrientId: 1258, value: 0.11 }, // grasa saturada
        { nutrientId: 1093, value: 1 }, // sodio (mg)
      ],
    });

    expect(result).toEqual({
      name: "Banana, raw",
      calories: 89,
      protein: 1.09,
      carbs: 22.8,
      fat: 0.33,
      fiber: 2.6,
      sugar: 12.2,
      saturatedFat: 0.11,
      sodium: 1,
    });
  });

  it("omite los nutrientes opcionales cuando la fuente no los reporta", () => {
    const result = normalizeUsdaFood({
      description: "Water, bottled",
      foodNutrients: [
        { nutrientId: 1008, value: 0 },
        { nutrientId: 1003, value: 0 },
        { nutrientId: 1005, value: 0 },
        { nutrientId: 1004, value: 0 },
      ],
    });

    expect(result).toEqual({
      name: "Water, bottled",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("devuelve null si falta un nutriente obligatorio", () => {
    const result = normalizeUsdaFood({
      description: "Alimento incompleto",
      foodNutrients: [
        { nutrientId: 1008, value: 100 },
        { nutrientId: 1005, value: 20 },
        { nutrientId: 1004, value: 5 },
        // falta nutrientId 1003 (proteína)
      ],
    });

    expect(result).toBeNull();
  });
});
