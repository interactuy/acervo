import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Artist } from "@/types/acervo";

type ArtistAvatarProps = {
  artist: Pick<Artist, "name" | "portrait">;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
  sizes?: string;
};

export function ArtistAvatar({
  artist,
  className,
  fallbackClassName,
  imageClassName,
  sizes = "6rem",
}: ArtistAvatarProps) {
  if (artist.portrait?.src) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-[0.95rem] bg-muted",
          className,
        )}
      >
        <Image
          src={artist.portrait.src}
          alt={artist.portrait.alt}
          fill
          sizes={sizes}
          unoptimized={artist.portrait.src.startsWith("http")}
          className={cn("object-cover", imageClassName)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[0.95rem] bg-primary/10 font-medium text-primary",
        className,
        fallbackClassName,
      )}
      aria-label={`Retrato de ${artist.name}`}
    >
      {getInitials(artist.name)}
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
