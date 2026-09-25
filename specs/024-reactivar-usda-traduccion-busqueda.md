# 024 - Reactivar USDA FDC con traducción de términos comunes

## Qué debe hacer

La búsqueda por nombre (`searchFoodsAction`, usada por `UnifiedFoodPickerTab`) vuelve a consultar **USDA FoodData Central** además de Open Food Facts, tal como antes de spec 021 — pero solo cuando el término buscado coincide con un alimento genérico común (agua, frutas, verduras, granos, carnes básicas, etc.) para el que existe una traducción al inglés conocida. USDA FDC indexa y busca únicamente en inglés, así que buscar "plátano" o "manzana" directamente no devuelve nada; ese fue el problema reportado.

Esto reabre el modelo de datos a **tres orígenes** (`OFF` | `USDA` | `MANUAL`), revirtiendo parcialmente la decisión de spec 021 de dejar una sola fuente activa. La regla de spec 021 que sí se mantiene: el origen de un alimento nunca se muestra en el frontend.

## Reglas de negocio

- Se restaura `src/lib/food-sources/usda/client.ts` y `normalize.ts` tal como existían antes de spec 021 (mapeo de nutrientes por `nutrientId`: energía 1008, proteína 1003, carbohidratos 1005, grasa 1004, fibra 1079, azúcares 2000, grasa saturada 1258, sodio 1093).
- Nuevo módulo `src/lib/food-sources/usda/search-terms.ts`: un diccionario español→inglés de alimentos genéricos comunes (agua, frutas, verduras, legumbres, granos, carnes y lácteos básicos) y una función `toEnglishSearchTerm(query)` que:
  - Normaliza el término (minúsculas, sin tildes).
  - Busca coincidencia exacta; si no hay, prueba quitando un sufijo plural simple (`-es`, `-s`) antes de buscar de nuevo.
  - Devuelve `null` si no hay traducción conocida — en ese caso **no se consulta USDA** (evita ruido y llamadas inútiles para términos sin traducción, ej. nombres de marcas o platos preparados).
- `searchFoodsAction` consulta OFF siempre; consulta USDA en paralelo solo si `toEnglishSearchTerm(query)` devuelve algo. Los resultados de ambas fuentes se combinan en una sola lista (igual que hoy con OFF sola), sin indicar la fuente en la UI.
- `ExternalFoodResult` gana un campo interno `source: "OFF" | "USDA"` (nunca se renderiza, solo se usa para persistir el alimento con el origen correcto). Esto corrige un bug latente: hoy `addFoodToMealAction` persiste usando literalmente el `kind` del candidato como `FoodSource` (`persistExternalFood(food.kind, ...)`) — si no se propaga el origen real de cada resultado, un alimento de USDA terminaría guardado con `source: "OFF"`.
- El escaneo de código de barra (`lookupBarcodeAction`, `BarcodePickerTab`) sigue siendo exclusivo de OFF — USDA no tiene búsqueda por barcode.
- `saveOffFoodAction` se renombra a `saveExternalFoodAction` y persiste usando el `source` real del resultado (antes asumía `"OFF"` siempre).
- CLAUDE.md y `.env.example` se actualizan para reflejar de nuevo las tres fuentes y la variable `USDA_FDC_API_KEY` (la key ya existe en `.env.local`, no se toca).

## Fuera de alcance

- No se traducen términos parciales mientras el usuario escribe (ej. "man" no encuentra "manzana"); la traducción exige coincidencia con la palabra completa (o su plural simple) ya escrita.
- No se traducen nombres de marcas, platos preparados ni productos envasados — el diccionario cubre solo alimentos genéricos sin marca.
- No se reintroducen badges de fuente en la UI (spec 021 se mantiene en ese punto).

## Criterios de aceptación

- [ ] Buscar "agua", "plátano"/"platano", "plátanos", "manzana", "manzanas", "naranja", "naranjas" (y el resto del diccionario) devuelve resultados de USDA combinados con los de OFF.
- [ ] Buscar un término sin traducción conocida (ej. una marca) no dispara ninguna llamada a USDA.
- [ ] Guardar un alimento encontrado vía USDA lo persiste con `source: "USDA"` en la base, y uno de OFF con `source: "OFF"` — ningún lugar de la UI muestra esa diferencia.
- [ ] `normalizeUsdaFood` tiene tests unitarios (TDD, rojo→verde) restaurados de antes de spec 021.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
