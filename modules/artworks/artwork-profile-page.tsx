import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Compass,
  ImageOff,
  Landmark,
  Palette,
} from "lucide-react";
import { ArtistAvatar } from "@/components/acervo/artist-avatar";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import { ContemplativeMode } from "@/modules/artworks/contemplative-mode";
import { ArtworkLightbox } from "@/modules/artworks/artwork-lightbox";
import type {
  Artist,
  ArtworkWithArtist,
  Exhibition,
  Museum,
} from "@/types/acervo";

type ArtworkProfilePageProps = {
  artwork: ArtworkWithArtist;
  relatedArtworks: ArtworkWithArtist[];
  sameMuseumArtworks: ArtworkWithArtist[];
  exhibitions: Exhibition[];
};

type DetailItem = {
  label: string;
  value: string;
  href?: string;
};

type TimelineItem = {
  id: string;
  year: string;
  sortYear: number;
  title: string;
  description: string;
  isCurrent?: boolean;
};

type ConnectionItem = {
  label: string;
  href?: string;
};

export function ArtworkProfilePage({
  artwork,
  relatedArtworks,
  sameMuseumArtworks,
  exhibitions,
}: ArtworkProfilePageProps) {
  const imageSrc = getArtworkImageSrc(artwork);
  const artistName = artwork.artist?.name ?? "Autor sin registrar";
  const museumName = artwork.museum?.name ?? "Institución sin registrar";
  const year = getArtworkYear(artwork);
  const discipline = getDisciplineFromTechnique(artwork.technique);
  const support = getSupportFromTechnique(artwork.technique);
  const location = artwork.locationNote ?? artwork.location;
  const introText = getArtworkIntro(artwork);
  const shortReading = getShortArtworkReading(artwork, discipline);
  const essentialDetails = getEssentialDetails({
    artwork,
    artistName,
    museumName,
    year,
    support,
    location,
  });
  const lookItems = getWhatToLookItems(artwork, discipline);
  const timelineItems = getTimelineItems(artwork, exhibitions);
  const connections = getCulturalConnections({
    artwork,
    discipline,
    year,
    exhibitions,
  });

  return (
    <main className="bg-[#f7f4ee] text-foreground">
      <ArtworkHero
        artwork={artwork}
        imageSrc={imageSrc}
        year={year}
      />

      <div className="border-y border-border/70 bg-[#f7f4ee]">
        <Container className="py-12 sm:py-16">
          <EnterArtworkSection text={introText} />
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <ArtworkEssentials details={essentialDetails} reading={shortReading} />

        <WhatToLookSection items={lookItems} />

        {timelineItems.length > 1 && (
          <ArtworkTimeline items={timelineItems} artworkTitle={artwork.title} />
        )}

        {artwork.artist && (
          <ArtistIntroSection
            artist={artwork.artist}
            discipline={discipline}
            relatedArtworksCount={relatedArtworks.length + 1}
          />
        )}

        {relatedArtworks.length > 0 && (
          <RelatedArtistWorks
            artistName={artistName}
            artworks={relatedArtworks.slice(0, 8)}
          />
        )}

        <CulturalConnections connections={connections} />

        <ArtworkContext
          artwork={artwork}
          discipline={discipline}
          year={year}
          museum={artwork.museum}
        />

        <ContinueExploring
          artist={artwork.artist}
          museum={artwork.museum}
          relatedArtworks={relatedArtworks}
          sameMuseumArtworks={sameMuseumArtworks}
        />
      </Container>
    </main>
  );
}

