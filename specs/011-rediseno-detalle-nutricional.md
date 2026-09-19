# 011 - Rediseño mobile-first del detalle nutricional

## Qué debe hacer

Hoy, en tres lugares distintos (la ficha de un resultado de búsqueda en `/foods`, la ficha de un alimento guardado, y el paso de confirmar cantidad al agregar un alimento a una comida), se muestra la misma información nutricional **duplicada dos veces completas** ("Por 100g" y "Por porción", cada una con calorías/proteína/carbohidratos/grasa/fibra/azúcares/grasa saturada/sodio). Esto hace que el diálogo ocupe toda la altura de la pantalla en mobile y sea abrumador de leer.

Se reemplaza por una vista compacta y reactiva a la cantidad, igual en los tres lugares:

- **Resumen principal, siempre visible**: calorías, proteína, carbohidratos y grasa en números grandes, para la cantidad actualmente seleccionada.
- **Distribución porcentual de macros**: qué porcentaje de las calorías viene de proteína, de carbohidratos y de grasa (una barra con 3 segmentos + los porcentajes).
- **Selector de cantidad**: un campo numérico y, si el alimento tiene una porción definida (ej. "1 taza", 30g), un selector para elegir entre cargar la cantidad en **gramos** o en **porciones** de esa unidad. Cambiar la cantidad o la unidad recalcula el resumen principal al instante — no hace falta enviar nada para verlo.
- **Sección colapsable "Información nutricional completa"**, cerrada por defecto: fibra, azúcares, grasa saturada y sodio (los únicos datos adicionales que tenemos hoy), también ajustados a la cantidad seleccionada.

No se agregan las secciones de "Micronutrientes" ni "Ingredientes" que mencionaste — hoy no tenemos esos datos de OFF ni de USDA (ver Reglas de negocio). Quedan para un spec aparte que primero traiga esos datos.

## Reglas de negocio

- Esta es una reorganización de **presentación e interacción**, no de datos: se calcula todo a partir de los valores por 100g que ya tenemos (`calories/protein/carbs/fat/fiber/sugar/saturatedFat/sodium`). No se agregan campos nuevos al modelo `Food` ni se toca el parsing de OFF/USDA.
- Para una **receta**, no hay selector de gramos — la cantidad siempre es en porciones de la receta, y el resumen usa directamente los valores por porción ya calculados (comportamiento actual, sin cambios).
- Para un **alimento** (OFF/USDA/manual/guardado), la cantidad por defecto al abrir es 100g. Si el alimento tiene porción definida, el usuario puede cambiar la unidad a "porción" — al hacerlo, la cantidad por defecto pasa a 1 porción.
- El porcentaje de macros se calcula así: `kcal_de_proteína = proteína×4`, `kcal_de_carbohidratos = carbohidratos×4`, `kcal_de_grasa = grasa×9`; cada porcentaje es esa cantidad sobre la suma de las tres. Si la suma da 0 (ej. un alimento sin macros cargados), no se muestra la barra.
- En el paso de "agregar a una comida", la cantidad que se envía al confirmar sigue siendo la que ya espera el sistema hoy: gramos para un alimento (sin importar si el usuario cargó la cantidad en gramos o en porciones — se convierte antes de enviar) y número de porciones para una receta. No cambia el modelo de datos de `FoodLogEntry`.
- En las fichas de solo consulta (resultado de búsqueda, alimento guardado) el selector de cantidad es solo para previsualizar — no dispara ninguna acción, sirve para ver "cuánto es X gramos/porciones de esto".
- El diálogo no debe depender de crecer indefinidamente en alto: si el contenido no entra en la pantalla (por ejemplo con la sección colapsable abierta en una pantalla chica), el diálogo scrollea internamente en vez de desbordar la ventana.

## Criterios de aceptación

- [ ] Al abrir la ficha de un resultado de búsqueda, un alimento guardado, o el paso de confirmar cantidad, se ve un resumen compacto (calorías/proteína/carbohidratos/grasa + distribución de macros) sin la información duplicada de hoy.
- [ ] Cambiar la cantidad o la unidad (gramos/porción) actualiza el resumen principal sin recargar ni tocar ningún botón.
- [ ] La sección "Información nutricional completa" está colapsada por defecto y se puede expandir para ver fibra/azúcares/grasa saturada/sodio, ajustados a la cantidad seleccionada.
- [ ] Para una receta, el selector sigue siendo solo en porciones, sin opción de gramos.
- [ ] Al confirmar agregar un alimento a una comida habiendo elegido la unidad "porción", la cantidad que termina guardada en la base de datos está en gramos (verificable con una consulta directa después de la prueba).
- [ ] Probado en un viewport mobile angosto (375px): el diálogo no ocupa más de lo necesario y no se corta contenido — si no entra, scrollea dentro del diálogo.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
