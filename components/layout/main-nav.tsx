"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { mainNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const isOverlay = isHeroOverlayPath(pathname);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative md:ml-auto">
      <button
        type="button"
        className={cn(
          "flex size-10 items-center justify-center rounded-xl transition-colors md:hidden",
          isOverlay
            ? "bg-white/12 text-white hover:bg-white/18"
            : "bg-card text-foreground shadow-sm hover:bg-muted",
        )}
        aria-label={isOpen ? "Cerrar navegacion" : "Abrir navegacion"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
      </button>

      <nav
        className="hidden items-center gap-1 md:flex"
        aria-label="Navegacion principal"
      >
        {mainNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative px-2.5 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-2.5 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:transition-transform hover:after:scale-x-100",
                isOverlay
                  ? "text-white after:bg-white/80 hover:text-white"
                  : "text-muted-foreground after:bg-foreground/62 hover:text-foreground",
                isActive &&
                  (isOverlay
                    ? "text-white after:scale-x-100"
                    : "text-foreground after:scale-x-100"),
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      {isOpen && (
        <nav
          id="mobile-navigation"
          className={cn(
            "absolute right-0 top-12 z-50 grid w-60 gap-1 rounded-2xl p-2 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl md:hidden",
            isOverlay ? "bg-[#101010]/82 text-white" : "bg-card/95",
          )}
          aria-label="Navegacion movil"
        >
          {mainNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "relative rounded-xl px-4 py-3 text-sm font-medium transition-colors after:absolute after:bottom-2 after:left-4 after:h-px after:w-8 after:origin-left after:scale-x-0 after:transition-transform hover:after:scale-x-100",
                  isOverlay
                    ? "text-white after:bg-white/80 hover:text-white"
                    : "text-muted-foreground after:bg-foreground/62 hover:bg-muted/55 hover:text-foreground",
                  isActive &&
                    (isOverlay
                      ? "text-white after:scale-x-100"
                      : "text-foreground after:scale-x-100"),
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function isHeroOverlayPath(pathname: string) {
  return (
    pathname === "/" ||
    /^\/obras\/[^/]+$/.test(pathname) ||
    /^\/artistas\/[^/]+$/.test(pathname) ||
    /^\/museos\/[^/]+$/.test(pathname)
  );
}
