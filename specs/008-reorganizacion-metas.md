# 008 - Reorganización de Metas y peso objetivo

## Qué debe hacer

Reorganizar la sección "Metas" (`/goals`) en tres pestañas con significados distintos y sin solapamiento semántico, y agregar el peso objetivo que hoy falta.

Hoy la pestaña "Objetivos" contiene mayormente datos de perfil (sexo, edad, estatura, nivel de actividad), que no son un objetivo; y "Meta" y "Objetivos" son prácticamente sinónimos, lo que hace confuso saber qué se edita en cada una.

### Pestaña "Meta diaria" (hoy "Meta")

Sin cambios funcionales: calorías y macros objetivo del día, panel de recomendación (grasa corporal estimada, BMR, TDEE, calorías y macros sugeridos) con "Aplicar como meta", y el formulario manual editable.

### Pestaña "Objetivo" (reemplaza a "Objetivos")

Contiene solo lo que es genuinamente un objetivo:

- Qué querés lograr: bajar grasa / mantener / subir músculo (ya existe).
- **Peso objetivo (kg)** — campo nuevo.

Los datos biométricos (sexo, edad, estatura, nivel de actividad) salen de esta vista y pasan a un diálogo "Editar mis datos", accesible desde un botón en esta misma pestaña. Arriba se muestra un resumen de una línea de esos datos, para no esconderlos por completo (ej. "Hombre · 30 años · 180 cm · Actividad moderada").

### Pestaña "Progreso" (hoy "Medidas")

- El historial de mediciones tal como está hoy: lista como contenido principal y botón "Agregar medición" que abre el diálogo de carga.
- Nuevo: un encabezado con el peso actual (última medición), el peso objetivo y la diferencia pendiente (ej. "85 kg → 80 kg · faltan 5 kg").

## Reglas de negocio

- El peso objetivo es **opcional**: sin él, la app funciona igual que hoy y "Progreso" simplemente no muestra la comparación.
- El peso objetivo **no cambia el cálculo de la recomendación**, que sigue derivándose de perfil + medición más reciente + tipo de objetivo. Es información de seguimiento, no un input de las fórmulas.
- La diferencia pendiente se calcula contra la medición más reciente (`peso objetivo − peso actual`), indicando si falta bajar o subir.
- Si no hay ninguna medición cargada, no se muestra la comparación: no hay peso actual con qué comparar.
- Editar los datos biométricos desde el diálogo sigue guardando en el mismo registro `Profile` (singleton) — no se duplica el concepto de perfil.
- Los nombres de las pestañas no deben ser sinónimos entre sí: "Meta diaria" es el resultado del día, "Objetivo" es a dónde se quiere llegar, "Progreso" es dónde se está.

## Criterios de aceptación

- [ ] `/goals` tiene tres pestañas: "Meta diaria", "Objetivo" y "Progreso".
- [ ] "Objetivo" muestra solo el tipo de objetivo y el peso objetivo, más un resumen de una línea de los datos biométricos.
- [ ] Desde "Objetivo" se pueden editar sexo, edad, estatura y nivel de actividad en un diálogo, y los cambios se reflejan al cerrarlo.
- [ ] El peso objetivo se persiste y se recupera al recargar la página.
- [ ] "Progreso" muestra peso actual, peso objetivo y cuánto falta cuando ambos existen, y lo omite si falta alguno.
- [ ] La recomendación de calorías y macros sigue funcionando igual que antes.
- [ ] La barra flotante inferior de mobile refleja las tres pestañas con sus íconos.
- [ ] La migración de Prisma que agrega el peso objetivo está aplicada y versionada.
- [ ] `npm run build` y `npm run lint` pasan sin errores.
