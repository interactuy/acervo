import type { Metadata } from "next";
import { MuseumsListPage } from "@/modules/museums/museums-list-page";

export const metadata: Metadata = {
  title: "Todos los museos",
};

export default function Page() {
  return <MuseumsListPage />;
}
