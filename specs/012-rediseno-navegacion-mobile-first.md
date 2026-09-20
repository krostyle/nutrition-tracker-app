# 012 - Rediseño de la navegación hacia mobile-first

## Qué debe hacer

Hoy la navegación principal es un menú hamburguesa (mobile) / sidebar (desktop) con cuatro destinos: Dashboard, Alimentos, Recetas y Metas. Alimentos y Recetas son redundantes como destinos de primer nivel porque ya se puede llegar a ellos — buscar, escanear, cargar manual, elegir una receta guardada — desde el selector de "agregar alimento a una comida".

Se simplifica la navegación general:

- El **dashboard (`/`)** pasa a ser la única pantalla principal de la app — el tracker de días con sus comidas.
- Se elimina el menú hamburguesa y el sidebar (tanto en mobile como en desktop).
- **`/foods` y `/recipes` se mantienen intactos** como páginas completas (toda su funcionalidad actual sigue igual), pero dejan de estar en cualquier navegación global. Se llega a ellos únicamente con un enlace contextual desde dentro del selector de "agregar alimento a una comida" (pestaña "Guardados" → enlace a `/foods`; pestaña "Recetas" → enlace a `/recipes`).
- El **botón de perfil** (el mismo `UserButton` de Clerk que ya existe) se reutiliza agregándole un ítem **"Configuración"** en su menú desplegable, que lleva a lo que hoy es `/goals` (meta diaria, objetivo, historial de progreso — contenido sin cambios, solo cambia cómo se llega).
- Header simplificado, presente en todas las páginas: en el dashboard muestra el nombre de la app; en cualquier otra página muestra una flecha para volver al dashboard. El botón de perfil (con Configuración) está siempre visible.

## Reglas de negocio

- No se elimina ninguna funcionalidad de `/foods`, `/recipes` ni `/goals` — solo cambia cómo se accede a ellas. Sus rutas y comportamiento interno quedan igual.
- El selector de agregar alimento a una comida (`meal-food-picker.tsx`) agrega dos enlaces contextuales:
  - En la pestaña "Guardados": un enlace tipo "Gestionar mis alimentos guardados" que cierra el selector y navega a `/foods`.
  - En la pestaña "Recetas": un enlace tipo "Crear o gestionar recetas" que cierra el selector y navega a `/recipes`.
- La página de Metas (`/goals`) no cambia de contenido ni de ruta — solo se retira su entrada del sidebar y se agrega como ítem "Configuración" dentro del menú del botón de perfil, usando los subcomponentes `UserButton.MenuItems` / `UserButton.Link` de Clerk (ya disponibles en la versión instalada, no requiere actualizar dependencias).
- El sidebar (`AppSidebar`) y el shell con hamburguesa (`AppShell`) actuales se eliminan por completo — no se mantiene una versión "solo para desktop"; al ser una app mobile-first con una sola pantalla principal, no tiene sentido conservar dos paradigmas de navegación distintos.
- Toda página que no sea el dashboard (`/foods`, `/recipes` y sus subrutas, `/goals`) muestra una flecha de "Volver" en el header hacia `/`.

## Criterios de aceptación

- [ ] Al entrar a la app ya no aparece el menú hamburguesa ni el sidebar; el dashboard es lo que se ve al cargar `/`.
- [ ] El botón de perfil tiene un ítem "Configuración" que lleva a la página de Metas.
- [ ] `/foods` y `/recipes` siguen funcionando exactamente igual que antes (búsqueda, escaneo, manual, guardados, crear/editar recetas), pero ya no aparecen en ningún menú global.
- [ ] Desde la pestaña "Guardados" del selector de agregar comida hay un enlace para ir a `/foods`.
- [ ] Desde la pestaña "Recetas" del selector de agregar comida hay un enlace para ir a `/recipes`.
- [ ] Estando en `/foods`, `/recipes` o Configuración (Metas), aparece una flecha para volver al dashboard.
- [ ] Probado en mobile (375px) y en desktop.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
