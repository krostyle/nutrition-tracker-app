"use server";

import type { Food } from "@/generated/prisma/client";
import { runAction, type ActionResult } from "@/lib/action-result";
import { lookupOffBarcode, searchOffProducts } from "./off/client";
import { normalizeOffProduct } from "./off/normalize";
import { createManualFood, persistExternalFood, type ManualFoodInput } from "./persist";
import { listFoods } from "./search-local";
import type { NormalizedNutrients } from "./types";

export type ExternalFoodResult = NormalizedNutrients & { externalId: string };

export type BarcodeLookupResult =
  | { status: "found"; result: ExternalFoodResult }
  | { status: "not_found" }
  | { status: "error"; message: string };

export async function lookupBarcodeAction(barcode: string): Promise<BarcodeLookupResult> {
  let product;
  try {
    product = await lookupOffBarcode(barcode);
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "No pudimos consultar Open Food Facts ahora. Prueba de nuevo en un momento.",
    };
  }

  if (!product) return { status: "not_found" };

  const normalized = normalizeOffProduct(product);
  const externalId = product.code ?? barcode;
  if (!normalized) return { status: "not_found" };

  return { status: "found", result: { ...normalized, externalId } };
}

export type SourceSearchResult =
  | { ok: true; results: ExternalFoodResult[] }
  | { ok: false };

export async function searchFoodsAction(query: string): Promise<SourceSearchResult> {
  try {
    const products = await searchOffProducts(query);
    return {
      ok: true,
      results: products.flatMap((product) => {
        const normalized = normalizeOffProduct(product);
        if (!normalized || !product.code) return [];
        return [{ ...normalized, externalId: product.code }];
      }),
    };
  } catch {
    return { ok: false };
  }
}

const SAVE_FOOD_ERROR = "No pudimos guardar el alimento. Prueba de nuevo.";

export async function saveOffFoodAction(result: ExternalFoodResult): Promise<ActionResult<Food>> {
  const { externalId, ...nutrients } = result;
  return runAction(() => persistExternalFood("OFF", externalId, nutrients), SAVE_FOOD_ERROR);
}

export async function createManualFoodAction(input: ManualFoodInput): Promise<ActionResult<Food>> {
  return runAction(() => createManualFood(input), SAVE_FOOD_ERROR);
}

export async function listFoodsAction(): Promise<Food[]> {
  return listFoods();
}
