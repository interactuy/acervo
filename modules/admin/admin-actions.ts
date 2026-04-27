"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAcervoSeed, saveAcervoSeed } from "@/lib/acervo/data";
import { uploadAdminMedia } from "@/lib/acervo/media";
import type { AcervoSeed, Artist, Artwork, Exhibition, Museum } from "@/types/acervo";

const ADMIN_COOKIE = "acervo_admin_session";
const LEGACY_MUSEUM_IMAGE_PREFIX = "/hero/home-artwork";

type AdminSection = "museos" | "artistas" | "obras" | "exposiciones";

export async function getAdminAuthState() {
  const hasPassword = Boolean(process.env.ADMIN_PASSWORD);
  const isProduction = process.env.NODE_ENV === "production";

  if (!hasPassword && !isProduction) {
    return {
      isAllowed: true,
      hasPassword,
      isProduction,
    };
  }

  if (!hasPassword) {
    return {
      isAllowed: false,
      hasPassword,
      isProduction,
    };
  }

  const cookieStore = await cookies();

  return {
    isAllowed:
      cookieStore.get(ADMIN_COOKIE)?.value === hashAdminPassword(process.env.ADMIN_PASSWORD),
    hasPassword,
    isProduction,
  };
}

export async function loginAdminAction(formData: FormData) {
  const password = getFormString(formData, "password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    redirectAdmin("museos", undefined, "El panel esta abierto en desarrollo.");
  }

  if (password !== adminPassword) {
    redirectAdmin("museos", undefined, undefined, "Contrasena incorrecta.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, hashAdminPassword(adminPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirectAdmin("museos", undefined, "Sesion iniciada.");
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirectAdmin("museos", undefined, "Sesion cerrada.");
}

export async function upsertMuseumAction(formData: FormData) {
  await requireAdmin();

  const seed = await getAcervoSeed();
  const currentId = getFormString(formData, "id");
  const name = getRequiredString(formData, "name", "El museo necesita nombre.");
  const slug = ensureUniqueSlug(
    seed.museums,
    getFormString(formData, "slug") || name,
    currentId,
  );
  const id = currentId || ensureUniqueId(seed.museums, `museum-${slug}`);
  const coordinates = getMuseumCoordinatesOrRedirect(formData, id);
  const uploadedImageSrc = await uploadMediaOrRedirect(
    formData,
    "imageFile",
    "museums",
    "museos",
    id,
  );
  const imageSrc =
    uploadedImageSrc ?? normalizeMuseumImageSrc(getFormString(formData, "imageSrc"));
  const museum: Museum = {
    id,
    slug,
    name,
    acronym: optionalString(formData, "acronym") ?? undefined,
    type: getFormString(formData, "type") || "Museo",
    summary: getFormString(formData, "summary"),
    description: getFormString(formData, "description"),
    address: getFormString(formData, "address"),
    neighborhood: getFormString(formData, "neighborhood"),
    city: getFormString(formData, "city") || "Montevideo",
    country: getFormString(formData, "country") || "Uruguay",
    coordinates,
    openingHours: getFormString(formData, "openingHoursLabel")
      ? {
          label: getFormString(formData, "openingHoursLabel"),
          notes: optionalString(formData, "openingHoursNotes") ?? undefined,
        }
      : undefined,
    accessibility: optionalString(formData, "accessibility"),
    website: optionalString(formData, "website") ?? undefined,
    contactEmail: optionalString(formData, "contactEmail"),
    contactPhone: optionalString(formData, "contactPhone"),
    ticketInfo: optionalString(formData, "ticketInfo"),
    howToGetThere: optionalString(formData, "howToGetThere"),
    social: {
      instagram: optionalString(formData, "instagram"),
      facebook: optionalString(formData, "facebook"),
      x: optionalString(formData, "x"),
      youtube: optionalString(formData, "youtube"),
    },
    sourceUrl: getFormString(formData, "sourceUrl"),
    collectionSourceUrl: optionalString(formData, "collectionSourceUrl") ?? undefined,
    image: {
      src: imageSrc,
      alt: getFormString(formData, "imageAlt") || `Imagen de ${name}`,
    },
  };

  upsertById(seed.museums, museum);
  await persistSeedOrRedirect(seed, "museos", id);
  await refreshPublicPages();
  redirectAdmin("museos", id, "Museo guardado.");
}

export async function deleteMuseumAction(formData: FormData) {
  await requireAdmin();

  const id = getRequiredString(formData, "id", "Falta el museo.");
  const seed = await getAcervoSeed();
  const relatedArtworks = seed.artworks.filter((artwork) => artwork.museumId === id);

  if (relatedArtworks.length > 0) {
    redirectAdmin(
      "museos",
      id,
      undefined,
      `No se puede eliminar: tiene ${relatedArtworks.length} obras vinculadas.`,
    );
  }

  seed.museums = seed.museums.filter((museum) => museum.id !== id);
  await persistSeedOrRedirect(seed, "museos");
  await refreshPublicPages();
  redirectAdmin("museos", undefined, "Museo eliminado.");
}

export async function upsertArtistAction(formData: FormData) {
  await requireAdmin();

  const seed = await getAcervoSeed();
  const currentId = getFormString(formData, "id");
  const name = getRequiredString(formData, "name", "El artista necesita nombre.");
  const slug = ensureUniqueSlug(
    seed.artists,
    getFormString(formData, "slug") || name,
    currentId,
  );
  const id = currentId || ensureUniqueId(seed.artists, `artist-${slug}`);
  const birthYear = getFormNumber(formData, "birthYear");
  const deathYear = getFormNumber(formData, "deathYear");
  const uploadedPortraitSrc = await uploadMediaOrRedirect(
    formData,
    "portraitFile",
    "artists",
    "artistas",
    id,
  );
  const portraitSrc = uploadedPortraitSrc ?? getFormString(formData, "portraitSrc");
  const artist: Artist = {
    id,
    slug,
    name,
    biography: optionalString(formData, "biography"),
    portrait: portraitSrc
      ? {
          src: portraitSrc,
          alt: getFormString(formData, "portraitAlt") || `Retrato de ${name}`,
        }
      : null,
    birthYear,
    deathYear,
    lifeDates: optionalString(formData, "lifeDates") ?? buildLifeDates(birthYear, deathYear),
    nationality: optionalString(formData, "nationality"),
    sourceUrl: getFormString(formData, "sourceUrl"),
  };

  upsertById(seed.artists, artist);
  await persistSeedOrRedirect(seed, "artistas", id);
  await refreshPublicPages();
  redirectAdmin("artistas", id, "Artista guardado.");
}

export async function deleteArtistAction(formData: FormData) {
  await requireAdmin();

  const id = getRequiredString(formData, "id", "Falta el artista.");
  const seed = await getAcervoSeed();
  const relatedArtworks = seed.artworks.filter((artwork) => artwork.artistId === id);

  if (relatedArtworks.length > 0) {
    redirectAdmin(
      "artistas",
      id,
      undefined,
      `No se puede eliminar: tiene ${relatedArtworks.length} obras vinculadas.`,
    );
  }

  seed.artists = seed.artists.filter((artist) => artist.id !== id);
  await persistSeedOrRedirect(seed, "artistas");
  await refreshPublicPages();
  redirectAdmin("artistas", undefined, "Artista eliminado.");
}

export async function upsertArtworkAction(formData: FormData) {
  await requireAdmin();

  const seed = await getAcervoSeed();
  const currentId = getFormString(formData, "id");
  const title = getRequiredString(formData, "title", "La obra necesita titulo.");
  const inventoryNumber = getRequiredString(
    formData,
    "inventoryNumber",
    "La obra necesita inventario.",
  );
  const slug = ensureUniqueSlug(
    seed.artworks,
    getFormString(formData, "slug") || `${title}-${inventoryNumber}`,
    currentId,
  );
  const id = currentId || ensureUniqueId(seed.artworks, `artwork-${slug}`);
  const uploadedImageUrl = await uploadMediaOrRedirect(
    formData,
    "imageFile",
    "artworks",
    "obras",
    id,
  );
  const artwork: Artwork = {
    id,
    slug,
    title,
    inventoryNumber,
    artistId: getRequiredString(formData, "artistId", "Elegí un artista."),
    museumId: getRequiredString(formData, "museumId", "Elegí un museo."),
    technique: optionalString(formData, "technique"),
    dimensions: optionalString(formData, "dimensions"),
    year: optionalString(formData, "year"),
    location: optionalString(formData, "location"),
    exhibitionStatus: optionalString(formData, "exhibitionStatus"),
    sourceUrl: getFormString(formData, "sourceUrl"),
    imageUrl: uploadedImageUrl ?? optionalString(formData, "imageUrl"),
  };

  upsertById(seed.artworks, artwork);
  await persistSeedOrRedirect(seed, "obras", id);
  await refreshPublicPages();
  redirectAdmin("obras", id, "Obra guardada.");
}

export async function deleteArtworkAction(formData: FormData) {
  await requireAdmin();

  const id = getRequiredString(formData, "id", "Falta la obra.");
  const seed = await getAcervoSeed();

  seed.artworks = seed.artworks.filter((artwork) => artwork.id !== id);
  seed.exhibitions = seed.exhibitions.map((exhibition) => ({
    ...exhibition,
    artworkIds: exhibition.artworkIds.filter((artworkId) => artworkId !== id),
  }));
  await persistSeedOrRedirect(seed, "obras");
  await refreshPublicPages();
  redirectAdmin("obras", undefined, "Obra eliminada.");
}

export async function upsertExhibitionAction(formData: FormData) {
  await requireAdmin();

  const seed = await getAcervoSeed();
  const currentId = getFormString(formData, "id");
  const title = getRequiredString(
    formData,
    "title",
    "La exposicion necesita titulo.",
  );
  const slug = ensureUniqueSlug(
    seed.exhibitions,
    getFormString(formData, "slug") || title,
    currentId,
  );
  const id = currentId || ensureUniqueId(seed.exhibitions, `exhibition-${slug}`);
  const exhibition: Exhibition = {
    id,
    slug,
    title,
    museumId: getRequiredString(formData, "museumId", "Elegí un museo."),
    startDate: optionalString(formData, "startDate"),
    endDate: optionalString(formData, "endDate"),
    location: optionalString(formData, "location"),
    description: optionalString(formData, "description"),
    artworkIds: splitList(getFormString(formData, "artworkIds")),
    sourceUrl: getFormString(formData, "sourceUrl"),
  };

  upsertById(seed.exhibitions, exhibition);
  await persistSeedOrRedirect(seed, "exposiciones", id);
  await refreshPublicPages();
  redirectAdmin("exposiciones", id, "Exposicion guardada.");
}

export async function deleteExhibitionAction(formData: FormData) {
  await requireAdmin();

  const id = getRequiredString(formData, "id", "Falta la exposicion.");
  const seed = await getAcervoSeed();

  seed.exhibitions = seed.exhibitions.filter((exhibition) => exhibition.id !== id);
  await persistSeedOrRedirect(seed, "exposiciones");
  await refreshPublicPages();
  redirectAdmin("exposiciones", undefined, "Exposicion eliminada.");
}

async function requireAdmin() {
  const authState = await getAdminAuthState();

  if (!authState.isAllowed) {
    redirectAdmin("museos", undefined, undefined, "No autorizado.");
  }
}

async function refreshPublicPages() {
  revalidatePath("/", "layout");
}

async function persistSeedOrRedirect(
  seed: AcervoSeed,
  section: AdminSection,
  id?: string,
) {
  try {
    await saveAcervoSeed(seed);
  } catch (error) {
    redirectAdmin(section, id, undefined, getErrorMessage(error));
  }
}

async function uploadMediaOrRedirect(
  formData: FormData,
  fieldName: string,
  folder: string,
  section: AdminSection,
  id?: string,
) {
  try {
    return await uploadAdminMedia(formData, fieldName, folder);
  } catch (error) {
    redirectAdmin(section, id, undefined, getErrorMessage(error));
  }
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const existingIndex = items.findIndex((currentItem) => currentItem.id === item.id);

  if (existingIndex >= 0) {
    items[existingIndex] = item;
    return;
  }

  items.push(item);
}

function ensureUniqueSlug(
  items: Array<{ id: string; slug: string }>,
  value: string,
  currentId?: string,
) {
  const baseSlug = slugify(value) || "sin-titulo";
  let slug = baseSlug;
  let suffix = 2;

  while (items.some((item) => item.slug === slug && item.id !== currentId)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function ensureUniqueId(items: Array<{ id: string }>, value: string) {
  const baseId = slugify(value) || "item";
  let id = baseId;
  let suffix = 2;

  while (items.some((item) => item.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getRequiredString(formData: FormData, key: string, message: string) {
  const value = getFormString(formData, key);

  if (!value) {
    throw new Error(message);
  }

  return value;
}

function optionalString(formData: FormData, key: string) {
  return getFormString(formData, key) || null;
}

function normalizeMuseumImageSrc(src: string) {
  const trimmedSrc = src.trim();

  if (!trimmedSrc || trimmedSrc.startsWith(LEGACY_MUSEUM_IMAGE_PREFIX)) {
    return "";
  }

  return trimmedSrc;
}

function getFormNumber(formData: FormData, key: string) {
  const value = getFormString(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function getMuseumCoordinatesOrRedirect(formData: FormData, id?: string) {
  const latValue = getFormString(formData, "lat");
  const lngValue = getFormString(formData, "lng");

  if (!latValue && !lngValue) {
    return { lat: null, lng: null };
  }

  if (!latValue || !lngValue) {
    redirectAdmin(
      "museos",
      id,
      undefined,
      "Para ubicar el museo en el mapa cargá latitud y longitud.",
    );
  }

  const lat = parseCoordinateOrRedirect(latValue, -90, 90, "Latitud", id);
  const lng = parseCoordinateOrRedirect(lngValue, -180, 180, "Longitud", id);

  return { lat, lng };
}

function parseCoordinateOrRedirect(
  value: string,
  min: number,
  max: number,
  label: string,
  id?: string,
) {
  const normalizedValue = value.replace(/\s/g, "").replace(",", ".");
  const numberValue = Number(normalizedValue);

  if (!Number.isFinite(numberValue)) {
    redirectAdmin(
      "museos",
      id,
      undefined,
      `${label} debe ser un número válido. Podés usar punto o coma decimal.`,
    );
  }

  if (numberValue < min || numberValue > max) {
    redirectAdmin(
      "museos",
      id,
      undefined,
      `${label} debe estar entre ${min} y ${max}.`,
    );
  }

  return numberValue;
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildLifeDates(birthYear: number | null, deathYear: number | null) {
  if (birthYear && deathYear) {
    return `${birthYear}-${deathYear}`;
  }

  if (birthYear) {
    return `${birthYear}-`;
  }

  if (deathYear) {
    return `-${deathYear}`;
  }

  return null;
}

function hashAdminPassword(password?: string) {
  return createHash("sha256").update(password ?? "").digest("hex");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar.";
}

function redirectAdmin(
  section: AdminSection,
  id?: string,
  notice?: string,
  error?: string,
): never {
  const params = new URLSearchParams({ section });

  if (id) {
    params.set("id", id);
  }

  if (notice) {
    params.set("notice", notice);
  }

  if (error) {
    params.set("error", error);
  }

  redirect(`/admin?${params.toString()}`);
}
