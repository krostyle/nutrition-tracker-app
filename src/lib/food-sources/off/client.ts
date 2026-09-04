import type { OffProduct } from "./normalize";

const OFF_BASE_URL = "https://world.openfoodfacts.org";

// OFF blocks requests without an app-identifying User-Agent (returns an
// HTML bot-protection page instead of JSON) — see
// https://openfoodfacts.github.io/openfoodfacts-server/api/#requests
const OFF_HEADERS = {
  "User-Agent":
    "NutritionTrackerApp - personal use (https://github.com/krostyle/nutrition-tracker-app)",
};

export async function lookupOffBarcode(barcode: string): Promise<OffProduct | null> {
  const res = await fetch(
    `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`,
    { headers: OFF_HEADERS },
  );
  if (!res.ok) {
    throw new Error(`OFF barcode lookup failed with status ${res.status}`);
  }

  const data = (await res.json()) as { status: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) {
    return null;
  }
  return data.product;
}

export async function searchOffProducts(query: string): Promise<OffProduct[]> {
  const url = new URL(`${OFF_BASE_URL}/cgi/search.pl`);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", "code,product_name,nutriments");

  const res = await fetch(url, { headers: OFF_HEADERS });
  if (!res.ok) {
    throw new Error(`OFF search failed with status ${res.status}`);
  }

  const data = (await res.json()) as { products?: OffProduct[] };
  return data.products ?? [];
}
