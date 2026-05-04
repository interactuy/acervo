import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageOff } from "lucide-react";
import type { ArtworkWithArtist } from "@/types/acervo";
import { cn } from "@/lib/utils";

type ArtworkCardProps = {
  artwork: ArtworkWithArtist;
  className?: string;
};

export function ArtworkCard({ artwork, className }: ArtworkCardProps) {
  const imageSrc = artwork.imageSrc ?? artwork.imageUrl;
  const year = artwork.yearLabel ?? artwork.year;
  const details = [year, artwork.technique, artwork.dimensions].filter(Boolean);

  return (
    <Link
      href={`/obras/${artwork.slug}`}
      id={artwork.slug}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-[0_18px_60px_rgba(23,25,22,0.055)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_70px_rgba(23,25,22,0.095)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
        className,
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[linear-gradient(135deg,#eee7db_0%,#e5e8e1_58%,#d2dce5_100%)] p-3">
        <div className="relative h-full overflow-hidden rounded-md border border-white/70 bg-[#fbfaf5] shadow-[inset_0_0_0_1px_rgba(23,25,22,0.04),0_16px_40px_rgba(23,25,22,0.08)]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={artwork.title}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
              unoptimized={imageSrc.startsWith("http")}
              className="object-contain p-4 transition duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-primary/72">
              <ImageOff className="size-8" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-[0.16em]">
                Imagen no disponible
              </span>
            </div>
          )}
        </div>
        <span className="absolute left-5 top-5 rounded-md bg-card/92 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-primary shadow-sm backdrop-blur">
          Inv. {artwork.inventoryNumber}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="line-clamp-1 text-xs font-medium uppercase tracking-[0.12em] text-primary/78">
            {artwork.artist?.name ?? "Autor sin registrar"}
          </p>
          <ArrowRight
            className="size-4 shrink-0 text-primary/70 transition group-hover:translate-x-1 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
        <h3 className="mt-3 line-clamp-2 font-serif text-2xl font-medium leading-tight text-foreground">
          {artwork.title}
        </h3>
        {details.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {details.slice(0, 3).map((detail) => (
              <span
                key={detail}
                className="rounded-md bg-muted/72 px-2.5 py-1 text-xs leading-5 text-muted-foreground"
              >
                {detail}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
