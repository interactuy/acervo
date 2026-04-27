"use client";

import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, Search, X } from "lucide-react";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import { Input } from "@/components/ui/input";
import type { ArtworkWithArtist } from "@/types/acervo";

type ArtworksBrowserProps = {
  artworks: ArtworkWithArtist[];
};

type SortMode = "inventory" | "title" | "artist" | "year";

const ALL_VALUE = "__all";
const EMPTY_YEAR_VALUE = "__empty_year";
const collator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    collator.compare(a, b),
  );
}

function getYearSortValue(year: string | null) {
  if (!year) {
    return Number.POSITIVE_INFINITY;
  }

  const match = year.match(/\d{4}/);

  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
}

export function ArtworksBrowser({ artworks }: ArtworksBrowserProps) {
  const [query, setQuery] = useState("");
  const [artistFilter, setArtistFilter] = useState(ALL_VALUE);
  const [museumFilter, setMuseumFilter] = useState(ALL_VALUE);
  const [yearFilter, setYearFilter] = useState(ALL_VALUE);
  const [techniqueFilter, setTechniqueFilter] = useState(ALL_VALUE);
  const [exhibitionFilter, setExhibitionFilter] = useState(ALL_VALUE);
  const [sortMode, setSortMode] = useState<SortMode>("inventory");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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

  const years = useMemo(
    () =>
      uniqueSorted(artworks.map((artwork) => artwork.year)).sort(
        (a, b) => getYearSortValue(a) - getYearSortValue(b),
      ),
    [artworks],
  );

  const techniques = useMemo(
    () => uniqueSorted(artworks.map((artwork) => artwork.technique)),
    [artworks],
  );

  const exhibitionStatuses = useMemo(
    () => uniqueSorted(artworks.map((artwork) => artwork.exhibitionStatus)),
    [artworks],
  );

  const filteredArtworks = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return artworks
      .filter((artwork) => {
        const matchesQuery =
          !normalizedQuery ||
          normalizeSearchText(
            [
              artwork.title,
              artwork.inventoryNumber,
              artwork.artist?.name,
              artwork.museum?.name,
              artwork.technique,
              artwork.dimensions,
              artwork.year,
              artwork.exhibitionStatus,
            ]
              .filter(Boolean)
              .join(" "),
          ).includes(normalizedQuery);

        const matchesArtist =
          artistFilter === ALL_VALUE || artwork.artistId === artistFilter;
        const matchesMuseum =
          museumFilter === ALL_VALUE || artwork.museumId === museumFilter;
        const matchesYear =
          yearFilter === ALL_VALUE ||
          (yearFilter === EMPTY_YEAR_VALUE && !artwork.year) ||
          artwork.year === yearFilter;
        const matchesTechnique =
          techniqueFilter === ALL_VALUE ||
          artwork.technique === techniqueFilter;
        const matchesExhibition =
          exhibitionFilter === ALL_VALUE ||
          artwork.exhibitionStatus === exhibitionFilter;

        return (
          matchesQuery &&
          matchesArtist &&
          matchesMuseum &&
          matchesYear &&
          matchesTechnique &&
          matchesExhibition
        );
      })
      .sort((a, b) => {
        if (sortMode === "title") {
          return collator.compare(a.title, b.title);
        }

        if (sortMode === "artist") {
          return collator.compare(a.artist?.name ?? "", b.artist?.name ?? "");
        }

        if (sortMode === "year") {
          return (
            getYearSortValue(a.year) - getYearSortValue(b.year) ||
            collator.compare(a.title, b.title)
          );
        }

        return collator.compare(a.inventoryNumber, b.inventoryNumber);
      });
  }, [
    artistFilter,
    artworks,
    exhibitionFilter,
    museumFilter,
    query,
    sortMode,
    techniqueFilter,
    yearFilter,
  ]);

  const activeFilterCount = [
    query.trim(),
    artistFilter !== ALL_VALUE,
    museumFilter !== ALL_VALUE,
    yearFilter !== ALL_VALUE,
    techniqueFilter !== ALL_VALUE,
    exhibitionFilter !== ALL_VALUE,
    sortMode !== "inventory",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  function clearFilters() {
    setQuery("");
    setArtistFilter(ALL_VALUE);
    setMuseumFilter(ALL_VALUE);
    setYearFilter(ALL_VALUE);
    setTechniqueFilter(ALL_VALUE);
    setExhibitionFilter(ALL_VALUE);
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                label="Año"
                value={yearFilter}
                onChange={setYearFilter}
                options={[
                  ...years.map((year) => ({ label: year, value: year })),
                  { label: "Sin fecha", value: EMPTY_YEAR_VALUE },
                ]}
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
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredArtworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
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
