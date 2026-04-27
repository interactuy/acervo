"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

type ArtworkLightboxProps = {
  imageSrc: string;
  title: string;
  artistName?: string | null;
};

export function ArtworkLightbox({
  imageSrc,
  title,
  artistName,
}: ArtworkLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const lightbox = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Vista ampliada de ${title}`}
      className="fixed inset-0 z-[999] bg-[#030303] text-white"
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-[1000] inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/35 sm:right-6 sm:top-6"
        onClick={() => setIsOpen(false)}
      >
        <X className="size-5" aria-hidden="true" />
        <span className="sr-only">Cerrar</span>
      </button>

      <div className="flex min-h-dvh flex-col">
        <div className="relative flex-1">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="100vw"
            priority
            unoptimized={imageSrc.startsWith("http")}
            className="object-contain p-4 sm:p-8 lg:p-10"
          />
        </div>
        <div className="px-4 pb-5 pt-2 text-center sm:px-8 sm:pb-7">
          <p className="font-serif text-2xl font-medium leading-tight sm:text-3xl">
            {title}
          </p>
          {artistName && (
            <p className="mt-2 text-sm text-white/62">{artistName}</p>
          )}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#171916] shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition hover:bg-white/88 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/42"
        onClick={() => setIsOpen(true)}
      >
        <Maximize2 className="size-4" aria-hidden="true" />
        Ampliar obra
      </button>

      {isOpen && createPortal(lightbox, document.body)}
    </>
  );
}
