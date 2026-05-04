import { getArtworksWithArtists } from "@/lib/acervo/data";
import { ArtworksBrowser } from "@/modules/artworks/artworks-browser";

export async function ArtworksPage() {
  const artworks = await getArtworksWithArtists();

  return (
    <main className="bg-[#f7f4ed] text-foreground">
      <ArtworksBrowser artworks={artworks} />
    </main>
  );
}
