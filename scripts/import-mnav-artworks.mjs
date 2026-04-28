import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const MNAV_ARTWORK_URL = "https://mnav.gub.uy/cms.php?o=";
const REQUIRED_COLUMNS = [
  "ID",
  "NAUTOR",
  "TITULO",
  "REALIZ",
  "ALTO",
  "ANCHO",
  "PROF",
  "TEC",
  "UBICACION",
  "EXHIBICION",
  "IMAGEN",
  "MODIFICADO",
];

const MUSEUM_ID_BY_LOCATION_NOTE = new Map([
  [
    "Prestado: Museo Dep. de San José",
    "museum-museo-de-bellas-artes-de-san-jose",
  ],
  [
    "Prestado: Salto (Pcio. Gallino/Mus.B.Artes)",
    "museum-museo-gallino",
  ],
  [
    "Prestado: Museo de Artes Decorativas - Palacio Taranco",
    "museum-museo-de-artes-decorativas-palacio-taranco",
  ],
  [
    "Prestado: Museo Histórico Nacional",
    "museum-museo-historico-nacional",
  ],
  ["Prestado: Casa Montero", "museum-museo-romantico-casa-montero"],
  ["Prestado: Museo de Durazno", "museum-museo-de-arte-gonzalez-posse"],
  [
    "Prestado: Mercedes, Mus. Bibl. Eusebio Giménez",
    "museum-pinacoteca-museo-eusebio-gimenez",
  ],
  [
    "Prestado: Museo de Flores",
    "museum-museo-historico-departamental-fernando-gutierrez",
  ],
  ["Prestado: Museo Figari", "museum-museo-figari"],
  [
    "Prestado: Río Negro (Mus. Bibl. Mun. F. Bentos)",
    "museum-museo-luis-alberto-solari",
  ],
  [
    "Prestado: Palacio Estévez",
    "museum-museo-de-la-casa-de-gobierno-palacio-estevez",
  ],
  ["Prestado: Museo Treinta y Tres", "museum-museo-agustin-araujo"],
  [
    "Prestado: Museo Municipal J. M. Blanes",
    "museum-museo-de-bellas-artes-juan-manuel-blanes",
  ],
  [
    "Prestado: Museo Regional. de Maldonado",
    "museum-museo-regional-francisco-mazzoni",
  ],
  [
    "Prestado: Mercedes(Mus. Paleont. y C. Naturales)",
    "museum-museo-paleontologico-alejandro-berro",
  ],
  [
    "Prestado: Museo Agustín Araujo - Treinta y Tres",
    "museum-museo-agustin-araujo",
  ],
  [
    "Prestado: Espacio de Arte Contemporáneo",
    "museum-espacio-de-arte-contemporaneo",
  ],
  [
    "Prestado: Museo Blandengues de Artigas",
    "museum-museo-blandengues-de-artigas",
  ],
]);

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const env = {
  ...loadEnvFile(path.join(process.cwd(), ".env.local")),
  ...process.env,
};
const contentId = args.contentId ?? env.SUPABASE_ACERVO_CONTENT_ID ?? "production";
const csvPath = args.file
  ? path.resolve(args.file)
  : env.ARTWORKS_CSV_PATH
    ? path.resolve(env.ARTWORKS_CSV_PATH)
    : null;

if (!csvPath) {
  throw new Error("Falta --file <ruta-del-csv> o ARTWORKS_CSV_PATH.");
}

if (!existsSync(csvPath)) {
  throw new Error(`No existe el archivo CSV: ${csvPath}`);
}

const csvText = readFileSync(csvPath, args.encoding ?? "latin1");
const parsedRows = parseMnavArtworksCsv(csvText);
const candidateRows = Number.isFinite(args.limit)
  ? parsedRows.slice(0, args.limit)
  : parsedRows;