function ArtworkHero({
  artwork,
  imageSrc,
  year,
}: {
  artwork: ArtworkWithArtist;
  imageSrc: string | null;
  year: string | null;
}) {
  const heroDetails = [
    artwork.artist?.name,
    artwork.museum?.name,
    artwork.technique,
    year,
  ].filter(Boolean);

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#0d0e0c] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.11),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(13,14,12,0)_30%,rgba(13,14,12,0.92)_100%)]" />

      <Link
        href="/obras"
        className="absolute left-4 top-20 z-30 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/82 backdrop-blur-md transition hover:bg-white/16 hover:text-white sm:left-6 sm:top-24"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Obras
      </Link>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[104rem] flex-col px-4 pt-24 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center justify-center pb-52 pt-8 sm:pb-56 sm:pt-10 lg:pb-60">
          <div className="relative h-[min(64svh,50rem)] w-full max-w-[min(92vw,86rem)]">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={artwork.title}
                fill
                priority
                sizes="100vw"
                unoptimized={imageSrc.startsWith("http")}
                className="object-contain drop-shadow-[0_34px_90px_rgba(0,0,0,0.42)]"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg bg-white/6 text-white/68">
                <ImageOff className="size-10" aria-hidden="true" />
                <span className="text-xs font-medium uppercase tracking-[0.16em]">
                  Imagen no disponible
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(180deg,rgba(13,14,12,0)_0%,rgba(13,14,12,0.72)_34%,rgba(13,14,12,0.97)_100%)] pt-24">
        <Container className="pb-7 sm:pb-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-5xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/58">
                Obra del acervo
              </p>
              <h1 className="mt-3 max-w-5xl font-serif text-[3.1rem] font-medium leading-[0.95] text-white sm:text-7xl lg:text-8xl">
                {artwork.title}
              </h1>
              {heroDetails.length > 0 && (
                <p className="mt-5 max-w-4xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
                  {heroDetails.join(" · ")}
                </p>
              )}
            </div>

            {imageSrc && (
              <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                <ContemplativeMode
                  imageSrc={imageSrc}
                  title={artwork.title}
                  artistName={artwork.artist?.name}
                  year={year}
                  triggerClassName="border-white/20 bg-white/10 text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] hover:bg-white/16"
                />
                <ArtworkLightbox
                  imageSrc={imageSrc}
                  title={artwork.title}
                  artistName={artwork.artist?.name}
                  year={year}
                />
              </div>
            )}
          </div>
        </Container>
      </div>
    </section>
  );
}

function EnterArtworkSection({ text }: { text: string }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-start">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
          Entrar en la obra
        </p>
        <h2 className="mt-3 max-w-xl font-serif text-4xl font-medium leading-tight text-foreground sm:text-5xl">
          Mirar primero. Leer después.
        </h2>
      </div>
      <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg sm:leading-9">
        {text}
      </p>
    </section>
  );
}

