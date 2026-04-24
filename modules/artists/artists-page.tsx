import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Container } from "@/components/layout/container";
import { getArtistsWithArtworkCounts } from "@/lib/acervo/data";

export function ArtistsPage() {
  const artists = getArtistsWithArtworkCounts();

  return (
    <main className="bg-background">
      <Container className="py-10 sm:py-14">
        <section className="max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
            Artistas
          </p>
          <h1 className="mt-4 font-serif text-5xl font-medium leading-[1.02] text-foreground sm:text-6xl">
            Autores vinculados al MNAV
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {artists.length} artistas aparecen en esta primera carga de prueba
            con obras del Museo Nacional de Artes Visuales.
          </p>
        </section>

        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              id={artist.slug}
              href={`/buscar?q=${encodeURIComponent(artist.name)}`}
              className="group rounded-[1.1rem] bg-card/78 p-5 shadow-[0_18px_60px_rgba(23,25,22,0.05)] transition hover:-translate-y-0.5 hover:bg-card"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="size-4" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-serif text-2xl font-medium leading-tight text-foreground">
                {artist.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {artist.lifeDates ?? "Fechas no disponibles"}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                {artist.artworkCount} obras vinculadas
                <ArrowRight
                  className="size-4 transition group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </main>
  );
}
