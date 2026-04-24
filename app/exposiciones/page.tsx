import type { Metadata } from "next";
import { ExhibitionsPage } from "@/modules/exhibitions/exhibitions-page";

export const metadata: Metadata = {
  title: "Exposiciones",
};

export default function Page() {
  return <ExhibitionsPage />;
}
