export type NutrientsPer100g = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  sugar?: number | null;
  saturatedFat?: number | null;
  sodium?: number | null;
};

export type WeightedNutrients = {
  nutrients: NutrientsPer100g;
  grams: number;
};

export type AggregatedNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturatedFat: number;
  sodium: number;
};

export function aggregateNutrients(items: WeightedNutrients[]): AggregatedNutrients {
  const totals: AggregatedNutrients = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    saturatedFat: 0,
    sodium: 0,
  };

  for (const { nutrients, grams } of items) {
    const factor = grams / 100;
    totals.calories += nutrients.calories * factor;
    totals.protein += nutrients.protein * factor;
    totals.carbs += nutrients.carbs * factor;
    totals.fat += nutrients.fat * factor;
    totals.fiber += (nutrients.fiber ?? 0) * factor;
    totals.sugar += (nutrients.sugar ?? 0) * factor;
    totals.saturatedFat += (nutrients.saturatedFat ?? 0) * factor;
    totals.sodium += (nutrients.sodium ?? 0) * factor;
  }

  return totals;
}
