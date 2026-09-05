import type { UsdaFood } from "./normalize";

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export async function searchUsdaFoods(query: string): Promise<UsdaFood[]> {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_FDC_API_KEY no está configurada");
  }

  const url = new URL(`${USDA_BASE_URL}/foods/search`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "10");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`USDA search failed with status ${res.status}`);
  }

  const data = (await res.json()) as { foods?: UsdaFood[] };
  return data.foods ?? [];
}
