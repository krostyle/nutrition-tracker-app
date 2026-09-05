# 007 - Manejo de errores

## Qué debe hacer

### 1. Red de seguridad global

Si ocurre un error no previsto en cualquier pantalla (falla de render, excepción no capturada, ruta inexistente), la app muestra una página de error con el mismo diseño visual que el resto de la app (`Card`, tipografía, paleta de colores, textos en español) en vez de la pantalla genérica de Next.js. Incluye:

- Mensaje claro en español ("Algo salió mal", etc.), sin jerga técnica ni stack traces visibles.
- Una acción para recuperarse: botón "Reintentar" y/o "Volver al inicio".
- Una página 404 (`not-found.tsx`) con el mismo criterio de diseño, para rutas inexistentes.

### 2. Manejo específico en acciones que pueden fallar

Las server actions que dependen de servicios externos (OFF, USDA) o de la base de datos, y que hoy pueden lanzar una excepción sin capturar, devuelven un resultado tipado (éxito/error) que la UI interpreta para mostrar un mensaje inline apropiado, sin romper la pantalla.

Caso concreto ya detectado: `lookupBarcodeAction` no maneja el caso en que Open Food Facts devuelve un error HTTP (por ejemplo, rate limit) — hoy la excepción se propaga sin control hasta la pantalla de error de Next.js.

## Reglas de negocio

- Ningún mensaje de error visible para el usuario está en inglés ni muestra detalles técnicos (stack traces, códigos HTTP crudos, nombres de excepciones). El detalle técnico se puede loguear a consola del servidor para debugging, pero no se muestra en la UI.
- La página de error global reutiliza los componentes de UI existentes (`Card`, `Button`, paleta de colores) para mantener consistencia visual con el resto de la app.
- Un error dentro de una sección (ej. `/foods`) no tira abajo el resto de la navegación — se usa un `error.tsx` a nivel de segmento cuando aplica, no solo un `global-error.tsx` de última instancia.
- Las acciones que llaman a servicios externos (OFF, USDA) distinguen al menos estos casos con mensajes distintos:
  - "No se encontró" (resultado válido, vacío).
  - "El servicio no está disponible ahora" (error transitorio, ej. rate limit o caída del servicio).
- Los errores de base de datos (ej. al guardar un alimento) no se muestran crudos; se traducen a un mensaje genérico ("No se pudo guardar, probá de nuevo") con opción de reintentar.
- El alcance de la auditoría de server actions (qué acciones se revisan y corrigen) se define como lista concreta en el plan técnico, no en este spec.

## Criterios de aceptación

- [ ] Forzar un error de render (ej. una excepción de prueba en un componente) muestra una página con el diseño de la app, no la pantalla default de Next.js.
- [ ] Navegar a una ruta inexistente muestra una página 404 con el diseño de la app.
- [ ] Simular una falla de Open Food Facts (rate limit / servicio caído) al buscar por código de barras muestra un mensaje inline en la pestaña "Escanear", sin romper la pantalla.
- [ ] Se audita al menos las acciones que llaman a OFF, USDA y Prisma, y se corrigen las que hoy pueden propagar una excepción sin manejar.
- [ ] Ningún mensaje de error visible queda en inglés o muestra detalles técnicos crudos.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
