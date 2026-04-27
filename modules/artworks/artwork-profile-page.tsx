import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import { Container } from "@/components/layout/container";
import { ArtworkLightbox } from "@/modules/artworks/artwork-lightbox";
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
  const artistName = artwork.artist?.name ?? "Autor no disponible";
  const museumName = artwork.museum?.name ?? "Museo no disponible";
  const heroDetails = [
    artistName,
    artwork.year,
    museumName,
    artwork.technique,
  ].filter(Boolean);
  const technicalDetails = [
    { label: "Inventario", value: artwork.inventoryNumber },
    { label: "Técnica", value: artwork.technique },
    { label: "Medidas", value: artwork.dimensions },
    { label: "Fecha", value: artwork.year },
    { label: "Ubicación", value: artwork.location },
    { label: "Exhibición", value: artwork.exhibitionStatus },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  );

  return (
    <main className="bg-background">
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[#11130f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(255,255,255,0.08),transparent_38%),linear-gradient(180deg,rgba(17,19,15,0.76)_0%,rgba(17,19,15,0.18)_34%,rgba(17,19,15,0.9)_100%)]" />

        <Link
          href="/obras"
          className="absolute left-4 top-20 z-30 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/16 sm:left-6 sm:top-24"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Obras
        </Link>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-[104rem] flex-col">
          <div className="flex flex-1 items-center justify-center px-4 pb-48 pt-16 sm:px-8 sm:pb-52 sm:pt-20 lg:pb-56">
            <div className="relative h-[min(68svh,52rem)] w-full max-w-[min(92vw,86rem)]">
              <Image
                src={imageSrc}
                alt={artwork.title}
                fill
                priority
                sizes="100vw"
                unoptimized={imageSrc.startsWith("http")}
                className="object-contain drop-shadow-[0_34px_90px_rgba(0,0,0,0.38)]"
              />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(180deg,rgba(17,19,15,0)_0%,rgba(17,19,15,0.72)_36%,rgba(17,19,15,0.96)_100%)] pt-24">
            <Container className="pb-8 sm:pb-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-5xl">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/58">
                    Obra del acervo
                  </p>
                  <h1 className="mt-3 max-w-5xl font-serif text-5xl font-medium leading-[0.95] text-white sm:text-7xl lg:text-8xl">
                    {artwork.title}
                  </h1>
                  <p className="mt-5 max-w-4xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
                    {heroDetails.join(" · ")}
                  </p>
                </div>
                <ArtworkLightbox
                  imageSrc={imageSrc}
                  title={artwork.title}
                  artistName={artwork.artist?.name}
                />
              </div>
            </Container>
          </div>
        </div>
      </section>

      <Container className="py-12 sm:py-16">
        <section className="border-b border-border pb-12">
          <div className="max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              Ficha técnica
            </p>
            <dl className="mt-5 border-t border-border">
              {technicalDetails.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2 border-b border-border py-4 sm:grid-cols-[8rem_minmax(0,1fr)]"
                >
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="text-sm leading-6 text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="grid gap-10 border-b border-border py-12 lg:grid-cols-2 lg:gap-16">
          <EditorialLinkBlock
            label="Artista"
            title={artistName}
            description={
              artwork.artist?.lifeDates
                ? `${artwork.artist.lifeDates}${
                    artwork.artist.nationality
                      ? ` · ${artwork.artist.nationality}`
                      : ""
                  }`
                : artwork.artist?.nationality ?? "Ficha de artista"
            }
            href={artwork.artist ? `/artistas/${artwork.artist.slug}` : null}
          />
          <EditorialLinkBlock
            label="Museo"
            title={museumName}
            description={
              artwork.museum
                ? [artwork.museum.neighborhood, artwork.museum.city]
                    .filter(Boolean)
                    .join(" · ")
                : "Institución no disponible"
            }
            href={artwork.museum ? `/museos/${artwork.museum.slug}` : null}
          />
        </section>

        <section className="py-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
                Catalogación
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Los datos e imágenes de esta obra son del MNAV, Museo Nacional
                de Artes Visuales.
              </p>
            </div>
          </div>
        </section>

        {relatedArtworks.length > 0 && (
          <section className="border-t border-border pt-12">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
              También de {artwork.artist?.name}
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

function EditorialLinkBlock({
  label,
  title,
  description,
  href,
}: {
  label: string;
  title: string;
  description: string;
  href: string | null;
}) {
  const content = (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
        {label}
      </p>
      <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {href && (
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
          Ver ficha
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (!href) {
    return <div>{content}</div>;
  }

  return (
    <Link href={href} className="group block transition hover:translate-x-1">
      {content}
    </Link>
  );
}
