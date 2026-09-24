# 020 - Diferenciar comidas y arrastrar alimentos entre ellas

## Qué debe hacer

Dos problemas del dashboard cuando hay varias entradas por comida:

1. **Difícil diferenciar dónde termina una comida y empieza otra** — antes todas las comidas estaban en una sola lista con líneas divisorias finas entre secciones, que se perdían visualmente con muchas entradas.
2. **No se podía mover un alimento de una comida a otra** — para cambiarlo había que eliminarlo y volver a agregarlo a mano.

Se resuelven juntos: cada comida pasa a ser su propia card, con un ícono y color distintivo (Desayuno ámbar, Almuerzo verde, Cena violeta, Snack rosado — mismo lenguaje de color que ya se usa en otras partes de la app), y cada entrada tiene una manija para arrastrarla y soltarla en otra comida, tanto con mouse (desktop) como con el dedo (mobile).

## Reglas de negocio

- Arrastrar una entrada a otra comida solo cambia su `mealType` — la cantidad, el alimento/receta referenciado y la fecha no cambian.
- Si se suelta en la misma comida de origen, o fuera de cualquier comida, no pasa nada.
- El drag funciona con mouse y con touch usando el mismo sensor (`PointerSensor` de `@dnd-kit/core`), con un umbral de distancia mínimo antes de activarse para no interferir con toques/clics normales sobre la fila (editar, eliminar).

## Criterios de aceptación

- [ ] Cada comida se ve como una card propia con ícono y color distintivo, tanto en mobile como en desktop.
- [ ] Se puede arrastrar una entrada desde su comida y soltarla en otra comida, y el cambio queda guardado.
- [ ] Mientras se arrastra, la comida sobre la que se pasa el puntero se resalta como destino.
- [ ] Funciona igual con mouse (desktop) y con touch (mobile) — verificado de punta a punta en ambos, con el cambio confirmado en la base de datos.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
