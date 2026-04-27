"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark } from "lucide-react";
import { Container } from "@/components/layout/container";
import { MainNav } from "@/components/layout/main-nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isArtworkProfile = /^\/obras\/[^/]+$/.test(pathname);
  const isOverlayHeader = isHome || isArtworkProfile;
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!isOverlayHeader) {
      return;
    }

    const updateScrollState = () => {
      setHasScrolled(window.scrollY > 18);
    };

    const frame = window.requestAnimationFrame(updateScrollState);
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollState);
    };
  }, [isOverlayHeader]);

  return (
    <header
      className={cn(
        "top-0 z-40 transition-colors duration-300",
        isOverlayHeader
          ? cn(
              "fixed inset-x-0 text-white",
              hasScrolled
                ? "bg-[#0d0d0d]/54 shadow-[0_14px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                : "bg-transparent",
            )
          : "sticky bg-background/88 text-foreground backdrop-blur-xl",
      )}
    >
      <Container className="flex min-h-16 items-center justify-between gap-4 py-3">
        <Link
          href="/"
          className={cn(
            "flex w-fit items-center gap-3 transition-colors",
            isOverlayHeader
              ? "text-white hover:text-white/82"
              : "hover:text-primary",
          )}
          aria-label="Acervo"
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-md shadow-sm",
              isOverlayHeader
                ? cn(
                    "text-white backdrop-blur-md",
                    hasScrolled ? "bg-white/12" : "bg-white/10",
                  )
                : "bg-primary text-primary-foreground",
            )}
          >
            <Landmark className="size-4" aria-hidden="true" />
          </span>
          <span className="font-serif text-xl font-medium tracking-normal">
            Acervo
          </span>
        </Link>
        <MainNav />
      </Container>
    </header>
  );
}
