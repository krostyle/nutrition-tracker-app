# 022 - Unificar búsqueda de alimentos, mover editar/eliminar a un diálogo y arreglo de drag optimista

## Qué debe hacer

Tres mejoras independientes pedidas juntas:

1. **Unificar "Guardados" y "Buscar" en una sola pestaña.** Tener dos pestañas que hacen básicamente lo mismo (buscar un alimento) genera fricción. Pasan a ser una: una sola caja de búsqueda que, mientras se escribe, muestra primero los alimentos ya guardados que calzan y después (si hay 3+ caracteres) los resultados de Open Food Facts. Elegir cualquiera de los dos agrega el alimento; si es de OFF y no estaba guardado, se guarda automáticamente (esto ya pasaba, ahora es más visible al estar todo junto). Aplica a los tres lugares que tienen este selector: agregar a una comida, agregar ingrediente de receta, y la página `/foods`.
2. **Editar/eliminar una entrada del dashboard pasa a un diálogo.** Hoy hay un ícono de basurero siempre visible en desktop y la edición se hace inline en la fila, lo que sobrecarga visualmente la lista. Ahora, hacer click/tap en una entrada (fuera del gesto de arrastre) abre un diálogo con la cantidad editable y un botón "Eliminar" — ya no hay ícono de basurero en la fila. El swipe hacia la izquierda en mobile se mantiene como atajo rápido de eliminar, independiente del diálogo.
3. **Arreglar la transición tosca al arrastrar una entrada a otra comida.** Hoy se espera la respuesta del servidor y un refetch completo del día antes de mover la entrada visualmente, lo que genera un delay perceptible. Pasa a moverse de inmediato en el estado local al soltar (optimista), y solo se vuelve a pedir el día completo si la actualización en el servidor falla.

## Reglas de negocio

- El orden de resultados en la búsqueda unificada es: guardados que calzan primero, después resultados de OFF (si el término tiene 3+ caracteres). No hace falta deduplicar si un alimento aparece en ambas listas.
- Elegir un resultado de OFF sigue guardándolo en la base antes de usarlo (comportamiento existente, sin cambios).
- El diálogo de editar/eliminar no permite arrastrar la entrada mientras está abierto (ya es automático: un diálogo modal bloquea los gestos de la fila debajo).
- Mover una entrada de comida por drag-and-drop no cambia cantidad, alimento/receta ni fecha — solo `mealType` (regla ya existente, sin cambios). La actualización optimista debe revertirse (refetch del día) si la acción del servidor falla.

## Criterios de aceptación

- [ ] En los tres selectores de alimento (agregar a comida, ingrediente de receta, `/foods`), hay una sola pestaña de búsqueda que mezcla guardados y OFF.
- [ ] Ya no existe el ícono de basurero en las entradas del dashboard; click/tap en una entrada abre un diálogo con cantidad editable y botón eliminar.
- [ ] El swipe hacia la izquierda en mobile sigue eliminando la entrada sin pasar por el diálogo.
- [ ] Arrastrar una entrada a otra comida la mueve visualmente de inmediato, sin esperar al servidor.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
