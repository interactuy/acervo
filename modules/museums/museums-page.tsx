import { MuseumsMapExplorer } from "@/modules/museums/museums-map-explorer";
import { getMuseums } from "@/lib/acervo/data";

export function MuseumsPage() {
  const museums = getMuseums();

  return <MuseumsMapExplorer museums={museums} />;
}
