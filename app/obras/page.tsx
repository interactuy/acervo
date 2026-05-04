import type { Metadata } from "next";
import { ArtworksPage } from "@/modules/artworks/artworks-page";

export const metadata: Metadata = {
  title: "Explorar obras",
  description:
    "Recorrido visual por obras del arte uruguayo: pinturas, dibujos, grabados, esculturas y piezas del acervo cultural.",
};

export default function Page() {
  return <ArtworksPage />;
}
