import { Container } from "@/components/layout/container";
import { getArtistsWithArtworkCounts } from "@/lib/acervo/data";
import { ArtistsBrowser } from "@/modules/artists/artists-browser";

export async function ArtistsPage() {
  const artists = await getArtistsWithArtworkCounts();

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
            {artists.length} artistas con obras registradas en el Museo
            Nacional de Artes Visuales.
          </p>
        </section>

        <ArtistsBrowser artists={artists} />
      </Container>
    </main>
  );
}
