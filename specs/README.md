# Convención de specs

Cada feature no trivial (la que toca varios archivos o implica una decisión de diseño) tiene su spec en este directorio antes de escribir código, según la metodología descrita en [`CLAUDE.md`](../CLAUDE.md).

## Numeración

- Archivo: `NNN-nombre-feature.md`, con `NNN` como número secuencial de 3 dígitos (`001`, `002`, `003`, ...).
- El número lo asigna el siguiente correlativo disponible al momento de crear el spec (mirar el último `NNN` existente en este directorio).
- Los números no se reutilizan, incluso si un spec se abandona o se descarta.
- `nombre-feature` en kebab-case, corto y descriptivo (ej. `barcode-lookup`, `receta-calculo-nutrientes`, `registro-comidas-diario`).

## Plantilla mínima

Todo spec debe incluir, como mínimo, estas secciones:

```markdown
# NNN - Nombre de la feature

## Qué debe hacer

Descripción funcional de la feature, desde la perspectiva de uso.

## Reglas de negocio

Reglas, restricciones y casos especiales que la implementación debe respetar.

## Criterios de aceptación

Lista verificable de condiciones que determinan si la feature está bien implementada.
```

## Ciclo de vida

1. Se redacta el spec y se presenta al usuario.
2. Se espera confirmación explícita del contenido del spec.
3. Recién ahí se pasa a la etapa de plan técnico (fuera de este documento, ver `CLAUDE.md`).
