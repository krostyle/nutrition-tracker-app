"use server";

import type { Food } from "@/generated/prisma/client";
import { runAction, type ActionResult } from "@/lib/action-result";
import { lookupOffBarcode, searchOffProducts } from "./off/client";
import { normalizeOffProduct } from "./off/normalize";
import { searchUsdaFoods } from "./usda/client";
import { normalizeUsdaFood } from "./usda/normalize";
import { toEnglishSearchTerm } from "./usda/search-terms";
import { createManualFood, persistExternalFood, type ManualFoodInput } from "./persist";
import { listFoods } from "./search-local";
import type { NormalizedNutrients } from "./types";

// `source` nunca se muestra en el frontend (ver CLAUDE.md) — solo se usa
// para persistir el alimento con el origen correcto al guardarlo.
export type ExternalFoodResult = NormalizedNutrients & {
  externalId: string;
  source: "OFF" | "USDA";
};

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

  return { status: "found", result: { ...normalized, externalId, source: "OFF" } };
}

export type SourceSearchResult =
  | { ok: true; results: ExternalFoodResult[] }
  | { ok: false };

export async function searchFoodsAction(query: string): Promise<SourceSearchResult> {
  const usdaTerm = toEnglishSearchTerm(query);

  const [off, usda] = await Promise.allSettled([
    searchOffProducts(query),
    usdaTerm ? searchUsdaFoods(usdaTerm) : Promise.resolve([]),
  ]);

  const offResults: ExternalFoodResult[] =
    off.status === "fulfilled"
      ? off.value.flatMap((product) => {
          const normalized = normalizeOffProduct(product);
          if (!normalized || !product.code) return [];
          return [{ ...normalized, externalId: product.code, source: "OFF" as const }];
        })
      : [];

  const usdaResults: ExternalFoodResult[] =
    usda.status === "fulfilled"
      ? usda.value.flatMap((food) => {
          const normalized = normalizeUsdaFood(food);
          if (!normalized || food.fdcId === undefined) return [];
          return [{ ...normalized, externalId: String(food.fdcId), source: "USDA" as const }];
        })
      : [];

  // Si OFF falla pero USDA sí trajo algo (justo el caso que motiva esta
  // fuente: términos genéricos), igual mostramos esos resultados en vez
  // de descartarlos por un problema de la otra fuente.
  if (off.status === "rejected" && usdaResults.length === 0) {
    return { ok: false };
  }

  return { ok: true, results: [...offResults, ...usdaResults] };
}

const SAVE_FOOD_ERROR = "No pudimos guardar el alimento. Prueba de nuevo.";

export async function saveExternalFoodAction(
  result: ExternalFoodResult,
): Promise<ActionResult<Food>> {
  const { externalId, source, ...nutrients } = result;
  return runAction(() => persistExternalFood(source, externalId, nutrients), SAVE_FOOD_ERROR);
}

export async function createManualFoodAction(input: ManualFoodInput): Promise<ActionResult<Food>> {
  return runAction(() => createManualFood(input), SAVE_FOOD_ERROR);
}

export async function listFoodsAction(): Promise<Food[]> {
  return listFoods();
}
