"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { mainNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const isOverlay = pathname === "/";
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
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isOverlay
                  ? "text-white/78 hover:bg-white/12 hover:text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive &&
                  (isOverlay
                    ? "bg-white/15 text-white shadow-sm hover:bg-white/20"
                    : "bg-primary text-primary-foreground shadow-sm hover:bg-primary"),
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
                  "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isOverlay
                    ? "text-white/78 hover:bg-white/12 hover:text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive &&
                    (isOverlay
                      ? "bg-white/14 text-white"
                      : "bg-primary text-primary-foreground"),
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
