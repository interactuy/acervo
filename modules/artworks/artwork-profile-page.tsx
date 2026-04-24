import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Landmark, Palette, Ruler, UserRound } from "lucide-react";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import { Container } from "@/components/layout/container";
import type { ArtworkWithArtist } from "@/types/acervo";

type ArtworkProfilePageProps = {
  artwork: ArtworkWithArtist;
  relatedArtworks: ArtworkWithArtist[];
};

export function ArtworkProfilePage({
  artwork,
  relatedArtworks,
}: ArtworkProfilePageProps) {
  const imageSrc = artwork.imageUrl ?? "/hero/home-artwork-01.png";

  return (
    <main className="bg-background">
      <Container className="py-8 sm:py-12">
        <Link
          href="/obras"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/78"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Obras
        </Link>

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-start">
          <div className="overflow-hidden rounded-[1.45rem] bg-[#ede7dc] shadow-[0_26px_90px_rgba(23,25,22,0.09)]">
            <div className="relative aspect-[4/5] min-h-[28rem]">
              <Image
                src={imageSrc}
                alt={artwork.title}
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-contain p-6 sm:p-10"
              />
            </div>
          </div>

          <div className="lg:pt-5">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              Obra · MNAV
            </p>
            <h1 className="mt-4 font-serif text-5xl font-medium leading-[1.02] text-foreground sm:text-6xl">
              {artwork.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              {artwork.artist?.name ?? "Autor no disponible"}
              {artwork.artist?.lifeDates ? ` (${artwork.artist.lifeDates})` : ""}
            </p>

            <div className="mt-8 grid gap-3">
              <DetailRow icon={Palette} label="Inventario" value={artwork.inventoryNumber} />
              {artwork.technique && (
                <DetailRow icon={Palette} label="Tecnica" value={artwork.technique} />
              )}
              {artwork.dimensions && (
                <DetailRow icon={Ruler} label="Medidas" value={artwork.dimensions} />
              )}
              {artwork.year && (
                <DetailRow icon={Palette} label="Realizado" value={artwork.year} />
              )}
              {artwork.museum && (
                <Link
                  href={`/museos/${artwork.museum.slug}`}
                  className="group flex items-start gap-3 rounded-[1rem] bg-card/78 p-4 shadow-[0_16px_50px_rgba(23,25,22,0.05)] transition hover:bg-card"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Landmark className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-[0.12em] text-primary/74">
                      Museo
                    </span>
                    <span className="mt-1 block text-sm font-medium text-foreground group-hover:text-primary">
                      {artwork.museum.name}
                    </span>
                  </span>
                </Link>
              )}
              {artwork.artist && (
                <Link
                  href={`/artistas#${artwork.artist.slug}`}
                  className="group flex items-start gap-3 rounded-[1rem] bg-card/78 p-4 shadow-[0_16px_50px_rgba(23,25,22,0.05)] transition hover:bg-card"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-[0.12em] text-primary/74">
                      Artista
                    </span>
                    <span className="mt-1 block text-sm font-medium text-foreground group-hover:text-primary">
                      {artwork.artist.name}
                    </span>
                  </span>
                </Link>
              )}
            </div>

            <p className="mt-8 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Imagen y datos de catalogacion: Museo Nacional de Artes Visuales
            </p>
          </div>
        </section>

        {relatedArtworks.length > 0 && (
          <section className="mt-14">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              Tambien de {artwork.artist?.name}
            </p>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
              Obras relacionadas
            </h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {relatedArtworks.map((relatedArtwork) => (
                <ArtworkCard key={relatedArtwork.id} artwork={relatedArtwork} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Palette;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1rem] bg-card/78 p-4 shadow-[0_16px_50px_rgba(23,25,22,0.05)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary/74">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
