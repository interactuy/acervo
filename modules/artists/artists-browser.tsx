"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ArtistAvatar } from "@/components/acervo/artist-avatar";
import { Input } from "@/components/ui/input";
import {
  getSearchScore,
  hasSearchQuery,
  type SearchField,
} from "@/lib/acervo/search";
import type { ArtistWithArtworkCount } from "@/types/acervo";

type ArtistsBrowserProps = {
  artists: ArtistWithArtworkCount[];
};

type SortMode = "name" | "artworks" | "birthYear";

const ALL_VALUE = "__all";
const EMPTY_VALUE = "__empty";
const WITH_PORTRAIT_VALUE = "__with_portrait";
const WITHOUT_PORTRAIT_VALUE = "__without_portrait";
const WITH_BIO_VALUE = "__with_bio";
const WITHOUT_BIO_VALUE = "__without_bio";
const ONE_ARTWORK_VALUE = "1";
const TWO_TO_FOUR_ARTWORKS_VALUE = "2-4";
const FIVE_PLUS_ARTWORKS_VALUE = "5-plus";
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
  { label: "Sin fecha", value: EMPTY_VALUE },
];

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    collator.compare(a, b),
  );
}

function getPeriodValue(birthYear: number | null) {
  if (!birthYear) {
    return EMPTY_VALUE;
  }

  if (birthYear < 1900) {
    return "pre-1900";
  }

  if (birthYear < 1950) {
    return "1900-1949";
  }

  if (birthYear < 2000) {
    return "1950-1999";
  }

  return "2000-plus";
}

function getBirthYearSortValue(birthYear: number | null) {
  return birthYear ?? Number.POSITIVE_INFINITY;
}

