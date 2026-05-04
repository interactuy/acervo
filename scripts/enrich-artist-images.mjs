import fs from "node:fs";
import path from "node:path";

const USER_AGENT =
  "Acervo/0.1 image enrichment contact: local-script";

const COMMONS_FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const COMMONS_FILE_PAGE = "https://commons.wikimedia.org/wiki/File:";
const WD_API = "https://www.wikidata.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const ES_WIKI_API = "https://es.wikipedia.org/w/api.php";
const EN_WIKI_API = "https://en.wikipedia.org/w/api.php";

const EXTRA_FIELDS = [
  "wikidataId",
  "imageUrl",
  "imagePageUrl",
  "imageSource",
  "sourceUrl",
  "license",
  "imageType",
  "imageStatus",
  "imageNotes",
  "commonsSearchUrl",
  "wikidataSearchUrl",
  "mnavSearchUrl",
  "fallback_required",
];

const ART_TERMS = [
  "artist",
  "artista",
  "painter",
  "pintor",
  "pintora",
  "sculptor",
  "escultor",
  "escultora",
  "visual artist",
  "plastic artist",
  "artista plastico",
  "artista plastica",
  "grabador",
  "grabadora",
  "engraver",
  "printmaker",
  "dibujante",
  "drawer",
  "illustrator",
  "ilustrador",
  "ilustradora",
  "ceramist",
  "ceramista",
  "photographer",
  "fotografo",
  "fotografa",
  "arquitecto",
  "architect",
  "muralist",
  "muralista",
];

const VISUAL_ART_OCCUPATIONS = new Set([
  "Q483501", // artist
  "Q3391743", // visual artist
  "Q1028181", // painter
  "Q1281618", // sculptor
  "Q33231", // photographer
  "Q644687", // illustrator
  "Q15296811", // printmaker
  "Q173950", // engraver
  "Q5322166", // ceramist
  "Q42973", // architect
  "Q11063", // sculptor-like occupation in older items
  "Q174705", // graphic designer
  "Q17505902", // muralist
]);

const ARTWORK_SELF_PORTRAIT_TERMS = [
  "autorretrato",
  "auto retrato",
  "self-portrait",
  "self portrait",
];

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift() ?? [];
  return {
    headers,
    rows: rows
      .filter((cells) => cells.some((cell) => cell.trim() !== ""))
      .map((cells) =>
        Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
      ),
  };
}

