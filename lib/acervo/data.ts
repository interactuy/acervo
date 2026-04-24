import seedData from "@/data/seed/mnav-v1.json";
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

const seed = seedData as AcervoSeed;

const museumsById = new Map(seed.museums.map((museum) => [museum.id, museum]));
const artistsById = new Map(seed.artists.map((artist) => [artist.id, artist]));
const artworksById = new Map(seed.artworks.map((artwork) => [artwork.id, artwork]));

export function getAcervoMeta() {
  return seed.meta;
}

export function getMuseums(): Museum[] {
  return seed.museums;
}

export function getMuseumBySlug(slug: string): Museum | null {
  return seed.museums.find((museum) => museum.slug === slug) ?? null;
}

export function getMuseumById(id: string): Museum | null {
  return museumsById.get(id) ?? null;
}

export function getArtists(): Artist[] {
  return seed.artists;
}

export function getArtistById(id: string): Artist | null {
  return artistsById.get(id) ?? null;
}

export function getArtworks(): Artwork[] {
  return seed.artworks;
}

export function getArtworkById(id: string): Artwork | null {
  return artworksById.get(id) ?? null;
}

export function getArtworkBySlug(slug: string): ArtworkWithArtist | null {
  return (
    getArtworksWithArtists().find((artwork) => artwork.slug === slug) ?? null
  );
}

export function getExhibitions(): Exhibition[] {
  return seed.exhibitions;
}

export function getArtworksWithArtists(): ArtworkWithArtist[] {
  return seed.artworks.map((artwork) => ({
    ...artwork,
    artist: getArtistById(artwork.artistId),
    museum: getMuseumById(artwork.museumId),
  }));
}

export function getArtworksByMuseumId(museumId: string): ArtworkWithArtist[] {
  return getArtworksWithArtists().filter(
    (artwork) => artwork.museumId === museumId,
  );
}

export function getArtistsByMuseumId(museumId: string): ArtistWithArtworkCount[] {
  const museumArtworks = seed.artworks.filter(
    (artwork) => artwork.museumId === museumId,
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
      const artist = getArtistById(artistId);

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

export function getExhibitionsByMuseumId(museumId: string): Exhibition[] {
  return seed.exhibitions.filter(
    (exhibition) => exhibition.museumId === museumId,
  );
}

export function getMuseumProfile(slug: string) {
  const museum = getMuseumBySlug(slug);

  if (!museum) {
    return null;
  }

  return {
    museum,
    artworks: getArtworksByMuseumId(museum.id),
    artists: getArtistsByMuseumId(museum.id),
    exhibitions: getExhibitionsByMuseumId(museum.id),
  };
}

export function getArtworkProfile(slug: string) {
  const artwork = getArtworkBySlug(slug);

  if (!artwork) {
    return null;
  }

  const relatedArtworks = getArtworksWithArtists()
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

export function getArtistsWithArtworkCounts(): ArtistWithArtworkCount[] {
  return seed.artists
    .map((artist) => ({
      ...artist,
      artworkCount: seed.artworks.filter(
        (artwork) => artwork.artistId === artist.id,
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

function includesQuery(values: Array<string | null | undefined>, query: string) {
  return values.some((value) => normalizeSearchText(value ?? "").includes(query));
}

export function searchAcervo(query: string): SearchResult[] {
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
    .filter((artist) =>
      includesQuery(
        [artist.name, artist.lifeDates, artist.nationality],
        normalizedQuery,
      ),
    )
    .map<SearchResult>((artist) => ({
      id: artist.id,
      type: "artist",
      label: "Artista",
      title: artist.name,
      subtitle: artist.lifeDates ? artist.lifeDates : "Artista del acervo",
      description: `${getArtworksByArtistId(artist.id).length} obras vinculadas al MNAV`,
      href: `/artistas#${artist.slug}`,
    }));

  const artworkResults = getArtworksWithArtists()
    .filter((artwork) =>
      includesQuery(
        [
          artwork.title,
          artwork.inventoryNumber,
          artwork.technique,
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
      subtitle: artwork.artist?.name ?? "Autor no disponible",
      description: [artwork.year, artwork.technique, artwork.location]
        .filter(Boolean)
        .join(" · "),
      href: `/obras/${artwork.slug}`,
    }));

  return [...museumResults, ...artistResults, ...artworkResults].slice(0, 36);
}

export function getArtworksByArtistId(artistId: string): ArtworkWithArtist[] {
  return getArtworksWithArtists().filter(
    (artwork) => artwork.artistId === artistId,
  );
}
