import { MuseumsMapExplorer } from "@/modules/museums/museums-map-explorer";
import { getMuseums } from "@/lib/acervo/data";

export async function MuseumsPage() {
  const museums = await getMuseums();

  return <MuseumsMapExplorer museums={museums} />;
}
