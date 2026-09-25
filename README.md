# nutrition-tracker-app

App de tracking nutricional de uso personal (single-user), estilo Fitia. Web app responsive/PWA con un único codebase para desktop y mobile.

Permite:
- Buscar alimentos por código de barras o por nombre (Open Food Facts, USDA FoodData Central, o carga manual).
- Registrar las comidas del día contra metas de calorías y macros.
- Crear alimentos y recetas propias, con cálculo automático de nutrientes a partir de sus ingredientes.

## Stack

- Next.js 16 (App Router) + TypeScript
- Postgres (Neon) + Prisma
- Clerk (auth)
- Tailwind CSS + shadcn/ui
- Deploy en Vercel

## Metodología de trabajo

Este proyecto sigue un flujo spec-driven (spec → plan → código). Ver [`CLAUDE.md`](CLAUDE.md) para el detalle completo, y [`specs/README.md`](specs/README.md) para la convención de specs.

## Desarrollo local

### Variables de entorno

Copiar `.env.example` a `.env` y completar:

- `DATABASE_URL` — connection string de Postgres en Neon.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — credenciales de Clerk.
- `USDA_FDC_API_KEY` — API key gratuita de USDA FoodData Central.

### Comandos

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

- `npm run build` — build de producción.
- `npm run lint` — lint del proyecto.
