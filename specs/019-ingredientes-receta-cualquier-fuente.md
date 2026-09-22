# 019 - Ingredientes de receta desde cualquier fuente

## Qué debe hacer

Al crear o editar una receta, el buscador de ingredientes solo permitía elegir alimentos ya guardados en la librería. Ahora se puede agregar un ingrediente igual que se agrega un alimento a una comida: buscando por nombre (Open Food Facts/USDA), escaneando un código de barras, o cargándolo a mano — y si el alimento todavía no estaba guardado, se guarda automáticamente en la librería al usarlo como ingrediente.

## Reglas de negocio

- Una receta solo puede referenciar alimentos ya persistidos (`RecipeIngredient.foodId` apunta a un `Food` real) — por eso cualquier alimento externo (OFF/USDA) o manual se guarda primero, y recién con ese `Food` ya creado se agrega como ingrediente.
- Se reutiliza toda la lógica de búsqueda/escaneo/carga manual ya construida para el selector de agregar a una comida (`meal-food-picker.tsx`), extraída a un módulo compartido (`food-picker-tabs.tsx`) para no duplicar código — sin cambiar el comportamiento de ese flujo existente.
- El selector de ingredientes es su propio diálogo (`RecipeIngredientPicker`), separado del `<form>` de la receta, para que un envío interno (la pestaña Manual tiene su propio formulario) nunca dispare por error el envío del formulario de la receta completo.
- No incluye la pestaña "Recetas" del selector de comidas — una receta no puede tener otra receta como ingrediente.

## Criterios de aceptación

- [ ] Al crear o editar una receta, "Agregar ingrediente" abre un selector con las mismas opciones que agregar a una comida (Guardados/Buscar/Escanear/Manual).
- [ ] Elegir un resultado de búsqueda (OFF/USDA) que no estaba guardado lo guarda en la librería y lo agrega como ingrediente con 100 g por defecto, editable.
- [ ] Cargar un ingrediente a mano lo crea como alimento guardado y lo agrega con la cantidad indicada.
- [ ] El selector de agregar a una comida sigue funcionando exactamente igual que antes (sin regresiones tras la extracción de código compartido).
- [ ] `npm run build` y `npm run lint` pasan sin errores.
