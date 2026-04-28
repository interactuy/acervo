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
    lat: number | null;
    lng: number | null;
  };
  openingHours?: {
    label: string;
    notes?: string;
  };
  accessibility?: string | null;
  website?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ticketInfo?: string | null;
  howToGetThere?: string | null;
  social?: {
    instagram?: string | null;
    facebook?: string | null;
    x?: string | null;
    youtube?: string | null;
  } | null;
  sourceUrl: string;
  collectionSourceUrl?: string;
  image: AcervoImage;
};

export type Artist = {
  id: string;
  externalId?: string | null;
  slug: string;
  name: string;
  summary?: string | null;
  description?: string | null;
  biography?: string | null;
  portrait?: AcervoImage | null;
  birthYear: number | null;
  deathYear: number | null;
  birthPlace?: string | null;
  deathPlace?: string | null;
  lifeDates: string | null;
  nationality?: string | null;
  movement?: string | null;
  techniques?: string[];
  themes?: string[];
  influences?: string[];
  keyPeriods?: string[];
  timeline?: ArtistTimelineItem[];
  heroArtworkId?: string | null;
  featuredArtworkId?: string | null;
  featuredArtworkIds?: string[];
  relatedArtistIds?: string[];
  collectionSourceUrl?: string | null;
  sourceUrl: string;
  isPublished?: boolean;
};

export type ArtistTimelineItem = {
  id: string;
  year?: string | null;
  title: string;
  description?: string | null;
};

export type Artwork = {
  id: string;
  externalId?: string | null;
  slug: string;
  title: string;
  inventoryNumber: string;
  artistId: string;
  museumId: string;
  technique: string | null;
  dimensions: string | null;
  year: string | null;
  yearLabel?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  heightCm?: number | null;
  widthCm?: number | null;
  depthCm?: number | null;
  location: string | null;
  locationNote?: string | null;
  exhibitionStatus: string | null;
  sourceUrl: string;
  imageUrl?: string | null;
  imageSrc?: string | null;
  summary?: string | null;
  description?: string | null;
  modifiedAt?: string | null;
  isPublished?: boolean;
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
