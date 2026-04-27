import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Mail,
  Palette,
  Phone,
  Users,
} from "lucide-react";
import { ArtistAvatar } from "@/components/acervo/artist-avatar";
import { MuseumPhoto } from "@/components/acervo/museum-photo";
import { Container } from "@/components/layout/container";
import { MuseumArtworksList } from "@/modules/museums/museum-artworks-list";
import type {
  ArtistWithArtworkCount,
  ArtworkWithArtist,
  Exhibition,
  Museum,
} from "@/types/acervo";

type MuseumProfilePageProps = {
  museum: Museum;
  artworks: ArtworkWithArtist[];
  artists: ArtistWithArtworkCount[];
  exhibitions: Exhibition[];
};

export function MuseumProfilePage({
  museum,
  artworks,
  artists,
  exhibitions,
}: MuseumProfilePageProps) {
  const featuredArtists = artists.slice(0, 12);
  const directionsHref = getDirectionsHref(museum);

  return (
    <main className="bg-background">
      <section className="relative overflow-hidden bg-[#181b18] text-white">
        <div className="absolute inset-0 opacity-42">
          <MuseumPhoto
            museum={museum}
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,9,0.88)_0%,rgba(10,10,9,0.72)_50%,rgba(10,10,9,0.42)_100%)]" />

        <Container className="relative grid min-h-[34rem] gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/68">
              {museum.type} · {museum.neighborhood}
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl font-medium leading-[0.98] text-white sm:text-7xl">
              {museum.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
              {museum.summary}
            </p>
          </div>

          <aside className="rounded-[1.35rem] bg-[#f8f3e8]/12 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.16)] backdrop-blur-md">
            <div className="grid gap-4 text-sm text-white/78">
              {directionsHref ? (
                <InfoLink
                  icon={MapPin}
                  label={museum.address}
                  href={directionsHref}
                  note={museum.howToGetThere ?? "Cómo llegar"}
                />
              ) : (
                <InfoRow
                  icon={MapPin}
                  label={museum.address}
                  note={museum.howToGetThere ?? "Coordenadas pendientes"}
                />
              )}
              {museum.openingHours && (
                <InfoRow
                  icon={Clock}
                  label={museum.openingHours.label}
                  note={museum.openingHours.notes}
                />
              )}
              {museum.accessibility && (
                <InfoRow
                  icon={Accessibility}
                  label="Accesibilidad"
                  note={museum.accessibility}
                />
              )}
              {museum.website && (
                <InfoLink
                  icon={ExternalLink}
                  label="Web"
                  href={museum.website}
                />
              )}
              {museum.contactEmail && (
                <InfoLink
                  icon={Mail}
                  label={museum.contactEmail}
                  href={`mailto:${museum.contactEmail}`}
                />
              )}
              {museum.contactPhone && (
                <InfoLink
                  icon={Phone}
                  label={museum.contactPhone}
                  href={`tel:${museum.contactPhone}`}
                />
              )}
              {!museum.contactEmail && !museum.contactPhone && museum.sourceUrl && (
                <InfoLink
                  icon={ExternalLink}
                  label="Contacto"
                  href={museum.sourceUrl}
                />
              )}
              {museum.ticketInfo && (
                <InfoRow
                  icon={CalendarDays}
                  label="Entradas"
                  note={museum.ticketInfo}
                />
              )}
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/54">
                Datos institucionales: MNAV
              </p>
            </div>
          </aside>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Palette} value={artworks.length} label="obras cargadas" />
          <StatCard icon={Users} value={artists.length} label="artistas vinculados" />
          <StatCard
            icon={CalendarDays}
            value={exhibitions.length}
            label="exposiciones preparadas"
          />
        </div>

        <section className="mt-12 max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
            Información
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
            Sobre {museum.name}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {museum.description}
          </p>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
                Obras relacionadas
              </p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
                Primer recorte MNAV
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              12 visibles de entrada · {artworks.length} cargadas
            </p>
          </div>

          <MuseumArtworksList artworks={artworks} />
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              Artistas
            </p>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
              Autores del recorte
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {featuredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  id={artist.slug}
                  href={`/artistas/${artist.slug}`}
                  className="group rounded-[1.1rem] bg-card/76 p-4 shadow-[0_18px_60px_rgba(23,25,22,0.05)] transition hover:-translate-y-0.5 hover:bg-card"
                >
                  <span className="flex gap-3">
                    <ArtistAvatar
                      artist={artist}
                      className="size-16 text-xl"
                      sizes="4rem"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-serif text-2xl font-medium leading-tight text-foreground">
                        {artist.name}
                      </span>
                      <span className="mt-2 block text-sm text-muted-foreground">
                        {artist.lifeDates ?? "Fechas no disponibles"}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                        {artist.artworkCount} obras
                        <ArrowRight
                          className="size-4 transition group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-[1.25rem] bg-[#ebe4d7] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              Exposiciones
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-foreground">
              Estructura lista
            </h2>
            <div className="mt-5 grid gap-4">
              {exhibitions.map((exhibition) => (
                <article key={exhibition.id}>
                  <h3 className="font-serif text-2xl font-medium text-foreground">
                    {exhibition.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {exhibition.description}
                  </p>
                  <p className="mt-3 text-sm font-medium text-primary">
                    {exhibition.artworkIds.length} obras vinculadas
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </Container>
    </main>
  );
}

function InfoRow({
  icon: Icon,
  label,
  note,
}: {
  icon: typeof MapPin;
  label: string;
  note?: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-white/70" aria-hidden="true" />
      <div>
        <p>{label}</p>
        {note && <p className="mt-1 text-xs leading-5 text-white/58">{note}</p>}
      </div>
    </div>
  );
}

function InfoLink({
  icon: Icon,
  label,
  note,
  href,
}: {
  icon: typeof MapPin;
  label: string;
  note?: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex gap-3 transition hover:text-white"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-white/70" aria-hidden="true" />
      <span>
        <span className="block font-medium">{label}</span>
        {note && <span className="mt-1 block text-xs leading-5 text-white/58">{note}</span>}
      </span>
    </a>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Palette;
  value: number;
  label: string;
}) {
  return (
    <article className="rounded-[1.2rem] bg-card/80 p-5 shadow-[0_18px_60px_rgba(23,25,22,0.06)]">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-5 font-serif text-4xl font-medium leading-none text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </article>
  );
}

function getDirectionsHref(museum: Museum) {
  const { lat, lng } = museum.coordinates;

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
