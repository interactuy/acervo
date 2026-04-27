# Acervo

Base inicial de la web app publica para museos, artistas, obras, exposiciones y mapa cultural.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Mapbox

## Desarrollo

```bash
npm run dev
```

La estructura vive en raiz, sin carpeta `src`.

## Estructura

- `app/`: rutas y layouts de Next.js.
- `components/`: componentes reutilizables y shadcn/ui.
- `modules/`: modulos funcionales por dominio.
- `lib/`: utilidades e integraciones.
- `hooks/`: hooks compartidos.
- `types/`: tipos globales.
- `styles/`: tokens y estilos base.

## Variables

Copiar `.env.example` a `.env.local` cuando se definan las credenciales de Supabase y Mapbox.

Para persistencia real del admin:

1. Ejecutar `supabase/acervo-schema.sql` en el SQL editor del proyecto Supabase.
2. Definir `SUPABASE_SERVICE_ROLE_KEY` solo en el entorno server/deploy.
3. Cargar el seed inicial con:

```bash
npm run seed:supabase
```

El admin guarda en `public.acervo_content` y sube imagenes al bucket
`acervo-media`. En desarrollo, si falta la service role key, el proyecto sigue
usando `data/seed/mnav-v1.json` como respaldo local.
