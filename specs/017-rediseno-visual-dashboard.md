# 017 - Pasada de diseño visual en el dashboard principal

## Qué debe hacer

Se aplica el mismo criterio de diseño de specs 014/015 (Configuración) al dashboard principal: "Totales del día" y las 4 comidas eran 5 cards idénticas apiladas, sin jerarquía. Se rediseña, sin tocar lógica ni server actions:

- **Totales del día**: las calorías pasan a ser la cifra protagonista (grande, `tabular-nums`) con su barra de progreso; proteína/carbohidratos/grasa se muestran como filas con el mismo color por macro que ya se usa en Configuración y en el detalle de un alimento (proteína azul, carbohidratos ámbar, grasa violeta). Se agrega la fecha en formato legible ("Martes 22 de septiembre") en vez del `dateKey` crudo.
- **Comidas**: las 4 cards repetidas (Desayuno/Almuerzo/Cena/Snack) se fusionan en una sola lista agrupada — sin card en mobile, una sola card en desktop — separadas por una línea, en vez de repetir el mismo borde/sombra 4 veces.
- Cada entrada dentro de una comida usa botones de ícono (lápiz/tacho) para editar/eliminar, en vez de botones de texto "Editar"/"Eliminar".

## Reglas de negocio

- Cambio puramente visual/de presentación: ningún cálculo, server action, ni la estructura de datos (`DaySummary`, `entriesByMeal`) cambia.
- Se reutiliza la paleta de color por macro ya establecida (`MACRO_PERCENT_SEGMENTS`) en vez de definir colores nuevos.
- Mantiene el patrón responsive ya establecido: sin card en mobile, card en desktop, mismo breakpoint `sm:` que el resto de la app.

## Criterios de aceptación

- [ ] "Totales del día" muestra las calorías como cifra grande con su progreso, y los macros como filas de color, sin repetir el mismo tratamiento en 4 barras iguales.
- [ ] Las 4 comidas se ven como una sola lista agrupada, no como 4 cards separadas.
- [ ] Editar/Eliminar una entrada usa íconos, no texto.
- [ ] Probado visualmente en mobile (390px) y desktop (1280px) con datos reales.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
