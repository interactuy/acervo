import type { SectionCard } from "@/types/content";
import { Container } from "@/components/layout/container";

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  cards: SectionCard[];
};

export function SectionPage({
  eyebrow,
  title,
  description,
  status,
  cards,
}: SectionPageProps) {
  return (
    <Container className="py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase text-accent">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-medium leading-[1.05] text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </section>

        <aside className="rounded-lg border bg-secondary/55 p-5">
          <p className="text-sm font-medium text-secondary-foreground">
            Estado
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {status}
          </p>
        </aside>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-lg border bg-card p-5">
            <h2 className="font-serif text-xl font-medium leading-tight text-foreground">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </Container>
  );
}
