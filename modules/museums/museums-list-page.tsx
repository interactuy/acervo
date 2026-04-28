import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { getMuseums } from "@/lib/acervo/data";
import { MuseumsBrowser } from "@/modules/museums/museums-browser";

export async function MuseumsListPage() {
  const museums = await getMuseums();

  return (
    <main className="bg-background">
      <Container className="py-10 sm:py-14">
        <section className="flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              Museos
            </p>
            <h1 className="mt-4 font-serif text-5xl font-medium leading-[1.02] text-foreground sm:text-6xl">
              Museos del acervo
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Instituciones para explorar por territorio, colección y contexto.
            </p>
          </div>
          <Link
            href="/museos"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Ver mapa
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

        <MuseumsBrowser museums={museums} />
      </Container>
    </main>
  );
}
