import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtworkProfile, getArtworks } from "@/lib/acervo/data";
import { ArtworkProfilePage } from "@/modules/artworks/artwork-profile-page";

type ArtworkPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const artworks = await getArtworks();

  return artworks.map((artwork) => ({
    slug: artwork.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getArtworkProfile(slug);

  if (!profile) {
    return {
      title: "Obra no encontrada",
    };
  }

  return {
    title: profile.artwork.title,
    description: [
      profile.artwork.artist?.name,
      profile.artwork.yearLabel ?? profile.artwork.year,
      profile.artwork.technique,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export default async function Page({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const profile = await getArtworkProfile(slug);

  if (!profile) {
    notFound();
  }

  return <ArtworkProfilePage {...profile} />;
}
