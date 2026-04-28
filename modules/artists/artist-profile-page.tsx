import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Landmark,
  Palette,
} from "lucide-react";
import { ArtistAvatar } from "@/components/acervo/artist-avatar";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import { MuseumCard } from "@/components/acervo/museum-card";
import { Container } from "@/components/layout/container";
import type {
  Artist,
  ArtworkWithArtist,
  Exhibition,
  Museum,
} from "@/types/acervo";

type ArtistProfilePageProps = {
  artist: Artist;
  artworks: ArtworkWithArtist[];
  featuredArtworks: ArtworkWithArtist[];
  heroArtwork: ArtworkWithArtist | null;
  museums: Museum[];
  exhibitions: Exhibition[];
  relatedArtists: Artist[];
};

export function ArtistProfilePage({
  artist,
  artworks,
  featuredArtworks,
  heroArtwork,
  museums,
  exhibitions,
  relatedArtists,
}: ArtistProfilePageProps) {
  const heroImageSrc =
    heroArtwork?.imageSrc ??
    heroArtwork?.imageUrl ??
    artist.portrait?.src ??
    "/hero/home-artwork-02.png";
  const lifeDates = artist.lifeDates ?? buildLifeDates(artist);
  const summary =
    artist.summary ??
    artist.description ??
    artist.biography ??
    buildArtistSummary(artist, artworks.length, museums.length);
  const description = artist.description ?? artist.biography;
  const insightGroups = getArtistInsightGroups(artist);
  const secondaryArtworks = artworks.filter(
    (artwork) =>
      !featuredArtworks.some((featuredArtwork) => featuredArtwork.id === artwork.id),
  );
  const artworkLabel =
    artworks.length === 1 ? "obra vinculada" : "obras vinculadas";
  const museumLabel =
    museums.length === 1 ? "museo relacionado" : "museos relacionados";

  return (
    <main className="bg-background">
      <section className="relative overflow-hidden bg-[#171916] text-white">
        <div className="absolute inset-0 opacity-46">
          <Image
            src={heroImageSrc}
            alt={heroArtwork?.title ?? artist.portrait?.alt ?? artist.name}
            fill
            priority
            sizes="100vw"
            unoptimized={heroImageSrc.startsWith("http")}
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,10,9,0.94)_0%,rgba(9,10,9,0.78)_46%,rgba(9,10,9,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,9,0.2)_0%,rgba(9,10,9,0.1)_44%,rgba(9,10,9,0.78)_100%)]" />

        <Container className="relative flex min-h-[42rem] flex-col pb-8 pt-24 sm:pb-12 sm:pt-28 lg:min-h-[46rem]">
          <div className="grid gap-8 lg:mt-auto lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div className="max-w-4xl">
              <Link
                href="/artistas"
                className="mb-8 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/76 shadow-[0_16px_50px_rgba(0,0,0,0.16)] backdrop-blur-md transition hover:bg-white/16 hover:text-white"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Volver a artistas
              </Link>

              <HeroVisual artist={artist} artwork={heroArtwork} />

              <p className="mt-7 text-xs font-medium uppercase tracking-[0.18em] text-white/64">
                Artista
              </p>
              <h1 className="mt-4 max-w-4xl font-serif text-5xl font-medium leading-[0.98] text-white sm:text-7xl">
                {artist.name}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 sm:text-lg sm:leading-8">
                {summary}
              </p>

              <dl className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <HeroFact
                  label="Años"
                  value={lifeDates ?? "Información no registrada"}
                />
                <HeroFact
                  label="Nacionalidad"
                  value={artist.nationality ?? "Información no registrada"}
                />
                <HeroFact
                  label="Nacimiento"
                  value={formatPlaceYear(artist.birthPlace, artist.birthYear)}
                />
                <HeroFact
                  label="Fallecimiento"
                  value={formatPlaceYear(artist.deathPlace, artist.deathYear)}
                />
              </dl>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <HeroStat icon={Palette} value={artworks.length} label={artworkLabel} />
              <HeroStat icon={Landmark} value={museums.length} label={museumLabel} />
              <HeroStat
                icon={CalendarDays}
                value={artist.timeline?.length ?? 0}
                label="hitos en timeline"
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        {description && (
          <section className="max-w-4xl">
            <SectionEyebrow>Biografía</SectionEyebrow>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
              Recorrido y contexto
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {description}
            </p>
          </section>
        )}

        {insightGroups.length > 0 && (
          <section className={description ? "mt-14" : ""}>
            <SectionEyebrow>Claves de lectura</SectionEyebrow>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
              Para entender su obra
            </h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {insightGroups.map((group) => (
                <InsightCard
                  key={group.title}
                  title={group.title}
                  values={group.values}
                />
              ))}
            </div>
          </section>
        )}

        {featuredArtworks.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Obras destacadas</SectionEyebrow>
                <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
                  Selección del acervo
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {featuredArtworks.length} destacadas
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {featuredArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          </section>
        )}

        {artist.timeline && artist.timeline.length > 0 && (
          <section className="mt-14">
            <SectionEyebrow>Cronología</SectionEyebrow>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
              Línea de tiempo
            </h2>
            <div className="mt-7 grid gap-4">
              {artist.timeline.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-3 border-l border-primary/20 pl-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:border-l-0 sm:pl-0"
                >
                  <p className="text-sm font-semibold text-primary">
                    {item.year ?? "Sin fecha"}
                  </p>
                  <div className="rounded-[1.1rem] bg-card/78 p-5 shadow-[0_18px_60px_rgba(23,25,22,0.05)]">
                    <h3 className="font-serif text-2xl font-medium leading-tight text-foreground">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {secondaryArtworks.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Obras del acervo</SectionEyebrow>
                <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
                  Todas las obras de {artist.name}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {artworks.length} {artworkLabel}
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {secondaryArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          </section>
        )}

        {museums.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Museos relacionados</SectionEyebrow>
                <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
                  Instituciones con obra
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {museums.length} {museumLabel}
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {museums.map((museum) => (
                <MuseumCard
                  key={museum.id}
                  museum={museum}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}

        {exhibitions.length > 0 && (
          <section className="mt-14">
            <SectionEyebrow>Exposiciones relacionadas</SectionEyebrow>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
              Apariciones curatoriales
            </h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {exhibitions.map((exhibition) => (
                <article
                  key={exhibition.id}
                  className="rounded-[1.1rem] bg-card/78 p-5 shadow-[0_18px_60px_rgba(23,25,22,0.05)]"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/74">
                    {[exhibition.startDate, exhibition.endDate]
                      .filter(Boolean)
                      .join(" - ") || "Exposición"}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl font-medium leading-tight text-foreground">
                    {exhibition.title}
                  </h3>
                  {exhibition.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {exhibition.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {relatedArtists.length > 0 && (
          <section className="mt-14">
            <SectionEyebrow>Artistas relacionados</SectionEyebrow>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
              Vínculos editoriales
            </h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {relatedArtists.map((relatedArtist) => (
                <RelatedArtistCard
                  key={relatedArtist.id}
                  artist={relatedArtist}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-[1.1rem] border border-border/70 bg-card/64 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Créditos
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Datos e imágenes de obras vinculadas: Museo Nacional de Artes
            Visuales (MNAV). La información biográfica y curatorial se registra
            como parte del trabajo editorial de Acervo.
          </p>
          {(artist.collectionSourceUrl || artist.sourceUrl) && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {artist.collectionSourceUrl && (
                <a
                  href={artist.collectionSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-primary"
                >
                  Fuente colección
                </a>
              )}
              {artist.sourceUrl && (
                <a
                  href={artist.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-primary"
                >
                  Fuente biográfica
                </a>
              )}
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}

function HeroVisual({
  artist,
  artwork,
}: {
  artist: Artist;
  artwork: ArtworkWithArtist | null;
}) {
  if (artist.portrait?.src) {
    return (
      <ArtistAvatar
        artist={artist}
        className="size-32 text-4xl shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-md sm:size-40 sm:text-5xl"
        fallbackClassName="bg-[#f8f3e8]/14 text-white"
        sizes="10rem"
      />
    );
  }

  const artworkImageSrc = artwork?.imageSrc ?? artwork?.imageUrl;

  if (artwork && artworkImageSrc) {
    return (
      <Link
        href={`/obras/${artwork.slug}`}
        className="group block w-fit overflow-hidden rounded-[0.95rem] bg-[#f8f3e8]/10 shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-md"
      >
        <span className="relative block size-32 sm:size-40">
          <Image
            src={artworkImageSrc}
            alt={artwork.title}
            fill
            sizes="10rem"
            unoptimized={artworkImageSrc.startsWith("http")}
            className="object-contain p-3 transition duration-500 group-hover:scale-[1.03]"
          />
        </span>
      </Link>
    );
  }

  return (
    <ArtistAvatar
      artist={artist}
      className="size-32 text-4xl shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-md sm:size-40 sm:text-5xl"
      fallbackClassName="bg-[#f8f3e8]/14 text-white"
      sizes="10rem"
    />
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
      {children}
    </p>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/22 pl-4">
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-white/54">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium leading-6 text-white/86">
        {value}
      </dd>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Palette;
  value: number;
  label: string;
}) {
  return (
    <div className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#f8f3e8]/12 px-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-md">
      <span className="flex size-9 items-center justify-center rounded-full bg-white/12">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-medium leading-none text-white">
          {value}
        </span>
        <span className="mt-1 block text-xs text-white/64">{label}</span>
      </span>
    </div>
  );
}

function InsightCard({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <article className="rounded-[1.1rem] bg-card/78 p-5 shadow-[0_18px_60px_rgba(23,25,22,0.05)]">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary/78">
        {title}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
          >
            {value}
          </span>
        ))}
      </div>
    </article>
  );
}

function RelatedArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artistas/${artist.slug}`}
      className="group flex items-center gap-4 rounded-[1.1rem] bg-card/78 p-4 shadow-[0_18px_60px_rgba(23,25,22,0.05)] transition hover:-translate-y-0.5 hover:bg-card"
    >
      <ArtistAvatar artist={artist} className="size-16 text-xl" sizes="4rem" />
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-2xl font-medium leading-tight text-foreground">
          {artist.name}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {[artist.lifeDates, artist.nationality].filter(Boolean).join(" · ") ||
            "Artista del acervo"}
        </span>
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-primary/70 transition group-hover:translate-x-1 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

function getArtistInsightGroups(artist: Artist) {
  return [
    { title: "Movimiento", values: artist.movement ? [artist.movement] : [] },
    { title: "Técnicas", values: artist.techniques ?? [] },
    { title: "Temas", values: artist.themes ?? [] },
    { title: "Influencias", values: artist.influences ?? [] },
    { title: "Períodos", values: artist.keyPeriods ?? [] },
  ].filter((group) => group.values.length > 0);
}

function formatPlaceYear(place?: string | null, year?: number | null) {
  return (
    [place, year ? String(year) : null].filter(Boolean).join(", ") ||
    "Información no registrada"
  );
}

function buildLifeDates(artist: Artist) {
  if (artist.birthYear && artist.deathYear) {
    return `${artist.birthYear}-${artist.deathYear}`;
  }

  if (artist.birthYear) {
    return `${artist.birthYear}-`;
  }

  if (artist.deathYear) {
    return `-${artist.deathYear}`;
  }

  return null;
}

function buildArtistSummary(
  artist: Artist,
  artworkCount: number,
  museumCount: number,
) {
  const nationality = artist.nationality
    ? `Artista de nacionalidad ${artist.nationality.toLowerCase()}`
    : "Artista del acervo";
  const artworkText =
    artworkCount === 1
      ? "1 obra registrada"
      : `${artworkCount} obras registradas`;
  const museumText =
    museumCount === 1
      ? "1 museo relacionado"
      : `${museumCount} museos relacionados`;

  return `${nationality}, representado en esta carga con ${artworkText} y ${museumText}.`;
}
