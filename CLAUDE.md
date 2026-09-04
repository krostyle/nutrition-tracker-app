# CLAUDE.md

## Qué es este proyecto

**nutrition-tracker-app** es una app de tracking nutricional de uso personal (single-user), en la línea de Fitia pero sin las partes multiusuario/social. Es una web app responsive/PWA: un único codebase sirve tanto para desktop como para mobile, sin apps nativas separadas.

Funcionalidad principal:
- Buscar alimentos por código de barras o por nombre.
- Registrar las comidas del día y compararlas contra metas de calorías y macros.
- Crear alimentos y recetas propias, con cálculo automático de nutrientes a partir de sus ingredientes.

## Modelo de datos: orígenes de alimentos

Un alimento puede provenir de tres fuentes distintas que conviven en el mismo modelo:

1. **Open Food Facts (OFF)** — productos envasados con código de barras.
   - API pública, sin API key.
   - Rate limits: 100 req/min para lookup por barcode, 10 req/min para búsqueda por texto.
2. **USDA FoodData Central (FDC)** — alimentos genéricos sin barcode (frutas, verduras, preparaciones comunes). Incluye Foundation Foods, SR Legacy y FNDDS.
   - Requiere API key gratuita.
   - Rate limit: 1000 req/hora.
3. **Manual** — alimentos cargados a mano por el usuario cuando no aparecen en OFF ni en USDA.

Todo alimento debe persistir:
- Su **origen** (`OFF` | `USDA` | `MANUAL`).
- Su **ID externo** cuando aplica (barcode para OFF, `fdcId` para USDA). Los manuales no tienen ID externo.

### Recetas

Una receta es una lista de `(alimento, cantidad_en_gramos)`. El total nutricional de la receta se calcula así:

```
total_nutriente = Σ (nutriente_por_100g_ingrediente × gramos_ingrediente / 100)
nutriente_por_porción = total_nutriente / número_de_porciones
```

Este cálculo es lógica crítica del dominio (ver sección TDD más abajo).

## Stack técnico

- **Framework**: Next.js 16 (App Router), TypeScript
- **Base de datos**: Postgres en Neon
- **ORM**: Prisma
- **Auth**: Clerk
- **UI**: Tailwind CSS + shadcn/ui
- **Deploy**: Vercel

## Metodología de trabajo

Esta es la parte más importante de este documento. El flujo de trabajo para cualquier feature no trivial (que toca varios archivos o implica una decisión de diseño) sigue **siempre** este orden: **Spec → Plan → Código, una tarea a la vez**. No te saltes etapas ni implementes directamente desde un spec.

### 1. Spec first (Spec-Driven Development)

Antes de implementar una feature no trivial, se crea un spec en `specs/NNN-nombre-feature.md` que incluya:

- Qué debe hacer la feature.
- Reglas de negocio.
- Criterios de aceptación.

El spec se presenta al usuario y **se espera confirmación explícita** sobre su contenido antes de avanzar a la etapa de plan. No pasar a plan sin esa confirmación.

### 2. Plan antes de código

Nunca se implementa directamente desde el spec. Con el spec aprobado, se presenta un **plan técnico**: una lista de tareas chicas y verificables. Se espera **aprobación del plan** antes de escribir cualquier código.

### 3. Una tarea a la vez

Se implementa **una tarea del plan por vez**, nunca el plan completo de un saque. Después de cada tarea se muestra el diff correspondiente antes de pasar a la siguiente.

### 4. TDD para lógica crítica

Es **obligatorio** desarrollar con TDD (red → green) la siguiente lógica:

- Parsing/normalización de datos externos (respuestas de OFF y de USDA FDC).
- Cálculo de nutrientes de recetas a partir de sus ingredientes.

Flujo TDD estricto:
1. Escribir el test que describe el comportamiento esperado.
2. Mostrarlo al usuario.
3. Confirmar que falla (rojo).
4. Recién ahí escribir la implementación mínima para que pase (verde).

No escribir tests que solo validen código que uno mismo acaba de escribir (eso no es TDD, es documentación disfrazada).

### 5. Dashboards y UI

Para pantallas de dashboard y componentes visuales, TDD **no** es obligatorio. Sí es obligatorio correr `npm run build` y `npm run lint` antes de dar una tarea por terminada.

### 6. Tests existentes

Nunca modificar un test existente para que pase sin decirlo explícitamente y explicar el motivo del cambio.

### 7. Definición de "terminado" (Definition of Done) por spec

Un spec se considera completo cuando, **todo** lo siguiente es cierto:

- Todas las tareas de su plan están implementadas y aprobadas.
- `npm run build` compila sin errores.
- `npm run lint` no reporta problemas.
- Si el spec incluye lógica crítica (parsing externo o cálculo de recetas), los tests correspondientes pasan en verde.

### 8. Commit y push

- **Automático sin pedir confirmación adicional** en dos casos únicamente:
  a) Un spec cumple su Definición de Terminado (arriba) → commit + push a `origin main` inmediato.
  b) Un fix puntual que repara un build/deploy roto (ej. error de `next build` en Vercel) → no requiere spec previo ni confirmación, solo verificar build/lint/tests en verde antes de commitear.
- Si build, lint o tests fallan, **no se hace commit**: se arregla primero y se vuelve a verificar.
- **Cualquier otra operación de git** (force-push, reescritura de historia, push a otro remoto/rama que no sea `origin main`) sigue requiriendo confirmación explícita del usuario.

## Convención de specs

Los specs viven en `specs/NNN-nombre-feature.md`, numerados secuencialmente (001, 002, ...). Ver `specs/README.md` para el detalle de la convención.

## Notas del framework

@AGENTS.md
