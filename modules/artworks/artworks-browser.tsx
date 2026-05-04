"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Brush,
  CalendarDays,
  Compass,
  ImageOff,
  Landmark,
  Palette,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import {
  getSearchScore,
  hasSearchQuery,
  type SearchField,
} from "@/lib/acervo/search";
import { cn } from "@/lib/utils";
import { ContemplativeMode } from "@/modules/artworks/contemplative-mode";
import type { ArtworkWithArtist } from "@/types/acervo";

type ArtworksBrowserProps = {
  artworks: ArtworkWithArtist[];
};

type SortMode = "curated" | "title" | "artist" | "year";

type FilterOption = {
  label: string;
  value: string;
};

type ThemeEntry = {
  title: string;
  description: string;
  query: string;
  type?: string;
};

const ALL_VALUE = "__all";
const EMPTY_YEAR_VALUE = "__empty_year";
const INITIAL_VISIBLE_COUNT = 72;
const VISIBLE_INCREMENT = 72;

const collator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

const periodOptions = [
  { label: "Antes de 1900", value: "pre-1900" },
  { label: "Siglo XX", value: "1900-1999" },
  { label: "1900-1949", value: "1900-1949" },
  { label: "1950-1999", value: "1950-1999" },
  { label: "2000 en adelante", value: "2000-plus" },
  { label: "Sin fecha", value: EMPTY_YEAR_VALUE },
];

const quickChips = [
  "Pintura",
  "Dibujo",
  "Grabado",
  "Retrato",
  "Paisaje",
  "Figuración",
  "Abstracción",
  "Siglo XX",
];

const themeEntries: ThemeEntry[] = [
  {
    title: "El cuerpo",
    description: "Figuras, gestos y presencias que vuelven sensible la mirada.",
    query: "figura retrato cuerpo",
  },
  {
    title: "La ciudad",
    description: "Calles, talleres, plazas y arquitectura como memoria urbana.",
    query: "ciudad puerto plaza calle",
  },
  {
    title: "El paisaje",
    description: "Campo, costa y territorio como formas de mirar el país.",
    query: "paisaje campo costa cerro",
  },
  {
    title: "El trabajo",
    description: "Oficios, ritmos y escenas donde aparece la vida material.",
    query: "trabajo taller oficio",
  },
  {
    title: "Lo cotidiano",
    description: "Interiores, objetos y momentos mínimos cargados de mundo.",
    query: "interior naturaleza muerta costura",
  },
  {
    title: "La abstracción",
    description: "Color, forma y ritmo cuando la imagen se libera del relato.",
    query: "abstracto abstracción composición",
  },
  {
    title: "El retrato",
    description: "Rostros y cuerpos que nos devuelven una época y una presencia.",
    query: "retrato cabeza figura",
  },
  {
    title: "La costa",
    description: "Playas, puertos y orillas como borde afectivo del territorio.",
    query: "costa playa puerto bañistas",
  },
];

const preferredFeaturedArtists = [
  "Petrona Viera",
  "Rafael Barradas",
  "Joaquín Torres García",
  "Pedro Figari",
  "José Cuneo",
  "Carlos Federico Sáez",
  "Carlos María Herrera",
  "Juan Manuel Blanes",
];

