export type NormalizedNutrients = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  sodium?: number;
  servingSize?: number;
  servingLabel?: string;
};
