import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Landmark, Palette } from "lucide-react";
import { ArtistAvatar } from "@/components/acervo/artist-avatar";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import { MuseumCard } from "@/components/acervo/museum-card";
import { Container } from "@/components/layout/container";
import type { Artist, ArtworkWithArtist, Museum } from "@/types/acervo";

type ArtistProfilePageProps = {
  artist: Artist;
  artworks: ArtworkWithArtist[];
  museums: Museum[];
};

export function ArtistProfilePage({
  artist,
  artworks,
  museums,
}: ArtistProfilePageProps) {
  const featuredArtwork =
    artworks.find((artwork) => artwork.imageUrl) ?? artworks[0] ?? null;
  const imageSrc = featuredArtwork?.imageUrl ?? "/hero/home-artwork-02.png";
  const artworkLabel =
    artworks.length === 1 ? "obra vinculada" : "obras vinculadas";
  const museumLabel =
    museums.length === 1 ? "museo en el recorte" : "museos en el recorte";
  const biography =
    artist.biography ?? buildArtistBiography(artist, artworks.length, museums.length);

  return (
    <main className="bg-background">
      <section className="relative overflow-hidden bg-[#171916] text-white">
        <div className="absolute inset-0 opacity-42">
          <Image
            src={imageSrc}
            alt={featuredArtwork?.title ?? `Obra vinculada a ${artist.name}`}
            fill
            priority
            sizes="100vw"
            unoptimized={imageSrc.startsWith("http")}
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,10,9,0.92)_0%,rgba(9,10,9,0.76)_44%,rgba(9,10,9,0.38)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,9,0.28)_0%,rgba(9,10,9,0.08)_48%,rgba(9,10,9,0.74)_100%)]" />

        <Container className="relative flex min-h-[38rem] flex-col py-8 sm:py-12 lg:min-h-[42rem]">
          <Link
            href="/artistas"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/76 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Artistas
          </Link>

          <div className="mt-10 max-w-4xl sm:mt-14">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <ArtistAvatar
                artist={artist}
                className="size-32 text-4xl shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-md sm:size-40 sm:text-5xl"
                fallbackClassName="bg-[#f8f3e8]/14 text-white"
                sizes="10rem"
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/64">
                  Artista
                </p>
                <h1 className="mt-4 max-w-4xl font-serif text-5xl font-medium leading-[0.98] text-white sm:text-7xl">
                  {artist.name}
                </h1>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
              {biography}
            </p>

            <dl className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <HeroFact
                label="Nacimiento"
                value={artist.birthYear ? String(artist.birthYear) : "Sin dato"}
              />
              <HeroFact
                label="Fallecimiento"
                value={artist.deathYear ? String(artist.deathYear) : "Sin dato"}
              />
              <HeroFact
                label="Nacionalidad"
                value={artist.nationality ?? "Sin dato"}
              />
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <HeroStat
                icon={Palette}
                value={artworks.length}
                label={artworkLabel}
              />
              <HeroStat icon={Landmark} value={museums.length} label={museumLabel} />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        {featuredArtwork && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
                  Obra destacada
                </p>
                <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
                  {featuredArtwork.title}
                </h2>
              </div>
              <Link
                href={`/obras/${featuredArtwork.slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/78"
              >
                Ver ficha de obra
                <ArrowRight
                  className="size-4 transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {[featuredArtwork.year, featuredArtwork.technique, featuredArtwork.dimensions]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </section>
        )}

        <section className={featuredArtwork ? "mt-14" : ""}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
                Obras cargadas
              </p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
                Obras de {artist.name}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {artworks.length} {artworkLabel}
            </p>
          </div>

          {artworks.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.15rem] bg-card/78 p-6 shadow-[0_18px_60px_rgba(23,25,22,0.05)]">
              <h2 className="font-serif text-3xl font-medium text-foreground">
                Sin obras vinculadas
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Esta ficha queda preparada para cuando se agreguen obras al recorte.
              </p>
            </div>
          )}
        </section>

        {museums.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
                  Museos relacionados
                </p>
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

        <p className="mt-12 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Datos de catalogacion: Museo Nacional de Artes Visuales
        </p>
      </Container>
    </main>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/22 pl-4">
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-white/54">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-white/86">{value}</dd>
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

function buildArtistBiography(
  artist: Artist,
  artworkCount: number,
  museumCount: number,
) {
  const nationality = artist.nationality
    ? `Artista de nacionalidad ${artist.nationality.toLowerCase()}`
    : "Artista del acervo";
  const artworkText =
    artworkCount === 1
      ? "1 obra cargada"
      : `${artworkCount} obras cargadas`;
  const museumText =
    museumCount === 1
      ? "1 museo relacionado"
      : `${museumCount} museos relacionados`;

  return `${nationality}, representado en esta primera carga con ${artworkText} y ${museumText}.`;
}
