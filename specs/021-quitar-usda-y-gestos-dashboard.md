# 021 - Quitar USDA como fuente y rediseñar gestos de las entradas

## Qué debe hacer

Dos cambios independientes pedidos juntos:

1. **Una sola fuente de datos externa**: se deja de consultar USDA FoodData Central en la búsqueda por nombre. Open Food Facts queda como única fuente externa (más los alimentos manuales). Como ahora da lo mismo de dónde vino un alimento, el frontend deja de mostrar la fuente (badges "OFF"/"USDA"/"Manual") en cualquier parte de la UI — búsqueda, alimentos guardados, etc. — para no acoplar la interfaz a un dato que ya no aporta nada al usuario, incluso si en el futuro se agregan más fuentes.
2. **Rediseño de gestos en las entradas del dashboard**: en vez de una manija dedicada para arrastrar y un ícono de lápiz para editar, cada entrada se interactúa así:
   - **Arrastrar** (mouse o dedo) desde cualquier parte de la entrada, excepto el botón de eliminar, para moverla a otra comida (igual que antes, spec 020).
   - **Click o tap** sobre la entrada para editarla (reemplaza el ícono de lápiz, que se elimina).
   - **Deslizar hacia la izquierda** (solo en pantallas táctiles/mobile) para eliminarla. En desktop se mantiene un botón de eliminar visible.

## Reglas de negocio

- `persistExternalFood` y todo el camino de guardado de alimentos externos solo acepta `OFF` de ahora en adelante. Los alimentos ya guardados con `source: "USDA"` en la base no se tocan ni se migran — siguen existiendo tal cual, solo que no se puede crear ninguno nuevo desde la UI.
- La búsqueda por nombre (`searchFoodsAction`) deja de llamar a la API de USDA.
- El drag para cambiar de comida y el swipe para eliminar no deben interferir entre sí: en touch, el drag usa una activación con demora (mantener presionado antes de que se reconozca como arrastre) para que un swipe rápido y horizontal no se confunda con un intento de arrastre. En mouse, el drag sigue activándose por distancia como antes (sin demora).
- Mientras una entrada está en modo edición, no se puede arrastrar ni deslizar.

## Criterios de aceptación

- [ ] Buscar por nombre ya no devuelve ni consulta resultados de USDA.
- [ ] Ningún lugar de la UI muestra de qué fuente vino un alimento.
- [ ] Se puede arrastrar una entrada tocando cualquier parte de ella (menos el botón eliminar) y soltarla en otra comida.
- [ ] Tocar/hacer click en una entrada (fuera del botón eliminar) abre su modo de edición.
- [ ] En mobile, deslizar una entrada hacia la izquierda la elimina; en desktop existe un botón de eliminar visible.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
