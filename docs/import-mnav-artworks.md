# Import MNAV Artworks

Script: `scripts/import-mnav-artworks.mjs`

## Mapeo

| CSV | Acervo artworks |
| --- | --- |
| `ID` | `externalId`, `inventoryNumber`, `sourceUrl = https://mnav.gub.uy/cms.php?o=<ID>` |
| `NAUTOR` | `artistId`, resuelto contra `artists.externalId` o `artists.sourceUrl` con `?a=<NAUTOR>` |
| `TITULO` | `title` |
| `REALIZ` | `yearLabel`, `year`, `yearStart`, `yearEnd` |
| `TEC` | `technique` |
| `ALTO` | `heightCm` |
| `ANCHO` | `widthCm` |
| `PROF` | `depthCm` |
| `UBICACION` | `locationNote`, `location` |
| `EXHIBICION` | `exhibitionStatus` |
| `IMAGEN` | `imageSrc`, `imageUrl` |
| `MODIFICADO` | `modifiedAt` |

Campos sin dato explícito en el CSV quedan `null`: `summary` y `description`. `museumId` queda asociado al MNAV (`museum-mnav`) para este dataset.

## Comandos

Dry-run progresivo:

```bash
npm run import:artworks -- --file /Users/danielmaya/Downloads/obras.csv --limit 50
npm run import:artworks -- --file /Users/danielmaya/Downloads/obras.csv --limit 500
npm run import:artworks -- --file /Users/danielmaya/Downloads/obras.csv
```

Import completo:

```bash
npm run import:artworks -- --file /Users/danielmaya/Downloads/obras.csv --apply
```

El script escribe sobre `acervo_content.data.artworks`, que es la estructura que hoy lee la app. Hace merge por `externalId`/`inventoryNumber`, preserva campos curatoriales ya cargados (`summary`, `description`, `isPublished`) y no pisa una imagen existente si parece una imagen subida manualmente.
