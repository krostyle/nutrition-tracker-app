# 014 - Configuración: lista agrupada en mobile, cards en desktop

## Qué debe hacer

Las pantallas de Configuración (`/settings`, `/settings/profile`, `/settings/nutrition`) usan cards de shadcn en todos los tamaños de pantalla. En mobile eso agrega bordes/sombras que no aportan — el patrón más nativo ahí es una lista agrupada (filas separadas por una línea, dentro de un solo contenedor, sin sombra). En desktop, en cambio, la card sí ayuda a delimitar el contenido.

Se hace responsive, sin duplicar componentes ni lógica:

- **`/settings` (hub)**: en mobile, "Mis datos" y "Nutrición" se ven como una sola lista con las dos filas separadas por una línea. En desktop, cada una vuelve a ser su propia card.
- **`/settings/profile` y `/settings/nutrition`**: el contenedor exterior pierde el borde/fondo/sombra en mobile (el formulario y las pestañas quedan directo sobre el fondo de la página) y los recupera en desktop.

## Reglas de negocio

- Es un cambio puramente visual/responsive (clases de Tailwind condicionadas por breakpoint `sm:`), sin tocar la lógica de ningún formulario, acción de servidor, ni la estructura de las pestañas de Nutrición.
- No se toca el resto de la app (los cards de alimentos, comidas y recetas en listas siguen igual — ahí sí corresponden, porque son ítems repetidos, no un formulario de configuración).
- El breakpoint a usar es el mismo `sm:` que ya se usa en toda la app para decidir mobile vs. desktop (tab bar flotante vs. `TabsList`, etc.).

## Criterios de aceptación

- [ ] En viewport mobile (375-390px), Configuración se ve sin bordes/cards individuales de shadcn — solo texto y, en el hub, una lista agrupada con línea divisoria entre filas.
- [ ] En viewport desktop, se ve igual que antes de este cambio (cards con borde).
- [ ] Ningún formulario ni comportamiento cambia — solo el envoltorio visual.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
