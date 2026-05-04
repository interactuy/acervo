"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brush,
  CalendarRange,
  Compass,
  Frame,
  Landmark,
  Search,
  Shuffle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getSearchScore,
  hasSearchQuery,
  type SearchField,
} from "@/lib/acervo/search";
import { cn } from "@/lib/utils";
import type { ArtistWithArtworkCount } from "@/types/acervo";

type ArtistsBrowserProps = {
  artists: ArtistWithArtworkCount[];
};

type HeroArtwork = {
  id: string;
  title: string;
  artistName: string;
  imageSrc: string;
};

type SortMode = "name" | "artworks" | "birthYear" | "recent";

const ALL_VALUE = "__all";
const EMPTY_VALUE = "__empty";
const WITH_BIO_VALUE = "__with_bio";
const INITIAL_VISIBLE_COUNT = 48;
const VISIBLE_INCREMENT = 48;
const disciplineChips = [
  "Todos",
  "Pintura",
  "Escultura",
  "Fotografía",
  "Grabado",
  "Dibujo",
];
const searchSuggestions = [
  "Torres García",
  "Petrona Viera",
  "Figari",
  "Barradas",
  "Amalia Nieto",
];
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

function getRecentSortValue(artist: ArtistWithArtworkCount) {
  return artist.deathYear ?? artist.birthYear ?? Number.NEGATIVE_INFINITY;
}

function getBirthYearSortValue(birthYear: number | null) {
  return birthYear ?? Number.POSITIVE_INFINITY;
}

