"use server";

import type { Food } from "@/generated/prisma/client";
import { lookupOffBarcode, searchOffProducts } from "./off/client";
import { normalizeOffProduct } from "./off/normalize";
import { searchUsdaFoods } from "./usda/client";
import { normalizeUsdaFood } from "./usda/normalize";
import { createManualFood, persistExternalFood, type ManualFoodInput } from "./persist";
import type { NormalizedNutrients } from "./types";

export type ExternalFoodResult = NormalizedNutrients & { externalId: string };

export type BarcodeLookupResult =
  | { found: true; result: ExternalFoodResult }
  | { found: false };

export async function lookupBarcodeAction(barcode: string): Promise<BarcodeLookupResult> {
  const product = await lookupOffBarcode(barcode);
  if (!product) return { found: false };

  const normalized = normalizeOffProduct(product);
  const externalId = product.code ?? barcode;
  if (!normalized) return { found: false };

  return { found: true, result: { ...normalized, externalId } };
}

export type SourceSearchResult =
  | { ok: true; results: ExternalFoodResult[] }
  | { ok: false };

export type SearchFoodsResult = {
  off: SourceSearchResult;
  usda: SourceSearchResult;
};

export async function searchFoodsAction(query: string): Promise<SearchFoodsResult> {
  const [off, usda] = await Promise.allSettled([
    searchOffProducts(query),
    searchUsdaFoods(query),
  ]);

  const offResult: SourceSearchResult =
    off.status === "fulfilled"
      ? {
          ok: true,
          results: off.value.flatMap((product) => {
            const normalized = normalizeOffProduct(product);
            if (!normalized || !product.code) return [];
            return [{ ...normalized, externalId: product.code }];
          }),
        }
      : { ok: false };

  const usdaResult: SourceSearchResult =
    usda.status === "fulfilled"
      ? {
          ok: true,
          results: usda.value.flatMap((food) => {
            const normalized = normalizeUsdaFood(food);
            if (!normalized || food.fdcId === undefined) return [];
            return [{ ...normalized, externalId: String(food.fdcId) }];
          }),
        }
      : { ok: false };

  return { off: offResult, usda: usdaResult };
}

export async function saveOffFoodAction(result: ExternalFoodResult): Promise<Food> {
  const { externalId, ...nutrients } = result;
  return persistExternalFood("OFF", externalId, nutrients);
}

export async function saveUsdaFoodAction(result: ExternalFoodResult): Promise<Food> {
  const { externalId, ...nutrients } = result;
  return persistExternalFood("USDA", externalId, nutrients);
}

export async function createManualFoodAction(input: ManualFoodInput): Promise<Food> {
  return createManualFood(input);
}
