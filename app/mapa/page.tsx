import type { Metadata } from "next";
import { MuseumsPage } from "@/modules/museums/museums-page";

export const metadata: Metadata = {
  title: "Mapa",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <MuseumsPage />;
}
