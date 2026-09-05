import { describe, expect, it } from "vitest";
import { aggregateNutrients } from "./aggregate";

describe("aggregateNutrients", () => {
  it("suma los nutrientes de varias entradas ponderadas por un factor", () => {
    const result = aggregateNutrients([
      {
        factor: 2, // equivalente a 200g de un alimento (200/100)
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
        factor: 1, // equivalente a 100g
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
        factor: 1,
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

  it("combina en un mismo total un factor tipo gramos/100 (alimento) y uno tipo porciones (receta)", () => {
    const foodContribution = {
      nutrients: { calories: 80, protein: 4, carbs: 10, fat: 3 },
      factor: 150 / 100, // 150g de un alimento
    };
    const recipePerServing = { calories: 300, protein: 20, carbs: 30, fat: 10 };
    const recipeContribution = { nutrients: recipePerServing, factor: 0.5 }; // media porción

    const result = aggregateNutrients([foodContribution, recipeContribution]);

    expect(result.calories).toBeCloseTo(80 * 1.5 + 300 * 0.5);
    expect(result.protein).toBeCloseTo(4 * 1.5 + 20 * 0.5);
    expect(result.carbs).toBeCloseTo(10 * 1.5 + 30 * 0.5);
    expect(result.fat).toBeCloseTo(3 * 1.5 + 10 * 0.5);
  });
});
