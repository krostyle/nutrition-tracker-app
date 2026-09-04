# 001 - Búsqueda y alta de alimentos

## Qué debe hacer

Permitir encontrar un alimento y agregarlo al sistema desde cualquiera de las tres fuentes soportadas, dejando persistido un `Food` con toda su información nutricional:

- **Por código de barras**: el usuario escanea o tipea un barcode. Se busca en Open Food Facts (OFF). Si existe, se muestra y se puede guardar como `Food` (origen `OFF`).
- **Por nombre**: el usuario escribe un texto de búsqueda. Se busca en paralelo en OFF (texto) y en USDA FDC, y se muestra una lista combinada de resultados con su fuente indicada. El usuario elige uno y se guarda como `Food` (origen `OFF` o `USDA` según corresponda).
- **Alta manual**: cuando ninguna búsqueda externa da con el alimento, el usuario lo carga a mano: nombre y valores nutricionales por 100g. Se guarda como `Food` (origen `MANUAL`, sin `externalId`).

En todos los casos, si el alimento ya existe en la base (mismo `source` + `externalId`, o mismo nombre para manuales — ver reglas de negocio), no se duplica: se reutiliza el existente.

## Reglas de negocio

### Datos nutricionales persistidos

Todo `Food`, sin importar el origen, guarda estos valores **por 100g**:

- `calories` (kcal)
- `protein` (g)
- `carbs` (g)
- `fat` (g)
- `fiber` (g, opcional — no todas las fuentes lo reportan)
- `sugar` (g, opcional)
- `saturatedFat` (g, opcional)
- `sodium` (mg, opcional)

Los cuatro primeros (`calories`, `protein`, `carbs`, `fat`) son obligatorios para persistir un `Food`. Si la fuente externa no los reporta, el alimento no se puede guardar automáticamente y se le ofrece al usuario cargarlo como manual.

### Normalización de datos externos (OFF y USDA)

Cada fuente expone los nutrientes con su propia estructura y unidades. Se requiere una función de parsing/normalización por fuente que convierta la respuesta cruda al shape común de arriba:

- **OFF**: nutrientes vienen en el campo `nutriments`, ya expresados por 100g (sufijo `_100g`), en gramos (o kcal para energía — atención a `energy-kcal_100g` vs `energy_100g` en kJ).
- **USDA FDC**: nutrientes vienen en un array `foodNutrients`, cada uno con `nutrientId`/`nutrientName` y `value`, no necesariamente todos por 100g de forma directa (depende del tipo de alimento: Foundation, SR Legacy, FNDDS) — hay que mapear por `nutrientId` conocido (energía = 1008, proteína = 1003, carbohidratos = 1005, grasa total = 1004, fibra = 1079, azúcares = 2000, grasa saturada = 1258, sodio = 1093).

Esta normalización es lógica crítica de dominio → **TDD obligatorio** (ver CLAUDE.md).

### Búsqueda por barcode (OFF)

- Un solo request a OFF por barcode consultado.
- Si OFF no tiene el barcode, se informa "no encontrado" y se ofrece alta manual (con el barcode precargado como `externalId` potencial, aunque igual quede `MANUAL` si el usuario decide no usar el dato de OFF).
- Respetar rate limit de 100 req/min: no hace falta throttling explícito para uso single-user, pero si OFF responde 429 se debe mostrar error claro, sin reintentos automáticos agresivos.

### Búsqueda por texto (OFF + USDA)

- Se dispara una búsqueda a cada API en paralelo con el mismo texto.
- Resultados se muestran en una lista combinada, cada ítem con su fuente visible (badge "OFF" / "USDA").
- Si una de las dos APIs falla o tarda, se muestran igual los resultados de la que sí respondió, con un aviso de que la otra fuente no está disponible (no se bloquea toda la búsqueda por la falla de una).
- Rate limit de texto en OFF es 10 req/min: la búsqueda por texto no se dispara en cada tecla (debounce), solo cuando el usuario confirma el término (submit o pausa prolongada de tipeo).
- USDA FDC: usar `USDA_FDC_API_KEY` (ya presente en el entorno). Rate limit 1000 req/hora, no requiere debounce tan agresivo pero comparte el mismo debounce de UX que OFF.

### Alta manual

- Requiere: nombre, `calories`, `protein`, `carbs`, `fat` por 100g. El resto de los nutrientes es opcional.
- No tiene `externalId`.

### Deduplicación

- OFF/USDA: unicidad por (`source`, `externalId`) — ya existe como constraint en el schema (`@@unique([source, externalId])`). Si el usuario busca un alimento que ya fue guardado antes, se reutiliza el registro existente en vez de crear uno nuevo.
- Manual: no hay `externalId` para deduplicar automáticamente. No se bloquea la creación de manuales con nombres repetidos (el usuario es responsable de no duplicar).

## Criterios de aceptación

- [ ] Buscar por barcode devuelve el producto de OFF (si existe) con sus nutrientes normalizados, o un mensaje claro de "no encontrado" con opción de alta manual.
- [ ] Buscar por nombre devuelve resultados combinados de OFF y USDA, cada uno etiquetado con su fuente.
- [ ] Si una de las dos fuentes de búsqueda por texto falla, la otra igual muestra resultados.
- [ ] Elegir un resultado de búsqueda (barcode o texto) persiste un `Food` con `source`, `externalId` y nutrientes normalizados por 100g.
- [ ] Buscar dos veces el mismo barcode/resultado no crea un `Food` duplicado — reutiliza el existente.
- [ ] Alta manual permite crear un `Food` con `source = MANUAL`, sin `externalId`, con al menos calorías/proteína/carbos/grasa cargados.
- [ ] Las funciones de normalización de OFF y de USDA tienen tests unitarios (TDD, rojo→verde) que cubren: caso feliz, nutrientes faltantes/opcionales, y unidades (ej. energía en kJ vs kcal en OFF).
- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] La migración de Prisma que agrega los campos nutricionales al modelo `Food` está aplicada y versionada.
