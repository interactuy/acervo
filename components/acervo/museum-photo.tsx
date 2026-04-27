import Image from "next/image";
import type { Museum } from "@/types/acervo";
import { cn } from "@/lib/utils";

const LEGACY_ARTWORK_PLACEHOLDER_PREFIX = "/hero/home-artwork";
const GENERATED_PLACEHOLDER_PREFIX = "/images/placeholders";

type MuseumPhotoProps = {
  museum: Museum;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function getMuseumPhotoSrc(museum: Museum) {
  const src = museum.image.src?.trim() ?? "";

  if (
    !src ||
    src.startsWith(LEGACY_ARTWORK_PLACEHOLDER_PREFIX) ||
    src.startsWith(GENERATED_PLACEHOLDER_PREFIX)
  ) {
    return null;
  }

  return src;
}

export function museumHasPhoto(museum: Museum) {
  return Boolean(getMuseumPhotoSrc(museum));
}

export function MuseumPhoto({
  museum,
  sizes,
  className,
  priority = false,
}: MuseumPhotoProps) {
  const photoSrc = getMuseumPhotoSrc(museum);

  if (photoSrc) {
    return (
      <Image
        src={photoSrc}
        alt={museum.image.alt || `Foto de ${museum.name}`}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={photoSrc.startsWith("http")}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-[#dbe2df]",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#e8e0d4_0%,#e8e0d4_36%,#c7d4dc_36%,#c7d4dc_64%,#385d86_64%,#385d86_100%)]" />
      <div className="absolute left-[8%] top-[12%] h-[72%] w-[28%] bg-[#1f2528]/82" />
      <div className="absolute right-[12%] top-[18%] h-[24%] w-[18%] bg-[#b56a45]/78" />
      <div className="absolute bottom-0 left-0 h-[24%] w-full bg-[#f7f4ed]/92" />
      <div className="absolute bottom-[24%] left-[14%] h-px w-[68%] bg-[#18222b]/22" />
      <div className="absolute bottom-[17%] left-[18%] h-[7%] w-[16%] border border-[#18222b]/26" />
      <div className="absolute bottom-[17%] left-[42%] h-[7%] w-[16%] border border-[#18222b]/26" />
      <div className="absolute bottom-[17%] left-[66%] h-[7%] w-[16%] border border-[#18222b]/26" />
    </div>
  );
}
