"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  "¿Qué parte de la imagen miraste primero?",
  "¿Qué color sostiene la escena?",
  "¿Qué queda fuera del cuadro?",
  "¿Qué sensación deja la obra?",
];

type ContemplativeModeProps = {
  imageSrc: string | null;
  title: string;
  artistName?: string | null;
  year?: string | null;
  triggerClassName?: string;
};

export function ContemplativeMode({
  imageSrc,
  title,
  artistName,
  year,
  triggerClassName,
}: ContemplativeModeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const interval = window.setInterval(() => {
      setQuestionIndex((index) => (index + 1) % QUESTIONS.length);
    }, 7200);

    return () => window.clearInterval(interval);
  }, [isOpen]);

  if (!imageSrc) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-current/20 px-5 text-sm font-medium transition hover:bg-current/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
          triggerClassName,
        )}
        onClick={() => {
          setQuestionIndex(0);
          setIsOpen(true);
        }}
      >
        <Eye className="size-4" aria-hidden="true" />
        Mirar con tiempo
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-[#0c0d0b] text-white"
          role="dialog"
          aria-modal="true"
          aria-label={`Mirar con tiempo: ${title}`}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white/86 backdrop-blur transition hover:bg-white/16 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/35 sm:right-6 sm:top-6"
            aria-label="Salir de mirar con tiempo"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="flex min-h-svh flex-col">
            <div className="relative flex flex-1 items-center justify-center px-4 py-20 sm:px-8">
              <Image
                src={imageSrc}
                alt={[title, artistName].filter(Boolean).join(", ")}
                fill
                sizes="100vw"
                unoptimized={imageSrc.startsWith("http")}
                className="object-contain p-6 sm:p-10"
                priority
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,rgba(12,13,11,0)_0%,rgba(12,13,11,0.82)_72%,#0c0d0b_100%)]" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-7 sm:px-8 sm:pb-10">
              <div className="grid gap-5 border-t border-white/12 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/46">
                    Mirar con tiempo
                  </p>
                  <p className="mt-3 font-serif text-3xl font-medium leading-tight text-white sm:text-5xl">
                    {QUESTIONS[questionIndex]}
                  </p>
                </div>
                <p className="max-w-sm text-sm leading-6 text-white/56 sm:text-right">
                  {[title, artistName, year].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
