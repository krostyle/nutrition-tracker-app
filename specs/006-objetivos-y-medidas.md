# 006 - Objetivos y medidas corporales

## Qué debe hacer

Reemplazar la meta manual actual (cargar calorías y macros a mano) por un flujo que **calcula una recomendación** a partir de datos del usuario, organizados en dos secciones dentro de "Metas":

### Sección "Objetivos"

Datos de perfil, editables en cualquier momento (un único registro vigente, como la meta actual):

- Sexo biológico (macho/hembra — necesario para las fórmulas de abajo).
- Edad.
- Estatura (cm).
- Nivel de actividad física (sedentario / liviano / moderado / activo / muy activo).
- Objetivo: bajar grasa / mantener / subir músculo.

> Nota: sexo y edad no los mencionaste explícitamente, pero son imprescindibles para cualquier fórmula estándar de calorías (Mifflin-St Jeor) y para el método de estimación de grasa corporal — sin esos dos datos no se puede calcular nada de lo que sigue.

### Sección "Medidas"

Un **historial** de mediciones corporales (cada carga queda guardada con su fecha, para ver progreso en el tiempo):

- Peso (kg).
- Cuello (cm).
- Cintura (cm).
- Cadera (cm) — solo aplica si el sexo es hembra.

### Recomendación

Con el perfil (Objetivos) y la medición más reciente (Medidas), se calcula y muestra:

- **% de grasa corporal estimado** (método Navy — cinta métrica, sin equipo especial).
- **Gasto calórico estimado** (metabolismo basal × nivel de actividad).
- **Calorías y macros recomendados** según el objetivo elegido.

Esta recomendación se muestra como sugerencia — el usuario decide si la aplica como su meta activa (pudiendo ajustarla antes de guardar), no se sobreescribe la meta sola.

## Reglas de negocio

### Fórmulas

- **Metabolismo basal (BMR)** — Mifflin-St Jeor:
  - Hombre: `10×peso(kg) + 6.25×estatura(cm) − 5×edad + 5`
  - Mujer: `10×peso(kg) + 6.25×estatura(cm) − 5×edad − 161`
- **Gasto calórico total (TDEE)** = BMR × multiplicador según nivel de actividad (sedentario 1.2, liviano 1.375, moderado 1.55, activo 1.725, muy activo 1.9).
- **Calorías objetivo** según el objetivo elegido:
  - Bajar grasa: TDEE − 500
  - Mantener: TDEE
  - Subir músculo: TDEE + 300
- **Macros recomendados**: proteína 2.0 g/kg de peso, grasa 0.8 g/kg de peso, carbohidratos = el resto de las calorías objetivo.
- **% de grasa corporal** — método Navy (todas las medidas en cm):
  - Hombre: `495 / (1.0324 − 0.19077×log10(cintura−cuello) + 0.15456×log10(estatura)) − 450`
  - Mujer: `495 / (1.29579 − 0.35004×log10(cintura+cadera−cuello) + 0.22100×log10(estatura)) − 450`

Estas fórmulas son **cálculo crítico de dominio** (igual que el cálculo de nutrientes de recetas) → TDD obligatorio.

### Otras reglas

- El % de grasa corporal se calcula siempre a partir de la medición más reciente — no se guarda como valor aparte, se deriva en el momento.
- Sin una medición cargada todavía, no hay recomendación posible — se muestra un estado vacío indicando qué falta cargar.
- Aplicar la recomendación como meta actualiza el mismo registro de `Goal` que ya existe hoy (calorías/proteína/carbohidratos/grasa) — no se duplica el concepto de meta.
- La meta se puede seguir editando a mano después de aplicar una recomendación (no queda "bloqueada" al valor calculado).

## Criterios de aceptación

- [ ] Existe una sección "Objetivos" donde cargar/editar sexo, edad, estatura, nivel de actividad y tipo de objetivo.
- [ ] Existe una sección "Medidas" donde cargar una nueva medición (peso, cuello, cintura, cadera si corresponde) y ver el historial de mediciones anteriores.
- [ ] Con perfil + al menos una medición cargados, se muestra el % de grasa corporal estimado, el gasto calórico estimado, y las calorías/macros recomendados según el objetivo.
- [ ] El usuario puede aplicar la recomendación como su meta activa, pudiendo ajustar los valores antes de guardar.
- [ ] Sin mediciones cargadas, se indica claramente qué falta para poder calcular la recomendación.
- [ ] Las funciones de cálculo (BMR/TDEE/calorías objetivo/macros/% de grasa corporal) tienen tests unitarios (TDD, rojo→verde).
- [ ] `npm run build` y `npm run lint` pasan sin errores.
- [ ] La migración de Prisma que agrega `Profile` y `BodyMeasurement` está aplicada y versionada.
