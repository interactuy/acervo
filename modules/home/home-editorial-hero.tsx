import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Brush,
  CalendarDays,
  Landmark,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const heroBackgrounds = [
  {
    src: "/hero/home-artwork-01.png",
    alt: "Obra abstracta de referencia para el acervo cultural",
  },
  {
    src: "/hero/home-artwork-02.png",
    alt: "Obra pictorica de referencia para el acervo cultural",
  },
  {
    src: "/hero/home-artwork-03.png",
    alt: "Obra contemporanea de referencia para el acervo cultural",
  },
];

const quickLinks = [
  {
    title: "Museos",
    href: "/museos",
    icon: Landmark,
  },
  {
    title: "Obras",
    href: "/obras",
    icon: Brush,
  },
  {
    title: "Artistas",
    href: "/artistas",
    icon: Users,
  },
  {
    title: "Exposiciones",
    href: "/exposiciones",
    icon: CalendarDays,
  },
];

export function HomeEditorialHero() {
  return (
    <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-foreground text-white">
      <div className="absolute inset-0 -z-20">
        {heroBackgrounds.map((background, index) => (
          <Image
            key={background.src}
            src={background.src}
            alt={background.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="home-hero-image object-cover"
            style={{ animationDelay: `${index * 6}s` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,7,7,0.82)_0%,rgba(7,7,7,0.58)_42%,rgba(7,7,7,0.28)_76%,rgba(7,7,7,0.58)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_28%,rgba(0,0,0,0.36),transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0)_34%,rgba(0,0,0,0.62)_100%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col justify-center px-4 pb-8 pt-28 sm:px-6 sm:pb-9 sm:pt-32 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/72 sm:text-sm sm:tracking-[0.18em]">
            Plataforma de descubrimiento cultural
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-[3.25rem] font-medium leading-[0.98] text-white sm:mt-5 sm:text-7xl sm:leading-[0.94] lg:text-8xl">
            Entrar al acervo desde la mirada.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:mt-6 sm:text-xl sm:leading-8">
            Explorá obras, artistas, museos y exposiciones desde una lectura
            editorial, visual y contemporánea.
          </p>
        </div>

        <form
          className="mt-9 flex w-full max-w-[50rem] items-center gap-2 rounded-[1.1rem] bg-[#15130f]/64 p-1.5 shadow-[0_18px_58px_rgba(0,0,0,0.16)] backdrop-blur-[2px] sm:mt-10 sm:gap-2.5 sm:rounded-[1.35rem] sm:bg-[#15130f]/72 sm:p-2.5 sm:shadow-[0_24px_76px_rgba(0,0,0,0.2)]"
          role="search"
          action="/buscar"
        >
          <label htmlFor="home-search" className="sr-only">
            Buscar en Acervo
          </label>
          <Search className="ml-3 hidden size-5 text-[#f8f3e8]/62 sm:block" />
          <Input
            id="home-search"
            name="q"
            type="search"
            placeholder="Busca artistas, obras, museos y exposiciones"
            className="h-12 rounded-[0.85rem] border-0 bg-[#f8f3e8]/18 px-3 text-sm text-white shadow-none placeholder:text-white/62 focus-visible:ring-0 sm:h-14 sm:rounded-[1.05rem] sm:px-4 sm:text-base"
          />
          <Button
            type="submit"
            className="h-12 rounded-[0.85rem] bg-[#f8f3e8]/18 px-4 text-sm text-white shadow-none hover:bg-[#f8f3e8]/28 sm:h-14 sm:rounded-[1.05rem] sm:px-7"
          >
            Explorar
          </Button>
        </form>

        <div className="mt-8 flex w-[calc(100%+1rem)] max-w-[50rem] snap-x snap-mandatory gap-4 overflow-x-auto pr-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:mt-6 sm:grid sm:w-full sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pr-0 [&::-webkit-scrollbar]:hidden">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-28 min-w-[82vw] snap-start flex-col justify-between rounded-[1.15rem] bg-[#15130f]/42 p-5 text-white shadow-[0_18px_56px_rgba(0,0,0,0.14)] backdrop-blur-sm transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#f8f3e8]/16 hover:shadow-[0_24px_70px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/30 sm:min-h-24 sm:min-w-0"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#f8f3e8]/13">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <ArrowRight
                    className="size-4 text-[#f8f3e8]/58 transition group-hover:translate-x-1 group-hover:text-white"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-5 font-serif text-2xl font-medium leading-none">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
