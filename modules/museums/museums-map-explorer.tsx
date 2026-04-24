"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import { ArrowRight, Landmark, List, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mapboxConfig } from "@/lib/mapbox/config";
import { cn } from "@/lib/utils";
import type { Museum } from "@/types/acervo";

type SheetState = "collapsed" | "preview" | "expanded";

const fallbackPositions = [
  "left-[68%] top-[54%]",
  "left-[35%] top-[58%]",
  "left-[48%] top-[34%]",
  "left-[25%] top-[61%]",
];

function getMuseumHref(museum: Museum) {
  return `/museos/${museum.slug}`;
}

function getMuseumCoordinates(museum: Museum): [number, number] {
  return [museum.coordinates.lng, museum.coordinates.lat];
}

function normalizeMapSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function applyMinimalMapStyle(mapInstance: MapboxMap) {
  const style = mapInstance.getStyle();

  style.layers?.forEach((layer) => {
    const layerId = layer.id.toLowerCase();

    if (layer.type === "symbol") {
      const keepsPlaceContext =
        layerId.includes("settlement") ||
        layerId.includes("place") ||
        layerId.includes("water");

      if (!keepsPlaceContext) {
        mapInstance.setLayoutProperty(layer.id, "visibility", "none");
      }
    }

    if (layer.type === "line" && layerId.includes("road")) {
      mapInstance.setPaintProperty(layer.id, "line-color", "#d7d3c8");
      mapInstance.setPaintProperty(layer.id, "line-opacity", 0.58);
    }

    if (layer.type === "fill" && layerId.includes("water")) {
      mapInstance.setPaintProperty(layer.id, "fill-color", "#dce8f0");
    }
  });
}

function getExpandedSheetState(current: SheetState): SheetState {
  if (current === "collapsed") {
    return "preview";
  }

  return "expanded";
}

function getCollapsedSheetState(current: SheetState): SheetState {
  if (current === "expanded") {
    return "preview";
  }

  return "collapsed";
}

function getToggledSheetState(current: SheetState): SheetState {
  if (current === "collapsed") {
    return "preview";
  }

  if (current === "preview") {
    return "expanded";
  }

  return "collapsed";
}

type MuseumsMapExplorerProps = {
  museums: Museum[];
};

