import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const MNAV_ARTIST_URL = "https://mnav.gub.uy/cms.php?a=";
const REQUIRED_COLUMNS = [
  "NRO",
  "APENOM",
  "NOMAPE",
  "NACE",
  "MUERE",
  "LUGAR_NACE",
  "LUGAR_MUERE",
  "BIO",
];

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
  : env.ARTISTS_CSV_PATH
    ? path.resolve(env.ARTISTS_CSV_PATH)
    : null;

if (!csvPath) {
  throw new Error("Falta --file <ruta-del-csv> o ARTISTS_CSV_PATH.");
}

if (!existsSync(csvPath)) {
  throw new Error(`No existe el archivo CSV: ${csvPath}`);
}

const csvText = readFileSync(csvPath, args.encoding ?? "latin1");
const parsedRows = parseMnavArtistsCsv(csvText);
const mappedRows = parsedRows.map(mapCsvRowToArtist);
const invalidRows = mappedRows.filter((item) => item.errors.length > 0);
const validRows = mappedRows.filter((item) => item.errors.length === 0);
const selectedRows = Number.isFinite(args.limit)
  ? validRows.slice(0, args.limit)
  : validRows;

const selectedArtists = uniquifyImportedSlugs(
  selectedRows.map((item) => item.artist),
);
const seed = await readSupabaseSeed();
const mergePreview = mergeArtists(seed.artists ?? [], selectedArtists);

printImportReport({
  parsedRows,
  validRows,
  invalidRows,
  selectedArtists,
  mergePreview,
});

if (!args.apply) {
  console.log("\nDry-run: no se escribió en Supabase. Repetí con --apply para importar.");
  process.exit(0);
}

const nextSeed = {
  ...seed,
  artists: mergePreview.artists,
  meta: {
    ...seed.meta,
    generatedAt: new Date().toISOString(),
  },
};

await writeSupabaseSeed(nextSeed);

console.log(
  `\nImport aplicado en Supabase row "${contentId}": ${mergePreview.created} creados, ${mergePreview.updated} actualizados, ${mergePreview.unchanged} sin cambios.`,
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

function parseMnavArtistsCsv(csvText) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("El CSV está vacío.");
  }

  const headers = parseHeaderLine(lines[0]);

  if (REQUIRED_COLUMNS.some((column, index) => headers[index] !== column)) {
    throw new Error(
      `Columnas inesperadas. Recibidas: ${headers.join(", ")}. Esperadas: ${REQUIRED_COLUMNS.join(", ")}.`,
    );
  }

  return lines.slice(1).map((line, index) => {
    const values = parseArtistLine(line, index + 2);

    return Object.fromEntries(
      REQUIRED_COLUMNS.map((column, columnIndex) => [column, values[columnIndex]]),
    );
  });
}

function parseHeaderLine(line) {
  return parseSemicolonQuotedLine(line, 1);
}

function parseArtistLine(line, lineNumber) {
  const values = [];
  let cursor = 0;

  for (let index = 0; index < 7; index += 1) {
    const parsed = readQuotedField(line, cursor, lineNumber);
    values.push(parsed.value);
    cursor = parsed.cursor;

    if (index < 6) {
      if (line[cursor] !== ";") {
        throw new Error(`Línea ${lineNumber}: se esperaba ";" en columna ${index + 1}.`);
      }

      cursor += 1;
    }
  }

  if (line[cursor] !== "," && line[cursor] !== ";") {
    throw new Error(`Línea ${lineNumber}: separador inválido antes de BIO.`);
  }

  cursor += 1;
  let bio = line.slice(cursor);

  if (bio.startsWith('"') && bio.endsWith('"')) {
    bio = bio.slice(1, -1);
  }

  values.push(unescapeCsvValue(bio));
  return values;
}

function parseSemicolonQuotedLine(line, lineNumber) {
  const values = [];
  let cursor = 0;

  while (cursor < line.length) {
    const parsed = readQuotedField(line, cursor, lineNumber);
    values.push(parsed.value);
    cursor = parsed.cursor;

    if (cursor >= line.length) {
      break;
    }

    if (line[cursor] !== ";") {
      throw new Error(`Línea ${lineNumber}: separador inválido en header.`);
    }

    cursor += 1;
  }

  return values;
}

function readQuotedField(line, cursor, lineNumber) {
  if (line[cursor] !== '"') {
    throw new Error(`Línea ${lineNumber}: se esperaba campo entre comillas.`);
  }

  cursor += 1;
  let value = "";

  while (cursor < line.length) {
    const character = line[cursor];
    cursor += 1;

    if (character === '"') {
      if (line[cursor] === '"') {
        value += '"';
        cursor += 1;
        continue;
      }

      return { value, cursor };
    }

    value += character;
  }

  throw new Error(`Línea ${lineNumber}: campo entre comillas sin cerrar.`);
}

