import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/45">
      <Container className="flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Acervo</p>
        <p>Base cultural publica.</p>
      </Container>
    </footer>
  );
}
