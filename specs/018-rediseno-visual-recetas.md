# 018 - Pasada de diseño visual en el flujo de recetas

## Qué debe hacer

Se aplica el mismo criterio de diseño de specs 014/015/017 al flujo completo de recetas (lista, crear, ver, editar), sin tocar lógica ni server actions:

- **Lista de recetas**: pasa de una card con filas en cajas a una lista agrupada (sin card en mobile, card en desktop), con un ícono de chef con tinte verde por receta, igual que el patrón ya usado en el hub de Configuración.
- **Detalle de receta**: tenía el mismo problema que los alimentos antes de spec 011 — "Total receta" y "Por porción" mostrados en paralelo, duplicando la misma información. Ahora "por porción" es la cifra protagonista (con el código de color por macro ya establecido), y el total de la receta queda como una línea de contexto más chica debajo. Se extrajo el componente `MacroHero` (antes vivía solo dentro de Nutrición) a `nutrition-facts.tsx` para reutilizarlo aquí sin duplicar código.
- **Crear/editar receta**: el formulario deja el envoltorio de card fijo por el mismo patrón responsive (sin card en mobile, card en desktop). Las filas de ingredientes se agrupan en una lista con separadores, y "Quitar" pasa a ser un ícono en vez de un botón de texto, igual que las entradas del dashboard (spec 017).

## Reglas de negocio

- Cambio puramente visual/de presentación: ningún cálculo de receta, server action, ni la estructura de datos cambia.
- `MacroHero` (nuevo, en `nutrition-facts.tsx`) reemplaza el `GoalMetrics` que antes vivía solo en `nutrition-client.tsx` — mismo comportamiento, ahora reutilizable.

## Criterios de aceptación

- [ ] La lista de recetas se ve como lista agrupada, no como cards en fila.
- [ ] El detalle de una receta muestra "por porción" como cifra protagonista con macros de color, y el total como texto secundario, sin duplicar la lista completa dos veces.
- [ ] Crear y editar receta no usan card fija en mobile; las filas de ingredientes usan ícono para "Quitar".
- [ ] Probado de punta a punta (crear, ver, editar, eliminar) con datos reales en mobile y desktop.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
