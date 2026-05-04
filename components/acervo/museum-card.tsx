import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { MuseumPhoto } from "@/components/acervo/museum-photo";
import { cn } from "@/lib/utils";
import type { Museum } from "@/types/acervo";

type MuseumCardProps = {
  museum: Museum;
  className?: string;
  imagePriority?: boolean;
  variant?: "editorial" | "compact";
  onFocus?: () => void;
  onMouseEnter?: () => void;
};

export function MuseumCard({
  museum,
  className,
  imagePriority = false,
  variant = "editorial",
  onFocus,
  onMouseEnter,
}: MuseumCardProps) {
  const isCompact = variant === "compact";

  return (
    <Link
      id={museum.slug}
      href={`/museos/${museum.slug}`}
      className={cn(
        "group overflow-hidden transition duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
        isCompact
          ? "flex h-full flex-col rounded-lg border border-border/60 bg-card shadow-[0_18px_60px_rgba(23,25,22,0.055)] hover:border-primary/35 hover:shadow-[0_24px_70px_rgba(23,25,22,0.095)]"
          : "block rounded-[1.55rem] bg-[#fbf8ef] shadow-[0_24px_80px_rgba(23,25,22,0.08)] hover:shadow-[0_30px_90px_rgba(23,25,22,0.12)]",
        className,
      )}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          isCompact ? "aspect-[16/10]" : "aspect-[16/9]",
        )}
      >
        <MuseumPhoto
          museum={museum}
          sizes={
            isCompact
              ? "(min-width: 1024px) 22rem, (min-width: 768px) 50vw, 100vw"
              : "(min-width: 1024px) 34rem, (min-width: 768px) 50vw, 100vw"
          }
          priority={imagePriority}
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        {isCompact && (
          <div className="absolute inset-x-0 bottom-0 flex items-end bg-[linear-gradient(180deg,transparent,rgba(16,18,16,0.66))] p-4">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-card/92 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{museum.neighborhood}</span>
            </span>
          </div>
        )}
      </div>

      <div className={cn(isCompact ? "flex flex-1 flex-col p-5" : "p-7 sm:p-8")}>
        <div className="flex items-start justify-between gap-4">
          <p className="line-clamp-1 text-xs font-medium uppercase tracking-[0.18em] text-primary/74">
            {isCompact ? museum.type : `${museum.type} - ${museum.neighborhood}`}
          </p>
          {isCompact && (
            <ArrowRight
              className="mt-0.5 size-4 shrink-0 text-primary/72 transition group-hover:translate-x-1 group-hover:text-primary"
              aria-hidden="true"
            />
          )}
        </div>
        <h2
          className={cn(
            "mt-3 font-serif font-medium leading-[1.02] text-foreground",
            isCompact ? "line-clamp-2 text-2xl" : "text-4xl sm:text-5xl",
          )}
        >
          {museum.name}
        </h2>
        <p
          className={cn(
            "mt-4 text-muted-foreground",
            isCompact ? "line-clamp-3 text-sm leading-6" : "text-base leading-7 sm:text-lg",
          )}
        >
          {museum.summary}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium text-primary",
            isCompact ? "mt-auto pt-5" : "mt-6",
          )}
        >
          Ver museo
          <ArrowRight
            className="size-4 transition group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
