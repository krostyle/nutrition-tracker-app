import { describe, expect, it } from "vitest";
import { normalizeOffProduct } from "./normalize";

describe("normalizeOffProduct", () => {
  it("normaliza un producto con todos los nutrientes presentes", () => {
    const result = normalizeOffProduct({
      product_name: "Yogur natural",
      nutriments: {
        "energy-kcal_100g": 61,
        proteins_100g: 3.5,
        carbohydrates_100g: 4.7,
        fat_100g: 3.2,
        fiber_100g: 0,
        sugars_100g: 4.7,
        "saturated-fat_100g": 2,
        sodium_100g: 0.05,
      },
    });

    expect(result).toEqual({
      name: "Yogur natural",
      calories: 61,
      protein: 3.5,
      carbs: 4.7,
      fat: 3.2,
      fiber: 0,
      sugar: 4.7,
      saturatedFat: 2,
      sodium: 50,
    });
  });

  it("omite los nutrientes opcionales cuando la fuente no los reporta", () => {
    const result = normalizeOffProduct({
      product_name: "Agua mineral",
      nutriments: {
        "energy-kcal_100g": 0,
        proteins_100g: 0,
        carbohydrates_100g: 0,
        fat_100g: 0,
      },
    });

    expect(result).toEqual({
      name: "Agua mineral",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("convierte energía de kJ a kcal cuando falta energy-kcal_100g", () => {
    const result = normalizeOffProduct({
      product_name: "Barra de cereal",
      nutriments: {
        energy_100g: 1673, // kJ
        proteins_100g: 8,
        carbohydrates_100g: 65,
        fat_100g: 12,
      },
    });

    expect(result?.calories).toBeCloseTo(400, 0);
  });

  it("devuelve null si falta un nutriente obligatorio", () => {
    const result = normalizeOffProduct({
      product_name: "Producto incompleto",
      nutriments: {
        "energy-kcal_100g": 100,
        carbohydrates_100g: 20,
        fat_100g: 5,
        // falta proteins_100g
      },
    });

    expect(result).toBeNull();
  });
});
