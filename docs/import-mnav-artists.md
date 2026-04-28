# Import MNAV Artists

Script: `scripts/import-mnav-artists.mjs`

## Mapeo

| CSV | Acervo artists |
| --- | --- |
| `NRO` | `externalId` y `sourceUrl = https://mnav.gub.uy/cms.php?a=<NRO>` |
| `NOMAPE` | `name` |
| `NACE` | `birthYear` |
| `MUERE` | `deathYear` |
| `LUGAR_NACE` | `birthPlace` |
| `LUGAR_MUERE` | `deathPlace` |
| `BIO` | `description` y `summary` |

Campos sin dato explícito en el CSV quedan `null` o vacíos: `nationality`, `portrait`, `heroArtworkId`, `featuredArtworkId`, `featuredArtworkIds`, `relatedArtistIds`, `collectionSourceUrl`.

## Comandos

Dry-run con muestra:

```bash
npm run import:artists -- --file /Users/danielmaya/Downloads/artistas.csv --limit 20
```

Import completo:

```bash
npm run import:artists -- --file /Users/danielmaya/Downloads/artistas.csv --apply
```

El script escribe sobre `acervo_content.data.artists`, que es la estructura que hoy lee la app. Hace merge por `slug` y preserva campos curatoriales cargados manualmente.
