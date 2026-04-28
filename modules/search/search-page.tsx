import Link from "next/link";
import { ArrowRight, Brush, Landmark, Search, Users } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import type { SearchResult, SearchResultType } from "@/types/acervo";

type SearchPageProps = {
  query: string;
  results: SearchResult[];
};

const resultIcons = {
  museum: Landmark,
  artist: Users,
  artwork: Brush,
} satisfies Record<SearchResultType, typeof Landmark>;

export function SearchPage({ query, results }: SearchPageProps) {
  return (
    <main className="bg-background">
      <Container className="py-10 sm:py-14">
        <section className="max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
            Buscar en Acervo
          </p>
          <h1 className="mt-4 font-serif text-5xl font-medium leading-[1.02] text-foreground sm:text-6xl">
            Obras, artistas y museos en un mismo recorrido.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Consultá el catálogo por nombre, título, técnica, institución o
            palabras clave vinculadas al acervo.
          </p>
        </section>

        <form
          action="/buscar"
          role="search"
          className="mt-8 flex max-w-3xl items-center gap-2 rounded-[1.25rem] bg-card/78 p-2 shadow-[0_22px_70px_rgba(23,25,22,0.07)]"
        >
          <label htmlFor="search-page-query" className="sr-only">
            Buscar
          </label>
          <Search className="ml-3 size-5 shrink-0 text-primary/62" />
          <Input
            id="search-page-query"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Busca artistas, obras, museos y exposiciones"
            className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <button
            type="submit"
            className="h-12 rounded-[0.95rem] bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Buscar
          </button>
        </form>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-3xl font-medium text-foreground">
              {query ? `${results.length} resultados` : "Empeza una busqueda"}
            </h2>
            {query && (
              <p className="text-sm text-muted-foreground">
                Para &quot;{query}&quot;
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            {results.map((result) => {
              const Icon = resultIcons[result.type];

              return (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  className="group rounded-[1.1rem] bg-card/78 p-5 shadow-[0_18px_60px_rgba(23,25,22,0.05)] transition hover:-translate-y-0.5 hover:bg-card"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/74">
                        {result.label}
                      </p>
                      <h3 className="mt-2 font-serif text-2xl font-medium leading-tight text-foreground">
                        {result.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {result.subtitle}
                      </p>
                      {result.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      className="mt-2 size-4 shrink-0 text-primary transition group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}

            {query && results.length === 0 && (
              <div className="rounded-[1.1rem] bg-card/78 p-6">
                <h3 className="font-serif text-3xl font-medium text-foreground">
                  Sin resultados
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Proba con MNAV, Blanes, Barradas, naturaleza muerta o Sala 2.
                </p>
              </div>
            )}
          </div>
        </section>
      </Container>
    </main>
  );
}
