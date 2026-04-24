import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = "https://mnav.gub.uy/cms.php?id=coleccion2023";
const CONTACT_URL = "https://mnav.gub.uy/cms.php?id=contacto";
const BASE_URL = "https://mnav.gub.uy";
const OUTPUT_PATH = path.join(
  process.cwd(),
  "data",
  "seed",
  "mnav-v1.json",
);
const LIMIT = 100;

const MNAV = {
  id: "museum-mnav",
  slug: "mnav",
  name: "Museo Nacional de Artes Visuales",
  acronym: "MNAV",
  type: "Museo",
  summary:
    "Museo nacional dedicado a preservar, investigar y difundir la colección pública de artes visuales del Uruguay.",
  description:
    "El Museo Nacional de Artes Visuales reúne una de las colecciones artísticas públicas más importantes del Uruguay, con especial énfasis en artistas nacionales y obras constitutivas del patrimonio visual del país.",
  address: "Av. Tomás Giribaldi 2283 y Av. Julio Herrera y Reissig",
  neighborhood: "Parque Rodó",
  city: "Montevideo",
  country: "Uruguay",
  coordinates: {
    lat: -34.9132,
    lng: -56.159,
  },
  openingHours: {
    label: "Martes a domingos, 13:00 a 20:00 hs",
    notes: "Entrada gratuita. Confirmar horarios especiales con la institución.",
  },
  website: "https://mnav.gub.uy/",
  sourceUrl: CONTACT_URL,
  collectionSourceUrl: SOURCE_URL,
  image: {
    src: "/hero/home-artwork-01.png",
    alt: "Imagen editorial de referencia para MNAV",
  },
};

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&oacute;/g, "ó")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&aacute;/g, "á")
    .replace(/&Aacute;/g, "Á")
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&iacute;/g, "í")
    .replace(/&Iacute;/g, "Í")
    .replace(/&uacute;/g, "ú")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Ntilde;/g, "Ñ");
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n"),
  );
}

function normalize(value) {
  return (value ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, " ")
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

function parseArtist(rawArtist) {
  const artist = normalize(rawArtist);
  const match = artist.match(/^(.*?)\s*\(([^)]*)\)\s*$/);

  if (!match) {
    return {
      name: artist,
      birthYear: null,
      deathYear: null,
      lifeDates: null,
    };
  }

  const lifeDates = match[2];
  const [birthYear, deathYear] = lifeDates
    .split("-")
    .map((year) => {
      const numeric = Number.parseInt(year, 10);
      return Number.isNaN(numeric) ? null : numeric;
    });

  return {
    name: normalize(match[1]),
    birthYear: birthYear ?? null,
    deathYear: deathYear ?? null,
    lifeDates,
  };
}

function field(block, label) {
  const match = block.match(
    new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=\\n\\s*[A-ZÁÉÍÓÚÑ][^\\n:]{1,40}:|$)`,
      "i",
    ),
  );

  return match ? normalize(match[1]) : null;
}

function toAbsoluteUrl(value) {
  if (!value) {
    return null;
  }

  return new URL(value, BASE_URL).href;
}

function parseArtworks(html) {
  const itemBlocks = html.match(
    /<li class="lazy w-100 display-table border-top">[\s\S]*?<\/li>/g,
  );

  if (!itemBlocks) {
    return [];
  }

  return itemBlocks
    .map((htmlBlock) => {
      const textBlock = htmlToText(htmlBlock);
      const inventoryNumber = field(textBlock, "Nº de Inventario");
      const title = field(textBlock, "Título");
      const artist = field(textBlock, "Artista");
      const artworkHref = htmlBlock.match(/<a href="([^"]+)" target="_blank">/)?.[1];
      const imageHref = htmlBlock.match(/data-large="([^"]+)"/)?.[1] ?? null;

      if (!inventoryNumber || !title || !artist) {
        return null;
      }

      return {
        inventoryNumber,
        title,
        artist,
        technique: field(textBlock, "Técnica"),
        dimensions: field(textBlock, "Medidas"),
        year: field(textBlock, "Realizado"),
        location: field(textBlock, "Ubicación"),
        exhibitionStatus: field(textBlock, "Exhibición"),
        sourceUrl: toAbsoluteUrl(artworkHref) ?? SOURCE_URL,
        imageUrl: toAbsoluteUrl(imageHref),
      };
    })
    .filter(Boolean)
    .slice(0, LIMIT);
}

async function main() {
  const response = await fetch(SOURCE_URL);

  if (!response.ok) {
    throw new Error(`MNAV request failed: ${response.status}`);
  }

  const html = await response.text();
  const parsedArtworks = parseArtworks(html);
  const artistByName = new Map();
  const artists = [];

  const artworks = parsedArtworks.map((artwork) => {
    const parsedArtist = parseArtist(artwork.artist);
    let artist = artistByName.get(parsedArtist.name);

    if (!artist) {
      artist = {
        id: `artist-${slugify(parsedArtist.name)}`,
        slug: slugify(parsedArtist.name),
        name: parsedArtist.name,
        birthYear: parsedArtist.birthYear,
        deathYear: parsedArtist.deathYear,
        lifeDates: parsedArtist.lifeDates,
        nationality: "Uruguaya",
        sourceUrl: SOURCE_URL,
      };
      artistByName.set(parsedArtist.name, artist);
      artists.push(artist);
    }

    return {
      id: `artwork-mnav-${slugify(artwork.inventoryNumber)}`,
      slug: `${slugify(artwork.title)}-${slugify(artwork.inventoryNumber)}`,
      title: artwork.title,
      inventoryNumber: artwork.inventoryNumber,
      artistId: artist.id,
      museumId: MNAV.id,
      technique: artwork.technique,
      dimensions: artwork.dimensions,
      year: artwork.year,
      location: artwork.location,
      exhibitionStatus: artwork.exhibitionStatus,
      sourceUrl: artwork.sourceUrl,
      imageUrl: artwork.imageUrl,
    };
  });

  const seed = {
    meta: {
      generatedAt: new Date().toISOString(),
      sourceUrl: SOURCE_URL,
      sourceLabel: "Colección MNAV 2023",
      subsetLimit: LIMIT,
    },
    museums: [MNAV],
    artists,
    artworks,
    exhibitions: [
      {
        id: "exhibition-coleccion-mnav-2023",
        slug: "coleccion-mnav-2023",
        title: "Colección MNAV",
        museumId: MNAV.id,
        startDate: "2023-02-03",
        endDate: "2024-02-04",
        location: "Sala 2",
        description:
          "Selección de obras del acervo del Museo Nacional de Artes Visuales.",
        artworkIds: artworks
          .filter((artwork) => artwork.exhibitionStatus?.includes("Sala"))
          .map((artwork) => artwork.id),
        sourceUrl: SOURCE_URL,
      },
    ],
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(`${OUTPUT_PATH}`, `${JSON.stringify(seed, null, 2)}\n`);

  console.log(
    `Seed MNAV generado: ${seed.museums.length} museo, ${seed.artists.length} artistas, ${seed.artworks.length} obras.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
