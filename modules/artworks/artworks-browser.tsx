"use client";

import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, Search, X } from "lucide-react";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import { Input } from "@/components/ui/input";
import {
  getSearchScore,
  hasSearchQuery,
  type SearchField,
} from "@/lib/acervo/search";
import type { ArtworkWithArtist } from "@/types/acervo";

type ArtworksBrowserProps = {
  artworks: ArtworkWithArtist[];
};

type SortMode = "inventory" | "title" | "artist" | "year";

const ALL_VALUE = "__all";
const EMPTY_YEAR_VALUE = "__empty_year";
const WITH_IMAGE_VALUE = "__with_image";
const WITHOUT_IMAGE_VALUE = "__without_image";
const INITIAL_VISIBLE_COUNT = 60;
const VISIBLE_INCREMENT = 60;
const collator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

const periodOptions = [
  { label: "Hasta 1899", value: "pre-1900" },
  { label: "1900-1949", value: "1900-1949" },
  { label: "1950-1999", value: "1950-1999" },
  { label: "2000 en adelante", value: "2000-plus" },
  { label: "Sin fecha", value: EMPTY_YEAR_VALUE },
];

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    collator.compare(a, b),
  );
}

function getYearSortValue(year: string | null | undefined) {
  if (!year) {
    return Number.POSITIVE_INFINITY;
  }

  const match = year.match(/\d{4}/);

  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
}

function getArtworkYear(artwork: ArtworkWithArtist) {
  return artwork.yearLabel ?? artwork.year;
}

function getArtworkYearStart(artwork: ArtworkWithArtist) {
  return artwork.yearStart ?? getYearSortValue(getArtworkYear(artwork));
}

function getPeriodValue(artwork: ArtworkWithArtist) {
  const year = getArtworkYearStart(artwork);

  if (!Number.isFinite(year)) {
    return EMPTY_YEAR_VALUE;
  }

  if (year < 1900) {
    return "pre-1900";
  }

  if (year < 1950) {
    return "1900-1949";
  }

  if (year < 2000) {
    return "1950-1999";
  }

  return "2000-plus";
}

