import { SectionPage } from "@/modules/shared/section-page";

export function AdminPage() {
  return (
    <SectionPage
      eyebrow="Admin"
      title="Administracion interna"
      description="Area reservada para la gestion editorial interna de museos, artistas, obras y exposiciones."
      status="Placeholder interno. No hay autenticacion ni panel de gestion implementados en esta primera version."
      cards={[
        {
          title: "Contenido",
          description: "Base prevista para cargas y revisiones editoriales.",
        },
        {
          title: "Permisos",
          description: "Autenticacion pendiente para una etapa posterior.",
        },
        {
          title: "Operacion",
          description: "Preparado para flujos internos sin usuarios publicos.",
        },
      ]}
    />
  );
}
