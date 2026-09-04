# 002 - Registro diario de comidas y metas

## Qué debe hacer

Permitir al usuario:

- Definir sus metas diarias de calorías y macros (proteína, carbohidratos, grasa).
- Registrar entradas de comida a lo largo del día: elegir un alimento ya existente en la base (buscado/cargado según spec 001), indicar la cantidad en gramos y a qué comida del día corresponde (desayuno, almuerzo, cena, snack).
- Ver un dashboard del día actual con el total consumido (calorías y cada macro) comparado contra la meta, agrupado por tipo de comida.
- Editar la cantidad de una entrada ya cargada, o eliminarla.
- Navegar a otros días (anterior/posterior) y ver el registro de ese día.

## Reglas de negocio

### Metas

- Existe un único registro de metas vigente (no hay historial de metas por fecha — se simplifica dado que es una app single-user). Campos: `calories`, `protein`, `carbs`, `fat` (los cuatro obligatorios al guardar la meta).
- Si el usuario todavía no definió metas, el dashboard funciona igual (muestra lo consumido) pero indica que no hay meta configurada, con acceso directo a definirla.
- Editar la meta reemplaza el valor vigente; no afecta cómo se ven los días pasados más que en el número contra el que se comparan (no se guarda una meta "histórica" por día).

### Entradas de comida (`FoodLogEntry`)

Cada entrada tiene: alimento (`Food` existente), cantidad en gramos, tipo de comida (`BREAKFAST` | `LUNCH` | `DINNER` | `SNACK`), y fecha (día calendario, sin hora).

- Los nutrientes de una entrada **no se guardan duplicados**: se calculan siempre en el momento a partir de `food.nutriente_por_100g × gramos / 100`. Si el usuario corrige después los valores de un `Food` manual, las entradas ya cargadas reflejan el valor corregido.
- El total del día es la suma de esa fórmula sobre todas las entradas de ese día. Esta agregación es la misma lógica que después usará el cálculo de recetas (spec futura) → **TDD obligatorio** para la función de agregación, por tratarse de cálculo crítico de dominio (ver CLAUDE.md).
- Una entrada pertenece a un solo día y un solo tipo de comida.

### Navegación por día

- Por defecto el dashboard muestra el día actual (fecha del navegador del usuario, sin manejo de zonas horarias adicional — single-user).
- Se puede ir al día anterior/siguiente. Un día sin entradas se muestra vacío, no es un error.

## Criterios de aceptación

- [ ] El usuario puede definir/editar sus metas de calorías, proteína, carbohidratos y grasa.
- [ ] El usuario puede agregar una entrada de comida eligiendo un alimento existente, con gramos y tipo de comida, para el día que está viendo.
- [ ] El dashboard muestra el total consumido del día (calorías + cada macro) vs la meta vigente, con lo que resta o el exceso.
- [ ] Las entradas del día se agrupan visualmente por tipo de comida.
- [ ] El usuario puede editar los gramos de una entrada o eliminarla, y el total del día se recalcula.
- [ ] El usuario puede navegar a un día anterior o posterior y ver (o no) las entradas correspondientes.
- [ ] Sin metas configuradas, el dashboard sigue mostrando lo consumido y ofrece definir la meta.
- [ ] La función de agregación de nutrientes (alimento × gramos → total) tiene tests unitarios (TDD, rojo→verde): suma de varias entradas, entrada con nutrientes opcionales faltantes, día sin entradas (total en cero).
- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] La migración de Prisma que agrega `Goal` y `FoodLogEntry` está aplicada y versionada.
