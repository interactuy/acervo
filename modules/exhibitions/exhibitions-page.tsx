import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Container } from "@/components/layout/container";
import { getExhibitions, getMuseums } from "@/lib/acervo/data";

export async function ExhibitionsPage() {
  const [exhibitions, museums] = await Promise.all([
    getExhibitions(),
    getMuseums(),
  ]);
  const museumsById = new Map(museums.map((museum) => [museum.id, museum]));

  return (
    <main className="bg-background">
      <Container className="py-10 sm:py-14">
        <section className="max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
            Exposiciones
          </p>
          <h1 className="mt-4 font-serif text-5xl font-medium leading-[1.02] text-foreground sm:text-6xl">
            Exposiciones y recorridos curatoriales
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Un espacio para reunir muestras, obras e instituciones y seguir sus
            vínculos dentro del acervo.
          </p>
        </section>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {exhibitions.map((exhibition) => {
            const museum = museumsById.get(exhibition.museumId);

            return (
              <article
                key={exhibition.id}
                id={exhibition.slug}
                className="rounded-[1.2rem] bg-card/78 p-6 shadow-[0_18px_60px_rgba(23,25,22,0.05)]"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarDays className="size-4" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-primary/74">
                  {museum?.name ?? "Institución sin registrar"}
                </p>
                <h2 className="mt-2 font-serif text-3xl font-medium leading-tight text-foreground">
                  {exhibition.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {exhibition.description}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {[exhibition.location, exhibition.startDate, exhibition.endDate]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {museum && (
                  <Link
                    href={`/museos/${museum.slug}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/78"
                  >
                    Ver museo
                    <ArrowRight
                      className="size-4 transition group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
