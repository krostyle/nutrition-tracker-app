# 003 - Recetas

## Qué debe hacer

Permitir al usuario:

- Crear una receta: nombre, número de porciones, y una lista de ingredientes (cada uno un alimento existente, buscado/cargado según spec 001, con su cantidad en gramos).
- Ver el detalle de una receta: sus ingredientes, el total nutricional de la receta y el nutricional por porción, calculados automáticamente.
- Editar una receta: agregar/quitar ingredientes, cambiar cantidades, cambiar el número de porciones o el nombre — el cálculo se actualiza solo.
- Eliminar una receta.

**Fuera de alcance de este spec**: loguear una receta como entrada del registro diario (spec 002). Eso implica extender `FoodLogEntry` para aceptar recetas además de alimentos sueltos, y queda para un spec futuro.

## Reglas de negocio

- Una receta (`Recipe`) tiene: nombre, número de porciones (entero positivo) y una lista de ingredientes (`RecipeIngredient`), cada uno referenciando un `Food` existente + cantidad en gramos.
- Una receta requiere **al menos un ingrediente** para poder guardarse.
- El cálculo de nutrientes reutiliza la misma función de agregación de la spec 002 (`aggregateNutrients`) sobre la lista de ingredientes → total de la receta. El valor **por porción** es ese total dividido por el número de porciones.
- El cálculo **no se persiste**: se recalcula siempre en el momento a partir de los `Food` actuales de cada ingrediente y del número de porciones vigente (mismo criterio que las entradas del registro diario). Si se corrige un `Food` usado como ingrediente, el cálculo de la receta refleja el cambio automáticamente sin ninguna acción extra.

## Criterios de aceptación

- [ ] El usuario puede crear una receta con nombre, porciones y al menos un ingrediente (alimento existente + gramos).
- [ ] El usuario puede ver el detalle de una receta con el total nutricional y el nutricional por porción, calculados automáticamente.
- [ ] El usuario puede editar los ingredientes, las porciones o el nombre de una receta, y el cálculo se actualiza.
- [ ] El usuario puede eliminar una receta.
- [ ] No se puede guardar una receta sin al menos un ingrediente.
- [ ] La función de cálculo de nutrientes de receta (ingredientes + porciones → total y por porción) tiene tests unitarios (TDD, rojo→verde): receta con varios ingredientes, división por porciones, ingrediente con nutrientes opcionales faltantes.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] La migración de Prisma que agrega `Recipe` y `RecipeIngredient` está aplicada y versionada.