export function MuseumsMapExplorer({ museums }: MuseumsMapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, MapboxMarker>>({});
  const dragStartYRef = useRef<number | null>(null);
  const suppressHandleClickRef = useRef(false);
  const hasMapboxToken = Boolean(mapboxConfig.accessToken);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [selectedMuseumId, setSelectedMuseumId] = useState(
    museums[0]?.id ?? "",
  );
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedMuseum =
    museums.find((museum) => museum.id === selectedMuseumId) ?? museums[0];

  const filteredMuseums = useMemo(() => {
    const normalizedQuery = normalizeMapSearch(searchQuery);

    if (!normalizedQuery) {
      return museums;
    }

    return museums.filter((museum) =>
      [
        museum.name,
        museum.acronym,
        museum.type,
        museum.neighborhood,
        museum.city,
        museum.address,
        museum.summary,
        museum.description,
      ]
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [museums, searchQuery]);

  const filteredMuseumsLabel =
    filteredMuseums.length === 1
      ? "1 espacio para explorar"
      : `${filteredMuseums.length} espacios para explorar`;

  useEffect(() => {
    if (!hasMapboxToken || !mapContainerRef.current) {
      return;
    }

    let mounted = true;
    let map: MapboxMap | undefined;

    async function initializeMap() {
      try {
        const mapboxgl = await import("mapbox-gl");

        if (!mounted || !mapContainerRef.current) {
          return;
        }

        mapboxgl.default.accessToken = mapboxConfig.accessToken;

        const mapInstance = new mapboxgl.default.Map({
          container: mapContainerRef.current,
          style: mapboxConfig.defaultStyle,
          center: museums[0]
            ? getMuseumCoordinates(museums[0])
            : [...mapboxConfig.defaultCenter],
          zoom: museums.length === 1 ? 13.45 : 12.15,
          attributionControl: false,
          cooperativeGestures: false,
          doubleClickZoom: true,
          dragPan: true,
          keyboard: true,
          scrollZoom: true,
          touchZoomRotate: true,
        });

        map = mapInstance;

        mapInstance.once("load", () => {
          applyMinimalMapStyle(mapInstance);
          setMapState("ready");
          requestAnimationFrame(() => mapInstance.resize());
        });

        mapInstance.once("error", () => {
          setMapState("error");
        });

        mapInstance.addControl(
          new mapboxgl.default.AttributionControl({ compact: true }),
          "bottom-right",
        );

        museums.forEach((museum) => {
          const marker = new mapboxgl.default.Marker({
            color: "#3E679F",
            scale: 0.82,
          })
            .setLngLat(getMuseumCoordinates(museum))
            .setPopup(
              new mapboxgl.default.Popup({ offset: 18 }).setHTML(
                `<strong>${museum.name}</strong><br/><span>${museum.neighborhood}</span><br/><a href="${getMuseumHref(museum)}">Ver perfil</a>`,
              ),
            )
            .addTo(mapInstance);

          markersRef.current[museum.id] = marker;

          marker.getElement().addEventListener("click", () => {
            setSelectedMuseumId(museum.id);
            setSheetState("preview");
            mapInstance.easeTo({
              center: getMuseumCoordinates(museum),
              duration: 650,
              zoom: Math.max(mapInstance.getZoom(), 13),
            });
          });
        });
      } catch {
        setMapState("error");
      }
    }

    initializeMap();

    return () => {
      mounted = false;
      markersRef.current = {};
      map?.remove();
    };
  }, [hasMapboxToken, museums]);

  useEffect(() => {
    const visibleMuseumIds = new Set(
      filteredMuseums.map((museum) => museum.id),
    );

    Object.entries(markersRef.current).forEach(([museumId, marker]) => {
      marker.getElement().style.display = visibleMuseumIds.has(museumId)
        ? ""
        : "none";
    });
  }, [filteredMuseums]);

  function handleSearchFocus() {
    setSheetState((current) => (current === "expanded" ? "expanded" : "preview"));
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);

    if (value.trim()) {
      setSheetState((current) =>
        current === "expanded" ? "expanded" : "preview",
      );
    }
  }

  function handleSheetPointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSheetPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const dragStartY = dragStartYRef.current;

    if (dragStartY === null) {
      return;
    }

    const deltaY = event.clientY - dragStartY;
    dragStartYRef.current = null;

    if (Math.abs(deltaY) > 34) {
      suppressHandleClickRef.current = true;
      setSheetState((current) =>
        deltaY < 0 ? getExpandedSheetState(current) : getCollapsedSheetState(current),
      );
    }
  }

  function handleSheetHandleClick() {
    if (suppressHandleClickRef.current) {
      suppressHandleClickRef.current = false;
      return;
    }

    setSheetState((current) => getToggledSheetState(current));
  }

  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[#dfe7df]">
      {(!hasMapboxToken || mapState !== "ready") && (
        <FallbackMuseumMap visibleMuseums={filteredMuseums} />
      )}
      {hasMapboxToken && mapState !== "error" && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            mapState === "ready" ? "opacity-100" : "opacity-0",
          )}
        >
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,244,237,0.5)_0%,rgba(247,244,237,0.06)_32%,rgba(247,244,237,0)_54%,rgba(23,25,22,0.12)_100%)]" />

      <div className="absolute inset-x-0 bottom-0 z-20 px-0 sm:px-4 sm:pb-5 lg:px-8">
        <div
          className={cn(
            "mx-auto max-w-6xl overflow-hidden rounded-t-[1.75rem] bg-[#fbf8ef]/93 shadow-[0_-22px_90px_rgba(23,25,22,0.18)] backdrop-blur-2xl transition-[height] duration-300 ease-out sm:rounded-[1.75rem]",
            sheetState === "collapsed" && "h-[8.5rem] sm:h-[9rem]",
            sheetState === "preview" && "h-[25rem] sm:h-[24rem]",
            sheetState === "expanded" &&
              "h-[calc(100svh-6.5rem)] sm:h-[min(78svh,42rem)]",
          )}
        >
          <button
            type="button"
            className="flex w-full cursor-grab touch-none flex-col items-center gap-2 px-4 pb-2 pt-3 active:cursor-grabbing"
            aria-label="Mover panel de museos"
            onClick={handleSheetHandleClick}
            onPointerDown={handleSheetPointerDown}
            onPointerUp={handleSheetPointerUp}
            onPointerCancel={() => {
              dragStartYRef.current = null;
            }}
          >
            <span className="h-1.5 w-12 rounded-full bg-primary/22" />
            <span className="sr-only">Arrastrar o tocar para abrir el panel</span>
          </button>

          <div className="px-4 pb-4 sm:px-5 lg:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <List className="size-4" aria-hidden="true" />
                  Museos en el mapa
                </div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {sheetState === "collapsed"
                    ? "Busca o toca un pin para empezar."
                    : filteredMuseumsLabel}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary/80">
                {sheetState === "expanded" ? "Lista" : "Mapa"}
              </span>
            </div>

            <form
              className="mt-3 flex items-center gap-2 rounded-2xl bg-white/58 p-2"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="museum-search" className="sr-only">
                Buscar museos
              </label>
              <Search className="ml-2 size-4 text-primary/65" />
              <Input
                id="museum-search"
                type="search"
                value={searchQuery}
                placeholder="Buscar museo o barrio"
                className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
                onFocus={handleSearchFocus}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </form>

            <div
              className={cn(
                "transition-opacity duration-200",
                sheetState === "collapsed"
                  ? "pointer-events-none opacity-0"
                  : "opacity-100",
              )}
            >
              {sheetState === "preview" &&
                (searchQuery.trim() ? (
                  <MuseumResultsPreview
                    museums={filteredMuseums}
                    onSelect={(museumId) => setSelectedMuseumId(museumId)}
                    onOpenList={() => setSheetState("expanded")}
                  />
                ) : (
                  <MuseumPreview
                    museum={selectedMuseum}
                    onOpenList={() => setSheetState("expanded")}
                  />
                ))}

              {sheetState === "expanded" && (
                <div className="mt-4 grid max-h-[calc(100svh-19rem)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 sm:max-h-[calc(78svh-15rem)] lg:max-h-[25rem]">
                  {filteredMuseums.map((museum) => (
                    <MuseumListCard
                      key={museum.id}
                      museum={museum}
                      isSelected={museum.id === selectedMuseumId}
                      onSelect={() => setSelectedMuseumId(museum.id)}
                    />
                  ))}
                  {filteredMuseums.length === 0 && (
                    <div className="rounded-2xl bg-white/50 p-5">
                      <p className="font-serif text-2xl font-medium text-foreground">
                        Sin resultados
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Proba buscar por museo, barrio o tipo de espacio.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MuseumPreview({
  museum,
  onOpenList,
}: {
  museum: Museum;
  onOpenList: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-white/56 p-4 shadow-[0_18px_45px_rgba(62,103,159,0.13)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Landmark className="size-4" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary/80">
          {museum.neighborhood}
        </span>
      </div>
      <h2 className="mt-4 font-serif text-3xl font-medium leading-none text-foreground">
        {museum.name}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {museum.summary}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={getMuseumHref(museum)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Ver perfil
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
          onClick={onOpenList}
        >
          Ver lista completa
        </button>
      </div>
    </div>
  );
}

function MuseumResultsPreview({
  museums,
  onSelect,
  onOpenList,
}: {
  museums: Museum[];
  onSelect: (museumId: string) => void;
  onOpenList: () => void;
}) {
  const previewMuseums = museums.slice(0, 2);

  return (
    <div className="mt-4 rounded-2xl bg-white/50 p-4 shadow-[0_18px_45px_rgba(62,103,159,0.11)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">
            Resultados cercanos
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {museums.length} museos encontrados
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
          onClick={onOpenList}
        >
          Ver todos
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        {previewMuseums.map((museum) => (
          <Link
            key={museum.id}
            href={getMuseumHref(museum)}
            className="group rounded-2xl bg-white/56 p-3 transition hover:bg-white/78 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
            onMouseEnter={() => onSelect(museum.id)}
            onFocus={() => onSelect(museum.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
              <h2 className="font-serif text-xl font-medium leading-tight text-foreground">
                  {museum.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {museum.neighborhood}
                </p>
              </div>
              <ArrowRight
                className="mt-1 size-4 text-primary transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
        {museums.length === 0 && (
          <div className="rounded-2xl bg-white/56 p-4">
            <p className="font-serif text-xl font-medium text-foreground">
              Sin resultados
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Proba buscar por museo, barrio o tipo de espacio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MuseumListCard({
  museum,
  isSelected,
  onSelect,
}: {
  museum: Museum;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      id={museum.id}
      href={getMuseumHref(museum)}
      className={cn(
        "group rounded-2xl bg-white/50 p-4 transition hover:-translate-y-0.5 hover:bg-white/75 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35",
        isSelected && "shadow-[0_18px_45px_rgba(62,103,159,0.15)]",
      )}
      onMouseEnter={onSelect}
      onFocus={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Landmark className="size-4" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary/80">
          {museum.neighborhood}
        </span>
      </div>
      <h2 className="mt-4 font-serif text-2xl font-medium leading-none text-foreground">
        {museum.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {museum.summary}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
        Ver perfil
        <ArrowRight
          className="size-4 transition group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function FallbackMuseumMap({ visibleMuseums }: { visibleMuseums: Museum[] }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#dfe7df]"
      aria-label="Mapa de museos de referencia"
      role="img"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(62,103,159,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(62,103,159,0.08)_1px,transparent_1px)] bg-[size:82px_82px]" />
      <div className="absolute -left-20 top-0 h-[120%] w-[48%] rotate-[-8deg] rounded-[42%] bg-[#cbd7d7]" />
      <div className="absolute bottom-[-18%] right-[-8%] h-[62%] w-[50%] rounded-[38%] bg-[#cbd8e1]" />
      <div className="absolute left-[18%] top-[24%] h-2 w-[62%] rotate-[18deg] rounded-full bg-card/70" />
      <div className="absolute left-[28%] top-[40%] h-2 w-[54%] rotate-[-14deg] rounded-full bg-card/80" />
      <div className="absolute left-[16%] top-[65%] h-2 w-[70%] rotate-[7deg] rounded-full bg-card/70" />
      <div className="absolute left-[54%] top-[18%] h-[58%] w-2 rotate-[12deg] rounded-full bg-card/75" />

      {visibleMuseums.map((museum, index) => (
        <div
          key={museum.id}
          className={cn(
            "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2",
            fallbackPositions[index % fallbackPositions.length],
          )}
        >
          <span className="relative flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/15">
            <MapPin className="size-4" aria-hidden="true" />
          </span>
        </div>
      ))}
    </div>
  );
}
