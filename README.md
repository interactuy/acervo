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
