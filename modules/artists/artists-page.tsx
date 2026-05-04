import { getArtistsWithArtworkCounts } from "@/lib/acervo/data";
import { ArtistsBrowser } from "@/modules/artists/artists-browser";

export async function ArtistsPage() {
  const artists = await getArtistsWithArtworkCounts();

  return (
    <main className="bg-background">
      <ArtistsBrowser artists={artists} />
    </main>
  );
}
