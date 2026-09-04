import { describe, expect, it } from "vitest";
import { aggregateNutrients } from "./aggregate";

describe("aggregateNutrients", () => {
  it("suma los nutrientes de varias entradas ponderados por gramos", () => {
    const result = aggregateNutrients([
      {
        grams: 200,
        nutrients: {
          calories: 50,
          protein: 5,
          carbs: 10,
          fat: 2,
          fiber: 1,
          sugar: 3,
          saturatedFat: 0.5,
          sodium: 20,
        },
      },
      {
        grams: 100,
        nutrients: {
          calories: 100,
          protein: 8,
          carbs: 20,
          fat: 4,
          fiber: 2,
          sugar: 5,
          saturatedFat: 1,
          sodium: 40,
        },
      },
    ]);

    expect(result).toEqual({
      calories: 200,
      protein: 18,
      carbs: 40,
      fat: 8,
      fiber: 4,
      sugar: 11,
      saturatedFat: 2,
      sodium: 80,
    });
  });

  it("trata los nutrientes opcionales faltantes como 0 en el total", () => {
    const result = aggregateNutrients([
      {
        grams: 100,
        nutrients: { calories: 50, protein: 5, carbs: 10, fat: 2 },
      },
    ]);

    expect(result).toEqual({
      calories: 50,
      protein: 5,
      carbs: 10,
      fat: 2,
      fiber: 0,
      sugar: 0,
      saturatedFat: 0,
      sodium: 0,
    });
  });

  it("devuelve todos los totales en cero cuando no hay entradas", () => {
    const result = aggregateNutrients([]);

    expect(result).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      saturatedFat: 0,
      sodium: 0,
    });
  });
});
