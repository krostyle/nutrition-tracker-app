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

  it("extrae la porción recomendada usando el texto de porción casera si existe", () => {
    const result = normalizeUsdaFood({
      description: "Yogurt, plain",
      servingSize: 227,
      servingSizeUnit: "g",
      householdServingFullText: "1 cup",
      foodNutrients: [
        { nutrientId: 1008, value: 61 },
        { nutrientId: 1003, value: 3.5 },
        { nutrientId: 1005, value: 4.7 },
        { nutrientId: 1004, value: 3.2 },
      ],
    });

    expect(result?.servingSize).toBe(227);
    expect(result?.servingLabel).toBe("1 cup");
  });

  it("arma la porción con tamaño y unidad si no hay texto de porción casera", () => {
    const result = normalizeUsdaFood({
      description: "Yogurt, plain",
      servingSize: 80,
      servingSizeUnit: "g",
      foodNutrients: [
        { nutrientId: 1008, value: 61 },
        { nutrientId: 1003, value: 3.5 },
        { nutrientId: 1005, value: 4.7 },
        { nutrientId: 1004, value: 3.2 },
      ],
    });

    expect(result?.servingSize).toBe(80);
    expect(result?.servingLabel).toBe("80 g");
  });

  it("omite la porción cuando la fuente no la reporta", () => {
    const result = normalizeUsdaFood({
      description: "Bananas, raw",
      foodNutrients: [
        { nutrientId: 1008, value: 89 },
        { nutrientId: 1003, value: 1.09 },
        { nutrientId: 1005, value: 22.8 },
        { nutrientId: 1004, value: 0.33 },
      ],
    });

    expect(result?.servingSize).toBeUndefined();
    expect(result?.servingLabel).toBeUndefined();
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