export function ArtistsBrowser({ artists }: ArtistsBrowserProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("Todos");
  const [nationalityFilter, setNationalityFilter] = useState(ALL_VALUE);
  const [museumFilter, setMuseumFilter] = useState(ALL_VALUE);
  const [periodFilter, setPeriodFilter] = useState(ALL_VALUE);
  const [bioFilter, setBioFilter] = useState(ALL_VALUE);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [visibleState, setVisibleState] = useState({
    key: "",
    count: INITIAL_VISIBLE_COUNT,
  });

  const nationalities = useMemo(
    () => uniqueSorted(artists.map((artist) => artist.nationality)),
    [artists],
  );

  const museums = useMemo(() => {
    const museumsById = new Map<string, { id: string; name: string }>();

    artists.forEach((artist) => {
      artist.linkedMuseums.forEach((museum) => {
        museumsById.set(museum.id, {
          id: museum.id,
          name: museum.name,
        });
      });
    });

    return Array.from(museumsById.values()).sort((a, b) =>
      collator.compare(a.name, b.name),
    );
  }, [artists]);

  const availablePeriods = useMemo(() => {
    const usedPeriodValues = new Set<string>(
      artists.map((artist) => getPeriodValue(artist.birthYear)),
    );

    return periodOptions.filter((option) => usedPeriodValues.has(option.value));
  }, [artists]);

  const stats = useMemo(() => {
    const totalArtworks = artists.reduce(
      (total, artist) => total + artist.artworkCount,
      0,
    );
    const disciplines = new Set(
      artists.flatMap((artist) => artist.disciplines),
    );
    const linkedMuseums = new Set(
      artists.flatMap((artist) => artist.linkedMuseums.map((museum) => museum.id)),
    );

    return {
      artists: artists.length,
      artworks: totalArtworks,
      disciplines: disciplines.size,
      museums: linkedMuseums.size,
      periods: availablePeriods.length,
    };
  }, [artists, availablePeriods.length]);

  const featuredArtists = useMemo(() => getFeaturedArtists(artists), [artists]);
  const heroArtworks = useMemo(() => getHeroArtworks(artists), [artists]);

  const filteredArtists = useMemo(() => {
    const hasQuery = hasSearchQuery(query);

    return artists
      .map((artist) => ({
        artist,
        searchScore: hasQuery
          ? getSearchScore(query, getArtistSearchFields(artist))
          : 0,
      }))
      .filter(({ artist, searchScore }) => {
        const hasBiography = Boolean(
          artist.description ?? artist.biography ?? artist.summary,
        );
        const matchesQuery = !hasQuery || searchScore > 0;
        const matchesDiscipline =
          disciplineFilter === "Todos" ||
          artist.disciplines.includes(disciplineFilter);
        const matchesNationality =
          nationalityFilter === ALL_VALUE ||
          artist.nationality === nationalityFilter;
        const matchesMuseum =
          museumFilter === ALL_VALUE ||
          artist.linkedMuseums.some((museum) => museum.id === museumFilter);
        const matchesPeriod =
          periodFilter === ALL_VALUE ||
          getPeriodValue(artist.birthYear) === periodFilter;
        const matchesBio =
          bioFilter === ALL_VALUE ||
          (bioFilter === WITH_BIO_VALUE && hasBiography);

        return (
          matchesQuery &&
          matchesDiscipline &&
          matchesNationality &&
          matchesMuseum &&
          matchesPeriod &&
          matchesBio
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

        if (sortMode === "recent") {
          return (
            getRecentSortValue(b.artist) - getRecentSortValue(a.artist) ||
            collator.compare(a.artist.name, b.artist.name)
          );
        }

        return collator.compare(a.artist.name, b.artist.name);
      })
      .map((item) => item.artist);
  }, [
    artists,
    bioFilter,
    disciplineFilter,
    museumFilter,
    nationalityFilter,
    periodFilter,
    query,
    sortMode,
  ]);

  const activeFilterCount = [
    query.trim(),
    disciplineFilter !== "Todos",
    nationalityFilter !== ALL_VALUE,
    museumFilter !== ALL_VALUE,
    periodFilter !== ALL_VALUE,
    bioFilter !== ALL_VALUE,
    sortMode !== "name",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const resultKey = [
    query,
    disciplineFilter,
    nationalityFilter,
    museumFilter,
    periodFilter,
    bioFilter,
    sortMode,
  ].join("\u001f");
  const currentVisibleCount =
    visibleState.key === resultKey ? visibleState.count : INITIAL_VISIBLE_COUNT;
  const visibleArtists = filteredArtists.slice(0, currentVisibleCount);
  const hasMoreArtists = visibleArtists.length < filteredArtists.length;

  function clearFilters() {
    setQuery("");
    setDisciplineFilter("Todos");
    setNationalityFilter(ALL_VALUE);
    setMuseumFilter(ALL_VALUE);
    setPeriodFilter(ALL_VALUE);
    setBioFilter(ALL_VALUE);
    setSortMode("name");
  }

  function openRandomArtist() {
    const pool = filteredArtists.length > 0 ? filteredArtists : artists;
    const artist = pool[Math.floor(Math.random() * pool.length)];

    if (artist) {
      router.push(`/artistas/${artist.slug}`);
    }
  }

  function setMnavFilter() {
    const mnav = museums.find((museum) =>
      normalizeText(museum.name).includes("museo nacional de artes visuales"),
    );

    if (mnav) {
      setMuseumFilter(mnav.id);
    }
  }

  return (
    <>
      <ArtistsHero
        query={query}
        artworks={heroArtworks}
        stats={stats}
        onQueryChange={setQuery}
        onSuggestionClick={setQuery}
      />

      <div className="mx-auto w-full max-w-[92rem] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <ExploreBySection
          stats={stats}
          onExplorePeriods={() => setPeriodFilter("pre-1900")}
          onExploreDisciplines={() => setDisciplineFilter("Pintura")}
          onExploreMuseums={setMnavFilter}
          onExploreArtworks={() => setSortMode("artworks")}
        />

        <SuggestedRoutes artists={featuredArtists} />

        <DiscoveryBlock
          onPlanism={() => setQuery("planismo")}
          onMnav={setMnavFilter}
          onBefore1900={() => {
            setPeriodFilter("pre-1900");
            setSortMode("birthYear");
          }}
          onArtworkRoute={() => setSortMode("artworks")}
          onRandom={openRandomArtist}
        />

        <section className="mt-14" id="todos-los-artistas">
          <div className="flex flex-col gap-5 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
                Todos los artistas
              </p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
                Un archivo para recorrer
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {filteredArtists.length} resultados
              {hasActiveFilters ? ` · ${activeFilterCount} filtros activos` : ""}
            </p>
          </div>

          <ArtistsFilters
            query={query}
            disciplineFilter={disciplineFilter}
            nationalityFilter={nationalityFilter}
            museumFilter={museumFilter}
            periodFilter={periodFilter}
            bioFilter={bioFilter}
            sortMode={sortMode}
            advancedOpen={advancedOpen}
            nationalities={nationalities}
            museums={museums}
            periods={availablePeriods}
            hasActiveFilters={hasActiveFilters}
            onQueryChange={setQuery}
            onDisciplineChange={setDisciplineFilter}
            onNationalityChange={setNationalityFilter}
            onMuseumChange={setMuseumFilter}
            onPeriodChange={setPeriodFilter}
            onBioChange={setBioFilter}
            onSortChange={setSortMode}
            onAdvancedToggle={() => setAdvancedOpen((isOpen) => !isOpen)}
            onClear={clearFilters}
          />

          <ArtistsGrid
            artists={visibleArtists}
            total={filteredArtists.length}
            hasMore={hasMoreArtists}
            resultKey={resultKey}
            onShowMore={() => {
              setVisibleState((state) => ({
                key: resultKey,
                count:
                  (state.key === resultKey
                    ? state.count
                    : INITIAL_VISIBLE_COUNT) + VISIBLE_INCREMENT,
              }));
            }}
          />
        </section>
      </div>
    </>
  );
}

type ArtistStats = {
  artists: number;
  artworks: number;
  disciplines: number;
  museums: number;
  periods: number;
};

function ArtistsHero({
  query,
  artworks,
  stats,
  onQueryChange,
  onSuggestionClick,
}: {
  query: string;
  artworks: HeroArtwork[];
  stats: ArtistStats;
  onQueryChange: (value: string) => void;
  onSuggestionClick: (value: string) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document
      .getElementById("todos-los-artistas")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-foreground text-white">
      <div className="absolute inset-0 -z-20">
        {artworks.slice(0, 3).map((artwork, index) => (
          <Image
            key={`${artwork.artistName}-${artwork.id}`}
            src={artwork.imageSrc}
            alt={`${artwork.title} de ${artwork.artistName}`}
            fill
            priority={index === 0}
            sizes="100vw"
            unoptimized={artwork.imageSrc.startsWith("http")}
            className="home-hero-image object-cover"
            style={{ animationDelay: `${index * 6}s` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,7,7,0.82)_0%,rgba(7,7,7,0.58)_42%,rgba(7,7,7,0.28)_76%,rgba(7,7,7,0.58)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_28%,rgba(0,0,0,0.36),transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0)_34%,rgba(0,0,0,0.62)_100%)]" />

      <div className="mx-auto flex w-full max-w-[92rem] flex-col justify-center px-4 pb-8 pt-28 sm:px-6 sm:pb-9 sm:pt-32 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/72 sm:text-sm sm:tracking-[0.18em]">
            Artistas
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-[3.25rem] font-medium leading-[0.98] text-white sm:mt-5 sm:text-7xl sm:leading-[0.94] lg:text-8xl">
            Artistas
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:mt-6 sm:text-xl sm:leading-8">
            Un mapa de nombres, obras y miradas que forman parte de nuestra
            memoria visual.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-[0.12em] text-white/64 sm:text-sm">
            <span>{stats.artists.toLocaleString("es-UY")} artistas</span>
            <span>{stats.artworks.toLocaleString("es-UY")} obras</span>
            <span>{stats.disciplines.toLocaleString("es-UY")} disciplinas</span>
            <span>{stats.museums.toLocaleString("es-UY")} museos</span>
          </div>
        </div>

        <form
          className="mt-9 flex w-full max-w-[50rem] items-center gap-2 rounded-[1.1rem] bg-[#15130f]/64 p-1.5 shadow-[0_18px_58px_rgba(0,0,0,0.16)] backdrop-blur-[2px] sm:mt-10 sm:gap-2.5 sm:rounded-[1.35rem] sm:bg-[#15130f]/72 sm:p-2.5 sm:shadow-[0_24px_76px_rgba(0,0,0,0.2)]"
          role="search"
          onSubmit={handleSubmit}
        >
          <label htmlFor="artists-hero-search" className="sr-only">
            Buscar artistas
          </label>
          <Search className="ml-3 hidden size-5 text-[#f8f3e8]/62 sm:block" />
          <Input
            id="artists-hero-search"
            type="search"
            value={query}
            placeholder="Buscar por nombre, obra, técnica, período..."
            className="h-12 rounded-[0.85rem] border-0 bg-[#f8f3e8]/18 px-3 text-sm text-white shadow-none placeholder:text-white/62 focus-visible:ring-0 sm:h-14 sm:rounded-[1.05rem] sm:px-4 sm:text-base"
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button
            type="submit"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-[0.85rem] bg-[#f8f3e8]/18 px-4 text-sm font-medium text-white transition hover:bg-[#f8f3e8]/28 sm:h-14 sm:rounded-[1.05rem] sm:px-7"
          >
            Explorar
          </button>
        </form>

        <div className="mt-4 flex w-[calc(100%+1rem)] max-w-[50rem] snap-x snap-mandatory gap-2 overflow-x-auto pr-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:w-full sm:flex-wrap sm:overflow-visible sm:pr-0 [&::-webkit-scrollbar]:hidden">
          {searchSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="shrink-0 snap-start rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white/92 backdrop-blur-sm transition hover:bg-white/16 hover:text-white"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArtistSearch({
  id,
  value,
  placeholder,
  className,
  onChange,
}: {
  id: string;
  value: string;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-[0.95rem] bg-card px-4 text-foreground shadow-[0_14px_40px_rgba(23,25,22,0.055)] backdrop-blur",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        Buscar artistas
      </label>
      <Input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ExploreBySection({
  stats,
  onExplorePeriods,
  onExploreDisciplines,
  onExploreMuseums,
  onExploreArtworks,
}: {
  stats: ArtistStats;
  onExplorePeriods: () => void;
  onExploreDisciplines: () => void;
  onExploreMuseums: () => void;
  onExploreArtworks: () => void;
}) {
  const items = [
    {
      title: "Épocas",
      description: "Entrá por generaciones, años de nacimiento y momentos del acervo.",
      count: `${stats.periods} cortes`,
      icon: CalendarRange,
      onClick: onExplorePeriods,
    },
    {
      title: "Disciplinas",
      description: "Pintura, escultura, grabado, fotografía y otras formas de creación.",
      count: `${stats.disciplines} líneas`,
      icon: Brush,
      onClick: onExploreDisciplines,
    },
    {
      title: "Museos",
      description: "Conectá artistas con instituciones y colecciones vinculadas.",
      count: `${stats.museums} museos`,
      icon: Landmark,
      onClick: onExploreMuseums,
    },
    {
      title: "Obras",
      description: "Partí de las piezas registradas para llegar a sus autores.",
      count: `${stats.artworks.toLocaleString("es-UY")} obras`,
      icon: Frame,
      onClick: onExploreArtworks,
    },
  ];

  return (
    <section>
      <SectionHeading
        eyebrow="Explorar por"
        title="Entradas posibles al acervo"
      />
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              type="button"
              className="group min-w-[17rem] rounded-lg border border-border bg-card p-5 text-left shadow-[0_16px_55px_rgba(23,25,22,0.045)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_22px_65px_rgba(23,25,22,0.08)] lg:min-w-0"
              onClick={item.onClick}
            >
              <span className="flex items-start justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-primary">
                  {item.count}
                </span>
              </span>
              <span className="mt-5 block font-serif text-3xl font-medium leading-tight text-foreground">
                {item.title}
              </span>
              <span className="mt-3 block text-sm leading-6 text-muted-foreground">
                {item.description}
              </span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Explorar
                <ArrowRight
                  className="size-4 transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SuggestedRoutes({ artists }: { artists: ArtistWithArtworkCount[] }) {
  return (
    <section className="mt-14">
      <SectionHeading
        eyebrow="Para empezar a explorar"
        title="Recorridos con punto de partida"
      />
      <div className="mt-6 flex gap-5 overflow-x-auto pb-2 xl:grid xl:grid-cols-3 xl:overflow-visible xl:pb-0">
        {artists.map((artist, index) => (
          <FeaturedArtistCard key={artist.id} artist={artist} index={index} />
        ))}
      </div>
    </section>
  );
}

function FeaturedArtistCard({
  artist,
  index,
}: {
  artist: ArtistWithArtworkCount;
  index: number;
}) {
  const description =
    artist.summary ??
    "Una trayectoria para entrar al acervo desde obras, épocas y sensibilidades.";

  return (
    <Link
      href={`/artistas/${artist.slug}`}
      className="group grid min-w-[19rem] overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_65px_rgba(23,25,22,0.055)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_26px_75px_rgba(23,25,22,0.09)] sm:min-w-[25rem] xl:min-w-0"
    >
      <ArtistImagePanel artist={artist} priority={index === 0} />
      <span className="grid gap-4 p-5 sm:p-6">
        <span>
          <span className="text-sm font-medium text-primary">
            {artist.primaryDiscipline ?? "Artista"}
            {artist.lifeDates ? ` · ${artist.lifeDates}` : ""}
          </span>
          <span className="mt-2 block font-serif text-3xl font-medium leading-tight text-foreground">
            {artist.name}
          </span>
        </span>
        <span className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {description}
        </span>
        <span className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-muted-foreground">
            {artist.artworkCount} obras registradas
          </span>
          <span className="inline-flex items-center gap-2 font-medium text-primary">
            Ver artista
            <ArrowRight
              className="size-4 transition group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </span>
      </span>
    </Link>
  );
}

function DiscoveryBlock({
  onPlanism,
  onMnav,
  onBefore1900,
  onArtworkRoute,
  onRandom,
}: {
  onPlanism: () => void;
  onMnav: () => void;
  onBefore1900: () => void;
  onArtworkRoute: () => void;
  onRandom: () => void;
}) {
  const actions = [
    { label: "Descubrir una artista del planismo", onClick: onPlanism },
    { label: "Ver artistas con obras en el MNAV", onClick: onMnav },
    { label: "Explorar artistas nacidos antes de 1900", onClick: onBefore1900 },
    { label: "Ver una obra y llegar a su autor", onClick: onArtworkRoute },
    { label: "Explorar un artista al azar", onClick: onRandom, icon: Shuffle },
  ];

  return (
    <section className="mt-14 overflow-hidden rounded-lg bg-[#17324d] text-white shadow-[0_24px_80px_rgba(23,25,22,0.12)]">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/62">
            No sé por dónde empezar
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-white sm:text-5xl">
            Dejá que Acervo te proponga un recorrido.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
            Pequeños puntos de partida para recorrer artistas, obras,
            instituciones y épocas sin tener que saber exactamente qué buscar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon ?? Compass;

            return (
              <button
                key={action.label}
                type="button"
                className="group flex min-h-16 items-center justify-between gap-4 rounded-md bg-white/9 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/16"
                onClick={action.onClick}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="size-4 shrink-0 text-white/70" aria-hidden="true" />
                  <span>{action.label}</span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ArtistsFilters({
  query,
  disciplineFilter,
  nationalityFilter,
  museumFilter,
  periodFilter,
  bioFilter,
  sortMode,
  advancedOpen,
  nationalities,
  museums,
  periods,
  hasActiveFilters,
  onQueryChange,
  onDisciplineChange,
  onNationalityChange,
  onMuseumChange,
  onPeriodChange,
  onBioChange,
  onSortChange,
  onAdvancedToggle,
  onClear,
}: {
  query: string;
  disciplineFilter: string;
  nationalityFilter: string;
  museumFilter: string;
  periodFilter: string;
  bioFilter: string;
  sortMode: SortMode;
  advancedOpen: boolean;
  nationalities: string[];
  museums: Array<{ id: string; name: string }>;
  periods: FilterOption[];
  hasActiveFilters: boolean;
  onQueryChange: (value: string) => void;
  onDisciplineChange: (value: string) => void;
  onNationalityChange: (value: string) => void;
  onMuseumChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
  onAdvancedToggle: () => void;
  onClear: () => void;
}) {
  return (
    <div className="sticky top-16 z-30 mt-5 rounded-[1rem] bg-background/94 p-3 shadow-[0_16px_55px_rgba(23,25,22,0.08)] backdrop-blur-xl lg:static lg:z-auto lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <ArtistSearch
          id="artists-list-search"
          value={query}
          placeholder="Buscar en artistas..."
          className="min-h-12 bg-card shadow-none"
          onChange={onQueryChange}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {disciplineChips.map((discipline) => (
            <button
              key={discipline}
              type="button"
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition",
                disciplineFilter === discipline
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-secondary",
              )}
              onClick={() => onDisciplineChange(discipline)}
            >
              {discipline}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SegmentedSort value={sortMode} onChange={onSortChange} />
        <button
          type="button"
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
            advancedOpen
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground hover:bg-secondary",
          )}
          onClick={onAdvancedToggle}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filtros avanzados
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-muted px-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            onClick={onClear}
          >
            <X className="size-4" aria-hidden="true" />
            Limpiar
          </button>
        )}
      </div>

      {advancedOpen && (
        <div className="mt-4 grid gap-3 rounded-[0.95rem] bg-card p-4 shadow-[0_14px_40px_rgba(23,25,22,0.055)] sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="País"
            value={nationalityFilter}
            onChange={onNationalityChange}
            options={nationalities.map((nationality) => ({
              label: nationality,
              value: nationality,
            }))}
          />
          <FilterSelect
            label="Museo"
            value={museumFilter}
            onChange={onMuseumChange}
            options={museums.map((museum) => ({
              label: museum.name,
              value: museum.id,
            }))}
          />
          <FilterSelect
            label="Época"
            value={periodFilter}
            onChange={onPeriodChange}
            options={periods}
          />
          <FilterSelect
            label="Contexto"
            value={bioFilter}
            onChange={onBioChange}
            options={[{ label: "Con biografía", value: WITH_BIO_VALUE }]}
          />
        </div>
      )}
    </div>
  );
}

function SegmentedSort({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (value: SortMode) => void;
}) {
  const options: Array<{ label: string; value: SortMode }> = [
    { label: "Nombre A-Z", value: "name" },
    { label: "Más obras", value: "artworks" },
    { label: "Época", value: "birthYear" },
    { label: "Recientes", value: "recent" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto rounded-md bg-card p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "min-h-8 shrink-0 rounded px-3 text-xs font-medium transition",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ArtistsGrid({
  artists,
  total,
  hasMore,
  resultKey,
  onShowMore,
}: {
  artists: ArtistWithArtworkCount[];
  total: number;
  hasMore: boolean;
  resultKey: string;
  onShowMore: () => void;
}) {
  if (total === 0) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-8">
        <h3 className="font-serif text-3xl font-medium text-foreground">
          No hay artistas para esos filtros
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Probá limpiar algún filtro o buscar por nombre, obra, técnica o
          período.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {artists.map((artist) => (
          <ArtistCard key={`${resultKey}-${artist.id}`} artist={artist} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            onClick={onShowMore}
          >
            Mostrar más artistas
          </button>
        </div>
      )}
    </>
  );
}

function ArtistCard({ artist }: { artist: ArtistWithArtworkCount }) {
  const museumLabel =
    artist.linkedMuseums.length > 0
      ? artist.linkedMuseums.length === 1
        ? artist.linkedMuseums[0].name
        : `${artist.linkedMuseums[0].name} +${artist.linkedMuseums.length - 1}`
      : null;

  return (
    <Link
      id={artist.slug}
      href={`/artistas/${artist.slug}`}
      className="group grid overflow-hidden rounded-lg border border-border bg-card shadow-[0_16px_55px_rgba(23,25,22,0.045)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_70px_rgba(23,25,22,0.085)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
    >
      <ArtistImagePanel artist={artist} />
      <span className="grid gap-4 p-5">
        <span>
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-primary/76">
            {artist.primaryDiscipline ?? "Artista"}
          </span>
          <span className="mt-2 block font-serif text-3xl font-medium leading-tight text-foreground">
            {artist.name}
          </span>
          {artist.lifeDates && (
            <span className="mt-2 block text-sm text-muted-foreground">
              {artist.lifeDates}
            </span>
          )}
        </span>

        <span className="flex flex-wrap gap-2 text-xs font-medium">
          {artist.artworkCount > 0 ? (
            <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
              {artist.artworkCount} obras
            </span>
          ) : (
            <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
              Obras por vincular
            </span>
          )}
          {museumLabel && (
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">
              {museumLabel}
            </span>
          )}
        </span>

        <span className="flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-primary opacity-90 transition group-hover:opacity-100">
          <span>Ver ficha</span>
          <ArrowRight
            className="size-4 transition group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </span>
    </Link>
  );
}

function ArtistImagePanel({
  artist,
  priority = false,
}: {
  artist: ArtistWithArtworkCount;
  priority?: boolean;
}) {
  const artwork = artist.previewArtworks[0] ?? null;
  const src = artist.portrait?.src ?? artwork?.imageSrc ?? null;

  if (src) {
    return (
      <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={src}
          alt={artist.portrait?.alt ?? artwork?.title ?? artist.name}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 28vw, (min-width: 640px) 46vw, 92vw"
          unoptimized={src.startsWith("http")}
          className="object-cover transition duration-500 group-hover:scale-[1.035]"
        />
        <span className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(23,23,23,0.28))]" />
      </span>
    );
  }

  return (
    <span className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[linear-gradient(135deg,#e8e1d3_0%,#dce5e2_58%,#c7d4dc_100%)]">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(23,23,23,0.1)_1px,transparent_0)] bg-[size:18px_18px] opacity-30" />
      <span className="relative font-serif text-7xl font-medium text-primary/72">
        {getArtistInitial(artist.name)}
      </span>
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
          {title}
        </h2>
      </div>
    </div>
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
      <span className="text-xs font-bold uppercase tracking-[0.1em] text-primary/76">
        {label}
      </span>
      <select
        value={value}
        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25"
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
    { value: artist.movement, weight: 6 },
    { value: artist.primaryDiscipline, weight: 8 },
    { value: artist.disciplines.join(" "), weight: 6 },
    { value: artist.techniques?.join(" "), weight: 4 },
    { value: artist.themes?.join(" "), weight: 4 },
    { value: artist.influences?.join(" "), weight: 3 },
    { value: artist.keyPeriods?.join(" "), weight: 3 },
    { value: artist.linkedMuseums.map((museum) => museum.name).join(" "), weight: 4 },
    { value: artist.previewArtworks.map((artwork) => artwork.title).join(" "), weight: 5 },
    { value: artist.previewArtworks.map((artwork) => artwork.technique).join(" "), weight: 4 },
    { value: artist.summary, weight: 3 },
    { value: artist.description, weight: 2 },
    { value: artist.biography, weight: 2 },
    { value: artist.sourceUrl, weight: 1 },
  ];
}

function getFeaturedArtists(
  artists: ArtistWithArtworkCount[],
  count = 3,
): ArtistWithArtworkCount[] {
  const preferredNames = [
    "Juan Manuel Blanes",
    "Petrona Viera",
    "Pedro Figari",
    "Joaquín Torres García",
    "Rafael Barradas",
    "Amalia Nieto",
    "Carlos Federico Sáez",
    "José Cuneo",
    "Lacy Duarte",
  ].map(normalizeText);
  const selected = preferredNames
    .map((name) =>
      artists.find((artist) => normalizeText(artist.name).includes(name)),
    )
    .filter((artist): artist is ArtistWithArtworkCount => Boolean(artist));
  const fallback = artists
    .filter((artist) => !selected.some((item) => item.id === artist.id))
    .sort(
      (a, b) =>
        Number(b.previewArtworks.length > 0) -
          Number(a.previewArtworks.length > 0) ||
        b.artworkCount - a.artworkCount ||
        collator.compare(a.name, b.name),
    );

  return [...selected, ...fallback].slice(0, count);
}

function getHeroArtworks(artists: ArtistWithArtworkCount[]): HeroArtwork[] {
  const preferredNames = [
    "Juan Manuel Blanes",
    "Pedro Figari",
    "Joaquín Torres García",
    "Petrona Viera",
    "Rafael Barradas",
    "Amalia Nieto",
  ].map(normalizeText);
  const selectedArtistIds = new Set<string>();

  return preferredNames
    .flatMap((name) => {
      const artist =
        artists.find(
          (item) =>
            !selectedArtistIds.has(item.id) &&
            normalizeText(item.name) === name &&
            item.previewArtworks.length > 0,
        ) ??
        artists.find(
          (item) =>
            !selectedArtistIds.has(item.id) &&
            normalizeText(item.name).includes(name) &&
            item.previewArtworks.length > 0,
        );

      if (!artist) {
        return [];
      }

      const artwork = artist.previewArtworks[0];

      if (!artwork) {
        return [];
      }

      selectedArtistIds.add(artist.id);

      return {
        id: artwork.id,
        title: artwork.title,
        artistName: artist.name,
        imageSrc: artwork.imageSrc,
      };
    })
    .slice(0, 4);
}

function getArtistInitial(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .at(-1)
    ?.at(0)
    ?.toUpperCase() ?? "A";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
