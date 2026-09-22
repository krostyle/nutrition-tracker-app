# 015 - Pasada de diseño visual en Configuración (skill frontend-design)

## Qué debe hacer

Con el skill `frontend-design` se hace una pasada de diseño más intencional sobre `/settings`, `/settings/profile` y `/settings/nutrition` (ya reorganizadas en specs 013/014), sin tocar lógica ni server actions — solo tipografía, jerarquía, espaciado y color.

- **Números primero**: las calorías pasan a ser la cifra protagonista (grande, `tabular-nums`) en "Meta actual" y "Recomendación"; proteína/carbohidratos/grasa se muestran como filas con una barra de color a la izquierda, reutilizando el mismo código de color por macro que ya existe en el detalle de un alimento (proteína azul, carbohidratos ámbar, grasa violeta) en vez de una grilla pareja de etiqueta-sobre-valor.
- **"Cómo se calcula"** pasa de un cuadro con borde a una lista numerada limpia (es un proceso real de 5 pasos, por eso la numeración), separada del dato de % de grasa corporal que no es parte de esa secuencia.
- El hub de Configuración y el ícono de cada acceso usan un tinte distinto según de qué se trata (neutro para "Mis datos", verde primario para "Nutrición").
- El formulario de "Mis datos" agrupa Edad y Estatura lado a lado con el sufijo de unidad dentro del campo (años/cm), en vez de cuatro campos idénticos apilados.
- "Progreso" también usa el peso actual como cifra protagonista, con el peso meta y el historial como contexto secundario.

## Reglas de negocio

- Cambio puramente visual/de presentación: ningún formulario, cálculo, server action ni ruta cambia de comportamiento.
- Se reutiliza la paleta y tipografía ya establecidas en el resto de la app (verde primario, fondo cálido, Inter) — no se introduce una paleta o tipografía nueva ajena al resto de la app.
- Se mantiene el patrón responsive de specs 014 (sin card en mobile, card en desktop).

## Criterios de aceptación

- [ ] "Meta actual" y "Recomendación" muestran las calorías como cifra grande y los macros como filas con color, sin duplicar el mismo tratamiento de grilla en ambas pestañas.
- [ ] "Cómo se calcula" se lee como una lista de pasos, no como un cuadro con borde.
- [ ] El formulario de Mis datos agrupa edad/estatura y muestra la unidad dentro del campo.
- [ ] Probado visualmente en mobile (390px) y desktop (1280px) con datos reales.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
