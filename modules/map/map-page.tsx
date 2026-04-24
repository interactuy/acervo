import { SectionPage } from "@/modules/shared/section-page";

export function MapPage() {
  return (
    <SectionPage
      eyebrow="Mapa"
      title="Explorador territorial"
      description="Vista preparada para ubicar museos, exposiciones y puntos culturales con Mapbox en proximas iteraciones."
      status="Placeholder publico. La dependencia de Mapbox y su configuracion base ya estan disponibles."
      cards={[
        {
          title: "Coordenadas",
          description: "Base lista para georreferenciar instituciones.",
        },
        {
          title: "Capas",
          description: "Preparado para filtros por tipo de contenido cultural.",
        },
        {
          title: "Recorridos",
          description: "Espacio previsto para exploraciones y rutas culturales.",
        },
      ]}
    />
  );
}
