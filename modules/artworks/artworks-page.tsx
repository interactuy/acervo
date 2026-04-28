import { Container } from "@/components/layout/container";
import { getArtworksWithArtists } from "@/lib/acervo/data";
import { ArtworksBrowser } from "@/modules/artworks/artworks-browser";

export async function ArtworksPage() {
  const artworks = await getArtworksWithArtists();

  return (
    <main className="bg-background">
      <Container className="py-10 sm:py-14">
        <section className="max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
            Obras
          </p>
          <h1 className="mt-4 font-serif text-5xl font-medium leading-[1.02] text-foreground sm:text-6xl">
            Obras del acervo MNAV
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {artworks.length} registros con artistas, técnicas, fechas,
            imágenes y datos de catalogación del Museo Nacional de Artes
            Visuales.
          </p>
        </section>

        <ArtworksBrowser artworks={artworks} />
      </Container>
    </main>
  );
}
