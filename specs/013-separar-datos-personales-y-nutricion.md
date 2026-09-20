# 013 - Separar "Mis datos" de "Nutrición" dentro de Configuración

## Qué debe hacer

Hoy `/goals` (a la que se llega desde "Configuración" en el perfil) mezcla dos cosas distintas en su pestaña "Objetivo": los datos personales (sexo, edad, estatura, nivel de actividad) y el objetivo nutricional propiamente tal (tipo de objetivo, peso meta). Se separan en dos secciones independientes dentro de Configuración:

- **Configuración** pasa a ser una pantalla intermedia con dos accesos:
  - **Mis datos**: sexo, edad, estatura y nivel de actividad — lo que hoy edita el diálogo "Editar mis datos", convertido en una página propia.
  - **Nutrición**: lo que hoy es la página "Metas" (pestañas Meta diaria / Objetivo / Progreso), pero sin los datos personales ni el botón para editarlos — si todavía no se completaron "Mis datos", la pestaña Objetivo muestra un mensaje con un enlace a esa sección en vez de un botón para editarlos ahí mismo.
- El botón de perfil ahora lleva a esta nueva pantalla de Configuración (no directo a Nutrición).
- El enlace "Definirla" que aparece en el dashboard cuando no hay una meta cargada apunta a Nutrición.

## Reglas de negocio

- No cambia el modelo de datos ni `saveProfileAction`: sigue siendo una sola fila `Profile` con sexo/edad/estatura/actividad/tipo de objetivo/peso meta. Cada pantalla nueva sigue enviando el perfil completo al guardar (preservando los campos que no edita, igual que hoy).
- "Mis datos" y "Nutrición" son páginas propias (no diálogos), en línea con el resto de la navegación mobile-first de la app (spec 012).
- El botón "Volver" del header pasa a ir al nivel inmediatamente superior de la ruta actual (ej. `/settings/profile` → `/settings`, `/recipes/123/edit` → `/recipes/123`) en vez de ir siempre al dashboard — mejora general de navegación, no solo para Configuración.
- Se elimina la ruta `/goals`; su contenido se traslada a `/settings/nutrition`.

## Criterios de aceptación

- [ ] "Configuración" en el perfil lleva a una pantalla con dos opciones: "Mis datos" y "Nutrición".
- [ ] "Mis datos" permite editar sexo/edad/estatura/actividad, sin nada de objetivo ni metas ahí.
- [ ] "Nutrición" mantiene las tres pestañas actuales (Meta diaria/Objetivo/Progreso) y su funcionalidad, sin el botón de editar datos personales.
- [ ] Si no se han cargado los datos personales, la pestaña Objetivo lo indica con un enlace a "Mis datos" en vez de un botón para editarlos ahí mismo.
- [ ] El enlace del dashboard para definir una meta lleva a Nutrición.
- [ ] El botón "Volver" en cualquier página va al nivel superior de esa ruta, no siempre al dashboard.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
