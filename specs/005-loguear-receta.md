# 005 - Loguear receta en el registro diario

## Qué debe hacer

Permitir registrar que se comió una receta (o una cantidad de porciones de ella) en una comida del día, desde el mismo flujo de "+" por comida (spec 004), igual que se hace hoy con un alimento suelto.

- El selector de "+" por comida suma una pestaña **"Recetas"** para buscar entre las recetas ya creadas.
- Al elegir una receta, se indica la **cantidad de porciones** consumidas (puede ser fraccionaria, ej. 0.5) en vez de gramos.
- La entrada resultante se ve, se edita y se elimina igual que una entrada de alimento suelto.
- Los totales del día combinan correctamente entradas de alimentos sueltos (en gramos) y de recetas (en porciones).

## Reglas de negocio

- Una entrada del registro diario (`FoodLogEntry`) referencia **un alimento o una receta, nunca ambos ni ninguno**. Esto requiere extender el modelo actual (hoy `foodId` es obligatorio) para aceptar también `recipeId`, con la exclusividad validada en la capa de persistencia (Prisma no expresa un XOR nativamente).
- Cuando la entrada es de un alimento: la cantidad se expresa en **gramos** (comportamiento actual, sin cambios).
- Cuando la entrada es de una receta: la cantidad se expresa en **porciones**, y sus nutrientes son `nutriente_por_porción × cantidad_de_porciones` (reutilizando el cálculo de la spec 003).
- El cálculo de totales del día debe combinar ambos tipos de entrada en un mismo total — esto es una extensión de la lógica de agregación existente (spec 002) y cuenta como **cálculo crítico de dominio → TDD obligatorio**.
- Si se borra una receta que tiene entradas de registro asociadas, esas entradas quedan huérfanas de una forma controlada (a definir en el plan: impedir el borrado, o eliminar en cascada) — no puede quedar una entrada del día apuntando a una receta inexistente.

## Criterios de aceptación

- [ ] El selector "+" por comida permite buscar y elegir entre las recetas ya creadas.
- [ ] Se puede agregar una receta a una comida indicando la cantidad de porciones.
- [ ] La entrada de receta muestra su nombre y los nutrientes correspondientes a la cantidad de porciones indicada.
- [ ] El total del día incluye correctamente los nutrientes de las entradas de receta junto con las de alimentos sueltos.
- [ ] Se puede editar la cantidad de porciones de una entrada de receta ya cargada.
- [ ] Se puede eliminar una entrada de receta.
- [ ] Borrar una receta con entradas asociadas no deja el registro diario en un estado roto.
- [ ] La función que combina nutrientes de alimentos (por gramos) y recetas (por porciones) para el total del día tiene tests unitarios (TDD, rojo→verde).
- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] La migración de Prisma que extiende `FoodLogEntry` para soportar recetas está aplicada y versionada.