const seed = await readSupabaseSeed();
const museum = resolveMnavMuseum(seed);
const artistIndex = buildArtistIndex(seed.artists ?? []);
const mappedRows = candidateRows.map((row, index) =>
  mapCsvRowToArtwork(row, index + 2, {
    artistIndex,
    museumId: museum.id,
  }),
);
const invalidRows = mappedRows.filter((item) => item.errors.length > 0);
const validRows = mappedRows.filter((item) => item.errors.length === 0);
const selectedArtworks = uniquifyImportedSlugs(
  validRows.map((item) => item.artwork),
);
const mergePreview = mergeArtworks(seed.artworks ?? [], selectedArtworks);

printImportReport({
  parsedRows,
  candidateRows,
  validRows,
  invalidRows,
  selectedArtworks,
  mergePreview,
  artistIndex,
  museum,
});

if (!args.apply) {
  console.log("\nDry-run: no se escribió en Supabase. Repetí con --apply para importar.");
  process.exit(0);
}

const nextSeed = {
  ...seed,
  artworks: mergePreview.artworks,
  meta: {
    ...seed.meta,
    generatedAt: new Date().toISOString(),
  },
};

await writeSupabaseSeed(nextSeed);

console.log(
  `\nImport aplicado en Supabase row "${contentId}": ${mergePreview.created} creadas, ${mergePreview.updated} actualizadas, ${mergePreview.unchanged} sin cambios.`,
);

