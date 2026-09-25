# 023 - Configurar qué comidas se ven en el dashboard

## Qué debe hacer

Hoy el dashboard siempre muestra cuatro comidas fijas: Desayuno, Almuerzo, Cena, Snack. Se agrega una configuración en Nutrición para elegir cuáles de cinco comidas posibles usar — Desayuno, Snack 1, Almuerzo, Snack 2, Cena — y el dashboard solo muestra las que el usuario eligió, en ese orden.

## Reglas de negocio

- Las cinco comidas posibles, en orden de día: Desayuno, Snack 1, Almuerzo, Snack 2, Cena.
- "Snack 1" es la comida `SNACK` que ya existe (no se migra nada, solo cambia la etiqueta visible). "Snack 2" es un tipo de comida nuevo (`SNACK2`).
- Debe quedar al menos una comida activa — no se puede guardar la configuración sin ninguna elegida.
- Si no hay configuración guardada todavía, el default es el comportamiento actual: Desayuno, Almuerzo, Cena y Snack 1 activos (Snack 2 no).
- Las entradas ya cargadas en una comida que después se desactiva no se pierden ni dejan de sumar a las calorías/macros del día — simplemente no se ve esa tarjeta hasta que se vuelva a activar.

## Criterios de aceptación

- [ ] En Nutrición hay una pestaña nueva ("Comidas") con un interruptor por cada una de las cinco comidas.
- [ ] Guardar con todo desactivado muestra un error y no guarda.
- [ ] El dashboard muestra las tarjetas de comida solo para las activas, en el orden Desayuno → Snack 1 → Almuerzo → Snack 2 → Cena.
- [ ] Un usuario sin configuración previa ve el comportamiento actual (Desayuno, Almuerzo, Cena, Snack 1).
- [ ] `npm run build` y `npm run lint` pasan sin errores.
