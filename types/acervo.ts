export type AcervoMeta = {
  generatedAt: string;
  sourceUrl: string;
  sourceLabel: string;
  subsetLimit: number;
};

export type AcervoImage = {
  src: string;
  alt: string;
};

export type Museum = {
  id: string;
  slug: string;
  name: string;
  acronym?: string;
  type: string;
  summary: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  openingHours?: {
    label: string;
    notes?: string;
  };
  website?: string;
  sourceUrl: string;
  collectionSourceUrl?: string;
  image: AcervoImage;
};

export type Artist = {
  id: string;
  slug: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  lifeDates: string | null;
  nationality?: string | null;
  sourceUrl: string;
};

export type Artwork = {
  id: string;
  slug: string;
  title: string;
  inventoryNumber: string;
  artistId: string;
  museumId: string;
  technique: string | null;
  dimensions: string | null;
  year: string | null;
  location: string | null;
  exhibitionStatus: string | null;
  sourceUrl: string;
  imageUrl?: string | null;
};

export type Exhibition = {
  id: string;
  slug: string;
  title: string;
  museumId: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  artworkIds: string[];
  sourceUrl: string;
};

export type AcervoSeed = {
  meta: AcervoMeta;
  museums: Museum[];
  artists: Artist[];
  artworks: Artwork[];
  exhibitions: Exhibition[];
};

export type ArtworkWithArtist = Artwork & {
  artist: Artist | null;
  museum: Museum | null;
};

export type ArtistWithArtworkCount = Artist & {
  artworkCount: number;
};

export type SearchResultType = "museum" | "artist" | "artwork";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
};
