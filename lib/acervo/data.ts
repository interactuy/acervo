import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import {
  ACERVO_CONTENT_ID,
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type {
  AcervoSeed,
  Artist,
  ArtistWithArtworkCount,
  Artwork,
  ArtworkWithArtist,
  Exhibition,
  Museum,
  SearchResult,
} from "@/types/acervo";

export const ACERVO_SEED_PATH = path.join(
  process.cwd(),
  "data/seed/mnav-v1.json",
);

export function readAcervoSeed(): AcervoSeed {
  return JSON.parse(readFileSync(ACERVO_SEED_PATH, "utf8")) as AcervoSeed;
}

export const getAcervoSeed = cache(async (): Promise<AcervoSeed> => {
  const supabaseSeed = await readSupabaseAcervoSeed();

  return supabaseSeed ?? readAcervoSeed();
});

export async function saveAcervoSeed(seed: AcervoSeed): Promise<AcervoSeed> {
  const nextSeed: AcervoSeed = {
    ...seed,
    meta: {
      ...seed.meta,
      generatedAt: new Date().toISOString(),
    },
  };
  const supabase = createSupabaseAdminClient();

  if (supabase) {
    const { error } = await supabase.from("acervo_content").upsert(
      {
        id: ACERVO_CONTENT_ID,
        data: nextSeed as unknown as Json,
        updated_at: nextSeed.meta.generatedAt,
      },
      { onConflict: "id" },
    );

    if (!error) {
      return nextSeed;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error(`No se pudo guardar en Supabase: ${error.message}`);
    }

    console.warn(
      `[acervo] Supabase save failed, using local seed: ${error.message}`,
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY para guardar contenido en produccion.",
    );
  }

  await writeFile(ACERVO_SEED_PATH, `${JSON.stringify(nextSeed, null, 2)}\n`);

  return nextSeed;
}

export async function getAcervoMeta() {
  return (await getAcervoSeed()).meta;
}

export async function getMuseums(): Promise<Museum[]> {
  return (await getAcervoSeed()).museums;
}

export async function getMuseumBySlug(slug: string): Promise<Museum | null> {
  const seed = await getAcervoSeed();

  return seed.museums.find((museum) => museum.slug === slug) ?? null;
}

export async function getMuseumById(id: string): Promise<Museum | null> {
  const seed = await getAcervoSeed();

  return getMuseumByIdFromSeed(seed, id);
}

export async function getArtists(): Promise<Artist[]> {
  return (await getAcervoSeed()).artists.filter(isArtistPublished);
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const seed = await getAcervoSeed();

  return getArtistByIdFromSeed(seed, id);
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const seed = await getAcervoSeed();

  return seed.artists.find((artist) => artist.slug === slug) ?? null;
}

export async function getArtworks(): Promise<Artwork[]> {
  return (await getAcervoSeed()).artworks.filter(isArtworkPublished);
}

export async function getArtworkById(id: string): Promise<Artwork | null> {
  const seed = await getAcervoSeed();

  return (
    seed.artworks.find(
      (artwork) => artwork.id === id && isArtworkPublished(artwork),
    ) ?? null
  );
}

export async function getArtworkBySlug(
  slug: string,
): Promise<ArtworkWithArtist | null> {
  const seed = await getAcervoSeed();

  return (
    getArtworksWithArtistsFromSeed(seed).find((artwork) => artwork.slug === slug) ??
    null
  );
}

export async function getExhibitions(): Promise<Exhibition[]> {
  return (await getAcervoSeed()).exhibitions;
}

export async function getArtworksWithArtists(): Promise<ArtworkWithArtist[]> {
  return getArtworksWithArtistsFromSeed(await getAcervoSeed());
}

export async function getArtworksByMuseumId(
  museumId: string,
): Promise<ArtworkWithArtist[]> {
  return getArtworksByMuseumIdFromSeed(await getAcervoSeed(), museumId);
}

export async function getArtistsByMuseumId(
  museumId: string,
): Promise<ArtistWithArtworkCount[]> {
  return getArtistsByMuseumIdFromSeed(await getAcervoSeed(), museumId);
}

export async function getExhibitionsByMuseumId(
  museumId: string,
): Promise<Exhibition[]> {
  return getExhibitionsByMuseumIdFromSeed(await getAcervoSeed(), museumId);
}

export async function getMuseumProfile(slug: string) {
  const seed = await getAcervoSeed();
  const museum = seed.museums.find((item) => item.slug === slug) ?? null;

  if (!museum) {
    return null;
  }

  return {
    museum,
    artworks: getArtworksByMuseumIdFromSeed(seed, museum.id),
    artists: getArtistsByMuseumIdFromSeed(seed, museum.id),
    exhibitions: getExhibitionsByMuseumIdFromSeed(seed, museum.id),
  };
}

export async function getArtworkProfile(slug: string) {
  const seed = await getAcervoSeed();
  const artwork =
    getArtworksWithArtistsFromSeed(seed).find((item) => item.slug === slug) ??
    null;

  if (!artwork) {
    return null;
  }

  const relatedArtworks = getArtworksWithArtistsFromSeed(seed)
    .filter(
      (relatedArtwork) =>
        relatedArtwork.artistId === artwork.artistId &&
        relatedArtwork.id !== artwork.id,
    )
    .slice(0, 6);

  return {
    artwork,
    relatedArtworks,
  };
}

export async function getArtistProfile(slug: string) {
  const seed = await getAcervoSeed();
  const artist = seed.artists.find((item) => item.slug === slug) ?? null;

  if (!artist || !isArtistPublished(artist)) {
    return null;
  }

  const artworks = getArtworksByArtistIdFromSeed(seed, artist.id);
  const allArtworks = getArtworksWithArtistsFromSeed(seed);
  const artworkIds = new Set(artworks.map((artwork) => artwork.id));
  const heroArtwork =
    getArtworkByIdFromList(allArtworks, artist.heroArtworkId) ??
    getArtworkByIdFromList(allArtworks, artist.featuredArtworkId) ??
    artworks.find((artwork) => artwork.imageSrc ?? artwork.imageUrl) ??
    artworks[0] ??
    null;
  const featuredArtworks = getFeaturedArtistArtworks(artist, artworks, heroArtwork);
  const museums = Array.from(
    new Map(
      artworks
        .map((artwork) => artwork.museum)
        .filter((museum): museum is Museum => Boolean(museum))
        .map((museum) => [museum.id, museum]),
    ).values(),
  );
  const exhibitions = seed.exhibitions.filter((exhibition) =>
    exhibition.artworkIds.some((artworkId) => artworkIds.has(artworkId)),
  );
  const relatedArtists =
    artist.relatedArtistIds
      ?.map((artistId) => getArtistByIdFromSeed(seed, artistId))
      .filter((relatedArtist): relatedArtist is Artist =>
        Boolean(relatedArtist && isArtistPublished(relatedArtist)),
      ) ?? [];

  return {
    artist,
    artworks,
    featuredArtworks,
    heroArtwork,
    museums,
    exhibitions,
    relatedArtists,
  };
}

export async function getArtistsWithArtworkCounts(): Promise<
  ArtistWithArtworkCount[]
> {
  const seed = await getAcervoSeed();

  return seed.artists
    .filter(isArtistPublished)
    .map((artist) => ({
      ...artist,
      artworkCount: seed.artworks.filter(
        (artwork) =>
          artwork.artistId === artist.id && isArtworkPublished(artwork),
      ).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function searchAcervo(query: string): Promise<SearchResult[]> {
  const seed = await getAcervoSeed();
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const museumResults = seed.museums
    .filter((museum) =>
      includesQuery(
        [
          museum.name,
          museum.acronym,
          museum.type,
          museum.summary,
          museum.neighborhood,
          museum.city,
        ],
        normalizedQuery,
      ),
    )
    .map<SearchResult>((museum) => ({
      id: museum.id,
      type: "museum",
      label: "Museo",
      title: museum.name,
      subtitle: `${museum.neighborhood}, ${museum.city}`,
      description: museum.summary,
      href: `/museos/${museum.slug}`,
    }));

  const artistResults = seed.artists
    .filter(isArtistPublished)
    .filter((artist) =>
      includesQuery(
        [
          artist.name,
          artist.lifeDates,
          artist.nationality,
          artist.summary,
          artist.description,
          artist.movement,
        ],
        normalizedQuery,
      ),
    )
    .map<SearchResult>((artist) => ({
      id: artist.id,
      type: "artist",
      label: "Artista",
      title: artist.name,
      subtitle: artist.lifeDates ? artist.lifeDates : "Artista del acervo",
      description:
        artist.summary ??
        `${getArtworksByArtistIdFromSeed(seed, artist.id).length} obras vinculadas al MNAV`,
      href: `/artistas/${artist.slug}`,
    }));

  const artworkResults = getArtworksWithArtistsFromSeed(seed)
    .filter((artwork) =>
      includesQuery(
        [
          artwork.title,
          artwork.inventoryNumber,
          artwork.technique,
          artwork.yearLabel,
          artwork.year,
          artwork.artist?.name,
        ],
        normalizedQuery,
      ),
    )
    .map<SearchResult>((artwork) => ({
      id: artwork.id,
      type: "artwork",
      label: "Obra",
      title: artwork.title,
      subtitle: artwork.artist?.name ?? "Autor sin registrar",
      description: [
        artwork.yearLabel ?? artwork.year,
        artwork.technique,
        artwork.locationNote ?? artwork.location,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/obras/${artwork.slug}`,
    }));

  return [...museumResults, ...artistResults, ...artworkResults].slice(0, 36);
}

export async function getArtworksByArtistId(
  artistId: string,
): Promise<ArtworkWithArtist[]> {
  return getArtworksByArtistIdFromSeed(await getAcervoSeed(), artistId);
}

async function readSupabaseAcervoSeed(): Promise<AcervoSeed | null> {
  const supabase = createSupabaseAdminClient() ?? createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("acervo_content")
    .select("data")
    .eq("id", ACERVO_CONTENT_ID)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[acervo] Supabase read failed, using local seed: ${error.message}`,
      );
    }

    return null;
  }

  if (!isAcervoSeed(data?.data)) {
    return null;
  }

  return data.data;
}

function getMuseumByIdFromSeed(seed: AcervoSeed, id: string): Museum | null {
  return seed.museums.find((museum) => museum.id === id) ?? null;
}

function getArtistByIdFromSeed(seed: AcervoSeed, id: string): Artist | null {
  return seed.artists.find((artist) => artist.id === id) ?? null;
}

function getArtworksWithArtistsFromSeed(seed: AcervoSeed): ArtworkWithArtist[] {
  const museumsById = new Map(seed.museums.map((museum) => [museum.id, museum]));
  const artistsById = new Map(seed.artists.map((artist) => [artist.id, artist]));

  return seed.artworks
    .filter(isArtworkPublished)
    .map((artwork) => ({
      ...artwork,
      artist: artistsById.get(artwork.artistId) ?? null,
      museum: museumsById.get(artwork.museumId) ?? null,
    }));
}

function getArtworksByMuseumIdFromSeed(
  seed: AcervoSeed,
  museumId: string,
): ArtworkWithArtist[] {
  return getArtworksWithArtistsFromSeed(seed).filter(
    (artwork) => artwork.museumId === museumId,
  );
}

function getArtistsByMuseumIdFromSeed(
  seed: AcervoSeed,
  museumId: string,
): ArtistWithArtworkCount[] {
  const museumArtworks = seed.artworks.filter(
    (artwork) =>
      artwork.museumId === museumId && isArtworkPublished(artwork),
  );
  const countsByArtistId = new Map<string, number>();

  museumArtworks.forEach((artwork) => {
    countsByArtistId.set(
      artwork.artistId,
      (countsByArtistId.get(artwork.artistId) ?? 0) + 1,
    );
  });

  return Array.from(countsByArtistId.entries())
    .map(([artistId, artworkCount]) => {
      const artist = getArtistByIdFromSeed(seed, artistId);

      if (!artist) {
        return null;
      }

      return {
        ...artist,
        artworkCount,
      };
    })
    .filter((artist): artist is ArtistWithArtworkCount => Boolean(artist))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function getExhibitionsByMuseumIdFromSeed(
  seed: AcervoSeed,
  museumId: string,
): Exhibition[] {
  return seed.exhibitions.filter(
    (exhibition) => exhibition.museumId === museumId,
  );
}

function getArtworksByArtistIdFromSeed(
  seed: AcervoSeed,
  artistId: string,
): ArtworkWithArtist[] {
  return getArtworksWithArtistsFromSeed(seed).filter(
    (artwork) => artwork.artistId === artistId,
  );
}

function getFeaturedArtistArtworks(
  artist: Artist,
  artworks: ArtworkWithArtist[],
  heroArtwork: ArtworkWithArtist | null,
) {
  const selectedArtworks = artist.featuredArtworkIds
    ?.map((artworkId) => getArtworkByIdFromList(artworks, artworkId))
    .filter((artwork): artwork is ArtworkWithArtist => Boolean(artwork)) ?? [];
  const fallbackArtworks = [
    heroArtwork,
    ...artworks.filter((artwork) => artwork.id !== heroArtwork?.id),
  ].filter((artwork): artwork is ArtworkWithArtist => Boolean(artwork));

  return Array.from(
    new Map(
      (selectedArtworks.length > 0 ? selectedArtworks : fallbackArtworks)
        .slice(0, 6)
        .map((artwork) => [artwork.id, artwork]),
    ).values(),
  );
}

function getArtworkByIdFromList(
  artworks: ArtworkWithArtist[],
  artworkId?: string | null,
) {
  if (!artworkId) {
    return null;
  }

  return artworks.find((artwork) => artwork.id === artworkId) ?? null;
}

function isArtistPublished(artist: Artist) {
  return artist.isPublished !== false;
}

function isArtworkPublished(artwork: Artwork) {
  return artwork.isPublished !== false;
}

function includesQuery(values: Array<string | null | undefined>, query: string) {
  return values.some((value) => normalizeSearchText(value ?? "").includes(query));
}

function isAcervoSeed(value: unknown): value is AcervoSeed {
  if (!value || typeof value !== "object") {
    return false;
  }

  const seed = value as Partial<AcervoSeed>;

  return (
    Boolean(seed.meta) &&
    Array.isArray(seed.museums) &&
    Array.isArray(seed.artists) &&
    Array.isArray(seed.artworks) &&
    Array.isArray(seed.exhibitions)
  );
}
