# 016 - Fecha de nacimiento y controles nativos en Mis datos

## Qué debe hacer

En "Mis datos", dos problemas puntuales:

1. **Edad no escala**: se guardaba como número fijo, quedando desactualizada cada año. Se reemplaza por **fecha de nacimiento**; la edad se calcula al vuelo cada vez que se necesita (para el cálculo de la recomendación), nunca se guarda ni hay que actualizarla a mano.
2. **El `<Select>` de shadcn se siente tosco en mobile**: abre un popover flotante que se encima con el resto del formulario en pantallas chicas, en vez de un picker nativo. Se reemplaza según el tipo de opción:
   - Pocas opciones cortas (Sexo biológico, Objetivo): botones en línea (selector segmentado), sin dropdown.
   - Muchas opciones con texto largo (Nivel de actividad): `<select>` nativo del navegador, que en el teléfono real abre el picker nativo del sistema operativo en vez de un menú flotante.
   - Fecha de nacimiento: `<input type="date">` nativo, que abre el calendario nativo del teléfono.

## Reglas de negocio

- El cálculo de calorías/macros (Mifflin-St Jeor) sigue usando la edad como número — no cambia esa lógica ni sus tests. Solo cambia de dónde sale ese número: antes un campo guardado, ahora derivado de la fecha de nacimiento con una función pura y testeada (`calculateAge`).
- Migración de base de datos con dato real: se agregó `birthDate` (nullable), se rellenó con la fecha real del único perfil existente, y recién ahí se hizo obligatoria y se eliminó la columna `age` — en dos migraciones separadas, sin pérdida de datos.
- El selector segmentado es solo un cambio de presentación — el valor guardado (`Sex`, `GoalType`) no cambia.

## Criterios de aceptación

- [ ] "Mis datos" pide fecha de nacimiento (con selector de fecha nativo), no edad.
- [ ] La recomendación de calorías/macros calcula la misma edad que antes a partir de esa fecha.
- [ ] Sexo biológico y Objetivo se eligen con botones, no con un dropdown.
- [ ] Nivel de actividad usa un `<select>` nativo.
- [ ] Los tests de `recommendation.ts` siguen pasando sin modificarse.
- [ ] `npm run build`, `npm run lint` y los tests pasan sin errores.
