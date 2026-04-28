import Link from "next/link";
import { ArrowRight, CalendarDays, Eye, MapPinned } from "lucide-react";
import { Container } from "@/components/layout/container";

const features = [
  {
    title: "Una tarde entre colecciones",
    kicker: "Recorrido sugerido",
    description:
      "Museos, salas y obras cercanas para empezar por territorio y seguir por afinidad.",
    href: "/mapa",
    icon: MapPinned,
  },
  {
    title: "Obras para mirar de cerca",
    kicker: "Seleccion editorial",
    description:
      "Piezas para explorar por técnica, época, autoría y vínculos curatoriales.",
    href: "/obras",
    icon: Eye,
  },
  {
    title: "Exposiciones en agenda",
    kicker: "Actualidad cultural",
    description:
      "Una entrada a muestras, sedes y recorridos culturales para visitar.",
    href: "/exposiciones",
    icon: CalendarDays,
  },
];

const highlights = [
  "Artistas con obra en colecciones publicas",
  "Museos para explorar por barrio",
  "Exposiciones conectadas por tema",
  "Obras clave para construir recorridos",
];

export function EditorialSections() {
  return (
    <section className="border-t bg-card/45">
      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium uppercase text-accent">
              Contenido destacado
            </p>
            <h2 className="mt-3 max-w-xl font-serif text-4xl font-medium leading-[1.05] text-foreground sm:text-5xl">
              Mas que un mapa: una forma de entrar al patrimonio cultural.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              La home combina busqueda territorial con capas editoriales para
              que el usuario encuentre, compare y siga explorando sin quedarse
              solo en la ubicación.
            </p>
          </div>

          <div className="grid gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group grid gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/45 hover:bg-background sm:grid-cols-[9rem_minmax(0,1fr)]"
                >
                  <div className="relative min-h-32 overflow-hidden rounded-md bg-secondary">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(62,103,159,0.16)_1px,transparent_1px)] bg-[size:18px_18px]" />
                    <div
                      className={[
                        "absolute inset-x-4 rounded-full border border-primary/25",
                        index === 0 && "top-8 h-20 rotate-[-10deg]",
                        index === 1 && "top-5 h-24 rotate-[12deg]",
                        index === 2 && "top-10 h-16 rotate-[4deg]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    <span className="absolute bottom-4 left-4 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col justify-center">
                    <p className="text-sm font-medium text-accent">
                      {feature.kicker}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-medium leading-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Explorar
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div key={item} className="rounded-lg border bg-background p-4">
              <p className="text-sm font-medium leading-6 text-foreground">
                {item}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