function ArtworkEssentials({
  details,
  reading,
}: {
  details: DetailItem[];
  reading: string;
}) {
  return (
    <section className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
      <div>
        <SectionHeading eyebrow="Lo esencial" title="Sobre la obra" />
        <dl className="mt-6 border-t border-border">
          {details.map((item) => (
            <div
              key={item.label}
              className="grid gap-2 border-b border-border py-4 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
            >
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-sm leading-6 text-foreground">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="font-medium text-primary transition hover:text-primary/78"
                  >
                    {item.value}
                  </Link>
                ) : (
                  item.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-border pt-6 lg:border-t-0 lg:pt-0">
        <SectionHeading eyebrow="En pocas palabras" title="Una lectura breve" />
        <p className="mt-6 text-base leading-8 text-muted-foreground">
          {reading}
        </p>
      </div>
    </section>
  );
}

function WhatToLookSection({
  items,
}: {
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <section className="border-b border-border py-12">
      <SectionHeading eyebrow="Qué mirar en esta obra" title="Claves para acercarse" />
      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <article
            key={item.title}
            className="group rounded-lg bg-card p-5 shadow-[0_14px_48px_rgba(23,25,22,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(23,25,22,0.075)]"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 font-serif text-2xl font-medium leading-tight text-foreground">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArtworkTimeline({
  items,
  artworkTitle,
}: {
  items: TimelineItem[];
  artworkTitle: string;
}) {
  return (
    <section className="border-b border-border py-12">
      <SectionHeading
        eyebrow="Trayectoria"
        title="Esta obra en la trayectoria del artista"
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              "relative rounded-lg p-5 shadow-[0_14px_48px_rgba(23,25,22,0.045)]",
              item.isCurrent
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground",
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.14em]",
                item.isCurrent ? "text-primary-foreground/72" : "text-primary",
              )}
            >
              {item.year}
            </p>
            <h3 className="mt-4 font-serif text-2xl font-medium leading-tight">
              {item.isCurrent
                ? `Se realiza / se registra esta obra: ${artworkTitle}`
                : item.title}
            </h3>
            <p
              className={cn(
                "mt-3 text-sm leading-6",
                item.isCurrent
                  ? "text-primary-foreground/78"
                  : "text-muted-foreground",
              )}
            >
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArtistIntroSection({
  artist,
  discipline,
  relatedArtworksCount,
}: {
  artist: Artist;
  discipline: string | null;
  relatedArtworksCount: number;
}) {
  const bio = getArtistBio(artist);
  const chips = [
    discipline,
    artist.movement,
    artist.nationality,
    artist.lifeDates,
    ...(artist.themes ?? []).slice(0, 2),
  ].filter(Boolean) as string[];

  return (
    <section className="border-b border-border py-12">
      <div className="grid gap-8 rounded-lg bg-card p-5 shadow-[0_18px_70px_rgba(23,25,22,0.055)] sm:p-7 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-center">
        <ArtistAvatar
          artist={artist}
          className="aspect-[4/5] h-auto w-full text-6xl"
          fallbackClassName="bg-[linear-gradient(135deg,#e8e1d3_0%,#dce5e2_58%,#c7d4dc_100%)] font-serif text-primary/72"
          imageClassName="object-cover"
          sizes="(min-width: 1024px) 18rem, 90vw"
        />
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
            Conocer al artista
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground sm:text-5xl">
            {artist.name}
          </h2>
          {artist.lifeDates && (
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {artist.lifeDates}
            </p>
          )}
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
            {bio}
          </p>
          {chips.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                {relatedArtworksCount} obras vinculadas
              </span>
            </div>
          )}
          <Link
            href={`/artistas/${artist.slug}`}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Ver ficha del artista
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function RelatedArtistWorks({
  artistName,
  artworks,
}: {
  artistName: string;
  artworks: ArtworkWithArtist[];
}) {
  return (
    <section className="border-b border-border py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Más obras del mismo artista"
          title={`Más obras de ${artistName}`}
        />
        <p className="text-sm text-muted-foreground">
          {artworks.length} obras relacionadas
        </p>
      </div>
      <div className="mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {artworks.map((relatedArtwork) => (
          <ArtworkCard
            key={relatedArtwork.id}
            artwork={relatedArtwork}
            className="min-w-[18rem] snap-start lg:min-w-0"
          />
        ))}
      </div>
    </section>
  );
}

