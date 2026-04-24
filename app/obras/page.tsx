import type { Metadata } from "next";
import { ArtworksPage } from "@/modules/artworks/artworks-page";

export const metadata: Metadata = {
  title: "Obras",
};

export default function Page() {
  return <ArtworksPage />;
}
