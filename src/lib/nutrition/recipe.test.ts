import { describe, expect, it } from "vitest";
import { calculateRecipeNutrients } from "./recipe";

describe("calculateRecipeNutrients", () => {
  it("calcula el total y el valor por porción de una receta con varios ingredientes", () => {
    const result = calculateRecipeNutrients({
      servings: 2,
      ingredients: [
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
      ],
    });

    expect(result.total).toEqual({
      calories: 200,
      protein: 18,
      carbs: 40,
      fat: 8,
      fiber: 4,
      sugar: 11,
      saturatedFat: 2,
      sodium: 80,
    });

    expect(result.perServing).toEqual({
      calories: 100,
      protein: 9,
      carbs: 20,
      fat: 4,
      fiber: 2,
      sugar: 5.5,
      saturatedFat: 1,
      sodium: 40,
    });
  });

  it("divide correctamente cuando hay más de dos porciones", () => {
    const result = calculateRecipeNutrients({
      servings: 4,
      ingredients: [
        { grams: 400, nutrients: { calories: 400, protein: 40, carbs: 40, fat: 40 } },
      ],
    });

    expect(result.total.calories).toBe(1600);
    expect(result.perServing.calories).toBe(400);
    expect(result.perServing.protein).toBe(40);
  });

  it("trata los nutrientes opcionales faltantes de un ingrediente como 0", () => {
    const result = calculateRecipeNutrients({
      servings: 1,
      ingredients: [{ grams: 100, nutrients: { calories: 50, protein: 5, carbs: 10, fat: 2 } }],
    });

    expect(result.total.fiber).toBe(0);
    expect(result.perServing.fiber).toBe(0);
  });
});