function csvEscape(value) {
  const str = value == null ? "" : String(value);
  if (!/[",\r\n]/.test(str)) {
    return str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function writeCsv(filePath, headers, rows) {
  const output = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\r\n");
  fs.writeFileSync(filePath, `${output}\r\n`, "utf8");
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’'`´"]/g, "")
    .replace(/&/g, " y ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function compactText(value) {
  return normalizeText(value).replace(/\s/g, "");
}

function displayName(row) {
  const name = row.name ?? "";
  const commaMatch = name.match(/^([^,]+),\s*(.+)$/);
  if (commaMatch) {
    return `${commaMatch[2]} ${commaMatch[1]}`;
  }
  return name.replace(/^"|"$/g, "");
}

function nameVariants(row) {
  const base = displayName(row);
  const variants = new Set([base, row.name]);
  variants.add(base.replace(/\s+/g, " ").trim());
  variants.add(base.replace(/[’'`´"]/g, "").trim());
  return [...variants].filter(Boolean);
}

function hasArtTerm(value) {
  const normalized = normalizeText(value);
  return ART_TERMS.some((term) => normalized.includes(normalizeText(term)));
}

function parseLifeDates(lifeDates) {
  const years = String(lifeDates ?? "").match(/\d{4}/g) ?? [];
  return {
    birthYear: years[0] ? Number(years[0]) : null,
    deathYear: years[1] ? Number(years[1]) : null,
  };
}

function claimValues(entity, property) {
  return (entity.claims?.[property] ?? [])
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter(Boolean);
}

function claimEntityIds(entity, property) {
  return claimValues(entity, property)
    .map((value) => value.id)
    .filter(Boolean);
}

function claimYear(entity, property) {
  const value = claimValues(entity, property)[0]?.time;
  const match = value?.match(/[+-](\d{4})-/);
  return match ? Number(match[1]) : null;
}

function hasVisualArtOccupation(entity) {
  return claimEntityIds(entity, "P106").some((id) => VISUAL_ART_OCCUPATIONS.has(id));
}

function p18Image(entity) {
  const value = claimValues(entity, "P18")[0];
  return typeof value === "string" ? value : null;
}

function commonsFilePath(fileName) {
  return COMMONS_FILEPATH + encodeURIComponent(fileName.replace(/\s+/g, "_"));
}

function commonsFilePage(fileName) {
  return COMMONS_FILE_PAGE + encodeURIComponent(fileName.replace(/\s+/g, "_"));
}

function searchUrls(name) {
  const query = encodeURIComponent(`${name} artista uruguayo`);
  return {
    commonsSearchUrl: `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image`,
    wikidataSearchUrl: `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(name)}&title=Special:Search&ns0=1`,
    mnavSearchUrl: `https://mnav.gub.uy/cms.php?buscar=${encodeURIComponent(name)}`,
  };
}

function mergeSearchUrls(row) {
  return Object.assign(row, searchUrls(displayName(row)));
}

async function fetchJson(url, params, retries = 2) {
  const fullUrl = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      fullUrl.searchParams.set(key, value);
    }
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(fullUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) {
        throw error;
      }
      await sleep(500 * (attempt + 1));
    }
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const searchCache = new Map();
const entityCache = new Map();

async function wikidataSearch(query, lang) {
  const key = `${lang}:${query}`;
  if (searchCache.has(key)) {
    return searchCache.get(key);
  }
  const data = await fetchJson(WD_API, {
    action: "wbsearchentities",
    search: query,
    language: lang,
    format: "json",
    limit: "5",
  });
  const hits = data.search ?? [];
  searchCache.set(key, hits);
  return hits;
}

async function getEntity(qid) {
  if (entityCache.has(qid)) {
    return entityCache.get(qid);
  }
  const data = await fetchJson(WD_API, {
    action: "wbgetentities",
    ids: qid,
    props: "claims|sitelinks|labels|descriptions|aliases",
    format: "json",
  });
  const entity = data.entities?.[qid] ?? null;
  entityCache.set(qid, entity);
  return entity;
}

async function findNaiveWikidataEntity(row) {
  for (const lang of ["es", "en"]) {
    const hits = await wikidataSearch(displayName(row), lang);
    const qid = hits[0]?.id;
    if (qid) {
      return getEntity(qid);
    }
  }
  return null;
}

async function findArtistEntity(row) {
  const candidates = new Map();
  for (const variant of nameVariants(row)) {
    for (const lang of ["es", "en"]) {
      const hits = await wikidataSearch(variant, lang);
      for (const hit of hits) {
        if (hit.id && !candidates.has(hit.id)) {
          candidates.set(hit.id, hit);
        }
      }
    }
  }

  const scored = [];
  const rowNames = nameVariants(row).map(compactText);
  const lifeDates = parseLifeDates(row.lifeDates);

  for (const [qid, hit] of candidates) {
    const entity = await getEntity(qid);
    if (!entity || entity.missing) {
      continue;
    }

    const labels = [
      ...Object.values(entity.labels ?? {}).map((label) => label.value),
      ...Object.values(entity.aliases ?? {}).flatMap((aliases) =>
        aliases.map((alias) => alias.value),
      ),
    ].filter(Boolean);
    const compactLabels = labels.map(compactText);
    const descriptions = Object.values(entity.descriptions ?? {})
      .map((description) => description.value)
      .join(" ");
    const exactName = compactLabels.some((label) => rowNames.includes(label));
    const containsName = compactLabels.some((label) =>
      rowNames.some((rowName) => label.includes(rowName) || rowName.includes(label)),
    );
    const occupationMatch = hasVisualArtOccupation(entity);
    const artDescription = hasArtTerm(descriptions);
    const birthYear = claimYear(entity, "P569");
    const deathYear = claimYear(entity, "P570");
    const birthMatches =
      lifeDates.birthYear && birthYear ? lifeDates.birthYear === birthYear : false;
    const deathMatches =
      lifeDates.deathYear && deathYear ? lifeDates.deathYear === deathYear : false;
    const birthMismatch =
      lifeDates.birthYear && birthYear ? lifeDates.birthYear !== birthYear : false;
    const deathMismatch =
      lifeDates.deathYear && deathYear ? lifeDates.deathYear !== deathYear : false;

    let score = 0;
    if (exactName) score += 10;
    else if (containsName) score += 5;
    if (occupationMatch) score += 6;
    if (artDescription) score += 5;
    if (normalizeText(descriptions).includes("uruguay")) score += 2;
    if (birthMatches) score += 4;
    if (deathMatches) score += 4;
    if (birthMismatch) score -= 5;
    if (deathMismatch) score -= 5;
    if (p18Image(entity)) score += 1;

    const reliableArtistMatch =
      (exactName || containsName) &&
      (occupationMatch || artDescription || birthMatches || deathMatches) &&
      !birthMismatch &&
      !deathMismatch;

    if (reliableArtistMatch) {
      scored.push({ entity, score, qid, hit });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.entity ?? null;
}

async function wikipediaPageImage(entity) {
  const sitelinks = entity.sitelinks ?? {};
  const pages = [
    { api: ES_WIKI_API, site: "eswiki", language: "es" },
    { api: EN_WIKI_API, site: "enwiki", language: "en" },
  ];

  for (const page of pages) {
    const title = sitelinks[page.site]?.title;
    if (!title) {
      continue;
    }
    const data = await fetchJson(page.api, {
      action: "query",
      titles: title,
      prop: "pageimages|info",
      piprop: "original|name",
      inprop: "url",
      format: "json",
    });
    const foundPage = Object.values(data.query?.pages ?? {})[0];
    const original = foundPage?.original?.source;
    if (original) {
      return {
        imageUrl: original,
        imagePageUrl: foundPage.fullurl ?? `https://${page.language}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        sourceUrl: foundPage.fullurl ?? `https://${page.language}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        imageSource: `${page.language}.wikipedia pageimage`,
      };
    }
  }
  return null;
}

function fileTitleToName(title) {
  return title.replace(/^File:/, "").replace(/^Archivo:/, "");
}

function commonsCandidateScore(row, page) {
  const title = page.title ?? "";
  const normalizedTitle = normalizeText(title);
  const compactTitle = compactText(title);
  const rowNames = nameVariants(row).map(compactText);
  const hasName = rowNames.some((name) => compactTitle.includes(name));
  const portraitTerm = /\b(portrait|retrato|foto|photo|photograph|fotografia)\b/.test(
    normalizedTitle,
  );
  const selfPortraitTerm = ARTWORK_SELF_PORTRAIT_TERMS.some((term) =>
    normalizedTitle.includes(normalizeText(term)),
  );

  let score = 0;
  if (hasName) score += 8;
  if (portraitTerm) score += 7;
  if (selfPortraitTerm) score += 6;
  if (/\.jpe?g$|\.png$|\.webp$/i.test(title)) score += 1;
  if (/logo|signature|firma|map|emblem|escudo|grave|tomb|monument/.test(normalizedTitle)) {
    score -= 8;
  }

  return { score, portraitTerm, selfPortraitTerm, hasName };
}

async function commonsPortraitOrSelfPortrait(row) {
  const name = displayName(row);
  const queries = [
    `${name} portrait`,
    `${name} retrato`,
    `${name} fotografia`,
    `${name} autorretrato`,
    `${name} self-portrait`,
  ];
  let best = null;

  for (const query of queries) {
    const data = await fetchJson(COMMONS_API, {
      action: "query",
      generator: "search",
      gsrnamespace: "6",
      gsrsearch: query,
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      format: "json",
    });
    const pages = Object.values(data.query?.pages ?? {});
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info?.url) {
        continue;
      }
      const scored = commonsCandidateScore(row, page);
      if (scored.score < 14) {
        continue;
      }
      const candidate = {
        score: scored.score,
        imageUrl: info.url,
        imagePageUrl: info.descriptionurl ?? commonsFilePage(fileTitleToName(page.title)),
        sourceUrl: info.descriptionurl ?? commonsFilePage(fileTitleToName(page.title)),
        imageSource: "Wikimedia Commons search",
        imageType: scored.selfPortraitTerm ? "artist_self_portrait" : "artist_portrait",
        license:
          info.extmetadata?.LicenseShortName?.value ??
          info.extmetadata?.UsageTerms?.value ??
          "check_commons_file_page",
        imageNotes: `Strict Commons match: ${page.title}`,
      };
      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }
  }

  return best;
}

function loadInstitutionalSeed() {
  const seedPath = path.join(process.cwd(), "data", "seed", "mnav-v1.json");
  if (!fs.existsSync(seedPath)) {
    return { artistsBySlug: new Map(), artistsByName: new Map(), artworksByArtistId: new Map(), museums: new Map() };
  }

  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const artistsBySlug = new Map();
  const artistsByName = new Map();
  const artworksByArtistId = new Map();
  const museums = new Map((seed.museums ?? []).map((museum) => [museum.id, museum]));

  for (const artist of seed.artists ?? []) {
    artistsBySlug.set(artist.slug, artist);
    artistsByName.set(compactText(artist.name), artist);
  }

  for (const artwork of seed.artworks ?? []) {
    if (!artwork.artistId) {
      continue;
    }
    if (!artworksByArtistId.has(artwork.artistId)) {
      artworksByArtistId.set(artwork.artistId, []);
    }
    artworksByArtistId.get(artwork.artistId).push(artwork);
  }

  return { artistsBySlug, artistsByName, artworksByArtistId, museums };
}

function findSeedArtist(row, seed) {
  return (
    seed.artistsBySlug.get(row.slug) ??
    seed.artistsByName.get(compactText(displayName(row))) ??
    seed.artistsByName.get(compactText(row.name)) ??
    null
  );
}

function artworkImageCandidate(row, seed, selfPortraitOnly = false) {
  const artist = findSeedArtist(row, seed);
  if (!artist) {
    return null;
  }

  const artworks = (seed.artworksByArtistId.get(artist.id) ?? []).filter(
    (artwork) => artwork.imageUrl || artwork.imageSrc,
  );
  const byId = new Map(artworks.map((artwork) => [artwork.id, artwork]));
  const preferredIds = [
    artist.featuredArtworkId,
    artist.heroArtworkId,
    ...(artist.featuredArtworkIds ?? []),
  ].filter(Boolean);

  const sorted = [...artworks].sort((a, b) => {
    const aPreferred = preferredIds.includes(a.id) ? 1 : 0;
    const bPreferred = preferredIds.includes(b.id) ? 1 : 0;
    if (aPreferred !== bPreferred) return bPreferred - aPreferred;
    if (a.isPublished !== b.isPublished) return Number(b.isPublished) - Number(a.isPublished);
    return String(a.inventoryNumber ?? a.externalId ?? "").localeCompare(
      String(b.inventoryNumber ?? b.externalId ?? ""),
      undefined,
      { numeric: true },
    );
  });

  const candidates = [
    ...preferredIds.map((id) => byId.get(id)).filter(Boolean),
    ...sorted,
  ];

  for (const artwork of candidates) {
    const title = artwork.title ?? "";
    const isSelfPortrait = ARTWORK_SELF_PORTRAIT_TERMS.some((term) =>
      normalizeText(title).includes(normalizeText(term)),
    );
    if (selfPortraitOnly && !isSelfPortrait) {
      continue;
    }
    if (!selfPortraitOnly && isSelfPortrait) {
      continue;
    }

    const museum = seed.museums.get(artwork.museumId);
    const imageUrl = artwork.imageUrl ?? artwork.imageSrc;
    const type = isSelfPortrait ? "artist_self_portrait" : "representative_artwork";
    return {
      imageUrl,
      imagePageUrl: artwork.sourceUrl ?? "",
      sourceUrl: artwork.sourceUrl ?? artist.sourceUrl ?? "",
      imageSource: museum?.name ?? "Fuente institucional",
      license: "check_institutional_object_page",
      imageType: type,
      imageStatus: "image_found",
      imageNotes: `${type === "artist_self_portrait" ? "Autorretrato" : "Obra representativa"}: ${title || "sin titulo"}${artwork.inventoryNumber ? ` (inv. ${artwork.inventoryNumber})` : ""}.`,
    };
  }

  return null;
}

function artistPortraitCandidate(row, seed) {
  const artist = findSeedArtist(row, seed);
  if (!artist?.portrait?.src) {
    return null;
  }
  return {
    imageUrl: artist.portrait.src,
    imagePageUrl: artist.portrait.src,
    sourceUrl: artist.sourceUrl ?? "",
    imageSource: "MNAV artist record",
    license: "check_source_page",
    imageType: "artist_portrait",
    imageStatus: "image_found",
    imageNotes: artist.portrait.alt ?? "Retrato de ficha de artista MNAV.",
  };
}

function applyImage(row, data) {
  row.imageUrl = data.imageUrl ?? "";
  row.imagePageUrl = data.imagePageUrl ?? "";
  row.imageSource = data.imageSource ?? "";
  row.sourceUrl = data.sourceUrl ?? row.sourceUrl ?? "";
  row.license = data.license ?? "";
  row.imageType = data.imageType ?? "";
  row.imageStatus = data.imageStatus ?? "image_found";
  row.imageNotes = data.imageNotes ?? "";
  row.fallback_required = "false";
}

async function enrichWikidataPass(rows) {
  const enriched = [];
  let done = 0;
  for (const inputRow of rows) {
    const row = mergeSearchUrls({ ...inputRow });
    try {
      const entity = await findNaiveWikidataEntity(row);
      if (entity?.id) {
        row.wikidataId = entity.id;
        row.sourceUrl = `https://www.wikidata.org/wiki/${entity.id}`;
        const image = p18Image(entity);
        if (image) {
          applyImage(row, {
            imageUrl: commonsFilePath(image),
            imagePageUrl: commonsFilePage(image),
            imageSource: "Wikidata P18 / Wikimedia Commons",
            sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
            license: "check_commons_file_page",
            imageType: "portrait_or_artist_image",
            imageStatus: "image_found",
          });
        } else {
          row.imageStatus = "needs_fallback_search";
          row.imageSource = "Wikidata found, no P18 image";
          row.imageNotes =
            "Search Commons/MNAV for portrait, self-portrait, or representative artwork.";
          row.fallback_required = "true";
        }
      } else {
        row.imageStatus = "artist_not_found_in_wikidata";
        row.fallback_required = "true";
      }
    } catch (error) {
      row.imageStatus = "lookup_error";
      row.imageNotes = String(error.message ?? error).slice(0, 180);
      row.fallback_required = "true";
    }
    enriched.push(row);
    done += 1;
    if (done % 50 === 0) {
      console.error(`wikidata pass: ${done}/${rows.length}`);
    }
    await sleep(80);
  }
  return enriched;
}

async function enrichFinal(rows) {
  const seed = loadInstitutionalSeed();
  const enriched = [];
  let done = 0;

  for (const inputRow of rows) {
    const row = mergeSearchUrls({ ...inputRow });
    row.fallback_required = "true";

    try {
      const entity = await findArtistEntity(row);
      if (entity?.id) {
        row.wikidataId = entity.id;
        const image = p18Image(entity);
        if (image) {
          applyImage(row, {
            imageUrl: commonsFilePath(image),
            imagePageUrl: commonsFilePage(image),
            imageSource: "Wikidata P18 / Wikimedia Commons",
            sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
            license: "check_commons_file_page",
            imageType: "artist_portrait",
            imageStatus: "image_found",
            imageNotes: "Imagen P18 del item de persona en Wikidata.",
          });
        }

        if (!row.imageUrl) {
          const wikiImage = await wikipediaPageImage(entity);
          if (wikiImage) {
            applyImage(row, {
              ...wikiImage,
              imageType: "artist_portrait",
              imageStatus: "image_found",
              license: "check_wikipedia_or_commons_file_page",
              imageNotes: "Pageimage de articulo Wikipedia enlazado desde Wikidata.",
            });
          }
        }
      }

      if (!row.imageUrl) {
        const localPortrait = artistPortraitCandidate(row, seed);
        if (localPortrait) {
          applyImage(row, localPortrait);
        }
      }

      if (!row.imageUrl) {
        const commonsImage = await commonsPortraitOrSelfPortrait(row);
        if (commonsImage) {
          applyImage(row, { ...commonsImage, imageStatus: "image_found" });
        }
      }

      if (!row.imageUrl) {
        const selfPortrait = artworkImageCandidate(row, seed, true);
        if (selfPortrait) {
          applyImage(row, selfPortrait);
        }
      }

      if (!row.imageUrl) {
        const representativeArtwork = artworkImageCandidate(row, seed, false);
        if (representativeArtwork) {
          applyImage(row, representativeArtwork);
        }
      }

      if (!row.imageUrl) {
        row.imageStatus = "fallback_required";
        row.imageNotes =
          "No reliable portrait, self-portrait, or institutional artwork image found in Wikidata, Wikipedia, Commons, MNAV seed, or institutional seed.";
        row.fallback_required = "true";
      }
    } catch (error) {
      row.imageStatus = row.imageUrl ? "image_found_with_lookup_error" : "fallback_required";
      row.imageNotes = String(error.message ?? error).slice(0, 180);
      row.fallback_required = row.imageUrl ? "false" : "true";
    }

    enriched.push(row);
    done += 1;
    if (done % 25 === 0) {
      const found = enriched.filter((candidate) => candidate.imageUrl).length;
      console.error(`final pass: ${done}/${rows.length}, images=${found}`);
    }
    await sleep(80);
  }

  return enriched;
}

async function main() {
  const [, , inputPath, outputPath, mode = "final"] = process.argv;
  if (!inputPath || !outputPath || !["wikidata", "final"].includes(mode)) {
    console.error(
      "Usage: node scripts/enrich-artist-images.mjs <input.csv> <output.csv> [wikidata|final]",
    );
    process.exit(1);
  }

  const input = readCsv(inputPath);
  const headers = [...input.headers, ...EXTRA_FIELDS.filter((field) => !input.headers.includes(field))];
  const rows =
    mode === "wikidata"
      ? await enrichWikidataPass(input.rows)
      : await enrichFinal(input.rows);

  writeCsv(outputPath, headers, rows);
  const found = rows.filter((row) => row.imageUrl).length;
  const fallback = rows.filter((row) => row.fallback_required === "true").length;
  console.error(`wrote ${outputPath}`);
  console.error(`rows=${rows.length} images=${found} fallback_required=${fallback}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
