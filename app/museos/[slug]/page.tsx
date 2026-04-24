import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMuseumProfile,
  getMuseums,
} from "@/lib/acervo/data";
import { MuseumProfilePage } from "@/modules/museums/museum-profile-page";

type MuseumPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getMuseums().map((museum) => ({
    slug: museum.slug,
  }));
}

export async function generateMetadata({
  params,
}: MuseumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getMuseumProfile(slug);

  if (!profile) {
    return {
      title: "Museo no encontrado",
    };
  }

  return {
    title: profile.museum.name,
    description: profile.museum.summary,
  };
}

export default async function Page({ params }: MuseumPageProps) {
  const { slug } = await params;
  const profile = getMuseumProfile(slug);

  if (!profile) {
    notFound();
  }

  return <MuseumProfilePage {...profile} />;
}
