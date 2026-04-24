import type { Metadata } from "next";
import { MuseumsPage } from "@/modules/museums/museums-page";

export const metadata: Metadata = {
  title: "Museos",
};

export default function Page() {
  return <MuseumsPage />;
}