function mapCsvRowToArtist(row) {
  const errors = [];
  const warnings = [];
  const sourceNumber = normalizeText(row.NRO);
  const name = normalizeText(row.NOMAPE) || normalizeText(row.APENOM);
  const slug = slugify(name);
  const birthYear = parseYear(row.NACE);
  const deathYear = parseYear(row.MUERE);
  const birthPlace = optionalText(row.LUGAR_NACE);
  const deathPlace = optionalText(row.LUGAR_MUERE);
  const description = normalizeBiography(row.BIO);
  const summary = buildSummary({
    description,
    birthYear,
    deathYear,
    birthPlace,
    deathPlace,
  });

  if (!sourceNumber || !/^\d+$/.test(sourceNumber)) {
    errors.push("NRO inválido o ausente.");
  }

  if (!name) {
    errors.push("Nombre principal NOMAPE ausente.");
  }

  if (!slug) {
    errors.push("No se pudo generar slug.");
  }

  if (row.NACE && !birthYear) {
    warnings.push(`NACE sin año reconocible: ${row.NACE}`);
  }

  if (row.MUERE && !deathYear) {
    warnings.push(`MUERE sin año reconocible: ${row.MUERE}`);
  }

  if (!description) {
    warnings.push("BIO vacía.");
  }

  const artist = {
    id: `artist-${slug}`,
    externalId: sourceNumber,
    slug,
    name,
    birthYear,
    deathYear,
    birthPlace,
    deathPlace,
    lifeDates: buildLifeDates(birthYear, deathYear),
    nationality: null,
    summary,
    description,
    biography: description,
    portrait: null,
    movement: null,
    techniques: [],
    themes: [],
    influences: [],
    keyPeriods: [],
    timeline: [],
    heroArtworkId: null,
    featuredArtworkId: null,
    featuredArtworkIds: [],
    relatedArtistIds: [],
    sourceUrl: `${MNAV_ARTIST_URL}${sourceNumber}`,
    collectionSourceUrl: null,
    isPublished: true,
  };

  return {
    artist,
    errors,
    warnings,
    sourceNumber,
  };
}

function uniquifyImportedSlugs(artists) {
  const seen = new Map();

  return artists.map((artist) => {
    const count = seen.get(artist.slug) ?? 0;
    seen.set(artist.slug, count + 1);

    if (count === 0) {
      return artist;
    }

    const slug = `${artist.slug}-${count + 1}`;

    return {
      ...artist,
      id: `artist-${slug}`,
      slug,
    };
  });
}

function mergeArtists(existingArtists, importedArtists) {
  const existingBySlug = new Map(
    existingArtists.map((artist) => [artist.slug, artist]),
  );
  const mergedBySlug = new Map(existingBySlug);
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  importedArtists.forEach((importedArtist) => {
    const existingArtist = existingBySlug.get(importedArtist.slug);
    const mergedArtist = mergeArtist(existingArtist, importedArtist);

    if (!existingArtist) {
      created += 1;
    } else if (JSON.stringify(existingArtist) === JSON.stringify(mergedArtist)) {
      unchanged += 1;
    } else {
      updated += 1;
    }

    mergedBySlug.set(importedArtist.slug, mergedArtist);
  });

  const artists = Array.from(mergedBySlug.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
  );

  return {
    artists,
    created,
    updated,
    unchanged,
  };
}

function mergeArtist(existingArtist, importedArtist) {
  if (!existingArtist) {
    return importedArtist;
  }

  return {
    ...existingArtist,
    ...importedArtist,
    id: existingArtist.id,
    nationality: existingArtist.nationality ?? importedArtist.nationality,
    portrait: existingArtist.portrait ?? importedArtist.portrait,
    movement: existingArtist.movement ?? importedArtist.movement,
    techniques: preserveList(existingArtist.techniques, importedArtist.techniques),
    themes: preserveList(existingArtist.themes, importedArtist.themes),
    influences: preserveList(existingArtist.influences, importedArtist.influences),
    keyPeriods: preserveList(existingArtist.keyPeriods, importedArtist.keyPeriods),
    timeline: preserveList(existingArtist.timeline, importedArtist.timeline),
    heroArtworkId: existingArtist.heroArtworkId ?? importedArtist.heroArtworkId,
    featuredArtworkId:
      existingArtist.featuredArtworkId ?? importedArtist.featuredArtworkId,
    featuredArtworkIds: preserveList(
      existingArtist.featuredArtworkIds,
      importedArtist.featuredArtworkIds,
    ),
    relatedArtistIds: preserveList(
      existingArtist.relatedArtistIds,
      importedArtist.relatedArtistIds,
    ),
    collectionSourceUrl:
      existingArtist.collectionSourceUrl ?? importedArtist.collectionSourceUrl,
    isPublished: existingArtist.isPublished ?? importedArtist.isPublished,
  };
}

function preserveList(existingValue, importedValue) {
  return Array.isArray(existingValue) && existingValue.length > 0
    ? existingValue
    : importedValue;
}

