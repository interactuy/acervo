"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Image as ImageIcon,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { MuseumCard } from "@/components/acervo/museum-card";
import { museumHasPhoto } from "@/components/acervo/museum-photo";
import { Input } from "@/components/ui/input";
import type { Museum } from "@/types/acervo";

type MuseumsBrowserProps = {
  museums: Museum[];
};

type SortMode = "name" | "neighborhood" | "city";

const ALL_VALUE = "__all";
const WITH_PHOTO_VALUE = "__with_photo";
const WITHOUT_PHOTO_VALUE = "__without_photo";
const collator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    collator.compare(a, b),
  );
}

export function MuseumsBrowser({ museums }: MuseumsBrowserProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL_VALUE);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState(ALL_VALUE);
  const [cityFilter, setCityFilter] = useState(ALL_VALUE);
  const [photoFilter, setPhotoFilter] = useState(ALL_VALUE);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const types = useMemo(
    () => uniqueSorted(museums.map((museum) => museum.type)),
    [museums],
  );

  const neighborhoods = useMemo(
    () => uniqueSorted(museums.map((museum) => museum.neighborhood)),
    [museums],
  );

  const cities = useMemo(
    () => uniqueSorted(museums.map((museum) => museum.city)),
    [museums],
  );

  const filteredMuseums = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return museums
      .filter((museum) => {
        const matchesQuery =
          !normalizedQuery ||
          normalizeSearchText(
            [
              museum.name,
              museum.acronym,
              museum.type,
              museum.neighborhood,
              museum.city,
              museum.country,
              museum.address,
              museum.summary,
              museum.description,
              museum.accessibility,
              museum.contactEmail,
              museum.contactPhone,
            ]
              .filter(Boolean)
              .join(" "),
          ).includes(normalizedQuery);

        const matchesType =
          typeFilter === ALL_VALUE || museum.type === typeFilter;
        const matchesNeighborhood =
          neighborhoodFilter === ALL_VALUE ||
          museum.neighborhood === neighborhoodFilter;
        const matchesCity =
          cityFilter === ALL_VALUE || museum.city === cityFilter;
        const hasPhoto = museumHasPhoto(museum);
        const matchesPhoto =
          photoFilter === ALL_VALUE ||
          (photoFilter === WITH_PHOTO_VALUE && hasPhoto) ||
          (photoFilter === WITHOUT_PHOTO_VALUE && !hasPhoto);

        return (
          matchesQuery &&
          matchesType &&
          matchesNeighborhood &&
          matchesCity &&
          matchesPhoto
        );
      })
      .sort((a, b) => {
        if (sortMode === "neighborhood") {
          return (
            collator.compare(a.neighborhood, b.neighborhood) ||
            collator.compare(a.name, b.name)
          );
        }

        if (sortMode === "city") {
          return (
            collator.compare(a.city, b.city) || collator.compare(a.name, b.name)
          );
        }

        return collator.compare(a.name, b.name);
      });
  }, [
    cityFilter,
    museums,
    neighborhoodFilter,
    photoFilter,
    query,
    sortMode,
    typeFilter,
  ]);

  const activeFilterCount = [
    query.trim(),
    typeFilter !== ALL_VALUE,
    neighborhoodFilter !== ALL_VALUE,
    cityFilter !== ALL_VALUE,
    photoFilter !== ALL_VALUE,
    sortMode !== "name",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  function clearFilters() {
    setQuery("");
    setTypeFilter(ALL_VALUE);
    setNeighborhoodFilter(ALL_VALUE);
    setCityFilter(ALL_VALUE);
    setPhotoFilter(ALL_VALUE);
    setSortMode("name");
  }

  return (
    <section className="mt-9">
      <div className="rounded-[1.2rem] bg-card/74 p-3 shadow-[0_22px_80px_rgba(23,25,22,0.07)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            aria-expanded={isFilterPanelOpen}
            aria-controls="museums-filter-panel"
            className="inline-flex min-h-[3.25rem] w-full items-center justify-between gap-3 rounded-[1rem] bg-background/78 px-4 py-2 text-left transition hover:bg-background sm:max-w-md"
            onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  Buscar y filtrar
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {filteredMuseums.length} de {museums.length}
                  {hasActiveFilters
                    ? ` · ${activeFilterCount} ${
                        activeFilterCount === 1
                          ? "filtro activo"
                          : "filtros activos"
                      }`
                    : ""}
                </span>
              </span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-primary transition ${
                isFilterPanelOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-muted px-4 text-sm font-medium text-foreground transition hover:bg-muted/78"
              onClick={clearFilters}
            >
              <X className="size-4" aria-hidden="true" />
              Limpiar
            </button>
          )}
        </div>

        {isFilterPanelOpen && (
          <div
            id="museums-filter-panel"
            className="mt-4 border-t border-border/60 pt-4"
          >
            <div className="flex min-h-14 items-center gap-3 rounded-[1rem] bg-background/78 px-4">
              <Search
                className="size-5 shrink-0 text-primary/64"
                aria-hidden="true"
              />
              <label htmlFor="museums-search" className="sr-only">
                Buscar museos
              </label>
              <Input
                id="museums-search"
                type="search"
                value={query}
                placeholder="Buscar por museo, barrio, ciudad o dirección"
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <FilterSelect
                label="Tipo"
                value={typeFilter}
                onChange={setTypeFilter}
                options={types.map((type) => ({
                  label: type,
                  value: type,
                }))}
              />
              <FilterSelect
                label="Barrio"
                value={neighborhoodFilter}
                onChange={setNeighborhoodFilter}
                options={neighborhoods.map((neighborhood) => ({
                  label: neighborhood,
                  value: neighborhood,
                }))}
              />
              <FilterSelect
                label="Ciudad"
                value={cityFilter}
                onChange={setCityFilter}
                options={cities.map((city) => ({
                  label: city,
                  value: city,
                }))}
              />
              <FilterSelect
                label="Foto"
                value={photoFilter}
                onChange={setPhotoFilter}
                options={[
                  { label: "Con foto", value: WITH_PHOTO_VALUE },
                  { label: "Sin foto", value: WITHOUT_PHOTO_VALUE },
                ]}
              />
              <FilterSelect
                label="Orden"
                value={sortMode}
                onChange={(value) => setSortMode(value as SortMode)}
                includeAllOption={false}
                options={[
                  { label: "Nombre", value: "name" },
                  { label: "Barrio", value: "neighborhood" },
                  { label: "Ciudad", value: "city" },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {filteredMuseums.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredMuseums.map((museum, index) => (
            <MuseumCard
              key={museum.id}
              museum={museum}
              variant="compact"
              imagePriority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.2rem] bg-card/78 p-8 shadow-[0_18px_60px_rgba(23,25,22,0.05)]">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ImageIcon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-serif text-3xl font-medium text-foreground">
            No hay museos para esos filtros
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Probá limpiar algún filtro o buscar por nombre, barrio, ciudad o
            dirección.
          </p>
        </div>
      )}
    </section>
  );
}

type FilterOption = {
  label: string;
  value: string;
};

function FilterSelect({
  label,
  value,
  options,
  includeAllOption = true,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  includeAllOption?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-primary/70">
        {label}
      </span>
      <select
        value={value}
        className="h-11 w-full rounded-[0.9rem] bg-background/78 px-3 text-sm text-foreground outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/30"
        onChange={(event) => onChange(event.target.value)}
      >
        {includeAllOption && <option value={ALL_VALUE}>Todos</option>}
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