export function ArtworksBrowser({ artworks }: ArtworksBrowserProps) {
  const [query, setQuery] = useState("");
  const [artistFilter, setArtistFilter] = useState(ALL_VALUE);
  const [museumFilter, setMuseumFilter] = useState(ALL_VALUE);
  const [periodFilter, setPeriodFilter] = useState(ALL_VALUE);
  const [techniqueFilter, setTechniqueFilter] = useState(ALL_VALUE);
  const [exhibitionFilter, setExhibitionFilter] = useState(ALL_VALUE);
  const [imageFilter, setImageFilter] = useState(ALL_VALUE);
  const [sortMode, setSortMode] = useState<SortMode>("inventory");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [visibleState, setVisibleState] = useState({
    key: "",
    count: INITIAL_VISIBLE_COUNT,
  });

  const artists = useMemo(() => {
    const artistMap = new Map<string, string>();

    artworks.forEach((artwork) => {
      if (artwork.artist) {
        artistMap.set(artwork.artist.id, artwork.artist.name);
      }
    });

    return Array.from(artistMap.entries()).sort((a, b) =>
      collator.compare(a[1], b[1]),
    );
  }, [artworks]);

  const museums = useMemo(() => {
    const museumMap = new Map<string, string>();

    artworks.forEach((artwork) => {
      if (artwork.museum) {
        museumMap.set(artwork.museum.id, artwork.museum.name);
      }
    });

    return Array.from(museumMap.entries()).sort((a, b) =>
      collator.compare(a[1], b[1]),
    );
  }, [artworks]);

  const availablePeriods = useMemo(() => {
    const usedPeriodValues = new Set<string>(
      artworks.map((artwork) => getPeriodValue(artwork)),
    );

    return periodOptions.filter((option) => usedPeriodValues.has(option.value));
  }, [artworks]);

  const techniques = useMemo(
    () => uniqueSorted(artworks.map((artwork) => artwork.technique)),
    [artworks],
  );

  const exhibitionStatuses = useMemo(
    () => uniqueSorted(artworks.map((artwork) => artwork.exhibitionStatus)),
    [artworks],
  );

  const filteredArtworks = useMemo(() => {
    const hasQuery = hasSearchQuery(query);

    return artworks
      .map((artwork) => ({
        artwork,
        searchScore: hasQuery
          ? getSearchScore(query, getArtworkSearchFields(artwork))
          : 0,
      }))
      .filter(({ artwork, searchScore }) => {
        const imageSrc = artwork.imageSrc ?? artwork.imageUrl;
        const matchesQuery = !hasQuery || searchScore > 0;

        const matchesArtist =
          artistFilter === ALL_VALUE || artwork.artistId === artistFilter;
        const matchesMuseum =
          museumFilter === ALL_VALUE || artwork.museumId === museumFilter;
        const matchesPeriod =
          periodFilter === ALL_VALUE || getPeriodValue(artwork) === periodFilter;
        const matchesTechnique =
          techniqueFilter === ALL_VALUE ||
          artwork.technique === techniqueFilter;
        const matchesExhibition =
          exhibitionFilter === ALL_VALUE ||
          artwork.exhibitionStatus === exhibitionFilter;
        const matchesImage =
          imageFilter === ALL_VALUE ||
          (imageFilter === WITH_IMAGE_VALUE && Boolean(imageSrc)) ||
          (imageFilter === WITHOUT_IMAGE_VALUE && !imageSrc);

        return (
          matchesQuery &&
          matchesArtist &&
          matchesMuseum &&
          matchesPeriod &&
          matchesTechnique &&
          matchesExhibition &&
          matchesImage
        );
      })
      .sort((a, b) => {
        if (hasQuery && a.searchScore !== b.searchScore) {
          return b.searchScore - a.searchScore;
        }

        if (sortMode === "title") {
          return collator.compare(a.artwork.title, b.artwork.title);
        }

        if (sortMode === "artist") {
          return collator.compare(
            a.artwork.artist?.name ?? "",
            b.artwork.artist?.name ?? "",
          );
        }

        if (sortMode === "year") {
          return (
            getYearSortValue(getArtworkYear(a.artwork)) -
              getYearSortValue(getArtworkYear(b.artwork)) ||
            collator.compare(a.artwork.title, b.artwork.title)
          );
        }

        return collator.compare(a.artwork.inventoryNumber, b.artwork.inventoryNumber);
      })
      .map((item) => item.artwork);
  }, [
    artistFilter,
    artworks,
    exhibitionFilter,
    imageFilter,
    museumFilter,
    periodFilter,
    query,
    sortMode,
    techniqueFilter,
  ]);

  const activeFilterCount = [
    query.trim(),
    artistFilter !== ALL_VALUE,
    museumFilter !== ALL_VALUE,
    periodFilter !== ALL_VALUE,
    techniqueFilter !== ALL_VALUE,
    exhibitionFilter !== ALL_VALUE,
    imageFilter !== ALL_VALUE,
    sortMode !== "inventory",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const resultKey = [
    query,
    artistFilter,
    museumFilter,
    periodFilter,
    techniqueFilter,
    exhibitionFilter,
    imageFilter,
    sortMode,
  ].join("\u001f");
  const currentVisibleCount =
    visibleState.key === resultKey ? visibleState.count : INITIAL_VISIBLE_COUNT;
  const visibleArtworks = filteredArtworks.slice(0, currentVisibleCount);
  const hasMoreArtworks = visibleArtworks.length < filteredArtworks.length;

  function clearFilters() {
    setQuery("");
    setArtistFilter(ALL_VALUE);
    setMuseumFilter(ALL_VALUE);
    setPeriodFilter(ALL_VALUE);
    setTechniqueFilter(ALL_VALUE);
    setExhibitionFilter(ALL_VALUE);
    setImageFilter(ALL_VALUE);
    setSortMode("inventory");
  }

  return (
    <section className="mt-9">
      <div className="rounded-[1.2rem] bg-card/74 p-3 shadow-[0_22px_80px_rgba(23,25,22,0.07)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            aria-expanded={isFilterPanelOpen}
            aria-controls="artworks-filter-panel"
            className="inline-flex min-h-[3.25rem] w-full items-center justify-between gap-3 rounded-[1rem] bg-background/78 px-4 py-2 text-left transition hover:bg-background sm:max-w-md"
            onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  Buscar y filtrar
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {filteredArtworks.length} de {artworks.length}
                  {hasActiveFilters
                    ? ` · ${activeFilterCount} ${
                        activeFilterCount === 1
                          ? "filtro activo"
                          : "filtros activos"
                      }`
                    : ""}
                </span>
              </span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-primary transition ${
                isFilterPanelOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-muted px-4 text-sm font-medium text-foreground transition hover:bg-muted/78"
              onClick={clearFilters}
            >
              <X className="size-4" aria-hidden="true" />
              Limpiar
            </button>
          )}
        </div>

        {isFilterPanelOpen && (
          <div
            id="artworks-filter-panel"
            className="mt-4 border-t border-border/60 pt-4"
          >
            <div className="flex min-h-14 items-center gap-3 rounded-[1rem] bg-background/78 px-4">
              <Search
                className="size-5 shrink-0 text-primary/64"
                aria-hidden="true"
              />
              <label htmlFor="artworks-search" className="sr-only">
                Buscar obras
              </label>
              <Input
                id="artworks-search"
                type="search"
                value={query}
                placeholder="Buscar por obra, artista, técnica o inventario"
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              <FilterSelect
                label="Artista"
                value={artistFilter}
                onChange={setArtistFilter}
                options={artists.map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
              />
              <FilterSelect
                label="Museo"
                value={museumFilter}
                onChange={setMuseumFilter}
                options={museums.map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
              />
              <FilterSelect
                label="Periodo"
                value={periodFilter}
                onChange={setPeriodFilter}
                options={availablePeriods}
              />
              <FilterSelect
                label="Técnica"
                value={techniqueFilter}
                onChange={setTechniqueFilter}
                options={techniques.map((technique) => ({
                  label: technique,
                  value: technique,
                }))}
              />
              <FilterSelect
                label="Exhibición"
                value={exhibitionFilter}
                onChange={setExhibitionFilter}
                options={exhibitionStatuses.map((status) => ({
                  label: status === "No" ? "No exhibida" : status,
                  value: status,
                }))}
              />
              <FilterSelect
                label="Imagen"
                value={imageFilter}
                onChange={setImageFilter}
                options={[
                  { label: "Con imagen", value: WITH_IMAGE_VALUE },
                  { label: "Sin imagen", value: WITHOUT_IMAGE_VALUE },
                ]}
              />
              <FilterSelect
                label="Orden"
                value={sortMode}
                onChange={(value) => setSortMode(value as SortMode)}
                includeAllOption={false}
                options={[
                  { label: "Inventario", value: "inventory" },
                  { label: "Título", value: "title" },
                  { label: "Artista", value: "artist" },
                  { label: "Año", value: "year" },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {filteredArtworks.length > 0 ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              Mostrando {visibleArtworks.length} de {filteredArtworks.length}
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visibleArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
          {hasMoreArtworks && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                onClick={() => {
                  setVisibleState((state) => ({
                    key: resultKey,
                    count:
                      (state.key === resultKey
                        ? state.count
                        : INITIAL_VISIBLE_COUNT) + VISIBLE_INCREMENT,
                  }));
                }}
              >
                Mostrar más
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-[1.2rem] bg-card/78 p-8 shadow-[0_18px_60px_rgba(23,25,22,0.05)]">
          <h2 className="font-serif text-3xl font-medium text-foreground">
            No hay obras para esos filtros
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Probá limpiar algún filtro o buscar por título, artista, técnica,
            año o número de inventario.
          </p>
        </div>
      )}
    </section>
  );
}

function getArtworkSearchFields(artwork: ArtworkWithArtist): SearchField[] {
  return [
    { value: artwork.title, weight: 12 },
    { value: artwork.externalId, weight: 12 },
    { value: artwork.inventoryNumber, weight: 12 },
    { value: artwork.slug, weight: 5 },
    { value: artwork.artist?.name, weight: 9 },
    { value: artwork.artist?.slug, weight: 5 },
    { value: artwork.museum?.name, weight: 5 },
    { value: artwork.technique, weight: 7 },
    { value: artwork.dimensions, weight: 5 },
    { value: artwork.heightCm, weight: 3 },
    { value: artwork.widthCm, weight: 3 },
    { value: artwork.depthCm, weight: 3 },
    { value: getArtworkYear(artwork), weight: 6 },
    { value: artwork.yearStart, weight: 6 },
    { value: artwork.yearEnd, weight: 5 },
    { value: artwork.locationNote ?? artwork.location, weight: 5 },
    { value: artwork.exhibitionStatus, weight: 4 },
    { value: artwork.summary, weight: 3 },
    { value: artwork.description, weight: 2 },
    { value: artwork.sourceUrl, weight: 1 },
  ];
}

type FilterOption = {
  label: string;
  value: string;
};

function FilterSelect({
  label,
  value,
  options,
  includeAllOption = true,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  includeAllOption?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-primary/70">
        {label}
      </span>
      <select
        value={value}
        className="h-11 w-full rounded-[0.9rem] bg-background/78 px-3 text-sm text-foreground outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/30"
        onChange={(event) => onChange(event.target.value)}
      >
        {includeAllOption && <option value={ALL_VALUE}>Todos</option>}
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