function printImportReport({
  parsedRows,
  validRows,
  invalidRows,
  selectedArtists,
  mergePreview,
}) {
  const warningCount = validRows.reduce(
    (count, item) => count + item.warnings.length,
    0,
  );
  const warningSummary = summarizeWarnings(validRows);

  console.log("Mapeo MNAV CSV -> Acervo artists");
  console.log("  NRO -> externalId + sourceUrl (https://mnav.gub.uy/cms.php?a=NRO)");
  console.log("  NOMAPE -> name");
  console.log("  NACE/MUERE -> birthYear/deathYear");
  console.log("  LUGAR_NACE/LUGAR_MUERE -> birthPlace/deathPlace");
  console.log("  BIO -> description + summary");
  console.log("  portrait/featured/nationality -> null si no hay dato explícito\n");

  console.log(`CSV: ${parsedRows.length} filas`);
  console.log(`Válidas: ${validRows.length}`);
  console.log(`Inválidas: ${invalidRows.length}`);
  console.log(`Warnings: ${warningCount}`);
  console.log(`Seleccionadas para esta corrida: ${selectedArtists.length}`);
  console.log(`Supabase content id: ${contentId}`);
  console.log(`Resultado: ${mergePreview.created} creados, ${mergePreview.updated} actualizados, ${mergePreview.unchanged} sin cambios`);
  console.log(`Total artists luego del merge: ${mergePreview.artists.length}`);

  if (invalidRows.length > 0) {
    console.log("\nFilas inválidas:");
    invalidRows.slice(0, 10).forEach((item) => {
      console.log(`  ${item.artist.name || "(sin nombre)"}: ${item.errors.join("; ")}`);
    });
  }

  if (warningSummary.length > 0) {
    console.log("\nWarnings por tipo:");
    warningSummary.forEach(([message, count]) => {
      console.log(`  ${count}x ${message}`);
    });
  }

  console.log("\nMuestra:");
  selectedArtists.slice(0, args.sample).forEach((artist) => {
    console.log(
      `  ${artist.slug} | ${artist.name} | ${artist.lifeDates ?? "s/f"} | ${artist.sourceUrl}`,
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

function normalizeBiography(value) {
  const text = decodeEntities(String(value ?? ""))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || null;
}

function buildSummary({
  description,
  birthYear,
  deathYear,
  birthPlace,
  deathPlace,
}) {
  if (description) {
    return truncateSummary(description);
  }

  const facts = [];

  if (birthYear || birthPlace) {
    facts.push(
      `Nace${birthPlace ? ` en ${birthPlace}` : ""}${birthYear ? ` en ${birthYear}` : ""}.`,
    );
  }

  if (deathYear || deathPlace) {
    facts.push(
      `Muere${deathPlace ? ` en ${deathPlace}` : ""}${deathYear ? ` en ${deathYear}` : ""}.`,
    );
  }

  return facts.join(" ") || null;
}

function truncateSummary(value) {
  const firstParagraph = value.split(/\n{2,}/)[0] ?? value;
  const firstSentence = firstParagraph.match(/^.{80,260}?[.!?](?:\s|$)/s)?.[0];
  const summary = normalizeText(firstSentence ?? firstParagraph);

  if (summary.length <= 280) {
    return summary;
  }

  return `${summary.slice(0, 277).replace(/\s+\S*$/, "")}...`;
}

function parseYear(value) {
  const match = String(value ?? "").match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  const year = match ? Number.parseInt(match[1], 10) : null;

  return Number.isFinite(year) ? year : null;
}

function buildLifeDates(birthYear, deathYear) {
  if (birthYear && deathYear) {
    return `${birthYear}-${deathYear}`;
  }

  if (birthYear) {
    return `${birthYear}-`;
  }

  if (deathYear) {
    return `-${deathYear}`;
  }

  return null;
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

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-zA-Z]+);/g, (entity) => entity);
}

function unescapeCsvValue(value) {
  return value.replace(/""/g, '"');
}

function parseArgs(argv) {
  const parsed = {
    apply: false,
    file: null,
    limit: Number.POSITIVE_INFINITY,
    sample: 5,
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
    parsed.sample = 5;
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
  console.log(`Importa artistas MNAV al array acervo_content.data.artists.

Uso:
  npm run import:artists -- --file /ruta/artistas.csv --limit 20
  npm run import:artists -- --file /ruta/artistas.csv --apply

Opciones:
  --file <path>       CSV de artistas MNAV. Requerido si no hay ARTISTS_CSV_PATH.
  --limit <n>         Limita la corrida a n artistas válidos.
  --apply             Escribe en Supabase. Sin esto es dry-run.
  --content-id <id>   ID de acervo_content. Default: SUPABASE_ACERVO_CONTENT_ID o production.
  --encoding <enc>    Encoding del CSV. Default: latin1.
  --sample <n>        Cantidad de filas de muestra en el reporte. Default: 5.
`);
}
