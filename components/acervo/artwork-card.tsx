import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import type { ArtworkWithArtist } from "@/types/acervo";
import { cn } from "@/lib/utils";

type ArtworkCardProps = {
  artwork: ArtworkWithArtist;
  className?: string;
};

export function ArtworkCard({ artwork, className }: ArtworkCardProps) {
  const imageSrc = artwork.imageUrl ?? "/hero/home-artwork-01.png";

  return (
    <Link
      href={`/obras/${artwork.slug}`}
      id={artwork.slug}
      className={cn(
        "group overflow-hidden rounded-[1.15rem] bg-card/78 shadow-[0_18px_60px_rgba(23,25,22,0.06)] transition hover:-translate-y-0.5 hover:bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={artwork.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-contain p-4 transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/88 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-md">
          <ImageIcon className="size-3.5" aria-hidden="true" />
          MNAV
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary/78">
            Inv. {artwork.inventoryNumber}
          </p>
          <ArrowRight
            className="size-4 shrink-0 text-primary/70 transition group-hover:translate-x-1 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
        <h3 className="mt-3 font-serif text-2xl font-medium leading-tight text-foreground">
          {artwork.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {artwork.artist?.name ?? "Autor no disponible"}
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {[artwork.year, artwork.technique, artwork.dimensions]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground/78">
          Imagen y datos: MNAV
        </p>
      </div>
    </Link>
  );
}