async function readSupabaseSeed() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("acervo_content")
    .select("data")
    .eq("id", contentId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer acervo_content: ${error.message}`);
  }

  if (!data?.data || typeof data.data !== "object") {
    throw new Error(`No existe acervo_content "${contentId}" o no tiene data.`);
  }

  return data.data;
}

async function writeSupabaseSeed(seed) {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("acervo_content").upsert(
    {
      id: contentId,
      data: seed,
      updated_at: seed.meta.generatedAt,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`No se pudo escribir acervo_content: ${error.message}`);
  }
}

function createSupabaseClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function parseMnavArtworksCsv(csvText) {
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ""), ";").filter((row) =>
    row.some((value) => normalizeText(value)),
  );

  if (rows.length === 0) {
    throw new Error("El CSV está vacío.");
  }

  const headers = rows[0].map((value) => normalizeText(value));

  if (
    headers.length !== REQUIRED_COLUMNS.length ||
    REQUIRED_COLUMNS.some((column, index) => headers[index] !== column)
  ) {
    throw new Error(
      `Columnas inesperadas. Recibidas: ${headers.join(", ")}. Esperadas: ${REQUIRED_COLUMNS.join(", ")}.`,
    );
  }

  return rows.slice(1).map((row, rowIndex) => {
    if (row.length !== REQUIRED_COLUMNS.length) {
      throw new Error(
        `Línea ${rowIndex + 2}: se esperaban ${REQUIRED_COLUMNS.length} columnas y llegaron ${row.length}.`,
      );
    }

    return Object.fromEntries(
      REQUIRED_COLUMNS.map((column, columnIndex) => [column, row[columnIndex]]),
    );
  });
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        value += character;
      }

      continue;
    }

    if (character === '"') {
      quoted = true;
      continue;
    }

    if (character === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (character === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    if (character === "\r") {
      continue;
    }

    value += character;
  }

  if (quoted) {
    throw new Error("CSV inválido: campo entre comillas sin cerrar.");
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function resolveMnavMuseum(seed) {
  const museum =
    seed.museums?.find((item) => item.id === "museum-mnav") ??
    seed.museums?.find((item) => item.slug === "mnav");

  if (!museum) {
    throw new Error("No encontré el museo MNAV en data.museums.");
  }

  return museum;
}

function buildArtistIndex(artists) {
  const buckets = new Map();

  artists.forEach((artist) => {
    addArtistKey(buckets, normalizeNumericId(artist.externalId), artist);
    addArtistKey(
      buckets,
      normalizeNumericId(readQueryParam(artist.sourceUrl, "a")),
      artist,
    );
  });

  const byExternalId = new Map();
  const ambiguousKeys = [];

  buckets.forEach((artistBucket, key) => {
    const uniqueArtists = Array.from(artistBucket.values());

    if (uniqueArtists.length === 1) {
      byExternalId.set(key, uniqueArtists[0]);
      return;
    }

    ambiguousKeys.push({ key, artists: uniqueArtists });
  });

  return {
    byExternalId,
    ambiguousKeys,
  };
}

function addArtistKey(buckets, value, artist) {
  const key = normalizeNumericId(value);

  if (!key) {
    return;
  }

  if (!buckets.has(key)) {
    buckets.set(key, new Map());
  }

  buckets.get(key).set(artist.id, artist);
}

function mapCsvRowToArtwork(row, lineNumber, context) {
  const errors = [];
  const warnings = [];
  const externalId = normalizeExternalId(row.ID);
  const artistExternalId = normalizeNumericId(row.NAUTOR);
  const title = optionalText(row.TITULO);
  const yearLabel = optionalText(row.REALIZ);
  const yearRange = parseYearRange(yearLabel);
  const heightCm = parseDimension(row.ALTO);
  const widthCm = parseDimension(row.ANCHO);
  const depthCm = parseDimension(row.PROF);
  const technique = optionalText(row.TEC);
  const locationNote = optionalText(row.UBICACION);
  const exhibitionStatus = optionalText(row.EXHIBICION);
  const imageSrc = normalizeUrl(row.IMAGEN);
  const modifiedAt = parseUnixTimestamp(row.MODIFICADO);
  const artist = context.artistIndex.byExternalId.get(artistExternalId);
  const slugBase = slugify(title ?? "");
  const externalSlug = slugify(externalId ?? `line-${lineNumber}`);
  const slug =
    externalId && slugBase ? `${slugBase}-${externalSlug}` : slugBase;

  if (!externalId) {
    errors.push("ID ausente.");
  }

  if (!artistExternalId) {
    errors.push("NAUTOR inválido o ausente.");
  } else if (!artist) {
    errors.push(`Artista no vinculado para NAUTOR=${artistExternalId}.`);
  }

  if (!title) {
    errors.push("TITULO ausente.");
  }

  if (!slug) {
    errors.push("No se pudo generar slug.");
  }

  if (!yearLabel) {
    warnings.push("REALIZ vacío.");
  } else if (!yearRange.yearStart) {
    warnings.push(`REALIZ sin año reconocible: ${yearLabel}`);
  }

  addDimensionWarning(warnings, "ALTO", row.ALTO, heightCm);
  addDimensionWarning(warnings, "ANCHO", row.ANCHO, widthCm);
  addDimensionWarning(warnings, "PROF", row.PROF, depthCm);

  if (!imageSrc) {
    warnings.push("IMAGEN vacía o inválida.");
  }

  const artwork = {
    id: `artwork-mnav-${externalSlug}`,
    externalId,
    slug,
    title: title ?? "",
    inventoryNumber: externalId ?? "",
    artistId: artist?.id ?? "",
    museumId: resolveMuseumIdForLocation(locationNote, context.museumId),
    year: yearLabel,
    yearLabel,
    yearStart: yearRange.yearStart,
    yearEnd: yearRange.yearEnd,
    technique,
    heightCm,
    widthCm,
    depthCm,
    dimensions: buildDimensionsLabel({ heightCm, widthCm, depthCm }),
    location: locationNote,
    locationNote,
    exhibitionStatus,
    imageUrl: imageSrc,
    imageSrc,
    summary: null,
    description: null,
    sourceUrl: externalId
      ? `${MNAV_ARTWORK_URL}${encodeURIComponent(externalId)}`
      : "",
    modifiedAt,
    isPublished: true,
  };

  return {
    artwork,
    errors,
    warnings,
    artistExternalId,
    lineNumber,
  };
}

function resolveMuseumIdForLocation(locationNote, fallbackMuseumId) {
  const normalizedLocation = normalizeText(locationNote);

  return MUSEUM_ID_BY_LOCATION_NOTE.get(normalizedLocation) ?? fallbackMuseumId;
}

function addDimensionWarning(warnings, column, rawValue, parsedValue) {
  if (normalizeText(rawValue) && parsedValue === null) {
    warnings.push(`${column} sin número reconocible: ${rawValue}`);
  }
}

function uniquifyImportedSlugs(artworks) {
  const seen = new Map();

  return artworks.map((artwork) => {
    const count = seen.get(artwork.slug) ?? 0;
    seen.set(artwork.slug, count + 1);

    if (count === 0) {
      return artwork;
    }

    return {
      ...artwork,
      slug: `${artwork.slug}-${count + 1}`,
    };
  });
}

function mergeArtworks(existingArtworks, importedArtworks) {
  const existingByExternalId = new Map();

  existingArtworks.forEach((artwork) => {
    const externalId = getArtworkExternalId(artwork);

    if (externalId && !existingByExternalId.has(externalId)) {
      existingByExternalId.set(externalId, artwork);
    }
  });

  const importedExternalIds = new Set();
  const mergedById = new Map(existingArtworks.map((artwork) => [artwork.id, artwork]));
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  importedArtworks.forEach((importedArtwork) => {
    const externalId = getArtworkExternalId(importedArtwork);
    const existingArtwork = externalId
      ? existingByExternalId.get(externalId)
      : mergedById.get(importedArtwork.id);
    const mergedArtwork = mergeArtwork(existingArtwork, importedArtwork);

    if (!existingArtwork) {
      created += 1;
    } else if (JSON.stringify(existingArtwork) === JSON.stringify(mergedArtwork)) {
      unchanged += 1;
    } else {
      updated += 1;
    }

    importedExternalIds.add(externalId);
    mergedById.set(mergedArtwork.id, mergedArtwork);
  });

  const artworks = Array.from(mergedById.values()).sort((a, b) =>
    (getArtworkExternalId(a) ?? a.title).localeCompare(
      getArtworkExternalId(b) ?? b.title,
      "es",
      { numeric: true, sensitivity: "base" },
    ),
  );

  return {
    artworks,
    created,
    updated,
    unchanged,
    selectedExternalIds: importedExternalIds,
  };
}

function mergeArtwork(existingArtwork, importedArtwork) {
  if (!existingArtwork) {
    return importedArtwork;
  }

  const existingImage = existingArtwork.imageSrc ?? existingArtwork.imageUrl ?? null;
  const importedImage = importedArtwork.imageSrc ?? importedArtwork.imageUrl ?? null;
  const imageSrc = shouldPreserveExistingImage(existingImage)
    ? existingImage
    : importedImage ?? existingImage;

  return {
    ...existingArtwork,
    ...importedArtwork,
    id: existingArtwork.id,
    imageSrc,
    imageUrl: imageSrc,
    summary: existingArtwork.summary ?? importedArtwork.summary,
    description: existingArtwork.description ?? importedArtwork.description,
    isPublished: existingArtwork.isPublished ?? importedArtwork.isPublished,
  };
}

function shouldPreserveExistingImage(value) {
  if (!value) {
    return false;
  }

  return !(
    value.includes("acervo.mnav.gub.uy/invFotos") ||
    value.includes("mnav.gub.uy/img.php")
  );
}

function printImportReport({
  parsedRows,
  candidateRows,
  validRows,
  invalidRows,
  selectedArtworks,
  mergePreview,
  artistIndex,
  museum,
}) {
  const warningCount = validRows.reduce(
    (count, item) => count + item.warnings.length,
    0,
  );
  const warningSummary = summarizeWarnings(validRows);
  const unmatchedSummary = summarizeUnmatchedArtists(invalidRows);

  console.log("Mapeo MNAV CSV -> Acervo artworks");
  console.log("  ID -> externalId + inventoryNumber + sourceUrl");
  console.log("  TITULO -> title");
  console.log("  NAUTOR -> artistId por artists.externalId o sourceUrl ?a=");
  console.log("  REALIZ -> yearLabel/year/yearStart/yearEnd");
  console.log("  TEC -> technique");
  console.log("  ALTO/ANCHO/PROF -> heightCm/widthCm/depthCm + dimensions");
  console.log("  UBICACION -> locationNote/location");
  console.log("  EXHIBICION -> exhibitionStatus");
  console.log("  IMAGEN -> imageSrc/imageUrl");
  console.log("  MODIFICADO -> modifiedAt");
  console.log("  summary/description -> null si no hay dato explícito\n");

  console.log(`CSV total: ${parsedRows.length} filas`);
  console.log(`Filas evaluadas en esta corrida: ${candidateRows.length}`);
  console.log(`Válidas con artista vinculado: ${validRows.length}`);
  console.log(`Inválidas/no vinculadas: ${invalidRows.length}`);
  console.log(`Warnings en válidas: ${warningCount}`);
  console.log(`Artistas indexados por ID MNAV: ${artistIndex.byExternalId.size}`);
  console.log(`Artistas con ID MNAV ambiguo: ${artistIndex.ambiguousKeys.length}`);
  console.log(`Museo destino: ${museum.name} (${museum.id})`);
  console.log(`Supabase content id: ${contentId}`);
  console.log(`Seleccionadas para merge: ${selectedArtworks.length}`);
  console.log(`Resultado: ${mergePreview.created} creadas, ${mergePreview.updated} actualizadas, ${mergePreview.unchanged} sin cambios`);
  console.log(`Total artworks luego del merge: ${mergePreview.artworks.length}`);

  if (invalidRows.length > 0) {
    console.log("\nFilas inválidas/no vinculadas:");
    invalidRows.slice(0, args.sample).forEach((item) => {
      console.log(
        `  línea ${item.lineNumber} | ID=${item.artwork.externalId ?? "s/id"} | NAUTOR=${item.artistExternalId ?? "s/autor"} | ${item.artwork.title || "(sin título)"} | ${item.errors.join("; ")}`,
      );
    });
  }

  if (unmatchedSummary.length > 0) {
    console.log("\nNAUTOR no vinculados más frecuentes:");
    unmatchedSummary.slice(0, args.sample).forEach(([artistExternalId, count]) => {
      console.log(`  ${artistExternalId}: ${count} obras`);
    });
  }

  if (warningSummary.length > 0) {
    console.log("\nWarnings por tipo:");
    warningSummary.forEach(([message, count]) => {
      console.log(`  ${count}x ${message}`);
    });
  }

  if (artistIndex.ambiguousKeys.length > 0) {
    console.log("\nIDs de artista ambiguos:");
    artistIndex.ambiguousKeys.slice(0, args.sample).forEach((item) => {
      console.log(
        `  ${item.key}: ${item.artists.map((artist) => artist.name).join(" / ")}`,
      );
    });
  }

  console.log("\nMuestra válida:");
  selectedArtworks.slice(0, args.sample).forEach((artwork) => {
    console.log(
      `  ${artwork.externalId} | ${artwork.slug} | artista=${artwork.artistId} | ${artwork.yearLabel ?? "s/f"} | ${artwork.dimensions ?? "s/medidas"} | imagen=${artwork.imageSrc ? "sí" : "no"}`,
    );
  });
}

function summarizeWarnings(rows) {
  const counts = new Map();

  rows.forEach((item) => {
    item.warnings.forEach((warning) => {
      const key = warning.replace(/: .+$/, "");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function summarizeUnmatchedArtists(rows) {
  const counts = new Map();

  rows.forEach((item) => {
    if (
      item.artistExternalId &&
      item.errors.some((error) => error.startsWith("Artista no vinculado"))
    ) {
      counts.set(item.artistExternalId, (counts.get(item.artistExternalId) ?? 0) + 1);
    }
  });

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function parseYearRange(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return {
      yearStart: null,
      yearEnd: null,
    };
  }

  const firstYearMatch = normalized.match(/\b(1[5-9]\d{2}|20\d{2})\b/);

  if (!firstYearMatch) {
    return {
      yearStart: null,
      yearEnd: null,
    };
  }

  const yearStart = Number.parseInt(firstYearMatch[1], 10);
  const afterFirstYear = normalized.slice(
    firstYearMatch.index + firstYearMatch[1].length,
  );
  const fullEndYear = afterFirstYear.match(/[-/–—]\s*(1[5-9]\d{2}|20\d{2})\b/);

  if (fullEndYear) {
    return {
      yearStart,
      yearEnd: Number.parseInt(fullEndYear[1], 10),
    };
  }

  const shortEndYear = afterFirstYear.match(/[-/–—]\s*(\d{2})\b/);

  if (shortEndYear) {
    const century = Math.floor(yearStart / 100) * 100;
    let yearEnd = century + Number.parseInt(shortEndYear[1], 10);

    if (yearEnd < yearStart) {
      yearEnd += 100;
    }

    return {
      yearStart,
      yearEnd,
    };
  }

  return {
    yearStart,
    yearEnd: yearStart,
  };
}

function parseDimension(value) {
  const normalized = normalizeText(value).replace(",", ".");

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/\d+(?:\.\d+)?/);
  const number = match ? Number.parseFloat(match[0]) : null;

  return Number.isFinite(number) ? number : null;
}

function buildDimensionsLabel({ heightCm, widthCm, depthCm }) {
  const values = [heightCm, widthCm, depthCm].filter((value) => value !== null);

  if (values.length === 0) {
    return null;
  }

  return `${values.map(formatNumber).join(" x ")} cm`;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

function parseUnixTimestamp(value) {
  const normalized = normalizeText(value);

  if (!/^\d{9,13}$/.test(normalized)) {
    return null;
  }

  const number = Number.parseInt(normalized, 10);
  const timestamp = normalized.length === 13 ? number : number * 1000;
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getArtworkExternalId(artwork) {
  return (
    normalizeExternalId(artwork.externalId) ||
    normalizeExternalId(artwork.inventoryNumber) ||
    readQueryParam(artwork.sourceUrl, "o")
  );
}

function readQueryParam(value, key) {
  if (!value) {
    return null;
  }

  try {
    return normalizeExternalId(new URL(value).searchParams.get(key));
  } catch {
    return null;
  }
}

function normalizeUrl(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeNumericId(value) {
  const normalized = normalizeText(value);

  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeExternalId(value) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function optionalText(value) {
  return normalizeText(value) || null;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArgs(argv) {
  const parsed = {
    apply: false,
    file: null,
    limit: Number.POSITIVE_INFINITY,
    sample: 8,
    encoding: "latin1",
    contentId: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      parsed.apply = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--file") {
      parsed.file = argv[++index];
      continue;
    }

    if (arg === "--limit") {
      parsed.limit = Number.parseInt(argv[++index], 10);
      continue;
    }

    if (arg === "--sample") {
      parsed.sample = Number.parseInt(argv[++index], 10);
      continue;
    }

    if (arg === "--encoding") {
      parsed.encoding = argv[++index];
      continue;
    }

    if (arg === "--content-id") {
      parsed.contentId = argv[++index];
      continue;
    }

    throw new Error(`Argumento desconocido: ${arg}`);
  }

  if (!Number.isFinite(parsed.limit) || parsed.limit <= 0) {
    parsed.limit = Number.POSITIVE_INFINITY;
  }

  if (!Number.isFinite(parsed.sample) || parsed.sample <= 0) {
    parsed.sample = 8;
  }

  return parsed;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");

  return Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");

        if (separatorIndex === -1) {
          return null;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line
          .slice(separatorIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, "");

        return [key, value];
      })
      .filter(Boolean),
  );
}

function printHelp() {
  console.log(`Importa obras MNAV al array acervo_content.data.artworks.

Uso:
  npm run import:artworks -- --file /ruta/obras.csv --limit 50
  npm run import:artworks -- --file /ruta/obras.csv --limit 500
  npm run import:artworks -- --file /ruta/obras.csv --apply

Opciones:
  --file <path>       CSV de obras MNAV. Requerido si no hay ARTWORKS_CSV_PATH.
  --limit <n>         Evalúa las primeras n filas del CSV.
  --apply             Escribe en Supabase. Sin esto es dry-run.
  --content-id <id>   ID de acervo_content. Default: SUPABASE_ACERVO_CONTENT_ID o production.
  --encoding <enc>    Encoding del CSV. Default: latin1.
  --sample <n>        Cantidad de filas de muestra en el reporte. Default: 8.
`);
}
