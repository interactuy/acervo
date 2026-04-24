import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Palette,
  Users,
} from "lucide-react";
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

  return (
    <main className="bg-background">
      <section className="relative overflow-hidden bg-[#181b18] text-white">
        <div className="absolute inset-0 opacity-42">
          <Image
            src={museum.image.src}
            alt={museum.image.alt}
            fill
            priority
            sizes="100vw"
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
              {museum.description}
            </p>
          </div>

          <aside className="rounded-[1.35rem] bg-[#f8f3e8]/12 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.16)] backdrop-blur-md">
            <div className="grid gap-4 text-sm text-white/78">
              <InfoRow icon={MapPin} label={museum.address} />
              {museum.openingHours && (
                <InfoRow
                  icon={Clock}
                  label={museum.openingHours.label}
                  note={museum.openingHours.notes}
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
                  href={`/artistas#${artist.slug}`}
                  className="group rounded-[1.1rem] bg-card/76 p-5 shadow-[0_18px_60px_rgba(23,25,22,0.05)] transition hover:-translate-y-0.5 hover:bg-card"
                >
                  <h3 className="font-serif text-2xl font-medium leading-tight text-foreground">
                    {artist.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {artist.lifeDates ?? "Fechas no disponibles"}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    {artist.artworkCount} obras
                    <ArrowRight
                      className="size-4 transition group-hover:translate-x-1"
                      aria-hidden="true"
                    />
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
