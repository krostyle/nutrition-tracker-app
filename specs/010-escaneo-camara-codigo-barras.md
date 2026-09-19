# 010 - Escaneo de código de barras con la cámara

## Qué debe hacer

Hoy la pestaña "Escanear" (en `/foods` y en el diálogo "Agregar a [comida]") solo permite escribir el número de código de barras a mano. Se agrega la posibilidad real de usar la cámara del dispositivo para leer el código de barras del envase y buscarlo automáticamente, en ambos lugares donde existe esa pestaña.

- Un botón "Escanear con cámara" abre la cámara del dispositivo (pidiendo permiso si hace falta) y muestra el video en vivo dentro de la pestaña.
- Apenas se detecta un código de barras válido en el video, se cierra la cámara automáticamente y se dispara la misma búsqueda que hoy dispara escribir el número a mano y tocar "Buscar" (mismos tres resultados posibles: encontrado, no encontrado, servicio no disponible).
- El campo para escribir el código a mano **se mantiene** como alternativa, para desktop sin cámara, o para cuando el usuario prefiere tipearlo.
- Si el usuario no da permiso de cámara, o el dispositivo no tiene cámara, se muestra un mensaje claro y queda disponible la carga manual — nunca se bloquea la función de buscar por código de barras.
- Un botón para cancelar/cerrar la cámara sin haber escaneado nada, volviendo al estado con el campo manual visible.

## Reglas de negocio

- La lectura de código de barras se hace con una librería que funcione igual en cualquier navegador (incluyendo iPhone/Safari), no con una API exclusiva de Chrome/Android — así la función no queda rota según el teléfono del usuario.
- La cámara se debe liberar (apagar) apenas se deja de usar: al detectar un código, al cancelar, o al cerrar la pestaña/diálogo. No debe quedar la cámara prendida de fondo.
- Solo se acepta como resultado un código de barras con formato válido de producto (EAN-13/UPC, que son los que usa Open Food Facts) — no cualquier código QR o de otro tipo que la cámara pueda llegar a detectar de fondo.
- Mientras la cámara está activa, no se permite iniciar otra búsqueda en paralelo desde el mismo campo manual (son mutuamente excluyentes dentro de la pestaña).
- El comportamiento de la búsqueda una vez obtenido el código (encontrado / no encontrado / servicio no disponible) es exactamente el mismo que ya existe hoy para la carga manual — no se duplica esa lógica.

## Criterios de aceptación

- [ ] En `/foods` y en "Agregar a [comida]", la pestaña "Escanear" tiene un botón para activar la cámara además del campo manual existente.
- [ ] Al apuntar la cámara a un código de barras real (probado con un producto físico o una imagen de código de barras), se detecta y dispara la búsqueda automáticamente, sin tocar "Buscar".
- [ ] Encontrar el mismo comportamiento (encontrado / no encontrado / error de servicio) que ya existe para la carga manual.
- [ ] Cancelar el escaneo apaga la cámara y vuelve a mostrar el campo manual sin errores.
- [ ] Denegar el permiso de cámara muestra un mensaje entendible y no rompe la pestaña — el campo manual sigue funcionando.
- [ ] Salir de la pestaña o cerrar el diálogo mientras la cámara está activa la apaga correctamente (verificable revisando que el navegador deja de mostrar el ícono de cámara en uso).
- [ ] Funciona probado en un navegador basado en Chromium (desktop, simulando cámara, o Android si hay dispositivo disponible).
- [ ] `npm run build` y `npm run lint` pasan sin errores.