export function ArtistsBrowser({ artists }: ArtistsBrowserProps) {
  const [query, setQuery] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState(ALL_VALUE);
  const [periodFilter, setPeriodFilter] = useState(ALL_VALUE);
  const [portraitFilter, setPortraitFilter] = useState(ALL_VALUE);
  const [bioFilter, setBioFilter] = useState(ALL_VALUE);
  const [artworkCountFilter, setArtworkCountFilter] = useState(ALL_VALUE);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [visibleState, setVisibleState] = useState({
    key: "",
    count: INITIAL_VISIBLE_COUNT,
  });

  const nationalities = useMemo(
    () => uniqueSorted(artists.map((artist) => artist.nationality)),
    [artists],
  );

  const availablePeriods = useMemo(() => {
    const usedPeriodValues = new Set<string>(
      artists.map((artist) => getPeriodValue(artist.birthYear)),
    );

    return periodOptions.filter((option) => usedPeriodValues.has(option.value));
  }, [artists]);

  const filteredArtists = useMemo(() => {
    const hasQuery = hasSearchQuery(query);

    return artists
      .map((artist) => ({
        artist,
        searchScore: hasQuery ? getSearchScore(query, getArtistSearchFields(artist)) : 0,
      }))
      .filter(({ artist, searchScore }) => {
        const hasBiography = Boolean(
          artist.description ?? artist.biography ?? artist.summary,
        );
        const matchesQuery = !hasQuery || searchScore > 0;

        const matchesNationality =
          nationalityFilter === ALL_VALUE ||
          artist.nationality === nationalityFilter;
        const matchesPeriod =
          periodFilter === ALL_VALUE ||
          getPeriodValue(artist.birthYear) === periodFilter;
        const matchesPortrait =
          portraitFilter === ALL_VALUE ||
          (portraitFilter === WITH_PORTRAIT_VALUE && Boolean(artist.portrait)) ||
          (portraitFilter === WITHOUT_PORTRAIT_VALUE && !artist.portrait);
        const matchesBio =
          bioFilter === ALL_VALUE ||
          (bioFilter === WITH_BIO_VALUE && hasBiography) ||
          (bioFilter === WITHOUT_BIO_VALUE && !hasBiography);
        const matchesArtworkCount =
          artworkCountFilter === ALL_VALUE ||
          (artworkCountFilter === ONE_ARTWORK_VALUE &&
            artist.artworkCount === 1) ||
          (artworkCountFilter === TWO_TO_FOUR_ARTWORKS_VALUE &&
            artist.artworkCount >= 2 &&
            artist.artworkCount <= 4) ||
          (artworkCountFilter === FIVE_PLUS_ARTWORKS_VALUE &&
            artist.artworkCount >= 5);

        return (
          matchesQuery &&
          matchesNationality &&
          matchesPeriod &&
          matchesPortrait &&
          matchesBio &&
          matchesArtworkCount
        );
      })
      .sort((a, b) => {
        if (hasQuery && a.searchScore !== b.searchScore) {
          return b.searchScore - a.searchScore;
        }

        if (sortMode === "artworks") {
          return (
            b.artist.artworkCount - a.artist.artworkCount ||
            collator.compare(a.artist.name, b.artist.name)
          );
        }

        if (sortMode === "birthYear") {
          return (
            getBirthYearSortValue(a.artist.birthYear) -
              getBirthYearSortValue(b.artist.birthYear) ||
            collator.compare(a.artist.name, b.artist.name)
          );
        }

        return collator.compare(a.artist.name, b.artist.name);
      })
      .map((item) => item.artist);
  }, [
    artists,
    artworkCountFilter,
    bioFilter,
    nationalityFilter,
    periodFilter,
    portraitFilter,
    query,
    sortMode,
  ]);

  const activeFilterCount = [
    query.trim(),
    nationalityFilter !== ALL_VALUE,
    periodFilter !== ALL_VALUE,
    portraitFilter !== ALL_VALUE,
    bioFilter !== ALL_VALUE,
    artworkCountFilter !== ALL_VALUE,
    sortMode !== "name",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const resultKey = [
    query,
    nationalityFilter,
    periodFilter,
    portraitFilter,
    bioFilter,
    artworkCountFilter,
    sortMode,
  ].join("\u001f");
  const currentVisibleCount =
    visibleState.key === resultKey ? visibleState.count : INITIAL_VISIBLE_COUNT;
  const visibleArtists = filteredArtists.slice(0, currentVisibleCount);
  const hasMoreArtists = visibleArtists.length < filteredArtists.length;

  function clearFilters() {
    setQuery("");
    setNationalityFilter(ALL_VALUE);
    setPeriodFilter(ALL_VALUE);
    setPortraitFilter(ALL_VALUE);
    setBioFilter(ALL_VALUE);
    setArtworkCountFilter(ALL_VALUE);
    setSortMode("name");
  }

  return (
    <section className="mt-9">
      <div className="rounded-[1.2rem] bg-card/74 p-3 shadow-[0_22px_80px_rgba(23,25,22,0.07)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            aria-expanded={isFilterPanelOpen}
            aria-controls="artists-filter-panel"
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
                  {filteredArtists.length} de {artists.length}
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
            id="artists-filter-panel"
            className="mt-4 border-t border-border/60 pt-4"
          >
            <div className="flex min-h-14 items-center gap-3 rounded-[1rem] bg-background/78 px-4">
              <Search
                className="size-5 shrink-0 text-primary/64"
                aria-hidden="true"
              />
              <label htmlFor="artists-search" className="sr-only">
                Buscar artistas
              </label>
              <Input
                id="artists-search"
                type="search"
                value={query}
                placeholder="Buscar por artista, nacionalidad, fecha o biografía"
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <FilterSelect
                label="Nacionalidad"
                value={nationalityFilter}
                onChange={setNationalityFilter}
                options={nationalities.map((nationality) => ({
                  label: nationality,
                  value: nationality,
                }))}
              />
              <FilterSelect
                label="Periodo"
                value={periodFilter}
                onChange={setPeriodFilter}
                options={availablePeriods}
              />
              <FilterSelect
                label="Retrato"
                value={portraitFilter}
                onChange={setPortraitFilter}
                options={[
                  { label: "Con retrato", value: WITH_PORTRAIT_VALUE },
                  { label: "Sin retrato", value: WITHOUT_PORTRAIT_VALUE },
                ]}
              />
              <FilterSelect
                label="Biografía"
                value={bioFilter}
                onChange={setBioFilter}
                options={[
                  { label: "Con bio", value: WITH_BIO_VALUE },
                  { label: "Sin bio", value: WITHOUT_BIO_VALUE },
                ]}
              />
              <FilterSelect
                label="Obras"
                value={artworkCountFilter}
                onChange={setArtworkCountFilter}
                options={[
                  { label: "1 obra", value: ONE_ARTWORK_VALUE },
                  { label: "2 a 4 obras", value: TWO_TO_FOUR_ARTWORKS_VALUE },
                  { label: "5 o más obras", value: FIVE_PLUS_ARTWORKS_VALUE },
                ]}
              />
              <FilterSelect
                label="Orden"
                value={sortMode}
                onChange={(value) => setSortMode(value as SortMode)}
                includeAllOption={false}
                options={[
                  { label: "Nombre", value: "name" },
                  { label: "Más obras", value: "artworks" },
                  { label: "Nacimiento", value: "birthYear" },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {filteredArtists.length > 0 ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              Mostrando {visibleArtists.length} de {filteredArtists.length}
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visibleArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
          {hasMoreArtists && (
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
            No hay artistas para esos filtros
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Probá limpiar algún filtro o buscar por nombre, nacionalidad, fecha
            o biografía.
          </p>
        </div>
      )}
    </section>
  );
}

function getArtistSearchFields(artist: ArtistWithArtworkCount): SearchField[] {
  return [
    { value: artist.name, weight: 12 },
    { value: artist.slug, weight: 6 },
    { value: artist.externalId, weight: 8 },
    { value: artist.lifeDates, weight: 6 },
    { value: artist.birthYear, weight: 6 },
    { value: artist.deathYear, weight: 5 },
    { value: artist.nationality, weight: 5 },
    { value: artist.birthPlace, weight: 5 },
    { value: artist.deathPlace, weight: 4 },
    { value: artist.movement, weight: 5 },
    { value: artist.techniques?.join(" "), weight: 4 },
    { value: artist.themes?.join(" "), weight: 4 },
    { value: artist.influences?.join(" "), weight: 3 },
    { value: artist.keyPeriods?.join(" "), weight: 3 },
    { value: artist.summary, weight: 3 },
    { value: artist.description, weight: 2 },
    { value: artist.biography, weight: 2 },
    { value: artist.sourceUrl, weight: 1 },
  ];
}

function ArtistCard({ artist }: { artist: ArtistWithArtworkCount }) {
  return (
    <Link
      id={artist.slug}
      href={`/artistas/${artist.slug}`}
      className="group rounded-[1.1rem] bg-card/78 p-4 shadow-[0_18px_60px_rgba(23,25,22,0.05)] transition hover:-translate-y-0.5 hover:bg-card"
    >
      <span className="flex gap-4">
        <ArtistAvatar artist={artist} className="size-20 text-2xl" sizes="5rem" />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="font-serif text-2xl font-medium leading-tight text-foreground">
              {artist.name}
            </span>
            <ArrowRight
              className="mt-1 size-4 shrink-0 text-primary/70 transition group-hover:translate-x-1 group-hover:text-primary"
              aria-hidden="true"
            />
          </span>
          <span className="mt-2 block text-sm text-muted-foreground">
            {artist.lifeDates ?? "Fechas no registradas"}
          </span>
          {artist.summary && (
            <span className="mt-3 line-clamp-2 block text-sm leading-6 text-muted-foreground">
              {artist.summary}
            </span>
          )}
          <span className="mt-4 block text-sm font-medium text-primary">
            {artist.artworkCount} obras vinculadas
          </span>
        </span>
      </span>
    </Link>
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
