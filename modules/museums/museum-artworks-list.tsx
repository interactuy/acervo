"use client";

import { useState } from "react";
import { ArtworkCard } from "@/components/acervo/artwork-card";
import type { ArtworkWithArtist } from "@/types/acervo";

type MuseumArtworksListProps = {
  artworks: ArtworkWithArtist[];
};

const INITIAL_VISIBLE_ARTWORKS = 12;

export function MuseumArtworksList({ artworks }: MuseumArtworksListProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleArtworks = showAll
    ? artworks
    : artworks.slice(0, INITIAL_VISIBLE_ARTWORKS);
  const hasMore = artworks.length > INITIAL_VISIBLE_ARTWORKS;

  return (
    <>
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visibleArtworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_46px_rgba(62,103,159,0.18)] transition hover:bg-primary/90"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll
              ? "Mostrar menos"
              : `Ver todas las obras (${artworks.length})`}
          </button>
        </div>
      )}
    </>
  );
}
