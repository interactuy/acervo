import type { Metadata } from "next";
import { ArtistsPage } from "@/modules/artists/artists-page";

export const metadata: Metadata = {
  title: "Artistas",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <ArtistsPage />;
}
