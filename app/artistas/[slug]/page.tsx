import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtistProfile, getArtists } from "@/lib/acervo/data";
import { ArtistProfilePage } from "@/modules/artists/artist-profile-page";

type ArtistPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const artists = await getArtists();

  return artists.map((artist) => ({
    slug: artist.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getArtistProfile(slug);

  if (!profile) {
    return {
      title: "Artista no encontrado",
    };
  }

  return {
    title: profile.artist.name,
    description: [
      profile.artist.summary,
      profile.artist.lifeDates,
      profile.artist.nationality,
      `${profile.artworks.length} obras vinculadas`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export default async function Page({ params }: ArtistPageProps) {
  const { slug } = await params;
  const profile = await getArtistProfile(slug);

  if (!profile) {
    notFound();
  }

  return <ArtistProfilePage {...profile} />;
}
