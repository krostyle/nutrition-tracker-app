# 009 - Dashboard: vista semanal y estadísticas

## Qué debe hacer

Reemplazar la navegación actual de "día anterior / día siguiente" del dashboard principal por una vista organizada en semanas (lunes a domingo), agregando estadísticas semanales que hoy no existen.

### Selector de semana

- Una tira con los 7 días de la semana actual (L M M J V S D), mostrando el número de día. El día seleccionado se resalta.
- Flechas a los costados de la tira cambian de semana completa (7 días para atrás/adelante), no de a un día.
- Al tocar un día de la tira, el resto del dashboard (totales del día y las tarjetas de comidas) muestra el detalle de ese día — mismo comportamiento que hoy, solo cambia cómo se elige la fecha.
- Al entrar a la pantalla, la semana mostrada es la que contiene la fecha actual, con el día de hoy seleccionado.

### Resumen semanal

Una tarjeta nueva, "Resumen semanal", con:

- Promedio de calorías y macros de la semana (de los días con al menos un registro) comparado contra la meta.
- Una barra mini por día (L a D) representando qué porcentaje de la meta de calorías se alcanzó ese día. Un día sin registros se muestra vacío/diferenciado de un día con 0% real.

## Reglas de negocio

- La semana va de **lunes a domingo** (no domingo a sábado).
- El promedio semanal se calcula solo sobre los días que tienen al menos un registro cargado — un día sin comidas registradas no cuenta como "0" y no baja el promedio artificialmente.
- Si ningún día de la semana tiene registros, el resumen semanal muestra un estado vacío en lugar de un promedio.
- Si no hay una meta definida (`Goal`), el resumen semanal muestra los totales/promedios sin comparación contra meta — mismo criterio que ya existe hoy para el resumen diario.
- Las tarjetas de comidas (Desayuno/Almuerzo/Cena/Snack) y su funcionalidad de agregar/editar/eliminar entradas siguen operando sobre **un solo día a la vez** (el seleccionado en la tira) — no se listan las comidas de los 7 días juntas.
- Navegar a una semana no debe disparar 7 consultas individuales a la base — se trae la información de la semana completa en una sola operación.

## Criterios de aceptación

- [ ] El dashboard muestra una tira de 7 días (lunes a domingo) en vez de las flechas "Anterior/Siguiente" de a un día.
- [ ] Las flechas de los costados de la tira avanzan/retroceden una semana completa.
- [ ] Seleccionar un día de la tira actualiza el resumen y las tarjetas de comidas para ese día, igual que el comportamiento actual.
- [ ] Existe una tarjeta "Resumen semanal" con el promedio de calorías/macros (solo días con registros) comparado contra la meta.
- [ ] La tarjeta de resumen semanal muestra una barra por día indicando el cumplimiento de la meta de calorías, distinguiendo visualmente un día sin registros de un día con 0%.
- [ ] Cambiar de semana no genera más de una consulta a la base por carga de pantalla.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