function CulturalConnections({
  connections,
}: {
  connections: ConnectionItem[];
}) {
  if (connections.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border py-12">
      <SectionHeading eyebrow="Relaciones culturales" title="También se conecta con" />
      <div className="mt-7 flex flex-wrap gap-2">
        {connections.map((connection) => {
          const className =
            "rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[0_12px_34px_rgba(23,25,22,0.04)] transition hover:bg-secondary";

          if (!connection.href) {
            return (
              <span key={connection.label} className={className}>
                {connection.label}
              </span>
            );
          }

          return (
            <Link key={connection.label} href={connection.href} className={className}>
              {connection.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ArtworkContext({
  artwork,
  discipline,
  year,
  museum,
}: {
  artwork: ArtworkWithArtist;
  discipline: string | null;
  year: string | null;
  museum: Museum | null;
}) {
  return (
    <section className="border-b border-border py-12">
      <div className="max-w-4xl">
        <SectionHeading eyebrow="En contexto" title="Una pieza dentro de una red" />
        <p className="mt-6 text-base leading-8 text-muted-foreground">
          {getContextText(artwork, discipline, year, museum)}
        </p>
      </div>
    </section>
  );
}

function ContinueExploring({
  artist,
  museum,
  relatedArtworks,
  sameMuseumArtworks,
}: {
  artist: Artist | null;
  museum: Museum | null;
  relatedArtworks: ArtworkWithArtist[];
  sameMuseumArtworks: ArtworkWithArtist[];
}) {
  const discoveryArtwork = sameMuseumArtworks[0] ?? relatedArtworks[0] ?? null;
  const actions = [
    artist
      ? {
          title: "Ver más obras del artista",
          description: artist.name,
          href: `/artistas/${artist.slug}`,
          icon: Palette,
        }
      : null,
    museum
      ? {
          title: "Ver obras del mismo museo",
          description: museum.name,
          href: `/museos/${museum.slug}`,
          icon: Landmark,
        }
      : null,
    {
      title: "Explorar artistas relacionados",
      description: "Nombres, obras y trayectorias del acervo",
      href: "/artistas",
      icon: Compass,
    },
    {
      title: "Descubrir otra obra",
      description: discoveryArtwork?.title ?? "Volver al catálogo de obras",
      href: discoveryArtwork ? `/obras/${discoveryArtwork.slug}` : "/obras",
      icon: CalendarDays,
    },
  ].filter(Boolean) as Array<{
    title: string;
    description: string;
    href: string;
    icon: typeof Palette;
  }>;

  return (
    <section className="pt-12">
      <SectionHeading eyebrow="Seguir explorando" title="Nuevos recorridos" />
      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group flex min-h-44 flex-col justify-between rounded-lg bg-[#17324d] p-5 text-white shadow-[0_18px_60px_rgba(23,25,22,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1b3b5d]"
            >
              <span className="flex items-start justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/12">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <ArrowRight
                  className="size-4 text-white/62 transition group-hover:translate-x-1 group-hover:text-white"
                  aria-hidden="true"
                />
              </span>
              <span>
                <span className="block font-serif text-2xl font-medium leading-tight">
                  {action.title}
                </span>
                <span className="mt-2 line-clamp-2 block text-sm leading-6 text-white/68">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
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
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
        {title}
      </h2>
    </div>
  );
}

function getArtworkImageSrc(artwork: ArtworkWithArtist) {
  return artwork.imageSrc ?? artwork.imageUrl ?? null;
}

function getArtworkYear(artwork: ArtworkWithArtist) {
  return artwork.yearLabel ?? artwork.year;
}

function getEssentialDetails({
  artwork,
  artistName,
  museumName,
  year,
  support,
  location,
}: {
  artwork: ArtworkWithArtist;
  artistName: string;
  museumName: string;
  year: string | null;
  support: string | null;
  location: string | null;
}): DetailItem[] {
  return [
    { label: "Título", value: artwork.title },
    artwork.artist
      ? {
          label: "Artista",
          value: artistName,
          href: `/artistas/${artwork.artist.slug}`,
        }
      : null,
    { label: "Año", value: year },
    { label: "Técnica", value: artwork.technique },
    { label: "Soporte", value: support },
    { label: "Dimensiones", value: artwork.dimensions },
    artwork.museum
      ? {
          label: "Museo / colección",
          value: museumName,
          href: `/museos/${artwork.museum.slug}`,
        }
      : null,
    { label: "Ciudad", value: artwork.museum?.city ?? null },
    { label: "Inventario", value: artwork.inventoryNumber },
    { label: "Ubicación", value: location },
    { label: "Exhibición", value: artwork.exhibitionStatus },
  ].filter((item): item is DetailItem => Boolean(item?.value));
}

function getArtworkIntro(artwork: ArtworkWithArtist) {
  return (
    getShortText(artwork.description ?? artwork.summary, 520) ??
    "Una entrada al universo visual de esta obra: color, composición, atmósfera y detalles que permiten acercarse a la mirada del artista."
  );
}

function getShortArtworkReading(
  artwork: ArtworkWithArtist,
  discipline: string | null,
) {
  const pieces = [
    artwork.title,
    artwork.artist?.name ? `de ${artwork.artist.name}` : null,
    discipline ? `se ubica dentro de ${discipline.toLowerCase()}` : null,
    artwork.museum?.name ? `y forma parte de ${artwork.museum.name}` : null,
  ].filter(Boolean);

  if (pieces.length > 2) {
    return `${pieces.join(" ")}. La obra invita a recorrer una sensibilidad, una época y una forma particular de mirar dentro del acervo.`;
  }

  return "Esta obra forma parte del acervo y permite acercarse a una sensibilidad, una época y una forma particular de mirar.";
}

function getWhatToLookItems(
  artwork: ArtworkWithArtist,
  discipline: string | null,
) {
  const techniqueText = artwork.technique
    ? `La técnica (${artwork.technique}) también orienta la experiencia: define textura, ritmo y cercanía material.`
    : "El modo en que está hecha la obra influye en su presencia y en la forma de percibirla.";
  const colorItem =
    discipline === "Escultura"
      ? {
          title: "El volumen",
          description:
            "Observar cómo la forma ocupa el espacio y cómo la luz cambia la percepción de la pieza.",
        }
      : {
          title: "El color",
          description:
            "Prestar atención a la paleta y a cómo construye atmósfera, contraste o silencio visual.",
        };

  return [
    {
      title: "La composición",
      description:
        "Mirar cómo se organiza la imagen y hacia dónde dirige la atención.",
    },
    colorItem,
    {
      title: "La escena",
      description:
        "Identificar que elementos aparecen, cuales quedan sugeridos y que tension se crea entre ellos.",
    },
    {
      title: "La técnica",
      description: techniqueText,
    },
  ];
}

function getTimelineItems(
  artwork: ArtworkWithArtist,
  exhibitions: Exhibition[],
): TimelineItem[] {
  const artist = artwork.artist;
  const artworkYear = getNumericArtworkYear(artwork);
  const items: TimelineItem[] = [];

  if (artist?.birthYear) {
    items.push({
      id: "artist-birth",
      year: String(artist.birthYear),
      sortYear: artist.birthYear,
      title: `Nace ${artist.name}`,
      description: artist.birthPlace
        ? `Inicio de una trayectoria vinculada a ${artist.birthPlace}.`
        : "Inicio de la trayectoria del artista.",
    });
  }

  if (artist?.timeline && artist.timeline.length > 0) {
    artist.timeline.slice(0, 2).forEach((item, index) => {
      const year = getYearFromText(item.year);

      if (!year) {
        return;
      }

      items.push({
        id: `artist-timeline-${item.id ?? index}`,
        year: item.year ?? String(year),
        sortYear: year,
        title: item.title,
        description: item.description ?? "Hito registrado en la trayectoria.",
      });
    });
  }

  if (artworkYear) {
    items.push({
      id: "current-artwork",
      year: getArtworkYear(artwork) ?? String(artworkYear),
      sortYear: artworkYear,
      title: artwork.title,
      description:
        "La obra queda como punto de lectura dentro del recorrido del artista y del acervo.",
      isCurrent: true,
    });
  }

  exhibitions.slice(0, 2).forEach((exhibition) => {
    const year = getYearFromText(exhibition.startDate ?? exhibition.endDate);

    if (!year) {
      return;
    }

    items.push({
      id: `exhibition-${exhibition.id}`,
      year: String(year),
      sortYear: year,
      title: exhibition.title,
      description: "Exhibición vinculada a esta obra dentro del acervo.",
    });
  });

  if (artist?.deathYear) {
    items.push({
      id: "artist-death",
      year: String(artist.deathYear),
      sortYear: artist.deathYear,
      title: `Fallece ${artist.name}`,
      description: artist.deathPlace
        ? `Cierre biográfico registrado en ${artist.deathPlace}.`
        : "Cierre biográfico de la trayectoria del artista.",
    });
  }

  return items
    .sort((a, b) => a.sortYear - b.sortYear)
    .filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) =>
            candidate.id === item.id ||
            (candidate.sortYear === item.sortYear &&
              candidate.title === item.title),
        ) === index,
    );
}

function getArtistBio(artist: Artist) {
  return (
    getShortText(artist.summary ?? artist.description ?? artist.biography, 520) ??
    "Su obra forma parte del acervo cultural uruguayo y permite recorrer una forma particular de mirar, crear y representar su tiempo."
  );
}

function getCulturalConnections({
  artwork,
  discipline,
  year,
  exhibitions,
}: {
  artwork: ArtworkWithArtist;
  discipline: string | null;
  year: string | null;
  exhibitions: Exhibition[];
}): ConnectionItem[] {
  const century = getCenturyLabel(getNumericArtworkYear(artwork));
  const connections: ConnectionItem[] = [
    artwork.artist
      ? { label: artwork.artist.name, href: `/artistas/${artwork.artist.slug}` }
      : null,
    artwork.museum
      ? { label: artwork.museum.name, href: `/museos/${artwork.museum.slug}` }
      : null,
    artwork.technique ? { label: artwork.technique } : null,
    discipline ? { label: discipline } : null,
    artwork.artist?.movement ? { label: artwork.artist.movement } : null,
    year ? { label: year } : null,
    century ? { label: century } : null,
    ...(artwork.artist?.themes ?? []).slice(0, 2).map((theme) => ({ label: theme })),
    ...exhibitions.slice(0, 1).map((exhibition) => ({
      label: exhibition.title,
    })),
  ].filter(Boolean) as ConnectionItem[];
  const seen = new Set<string>();

  return connections.filter((connection) => {
    const key = connection.label.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getContextText(
  artwork: ArtworkWithArtist,
  discipline: string | null,
  year: string | null,
  museum: Museum | null,
) {
  const contextParts = [
    discipline ? `desde ${discipline.toLowerCase()}` : null,
    year ? `en torno a ${year}` : null,
    museum ? `en diálogo con la colección de ${museum.name}` : null,
  ].filter(Boolean);

  if (contextParts.length > 0) {
    return `Esta obra puede leerse ${contextParts.join(", ")}. También forma parte de una red más amplia de artistas, museos, técnicas y períodos que integran el acervo cultural uruguayo.`;
  }

  return "Esta obra puede leerse como parte de una red más amplia de artistas, museos, técnicas y períodos que integran el acervo cultural uruguayo.";
}

function getShortText(value: string | null | undefined, maxLength: number) {
  const text = value?.replace(/\s+/g, " ").trim();

  if (!text) {
    return null;
  }

  if (text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    trimmed.lastIndexOf("."),
    trimmed.lastIndexOf(";"),
    trimmed.lastIndexOf(":"),
  );

  if (sentenceEnd > maxLength * 0.48) {
    return trimmed.slice(0, sentenceEnd + 1);
  }

  return `${trimmed.trimEnd()}...`;
}

function getSupportFromTechnique(technique: string | null | undefined) {
  const text = normalizeText(technique);

  if (!text) {
    return null;
  }

  if (text.includes("tela")) {
    return "Tela";
  }

  if (text.includes("papel")) {
    return "Papel";
  }

  if (text.includes("madera")) {
    return "Madera";
  }

  if (text.includes("carton")) {
    return "Carton";
  }

  if (text.includes("cartulina")) {
    return "Cartulina";
  }

  if (text.includes("metal")) {
    return "Metal";
  }

  return null;
}

function getDisciplineFromTechnique(technique: string | null | undefined) {
  const text = normalizeText(technique);

  if (!text) {
    return null;
  }

  if (text.includes("fotografia") || text.includes("foto")) {
    return "Fotografía";
  }

  if (
    text.includes("escultura") ||
    text.includes("bronce") ||
    text.includes("yeso") ||
    text.includes("madera") ||
    text.includes("ceramica") ||
    text.includes("terracota") ||
    text.includes("hierro") ||
    text.includes("piedra")
  ) {
    return "Escultura";
  }

  if (
    text.includes("grabado") ||
    text.includes("aguafuerte") ||
    text.includes("litografia") ||
    text.includes("xilografia") ||
    text.includes("serigrafia")
  ) {
    return "Grabado";
  }

  if (
    text.includes("dibujo") ||
    text.includes("lapiz") ||
    text.includes("carbon") ||
    text.includes("tinta") ||
    text.includes("pastel")
  ) {
    return "Dibujo";
  }

  if (
    text.includes("oleo") ||
    text.includes("acrilico") ||
    text.includes("acuarela") ||
    text.includes("tempera") ||
    text.includes("gouache") ||
    text.includes("pintura")
  ) {
    return "Pintura";
  }

  return "Otros medios";
}

function getNumericArtworkYear(artwork: ArtworkWithArtist) {
  return artwork.yearStart ?? getYearFromText(artwork.yearLabel ?? artwork.year);
}

function getYearFromText(value: string | null | undefined) {
  const match = value?.match(/\b(1[5-9]\d{2}|20\d{2})\b/);

  return match ? Number(match[1]) : null;
}

function getCenturyLabel(year: number | null) {
  if (!year) {
    return null;
  }

  if (year < 1900) {
    return "Siglo XIX";
  }

  if (year < 2000) {
    return "Siglo XX";
  }

  return "Siglo XXI";
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