export function ArtworksBrowser({ artworks }: ArtworksBrowserProps) {
  const explorerRef = useRef<HTMLElement | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [artistFilter, setArtistFilter] = useState(ALL_VALUE);
  const [museumFilter, setMuseumFilter] = useState(ALL_VALUE);
  const [periodFilter, setPeriodFilter] = useState(ALL_VALUE);
  const [techniqueFilter, setTechniqueFilter] = useState(ALL_VALUE);
  const [typeFilter, setTypeFilter] = useState(ALL_VALUE);
  const [imageOnly, setImageOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("curated");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] =
    useState<ArtworkWithArtist | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);
  const [visibleState, setVisibleState] = useState({
    key: "",
    count: INITIAL_VISIBLE_COUNT,
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") ?? "";

      setSearchInput(q);
      setQuery(q);
      setArtistFilter(params.get("artist") ?? ALL_VALUE);
      setMuseumFilter(params.get("museum") ?? ALL_VALUE);
      setPeriodFilter(params.get("period") ?? ALL_VALUE);
      setTechniqueFilter(params.get("technique") ?? ALL_VALUE);
      setTypeFilter(params.get("type") ?? ALL_VALUE);
      setImageOnly(params.get("image") === "1");

      const nextSort = params.get("sort");
      if (
        nextSort === "title" ||
        nextSort === "artist" ||
        nextSort === "year"
      ) {
        setSortMode(nextSort);
      }

      setHasLoadedUrlState(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery(searchInput.trim());
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!hasLoadedUrlState) {
      return;
    }

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (artistFilter !== ALL_VALUE) params.set("artist", artistFilter);
    if (museumFilter !== ALL_VALUE) params.set("museum", museumFilter);
    if (periodFilter !== ALL_VALUE) params.set("period", periodFilter);
    if (techniqueFilter !== ALL_VALUE) params.set("technique", techniqueFilter);
    if (typeFilter !== ALL_VALUE) params.set("type", typeFilter);
    if (imageOnly) params.set("image", "1");
    if (sortMode !== "curated") params.set("sort", sortMode);

    const nextQuery = params.toString();
    const nextUrl = nextQuery
      ? `${window.location.pathname}?${nextQuery}`
      : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }, [
    artistFilter,
    hasLoadedUrlState,
    imageOnly,
    museumFilter,
    periodFilter,
    query,
    sortMode,
    techniqueFilter,
    typeFilter,
  ]);

  useEffect(() => {
    if (!isMobileFiltersOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileFiltersOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileFiltersOpen]);

  const imageArtworks = useMemo(
    () => artworks.filter((artwork) => Boolean(getArtworkImageSrc(artwork))),
    [artworks],
  );

  const heroArtworks = useMemo(
    () => selectFeaturedArtworks(artworks, 5),
    [artworks],
  );

  const featuredArtworks = useMemo(
    () => selectFeaturedArtworks(artworks, 6),
    [artworks],
  );

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

    return periodOptions.filter((option) => {
      if (option.value === "1900-1999") {
        return (
          usedPeriodValues.has("1900-1949") ||
          usedPeriodValues.has("1950-1999")
        );
      }

      return usedPeriodValues.has(option.value);
    });
  }, [artworks]);

  const techniques = useMemo(
    () => uniqueSorted(artworks.map((artwork) => artwork.technique)),
    [artworks],
  );

  const artworkTypes = useMemo(
    () => uniqueSorted(artworks.map((artwork) => getArtworkType(artwork))),
    [artworks],
  );

  const themesWithImages = useMemo(
    () =>
      themeEntries.map((theme) => ({
        ...theme,
        artwork: findThemeArtwork(artworks, theme),
      })),
    [artworks],
  );

  const filteredArtworks = useMemo(() => {
    const hasQuery = hasSearchQuery(query);

    return artworks
      .map((artwork, index) => ({
        artwork,
        index,
        searchScore: hasQuery
          ? getSearchScore(query, getArtworkSearchFields(artwork))
          : 0,
      }))
      .filter(({ artwork, searchScore }) => {
        const imageSrc = getArtworkImageSrc(artwork);
        const matchesQuery = !hasQuery || searchScore > 0;
        const matchesArtist =
          artistFilter === ALL_VALUE || artwork.artistId === artistFilter;
        const matchesMuseum =
          museumFilter === ALL_VALUE || artwork.museumId === museumFilter;
        const matchesPeriod =
          periodFilter === ALL_VALUE || matchesPeriodFilter(artwork, periodFilter);
        const matchesTechnique =
          techniqueFilter === ALL_VALUE ||
          artwork.technique === techniqueFilter;
        const matchesType =
          typeFilter === ALL_VALUE || getArtworkType(artwork) === typeFilter;
        const matchesImage = !imageOnly || Boolean(imageSrc);

        return (
          matchesQuery &&
          matchesArtist &&
          matchesMuseum &&
          matchesPeriod &&
          matchesTechnique &&
          matchesType &&
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

        return getCuratedRank(a.artwork, a.index) - getCuratedRank(b.artwork, b.index);
      })
      .map((item) => item.artwork);
  }, [
    artistFilter,
    artworks,
    imageOnly,
    museumFilter,
    periodFilter,
    query,
    sortMode,
    techniqueFilter,
    typeFilter,
  ]);

  const activeFilterCount = [
    query,
    artistFilter !== ALL_VALUE,
    museumFilter !== ALL_VALUE,
    periodFilter !== ALL_VALUE,
    techniqueFilter !== ALL_VALUE,
    typeFilter !== ALL_VALUE,
    imageOnly,
    sortMode !== "curated",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const resultKey = [
    query,
    artistFilter,
    museumFilter,
    periodFilter,
    techniqueFilter,
    typeFilter,
    imageOnly,
    sortMode,
  ].join("\u001f");
  const currentVisibleCount =
    visibleState.key === resultKey ? visibleState.count : INITIAL_VISIBLE_COUNT;
  const visibleArtworks = filteredArtworks.slice(0, currentVisibleCount);
  const hasMoreArtworks = visibleArtworks.length < filteredArtworks.length;

  const scrollToExplorer = useCallback(() => {
    explorerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setQuery("");
    setArtistFilter(ALL_VALUE);
    setMuseumFilter(ALL_VALUE);
    setPeriodFilter(ALL_VALUE);
    setTechniqueFilter(ALL_VALUE);
    setTypeFilter(ALL_VALUE);
    setImageOnly(false);
    setSortMode("curated");
  }, []);

  const chooseArtwork = useCallback(() => {
    const preferredPool = filteredArtworks.filter((artwork) =>
      Boolean(getArtworkImageSrc(artwork)),
    );
    const fallbackPool = imageArtworks.length > 0 ? imageArtworks : artworks;
    const pool = preferredPool.length > 0 ? preferredPool : fallbackPool;
    const randomArtwork = pool[Math.floor(Math.random() * pool.length)];

    if (randomArtwork) {
      setSelectedArtwork(randomArtwork);
    }
  }, [artworks, filteredArtworks, imageArtworks]);

  function applyChip(label: string) {
    setSearchInput(label === "Siglo XX" ? "" : label);

    if (label === "Siglo XX") {
      setPeriodFilter("1900-1999");
      setTypeFilter(ALL_VALUE);
    } else if (["Pintura", "Dibujo", "Grabado"].includes(label)) {
      setTypeFilter(label);
      setPeriodFilter(ALL_VALUE);
    } else {
      setTypeFilter(ALL_VALUE);
      setPeriodFilter(ALL_VALUE);
    }

    scrollToExplorer();
  }

  function applyTheme(theme: ThemeEntry) {
    setSearchInput(theme.query);
    setTypeFilter(theme.type ?? ALL_VALUE);
    setImageOnly(true);
    scrollToExplorer();
  }

  const filterProps = {
    artistFilter,
    artists,
    availablePeriods,
    clearFilters,
    hasActiveFilters,
    imageOnly,
    museumFilter,
    museums,
    periodFilter,
    setArtistFilter,
    setImageOnly,
    setMuseumFilter,
    setPeriodFilter,
    setSortMode,
    setTechniqueFilter,
    setTypeFilter,
    sortMode,
    techniqueFilter,
    techniques,
    typeFilter,
    artworkTypes,
  };

  return (
    <>
      <WorksHero
        artworks={heroArtworks}
        resultCount={filteredArtworks.length}
        searchValue={searchInput}
        totalCount={artworks.length}
        onChipSelect={applyChip}
        onDiscover={chooseArtwork}
        onSearchChange={setSearchInput}
        onSearchSubmit={scrollToExplorer}
      />

      <FeaturedWorks artworks={featuredArtworks} onSelect={setSelectedArtwork} />

      <ThemeEntryGrid themes={themesWithImages} onSelect={applyTheme} />

      <section
        ref={explorerRef}
        className="border-t border-[#ded6c8] bg-[#f4efe6] py-12 sm:py-16"
      >
        <Container>
          <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <WorksFilters {...filterProps} />
              </div>
            </aside>

            <div>
              <div className="grid gap-5 border-b border-[#ded6c8] pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7a5d42]">
                    Todas las obras
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-medium leading-tight text-[#191a16] sm:text-5xl">
                    Un acervo para recorrer con la mirada
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69655d] sm:text-base">
                    {filteredArtworks.length.toLocaleString("es-UY")} de{" "}
                    {artworks.length.toLocaleString("es-UY")} obras visibles
                    {hasActiveFilters
                      ? ` · ${activeFilterCount} ${
                          activeFilterCount === 1
                            ? "filtro activo"
                            : "filtros activos"
                        }`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cbbfae] bg-[#fffdf7] px-4 text-sm font-medium text-[#25231d] transition hover:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 lg:hidden"
                    onClick={() => setIsMobileFiltersOpen(true)}
                  >
                    <SlidersHorizontal className="size-4" aria-hidden="true" />
                    Filtrar obras
                  </button>
                  <DiscoverWorkButton onDiscover={chooseArtwork} compact />
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-lg border border-[#ded6c8] bg-[#fffdf7]/64 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <SearchField
                  id="works-inline-search"
                  value={searchInput}
                  placeholder="Buscar por obra, artista, técnica, año o museo"
                  onChange={setSearchInput}
                  onSubmit={scrollToExplorer}
                />

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#ede3d5] px-4 text-sm font-medium text-[#25231d] transition hover:bg-[#e3d7c6] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
                    onClick={clearFilters}
                  >
                    <X className="size-4" aria-hidden="true" />
                    Limpiar filtros
                  </button>
                )}
              </div>

              {filteredArtworks.length > 0 ? (
                <>
                  <WorksMasonryGrid
                    artworks={visibleArtworks}
                    onSelect={setSelectedArtwork}
                  />

                  {hasMoreArtworks && (
                    <div className="mt-10 flex justify-center">
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#253c2f] px-5 text-sm font-medium text-white transition hover:bg-[#1d3025] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
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
                        Mostrar más obras
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyWorksState onClear={clearFilters} />
              )}
            </div>
          </div>
        </Container>
      </section>

      {isMobileFiltersOpen && (
        <MobileFiltersSheet
          filterProps={filterProps}
          onClose={() => setIsMobileFiltersOpen(false)}
        />
      )}

      <WorkQuickView
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
    </>
  );
}

function WorksHero({
  artworks,
  resultCount,
  searchValue,
  totalCount,
  onChipSelect,
  onDiscover,
  onSearchChange,
  onSearchSubmit,
}: {
  artworks: ArtworkWithArtist[];
  resultCount: number;
  searchValue: string;
  totalCount: number;
  onChipSelect: (chip: string) => void;
  onDiscover: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
}) {
  const primaryArtwork = artworks[0];
  const secondaryArtworks = artworks.slice(1, 5);

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f4ed]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,#f7f4ed_0%,#fffdf7_48%,#e8eee6_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(247,244,237,0)_0%,#f7f4ed_80%)]" />

      <Container className="grid min-h-[calc(100svh-5rem)] gap-10 pb-12 pt-10 sm:pb-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#7a5d42]">
            Obras
          </p>
          <h1 className="mt-4 font-serif text-[4rem] font-medium leading-[0.9] text-[#171916] sm:text-[5.8rem] lg:text-[7rem]">
            Explorar obras
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5b53] sm:text-lg sm:leading-9">
            Un recorrido visual por obras del arte uruguayo: pinturas, dibujos,
            grabados, esculturas y piezas que forman parte de nuestra memoria
            cultural.
          </p>

          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
          >
            <SearchField
              id="works-hero-search"
              value={searchValue}
              placeholder="Buscar por obra, artista, técnica, año o museo"
              onChange={onSearchChange}
              onSubmit={onSearchSubmit}
              large
            />
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className="rounded-full border border-[#d9d0bf] bg-[#fffdf7]/76 px-3 py-2 text-sm font-medium text-[#4f473d] transition hover:border-[#9c7d55] hover:bg-white hover:text-[#191a16] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
                onClick={() => onChipSelect(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <DiscoverWorkButton onDiscover={onDiscover} />
            <p className="max-w-xs text-sm leading-6 text-[#756f64]">
              No siempre se entra al arte sabiendo qué buscar.
            </p>
          </div>
        </div>

        <div className="relative min-h-[28rem] lg:min-h-[42rem]">
          {primaryArtwork && (
            <FloatingArtwork
              artwork={primaryArtwork}
              className="left-[6%] top-6 w-[72%] sm:left-[12%] sm:w-[62%] lg:left-[14%] lg:top-8 lg:w-[58%]"
              imageClassName="aspect-[4/5]"
              priority
            />
          )}

          {secondaryArtworks.map((artwork, index) => (
            <FloatingArtwork
              key={artwork.id}
              artwork={artwork}
              className={cn(
                "hidden sm:block",
                index === 0 &&
                  "right-[2%] top-0 w-[34%] rotate-[2deg] lg:right-[4%]",
                index === 1 &&
                  "bottom-[12%] right-[0%] w-[38%] -rotate-[3deg] lg:right-[2%]",
                index === 2 &&
                  "bottom-[4%] left-[0%] w-[34%] rotate-[2deg] lg:left-[3%]",
                index === 3 &&
                  "right-[18%] top-[58%] w-[26%] rotate-[5deg] opacity-90",
              )}
              imageClassName={
                index === 0
                  ? "aspect-[5/4]"
                  : index === 1
                    ? "aspect-[3/4]"
                    : "aspect-square"
              }
            />
          ))}

          <div className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 rounded-full border border-[#d9d0bf] bg-[#fffdf7]/82 px-4 py-2 text-sm text-[#5f5b53] backdrop-blur sm:block">
            {resultCount.toLocaleString("es-UY")} obras para mirar de{" "}
            {totalCount.toLocaleString("es-UY")}
          </div>
        </div>
      </Container>
    </section>
  );
}

function FloatingArtwork({
  artwork,
  className,
  imageClassName,
  priority = false,
}: {
  artwork: ArtworkWithArtist;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  const imageSrc = getArtworkImageSrc(artwork);

  if (!imageSrc) {
    return null;
  }

  return (
    <figure
      className={cn(
        "absolute overflow-hidden rounded-lg bg-[#fffdf7] p-2 shadow-[0_28px_70px_rgba(39,34,26,0.16)] ring-1 ring-[#d8cdbc]/70",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden rounded-md bg-[#efe8dc]", imageClassName)}>
        <Image
          src={imageSrc}
          alt={getArtworkAlt(artwork)}
          fill
          sizes="(min-width: 1024px) 34vw, 60vw"
          unoptimized={imageSrc.startsWith("http")}
          priority={priority}
          className="object-cover"
        />
      </div>
      <figcaption className="px-1 pt-2 text-xs leading-5 text-[#62594e]">
        <span className="line-clamp-1 font-medium text-[#25231d]">
          {artwork.title}
        </span>
        <span className="line-clamp-1">
          {artwork.artist?.name ?? "Autor sin registrar"}
        </span>
      </figcaption>
    </figure>
  );
}

function FeaturedWorks({
  artworks,
  onSelect,
}: {
  artworks: ArtworkWithArtist[];
  onSelect: (artwork: ArtworkWithArtist) => void;
}) {
  if (artworks.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f7f4ed] py-10 sm:py-14">
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7a5d42]">
              Obras destacadas
            </p>
            <h2 className="mt-2 font-serif text-4xl font-medium leading-tight text-[#171916] sm:text-5xl">
              Una selección inicial para empezar a mirar.
            </h2>
          </div>
        </div>

        <div className="-mx-4 mt-7 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 xl:grid-cols-6">
          {artworks.map((artwork, index) => (
            <FeaturedWorkCard
              key={artwork.id}
              artwork={artwork}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeaturedWorkCard({
  artwork,
  index,
  onSelect,
}: {
  artwork: ArtworkWithArtist;
  index: number;
  onSelect: (artwork: ArtworkWithArtist) => void;
}) {
  const imageSrc = getArtworkImageSrc(artwork);
  const year = getArtworkYear(artwork);

  return (
    <button
      type="button"
      className="group w-[76vw] shrink-0 snap-start text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 sm:w-auto"
      onClick={() => onSelect(artwork)}
    >
      <div
        className="relative overflow-hidden rounded-lg bg-[#ede5d7]"
        style={{ aspectRatio: getArtworkAspectRatio(artwork, index) }}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={getArtworkAlt(artwork)}
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 768px) 30vw, 76vw"
            unoptimized={imageSrc.startsWith("http")}
            className="object-cover transition duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <ArtworkImageFallback />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-[#2c241c]/0 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:bg-[#2c241c]/34 group-hover:opacity-100">
          Ver obra
        </span>
      </div>
      <span className="mt-3 block line-clamp-2 font-serif text-xl font-medium leading-tight text-[#191a16]">
        {artwork.title}
      </span>
      <span className="mt-1 block line-clamp-1 text-sm text-[#6a6258]">
        {[artwork.artist?.name, year].filter(Boolean).join(" · ")}
      </span>
    </button>
  );
}

function ThemeEntryGrid({
  themes,
  onSelect,
}: {
  themes: Array<ThemeEntry & { artwork: ArtworkWithArtist | null }>;
  onSelect: (theme: ThemeEntry) => void;
}) {
  return (
    <section className="bg-[#fffdf7] py-12 sm:py-16">
      <Container>
        <div className="grid gap-5 md:grid-cols-[0.7fr_1fr] md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7a5d42]">
              Entrar por temas
            </p>
            <h2 className="mt-2 font-serif text-4xl font-medium leading-tight text-[#171916] sm:text-5xl">
              Ocho formas de empezar sin saber el nombre.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#69655d] sm:text-base">
            Recorridos sensibles para entrar al acervo por atmósferas,
            materiales y escenas antes que por una ficha técnica.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {themes.map((theme) => (
            <button
              key={theme.title}
              type="button"
              className="group relative min-h-64 overflow-hidden rounded-lg bg-[#27231e] p-5 text-left text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
              onClick={() => onSelect(theme)}
            >
              {theme.artwork && getArtworkImageSrc(theme.artwork) && (
                <Image
                  src={getArtworkImageSrc(theme.artwork) as string}
                  alt={getArtworkAlt(theme.artwork)}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 92vw"
                  unoptimized={(getArtworkImageSrc(theme.artwork) as string).startsWith(
                    "http",
                  )}
                  className="object-cover opacity-78 transition duration-700 group-hover:scale-[1.035]"
                />
              )}
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,17,14,0.14)_0%,rgba(19,17,14,0.82)_100%)]" />
              <span className="relative flex h-full min-h-52 flex-col justify-end">
                <span className="font-serif text-3xl font-medium leading-tight">
                  {theme.title}
                </span>
                <span className="mt-3 text-sm leading-6 text-white/78">
                  {theme.description}
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white">
                  Explorar
                  <ArrowRight
                    className="size-4 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </span>
            </button>
          ))}
        </div>
      </Container>
    </section>
  );
}

function WorksFilters({
  artistFilter,
  artists,
  availablePeriods,
  clearFilters,
  hasActiveFilters,
  imageOnly,
  museumFilter,
  museums,
  periodFilter,
  setArtistFilter,
  setImageOnly,
  setMuseumFilter,
  setPeriodFilter,
  setSortMode,
  setTechniqueFilter,
  setTypeFilter,
  sortMode,
  techniqueFilter,
  techniques,
  typeFilter,
  artworkTypes,
}: {
  artistFilter: string;
  artists: Array<[string, string]>;
  availablePeriods: FilterOption[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
  imageOnly: boolean;
  museumFilter: string;
  museums: Array<[string, string]>;
  periodFilter: string;
  setArtistFilter: (value: string) => void;
  setImageOnly: (value: boolean) => void;
  setMuseumFilter: (value: string) => void;
  setPeriodFilter: (value: string) => void;
  setSortMode: (value: SortMode) => void;
  setTechniqueFilter: (value: string) => void;
  setTypeFilter: (value: string) => void;
  sortMode: SortMode;
  techniqueFilter: string;
  techniques: string[];
  typeFilter: string;
  artworkTypes: string[];
}) {
  return (
    <div className="rounded-lg border border-[#ded6c8] bg-[#fffdf7]/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#191a16]">Filtros</p>
          <p className="mt-1 text-xs leading-5 text-[#756f64]">
            Ajustes discretos para orientar el recorrido.
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-[#7a5d42] transition hover:bg-[#ede3d5]"
            onClick={clearFilters}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        <FilterSelect
          icon={Palette}
          label="Artista"
          value={artistFilter}
          onChange={setArtistFilter}
          options={artists.map(([id, name]) => ({ label: name, value: id }))}
        />
        <FilterSelect
          icon={Brush}
          label="Técnica"
          value={techniqueFilter}
          onChange={setTechniqueFilter}
          options={techniques.map((technique) => ({
            label: technique,
            value: technique,
          }))}
        />
        <FilterSelect
          icon={Landmark}
          label="Museo / colección"
          value={museumFilter}
          onChange={setMuseumFilter}
          options={museums.map(([id, name]) => ({ label: name, value: id }))}
        />
        <FilterSelect
          icon={CalendarDays}
          label="Año o período"
          value={periodFilter}
          onChange={setPeriodFilter}
          options={availablePeriods}
        />
        <FilterSelect
          icon={Sparkles}
          label="Tipo de obra"
          value={typeFilter}
          onChange={setTypeFilter}
          options={artworkTypes.map((type) => ({ label: type, value: type }))}
        />
        <FilterSelect
          icon={Compass}
          label="Orden"
          value={sortMode}
          includeAllOption={false}
          onChange={(value) => setSortMode(value as SortMode)}
          options={[
            { label: "Recorrido visual", value: "curated" },
            { label: "Título", value: "title" },
            { label: "Artista", value: "artist" },
            { label: "Año", value: "year" },
          ]}
        />

        <button
          type="button"
          aria-pressed={imageOnly}
          className={cn(
            "flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
            imageOnly
              ? "border-[#7a5d42] bg-[#ede3d5] text-[#191a16]"
              : "border-[#ded6c8] bg-[#fffdf7]/70 text-[#5f5b53] hover:bg-white",
          )}
          onClick={() => setImageOnly(!imageOnly)}
        >
          <span className="flex items-center gap-2">
            <ImageOff className="size-4" aria-hidden="true" />
            Con imagen disponible
          </span>
          <span
            className={cn(
              "h-5 w-9 rounded-full p-0.5 transition",
              imageOnly ? "bg-[#253c2f]" : "bg-[#d8cebd]",
            )}
          >
            <span
              className={cn(
                "block size-4 rounded-full bg-white transition",
                imageOnly ? "translate-x-4" : "translate-x-0",
              )}
            />
          </span>
        </button>
      </div>
    </div>
  );
}

function MobileFiltersSheet({
  filterProps,
  onClose,
}: {
  filterProps: Parameters<typeof WorksFilters>[0];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[#191a16]/35"
        aria-label="Cerrar filtros"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-2xl bg-[#f7f4ed] p-4 shadow-[0_-24px_80px_rgba(23,25,22,0.2)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#191a16]">Filtrar obras</p>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-[#ede3d5] text-[#25231d]"
            aria-label="Cerrar filtros"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <WorksFilters {...filterProps} />
      </div>
    </div>
  );
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  options,
  includeAllOption = true,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  options: FilterOption[];
  includeAllOption?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#7a5d42]">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <select
        value={value}
        className="min-h-11 w-full rounded-lg border border-[#ded6c8] bg-[#fffdf7]/72 px-3 text-sm text-[#25231d] outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/30"
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

function SearchField({
  id,
  value,
  placeholder,
  large = false,
  onChange,
  onSubmit,
}: {
  id: string;
  value: string;
  placeholder: string;
  large?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border border-[#d9d0bf] bg-[#fffdf7]/86 px-4 shadow-[0_18px_50px_rgba(39,34,26,0.08)] backdrop-blur",
        large ? "min-h-[4.3rem] sm:px-5" : "min-h-12",
      )}
    >
      <Search className="size-5 shrink-0 text-[#7a5d42]" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        Buscar obras
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        className={cn(
          "h-11 min-w-0 flex-1 bg-transparent text-[#191a16] outline-none placeholder:text-[#8b8377]",
          large ? "text-base sm:text-lg" : "text-sm",
        )}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="hidden min-h-10 items-center justify-center rounded-full bg-[#253c2f] px-4 text-sm font-medium text-white transition hover:bg-[#1d3025] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 sm:inline-flex"
        onClick={onSubmit}
      >
        Buscar
      </button>
    </div>
  );
}

function DiscoverWorkButton({
  compact = false,
  onDiscover,
}: {
  compact?: boolean;
  onDiscover: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#253c2f] text-sm font-medium text-white transition hover:bg-[#1d3025] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
        compact ? "px-4" : "px-5",
      )}
      onClick={onDiscover}
    >
      <Shuffle className="size-4" aria-hidden="true" />
      Descubrir una obra
    </button>
  );
}

function WorksMasonryGrid({
  artworks,
  onSelect,
}: {
  artworks: ArtworkWithArtist[];
  onSelect: (artwork: ArtworkWithArtist) => void;
}) {
  return (
    <div className="mt-8 columns-1 gap-5 min-[520px]:columns-2 xl:columns-3 2xl:columns-4">
      {artworks.map((artwork, index) => (
        <WorkCard
          key={artwork.id}
          artwork={artwork}
          index={index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function WorkCard({
  artwork,
  index,
  onSelect,
}: {
  artwork: ArtworkWithArtist;
  index: number;
  onSelect: (artwork: ArtworkWithArtist) => void;
}) {
  const imageSrc = getArtworkImageSrc(artwork);
  const year = getArtworkYear(artwork);
  const meta = [artwork.artist?.name, year].filter(Boolean).join(" · ");
  const style: CSSProperties = {
    aspectRatio: getArtworkAspectRatio(artwork, index),
  };

  return (
    <article className="mb-5 break-inside-avoid">
      <button
        type="button"
        className="group block w-full text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
        onClick={() => onSelect(artwork)}
      >
        <div
          className="relative overflow-hidden rounded-lg bg-[#e9dfcf]"
          style={style}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={getArtworkAlt(artwork)}
              fill
              sizes="(min-width: 1536px) 22vw, (min-width: 1280px) 28vw, (min-width: 520px) 46vw, 92vw"
              unoptimized={imageSrc.startsWith("http")}
              className="object-contain p-2 transition duration-700 group-hover:scale-[1.025]"
            />
          ) : (
            <ArtworkImageFallback />
          )}
          <span className="absolute inset-0 flex items-end bg-[linear-gradient(180deg,rgba(37,32,26,0)_0%,rgba(37,32,26,0.7)_100%)] p-4 opacity-0 transition duration-300 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fffdf7] px-3 py-2 text-sm font-medium text-[#25231d]">
              Ver ficha
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </span>
        </div>
        <div className="pt-3">
          <h3 className="line-clamp-2 font-serif text-2xl font-medium leading-tight text-[#191a16]">
            {artwork.title}
          </h3>
          {meta && (
            <p className="mt-1 line-clamp-1 text-sm leading-6 text-[#6a6258]">
              {meta}
            </p>
          )}
        </div>
      </button>
    </article>
  );
}

function WorkQuickView({
  artwork,
  onClose,
}: {
  artwork: ArtworkWithArtist | null;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const imageSrc = artwork ? getArtworkImageSrc(artwork) : null;

  useEffect(() => {
    if (!artwork) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [artwork, onClose]);

  if (!artwork) {
    return null;
  }

  const year = getArtworkYear(artwork);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha rápida de ${artwork.title}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#171916]/36 backdrop-blur-[2px]"
        aria-label="Cerrar ficha rápida"
        onClick={onClose}
      />

      <aside className="absolute inset-x-0 bottom-0 max-h-[92svh] overflow-y-auto rounded-t-2xl border-[#ded6c8] bg-[#fffdf7] shadow-[0_-28px_90px_rgba(23,25,22,0.2)] md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(36rem,92vw)] md:rounded-none md:border-l md:shadow-[-28px_0_90px_rgba(23,25,22,0.18)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ded6c8] bg-[#fffdf7]/90 px-5 py-4 backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#7a5d42]">
            Ficha rápida
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-[#ede3d5] text-[#25231d] transition hover:bg-[#e2d5c3] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
            aria-label="Cerrar ficha rápida"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#ede5d7]">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={getArtworkAlt(artwork)}
                fill
                sizes="(min-width: 768px) 36rem, 92vw"
                unoptimized={imageSrc.startsWith("http")}
                className="object-contain p-3"
              />
            ) : (
              <ArtworkImageFallback />
            )}
          </div>

          <h2 className="mt-6 font-serif text-4xl font-medium leading-tight text-[#191a16]">
            {artwork.title}
          </h2>
          <p className="mt-2 text-base leading-7 text-[#69655d]">
            {[artwork.artist?.name ?? "Autor sin registrar", year]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <WorkMetadata artwork={artwork} />

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/obras/${artwork.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#253c2f] px-5 text-sm font-medium text-white transition hover:bg-[#1d3025] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
            >
              Ver ficha completa
            </Link>
            <ContemplativeMode
              imageSrc={imageSrc}
              title={artwork.title}
              artistName={artwork.artist?.name}
              year={year}
              triggerClassName="border-[#cbbfae] text-[#25231d] hover:bg-[#ede3d5]"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

function WorkMetadata({ artwork }: { artwork: ArtworkWithArtist }) {
  const details = [
    { label: "Artista", value: artwork.artist?.name },
    { label: "Año", value: getArtworkYear(artwork) },
    { label: "Técnica", value: artwork.technique },
    { label: "Medidas", value: artwork.dimensions },
    { label: "Museo / colección", value: artwork.museum?.name },
    { label: "Inventario", value: artwork.inventoryNumber },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  );

  return (
    <dl className="mt-6 divide-y divide-[#ded6c8] border-y border-[#ded6c8]">
      {details.map((item) => (
        <div key={item.label} className="grid grid-cols-[7rem_1fr] gap-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#7a5d42]">
            {item.label}
          </dt>
          <dd className="text-sm leading-6 text-[#25231d]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyWorksState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-8 rounded-lg border border-[#ded6c8] bg-[#fffdf7]/70 p-8">
      <h3 className="font-serif text-4xl font-medium text-[#191a16]">
        No encontramos obras con esos filtros.
      </h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#69655d]">
        Probá buscar por otro término o volver al recorrido visual completo del
        acervo.
      </p>
      <button
        type="button"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#253c2f] px-5 text-sm font-medium text-white transition hover:bg-[#1d3025] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
        onClick={onClear}
      >
        Limpiar filtros
      </button>
    </div>
  );
}

function ArtworkImageFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#efe8dc_0%,#e8eee6_100%)] px-6 text-center text-[#7a5d42]">
      <ImageOff className="size-8" aria-hidden="true" />
      <span className="text-xs font-medium uppercase tracking-[0.16em]">
        Imagen no disponible
      </span>
    </div>
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
    { value: getArtworkType(artwork), weight: 7 },
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

function getArtworkImageSrc(artwork: ArtworkWithArtist) {
  return artwork.imageSrc ?? artwork.imageUrl ?? null;
}

function getArtworkAlt(artwork: ArtworkWithArtist) {
  return [artwork.title, artwork.artist?.name].filter(Boolean).join(", ");
}

function getArtworkYear(artwork: ArtworkWithArtist) {
  return artwork.yearLabel ?? artwork.year;
}

function getYearSortValue(year: string | null | undefined) {
  if (!year) {
    return Number.POSITIVE_INFINITY;
  }

  const match = year.match(/\d{4}/);

  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
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

function matchesPeriodFilter(artwork: ArtworkWithArtist, periodFilter: string) {
  if (periodFilter === "1900-1999") {
    const year = getArtworkYearStart(artwork);

    return Number.isFinite(year) && year >= 1900 && year < 2000;
  }

  return getPeriodValue(artwork) === periodFilter;
}

function getArtworkType(artwork: ArtworkWithArtist) {
  const source = normalizeText(`${artwork.technique ?? ""} ${artwork.title}`);

  if (/oleo|acrilico|tempera|acuarela|pintura|gouache/.test(source)) {
    return "Pintura";
  }

  if (/dibujo|grafito|lapiz|carbonilla|tinta|pastel/.test(source)) {
    return "Dibujo";
  }

  if (/grabado|xilografia|litografia|aguafuerte|serigrafia|monotipo/.test(source)) {
    return "Grabado";
  }

  if (/escultura|bronce|madera|yeso|relieve|marmol|hierro/.test(source)) {
    return "Escultura";
  }

  if (/fotografia|foto|gelatina/.test(source)) {
    return "Fotografía";
  }

  if (/ceramica|barro|gres/.test(source)) {
    return "Cerámica";
  }

  if (/tapiz|textil|bordado/.test(source)) {
    return "Textil";
  }

  return "Otros";
}

function getArtworkAspectRatio(artwork: ArtworkWithArtist, index: number) {
  const width = artwork.widthCm;
  const height = artwork.heightCm;

  if (width && height && width > 0 && height > 0) {
    const ratio = width / height;

    if (ratio > 1.55) {
      return "5 / 4";
    }

    if (ratio < 0.62) {
      return "3 / 4";
    }

    return `${width} / ${height}`;
  }

  return ["4 / 5", "1 / 1", "5 / 4", "3 / 4", "6 / 5"][index % 5];
}

function selectFeaturedArtworks(artworks: ArtworkWithArtist[], limit: number) {
  const imageWorks = artworks.filter((artwork) => Boolean(getArtworkImageSrc(artwork)));
  const selected: ArtworkWithArtist[] = [];
  const selectedArtistIds = new Set<string>();

  for (const artistName of preferredFeaturedArtists) {
    const artwork = imageWorks.find(
      (item) =>
        normalizeText(item.artist?.name) === normalizeText(artistName) &&
        !selectedArtistIds.has(item.artistId),
    );

    if (artwork) {
      selected.push(artwork);
      selectedArtistIds.add(artwork.artistId);
    }

    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const artwork of imageWorks) {
    if (selected.some((item) => item.id === artwork.id)) {
      continue;
    }

    if (!selectedArtistIds.has(artwork.artistId) || selected.length < 3) {
      selected.push(artwork);
      selectedArtistIds.add(artwork.artistId);
    }

    if (selected.length >= limit) {
      return selected;
    }
  }

  return selected;
}

function findThemeArtwork(artworks: ArtworkWithArtist[], theme: ThemeEntry) {
  const tokens = normalizeText(theme.query).split(" ").filter(Boolean);

  return (
    artworks.find((artwork) => {
      if (!getArtworkImageSrc(artwork)) {
        return false;
      }

      const haystack = normalizeText(
        [
          artwork.title,
          artwork.technique,
          artwork.description,
          artwork.summary,
          artwork.artist?.name,
        ].join(" "),
      );

      return tokens.some((token) => haystack.includes(token));
    }) ?? null
  );
}

function getCuratedRank(artwork: ArtworkWithArtist, index: number) {
  const imageBonus = getArtworkImageSrc(artwork) ? 0 : 100000;
  const preferredArtistIndex = preferredFeaturedArtists.findIndex(
    (name) => normalizeText(name) === normalizeText(artwork.artist?.name),
  );
  const artistBonus =
    preferredArtistIndex >= 0 ? preferredArtistIndex * 100 : 5000;

  return imageBonus + artistBonus + index;
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    collator.compare(a, b),
  );
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
