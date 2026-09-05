# 004 - Agregar alimento por comida

## Qué debe hacer

Reemplazar la sección única "Agregar alimento" del dashboard (con selector de tipo de comida + búsqueda solo entre alimentos ya guardados) por un botón **"+"** en cada card de comida (Desayuno, Almuerzo, Cena, Snack).

Al tocar el botón de una comida, se abre un buscador que permite:

- Buscar entre los alimentos ya guardados.
- Buscar por nombre en Open Food Facts y USDA FoodData Central.
- Buscar por código de barras (OFF).
- Cargar un alimento nuevo a mano.

Se elige un resultado, se indica la cantidad en gramos, y se agrega a esa comida en un solo paso — sin necesidad de guardar el alimento por separado primero.

El resto del comportamiento del dashboard (editar/eliminar entradas, navegación entre días, totales vs. meta) no cambia.

## Reglas de negocio

- El tipo de comida de la nueva entrada queda determinado por qué botón "+" se usó — no hay selector de tipo de comida.
- El buscador reutiliza toda la lógica ya existente de búsqueda, normalización y guardado de alimentos (spec 001): mismo dedup por `(source, externalId)`, mismo manejo de fallo parcial entre OFF/USDA, misma alta manual.
- Guardar y loguear es una sola acción desde la perspectiva del usuario:
  - Si el alimento elegido ya está guardado, se usa directamente.
  - Si es un resultado externo (OFF/USDA) todavía no guardado, se guarda automáticamente como parte de la misma acción de agregarlo a la comida.
  - Si se carga a mano, se crea el alimento y se agrega a la comida en el mismo paso.
- La fecha de la nueva entrada es la del día que se está viendo en el dashboard (igual que hoy).

## Criterios de aceptación

- [ ] Cada card de comida tiene un botón "+" visible.
- [ ] Al tocar el botón se abre el buscador para esa comida específica (sin selector de tipo de comida).
- [ ] El buscador permite elegir entre alimentos guardados, por nombre, por código de barras, o alta manual.
- [ ] Elegir un alimento ya guardado + indicar gramos agrega la entrada a la comida correcta sin pasos adicionales.
- [ ] Elegir un resultado externo (OFF/USDA) no guardado + indicar gramos lo guarda y lo agrega a la comida en un solo paso, sin pasar por `/alimentos` primero.
- [ ] Cargar un alimento a mano desde el buscador lo crea y lo agrega a la comida en el mismo paso.
- [ ] La sección genérica "Agregar alimento" con selector de comida desaparece del dashboard.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
