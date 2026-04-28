import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Database,
  Landmark,
  LogOut,
  Palette,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAcervoSeed } from "@/lib/acervo/data";
import type {
  Artist,
  ArtistTimelineItem,
  Artwork,
  Exhibition,
  Museum,
} from "@/types/acervo";
import {
  deleteArtistAction,
  deleteArtworkAction,
  deleteExhibitionAction,
  deleteMuseumAction,
  getAdminAuthState,
  loginAdminAction,
  logoutAdminAction,
  upsertArtistAction,
  upsertArtworkAction,
  upsertExhibitionAction,
  upsertMuseumAction,
} from "@/modules/admin/admin-actions";

type AdminSection = "museos" | "artistas" | "obras" | "exposiciones";

type AdminPageProps = {
  section: AdminSection;
  id?: string;
  notice?: string;
  error?: string;
};

const sections = [
  { id: "museos", label: "Museos", icon: Landmark },
  { id: "artistas", label: "Artistas", icon: Users },
  { id: "obras", label: "Obras", icon: Palette },
  { id: "exposiciones", label: "Exposiciones", icon: CalendarDays },
] satisfies Array<{ id: AdminSection; label: string; icon: typeof Landmark }>;

const fieldClass =
  "h-10 rounded-md border-[#d7dee8] bg-white text-sm shadow-none focus-visible:border-[#3E679F]/60 focus-visible:ring-[#3E679F]/15";
const textareaClass =
  "min-h-28 w-full rounded-md border border-[#d7dee8] bg-white px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-[#3E679F]/60 focus-visible:ring-[3px] focus-visible:ring-[#3E679F]/15";
const labelClass =
  "grid gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[#5f6b7a]";

export async function AdminPage({
  section,
  id,
  notice,
  error,
}: AdminPageProps) {
  const authState = await getAdminAuthState();

  if (!authState.isAllowed) {
    return <AdminLogin error={error} isProduction={authState.isProduction} />;
  }

  const seed = await getAcervoSeed();
  const currentSection =
    sections.find((item) => item.id === section) ?? sections[0];
  const CurrentSectionIcon = currentSection.icon;

  return (
    <div className="min-h-dvh bg-[#f6f8fb] text-[#172033]">
      <div className="grid min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="border-b border-[#e5e9f0] bg-white lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="border-b border-[#edf0f4] px-4 py-4">
              <Link
                href="/admin"
                className="flex items-center gap-3 text-sm font-semibold text-[#111827]"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-[#3E679F] text-white">
                  <Database className="size-4" aria-hidden="true" />
                </span>
                Acervo Admin
              </Link>
            </div>

            <nav
              className="flex gap-1 overflow-x-auto p-2 lg:grid lg:overflow-visible"
              aria-label="Secciones de administracion"
            >
              {sections.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;

                return (
                  <Link
                    key={item.id}
                    href={`/admin?section=${item.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#EAF2FA] text-[#2F5F96]"
                        : "text-[#5f6b7a] hover:bg-[#f7f9fc] hover:text-[#172033]"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto hidden border-t border-[#edf0f4] p-4 text-xs leading-5 text-[#6b7280] lg:block">
              <p className="font-medium text-[#172033]">Contenido</p>
              <p>Supabase + Storage</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#e5e9f0] bg-white/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f1f5f9] text-[#475569]">
                  <CurrentSectionIcon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                    Panel
                  </p>
                  <h1 className="truncate text-2xl font-semibold tracking-[-0.01em] text-[#0f172a]">
                    Gestión del acervo
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!authState.hasPassword && (
                  <span className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#64748b]">
                    Acceso sin contraseña
                  </span>
                )}
                {authState.hasPassword && (
                  <form action={logoutAdminAction}>
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-9 rounded-md border-[#d7dee8] bg-white text-[#172033]"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Salir
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 lg:px-8">
            {(notice || error) && (
              <div className="mb-5 grid gap-2">
                {notice && (
                  <p className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm font-medium text-[#1d4ed8]">
                    {notice}
                  </p>
                )}
                {error && (
                  <p className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={Landmark}
                label="Museos"
                value={seed.museums.length}
              />
              <SummaryCard
                icon={Users}
                label="Artistas"
                value={seed.artists.length}
              />
              <SummaryCard
                icon={Palette}
                label="Obras"
                value={seed.artworks.length}
              />
              <SummaryCard
                icon={CalendarDays}
                label="Exposiciones"
                value={seed.exhibitions.length}
              />
            </section>

            <div className="mt-5">
              {section === "museos" && (
                <MuseumsAdmin museums={seed.museums} selectedId={id} />
              )}
              {section === "artistas" && (
                <ArtistsAdmin
                  artists={seed.artists}
                  artworks={seed.artworks}
                  selectedId={id}
                />
              )}
              {section === "obras" && (
                <ArtworksAdmin
                  artworks={seed.artworks}
                  artists={seed.artists}
                  museums={seed.museums}
                  selectedId={id}
                />
              )}
              {section === "exposiciones" && (
                <ExhibitionsAdmin
                  exhibitions={seed.exhibitions}
                  artworks={seed.artworks}
                  museums={seed.museums}
                  selectedId={id}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminLogin({
  error,
  isProduction,
}: {
  error?: string;
  isProduction: boolean;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f6f8fb] px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-[#dde3ea] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <span className="flex size-10 items-center justify-center rounded-md bg-[#3E679F] text-white">
          <Database className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#0f172a]">
          Acceso interno
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">
          {isProduction
            ? "Definí una contraseña de administración para habilitar el panel."
            : "Ingresá la contraseña configurada para administrar el acervo."}
        </p>
        {error && (
          <p className="mt-5 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <form action={loginAdminAction} className="mt-6 grid gap-4">
          <label className={labelClass}>
            Contraseña
            <Input
              name="password"
              type="password"
              className={fieldClass}
              autoComplete="current-password"
              required
            />
          </label>
          <Button type="submit" className="h-10 rounded-md bg-[#3E679F] hover:bg-[#315782]">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}

function MuseumsAdmin({
  museums,
  selectedId,
}: {
  museums: Museum[];
  selectedId?: string;
}) {
  const museum = getSelectedItem(museums, selectedId);
  const isCreating = selectedId === "new";

  return (
    <AdminEditorLayout
      title="Museos"
      newHref="/admin?section=museos&id=new"
      selectedId={selectedId}
      list={museums.map((item) => ({
        id: item.id,
        href: `/admin?section=museos&id=${item.id}`,
        title: item.name,
        subtitle: [item.neighborhood, item.city].filter(Boolean).join(" · "),
      }))}
    >
      {isCreating || museum ? (
        <MuseumForm key={museum?.id ?? "new"} museum={museum} />
      ) : (
        <AdminEmptyState
          title="Seleccioná un museo"
          description="Elegí un registro de la lista o creá uno nuevo."
        />
      )}
    </AdminEditorLayout>
  );
}

function ArtistsAdmin({
  artists,
  artworks,
  selectedId,
}: {
  artists: Artist[];
  artworks: Artwork[];
  selectedId?: string;
}) {
  const artist = getSelectedItem(artists, selectedId);
  const isCreating = selectedId === "new";

  return (
    <AdminEditorLayout
      title="Artistas"
      newHref="/admin?section=artistas&id=new"
      selectedId={selectedId}
      list={artists.map((item) => ({
        id: item.id,
        href: `/admin?section=artistas&id=${item.id}`,
        title: item.name,
        subtitle: [item.lifeDates, item.nationality].filter(Boolean).join(" · "),
      }))}
    >
      {isCreating || artist ? (
        <ArtistForm
          key={artist?.id ?? "new"}
          artist={artist}
          artists={artists}
          artworks={artworks}
        />
      ) : (
        <AdminEmptyState
          title="Seleccioná un artista"
          description="Elegí un registro de la lista o creá uno nuevo."
        />
      )}
    </AdminEditorLayout>
  );
}

function ArtworksAdmin({
  artworks,
  artists,
  museums,
  selectedId,
}: {
  artworks: Artwork[];
  artists: Artist[];
  museums: Museum[];
  selectedId?: string;
}) {
  const artwork = getSelectedItem(artworks, selectedId);
  const isCreating = selectedId === "new";
  const artistsById = new Map(artists.map((artist) => [artist.id, artist]));

  return (
    <AdminEditorLayout
      title="Obras"
      newHref="/admin?section=obras&id=new"
      selectedId={selectedId}
      list={artworks.map((item) => ({
        id: item.id,
        href: `/admin?section=obras&id=${item.id}`,
        title: item.title,
        subtitle: [
          `Inv. ${item.inventoryNumber}`,
          artistsById.get(item.artistId)?.name,
        ]
          .filter(Boolean)
          .join(" · "),
      }))}
    >
      {isCreating || artwork ? (
        <ArtworkForm
          key={artwork?.id ?? "new"}
          artwork={artwork}
          artists={artists}
          museums={museums}
        />
      ) : (
        <AdminEmptyState
          title="Seleccioná una obra"
          description="Elegí un registro de la lista o creá uno nuevo."
        />
      )}
    </AdminEditorLayout>
  );
}

function ExhibitionsAdmin({
  exhibitions,
  artworks,
  museums,
  selectedId,
}: {
  exhibitions: Exhibition[];
  artworks: Artwork[];
  museums: Museum[];
  selectedId?: string;
}) {
  const exhibition = getSelectedItem(exhibitions, selectedId);
  const isCreating = selectedId === "new";

  return (
    <AdminEditorLayout
      title="Exposiciones"
      newHref="/admin?section=exposiciones&id=new"
      selectedId={selectedId}
      list={exhibitions.map((item) => ({
        id: item.id,
        href: `/admin?section=exposiciones&id=${item.id}`,
        title: item.title,
        subtitle: `${item.artworkIds.length} obras vinculadas`,
      }))}
    >
      {isCreating || exhibition ? (
        <ExhibitionForm
          key={exhibition?.id ?? "new"}
          exhibition={exhibition}
          artworks={artworks}
          museums={museums}
        />
      ) : (
        <AdminEmptyState
          title="Seleccioná una exposición"
          description="Elegí un registro de la lista o creá uno nuevo."
        />
      )}
    </AdminEditorLayout>
  );
}

function AdminEditorLayout({
  title,
  newHref,
  selectedId,
  list,
  children,
}: {
  title: string;
  newHref: string;
  selectedId?: string;
  list: Array<{ id: string; href: string; title: string; subtitle: string }>;
  children: ReactNode;
}) {
  return (
    <section className="grid overflow-hidden rounded-lg border border-[#dde3ea] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:min-h-[44rem] lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="border-b border-[#e5e9f0] bg-[#f8fafc] lg:border-b-0 lg:border-r">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#e5e9f0] bg-white px-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">{list.length} registros</p>
          </div>
          <Link
            href={newHref}
            className="inline-flex size-8 items-center justify-center rounded-md bg-[#3E679F] text-white transition hover:bg-[#315782]"
            aria-label={`Crear ${title.toLowerCase()}`}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="max-h-[26rem] overflow-y-auto lg:max-h-[calc(100svh-22rem)]">
          {list.map((item) => {
            const isActive = item.id === selectedId;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`block border-b border-[#edf0f4] px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-white shadow-[inset_3px_0_0_#3E679F]"
                    : "hover:bg-white"
                }`}
              >
                <span className="block truncate font-medium leading-5 text-[#172033]">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="mt-1 block truncate text-xs leading-5 text-[#64748b]">
                    {item.subtitle}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0 bg-white p-4 sm:p-5 lg:max-h-[calc(100svh-17rem)] lg:overflow-y-auto">
        {children}
      </div>
    </section>
  );
}

function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-[24rem] place-items-center rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto flex size-10 items-center justify-center rounded-md bg-[#EAF2FA] text-[#3E679F]">
          <Plus className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[#0f172a]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
      </div>
    </div>
  );
}

function MuseumForm({ museum }: { museum: Museum | null }) {
  return (
    <div>
      <FormHeading
        title={museum ? "Editar museo" : "Nuevo museo"}
        description="Las coordenadas lat/lng ubican el pin; la foto debe ser del edificio o espacio físico del museo."
      />
      <form
        action={upsertMuseumAction}
        className="mt-5 grid gap-5"
      >
        <HiddenId id={museum?.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="name" label="Nombre" defaultValue={museum?.name} required />
          <TextField name="slug" label="Slug" defaultValue={museum?.slug} />
          <TextField name="acronym" label="Sigla" defaultValue={museum?.acronym} />
          <TextField name="type" label="Tipo" defaultValue={museum?.type ?? "Museo"} />
          <TextField name="address" label="Dirección" defaultValue={museum?.address} />
          <TextField
            name="neighborhood"
            label="Barrio"
            defaultValue={museum?.neighborhood}
          />
          <TextField name="city" label="Ciudad" defaultValue={museum?.city ?? "Montevideo"} />
          <TextField name="country" label="País" defaultValue={museum?.country ?? "Uruguay"} />
          <TextField
            name="lat"
            label="Latitud"
            inputMode="decimal"
            defaultValue={museum?.coordinates.lat}
            placeholder="-34.9132"
          />
          <TextField
            name="lng"
            label="Longitud"
            inputMode="decimal"
            defaultValue={museum?.coordinates.lng}
            placeholder="-56.159"
          />
          <TextField name="website" label="Web" defaultValue={museum?.website} />
          <TextField name="sourceUrl" label="Fuente" defaultValue={museum?.sourceUrl} />
        </div>
        <TextAreaField name="summary" label="Resumen" defaultValue={museum?.summary} />
        <TextAreaField
          name="description"
          label="Descripción"
          defaultValue={museum?.description}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            name="openingHoursLabel"
            label="Horario"
            defaultValue={museum?.openingHours?.label}
          />
          <TextField
            name="openingHoursNotes"
            label="Notas de horario"
            defaultValue={museum?.openingHours?.notes}
          />
          <TextField
            name="contactEmail"
            label="Email de contacto"
            defaultValue={museum?.contactEmail}
          />
          <TextField
            name="contactPhone"
            label="Teléfono de contacto"
            defaultValue={museum?.contactPhone}
          />
          <TextField
            name="ticketInfo"
            label="Entradas"
            defaultValue={museum?.ticketInfo}
          />
          <TextField
            name="howToGetThere"
            label="Cómo llegar"
            defaultValue={museum?.howToGetThere}
          />
          <TextField
            name="collectionSourceUrl"
            label="Fuente colección"
            defaultValue={museum?.collectionSourceUrl}
          />
          <TextField
            name="imageSrc"
            label="URL de foto del museo"
            defaultValue={getMuseumImageFieldValue(museum)}
            placeholder="URL pública de la foto"
          />
          <FileField name="imageFile" label="Subir foto del museo" />
          <TextField
            name="imageAlt"
            label="Alt de la foto"
            defaultValue={museum?.image.alt}
          />
          <TextField
            name="instagram"
            label="Instagram"
            defaultValue={museum?.social?.instagram}
          />
          <TextField
            name="facebook"
            label="Facebook"
            defaultValue={museum?.social?.facebook}
          />
          <TextField name="x" label="X" defaultValue={museum?.social?.x} />
          <TextField
            name="youtube"
            label="YouTube"
            defaultValue={museum?.social?.youtube}
          />
        </div>
        <TextAreaField
          name="accessibility"
          label="Accesibilidad"
          defaultValue={museum?.accessibility}
          placeholder="Rampa, ascensor, baños accesibles, asistencia, restricciones o información a confirmar."
        />
        <FormActions />
      </form>
      {museum && (
        <DeleteForm
          id={museum.id}
          action={deleteMuseumAction}
          label="Eliminar museo"
          warning="Solo se elimina si no tiene obras vinculadas."
        />
      )}
    </div>
  );
}

function ArtistForm({
  artist,
  artists,
  artworks,
}: {
  artist: Artist | null;
  artists: Artist[];
  artworks: Artwork[];
}) {
  const artistArtworks = artist
    ? artworks.filter((artwork) => artwork.artistId === artist.id)
    : artworks;
  const relatedArtists = artists.filter((item) => item.id !== artist?.id);

  return (
    <div>
      <FormHeading
        title={artist ? "Editar artista" : "Nuevo artista"}
        description="La ficha combina datos biográficos, lectura didáctica, timeline y relaciones editoriales."
      />
      <form
        action={upsertArtistAction}
        className="mt-5 grid gap-5"
      >
        <HiddenId id={artist?.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="name" label="Nombre" defaultValue={artist?.name} required />
          <TextField name="slug" label="Slug" defaultValue={artist?.slug} />
          <TextField
            name="birthYear"
            label="Nacimiento"
            type="number"
            defaultValue={artist?.birthYear}
          />
          <TextField
            name="birthPlace"
            label="Lugar de nacimiento"
            defaultValue={artist?.birthPlace}
          />
          <TextField
            name="deathYear"
            label="Fallecimiento"
            type="number"
            defaultValue={artist?.deathYear}
          />
          <TextField
            name="deathPlace"
            label="Lugar de fallecimiento"
            defaultValue={artist?.deathPlace}
          />
          <TextField name="lifeDates" label="Fechas" defaultValue={artist?.lifeDates} />
          <TextField
            name="nationality"
            label="Nacionalidad"
            defaultValue={artist?.nationality}
          />
          <TextField
            name="movement"
            label="Movimiento"
            defaultValue={artist?.movement}
          />
          <TextField
            name="portraitSrc"
            label="Foto de perfil"
            defaultValue={artist?.portrait?.src}
            placeholder="URL pública o ruta del retrato"
          />
          <FileField name="portraitFile" label="Subir retrato" />
          <TextField
            name="portraitAlt"
            label="Alt del retrato"
            defaultValue={artist?.portrait?.alt}
          />
          <SelectField
            name="heroArtworkId"
            label="Obra hero"
            defaultValue={artist?.heroArtworkId}
            includeEmptyOption
            required={false}
            emptyLabel="Sin obra destacada seleccionada"
            options={artistArtworks.map((artwork) => ({
              value: artwork.id,
              label: `${artwork.title} (${artwork.inventoryNumber})`,
            }))}
          />
          <TextField
            name="sourceUrl"
            label="Fuente"
            defaultValue={artist?.sourceUrl}
          />
          <TextField
            name="collectionSourceUrl"
            label="Fuente colección"
            defaultValue={artist?.collectionSourceUrl}
          />
        </div>
        <CheckboxField
          name="isPublished"
          label="Publicado"
          description="Si se desactiva, la ficha no aparece en el sitio público."
          defaultChecked={artist?.isPublished !== false}
        />
        <TextAreaField
          name="summary"
          label="Resumen"
          defaultValue={artist?.summary}
          placeholder="Una síntesis breve para el hero y las vistas de búsqueda."
        />
        <TextAreaField
          name="description"
          label="Descripción"
          defaultValue={artist?.description ?? artist?.biography}
          placeholder="Biografía y lectura general del recorrido del artista."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            name="techniques"
            label="Técnicas"
            defaultValue={joinList(artist?.techniques)}
            placeholder={"Óleo\nDibujo\nGrabado"}
          />
          <TextAreaField
            name="themes"
            label="Temas"
            defaultValue={joinList(artist?.themes)}
            placeholder={"Paisaje\nRetrato\nEscena histórica"}
          />
          <TextAreaField
            name="influences"
            label="Influencias"
            defaultValue={joinList(artist?.influences)}
            placeholder="Artistas, escuelas, viajes o tradiciones."
          />
          <TextAreaField
            name="keyPeriods"
            label="Períodos clave"
            defaultValue={joinList(artist?.keyPeriods)}
            placeholder={"Formación\nEtapa europea\nMadurez"}
          />
        </div>
        <TextAreaField
          name="timeline"
          label="Línea de tiempo"
          defaultValue={formatTimeline(artist?.timeline)}
          placeholder={"Año | Hito | Descripción breve\n1911 | Premio | Obtiene una distinción"}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            name="featuredArtworkIds"
            label={`Obras destacadas (${artistArtworks.length} disponibles)`}
            defaultValue={joinList(artist?.featuredArtworkIds)}
            placeholder={artistArtworks
              .slice(0, 3)
              .map((artwork) => artwork.id)
              .join("\n")}
          />
          <TextAreaField
            name="relatedArtistIds"
            label={`Artistas relacionados (${relatedArtists.length} disponibles)`}
            defaultValue={joinList(artist?.relatedArtistIds)}
            placeholder={relatedArtists
              .slice(0, 3)
              .map((item) => item.id)
              .join("\n")}
          />
        </div>
        <FormActions />
      </form>
      {artist && (
        <DeleteForm
          id={artist.id}
          action={deleteArtistAction}
          label="Eliminar artista"
          warning="Solo se elimina si no tiene obras vinculadas."
        />
      )}
    </div>
  );
}

function ArtworkForm({
  artwork,
  artists,
  museums,
}: {
  artwork: Artwork | null;
  artists: Artist[];
  museums: Museum[];
}) {
  return (
    <div>
      <FormHeading
        title={artwork ? "Editar obra" : "Nueva obra"}
        description="Las relaciones artista/museo actualizan fichas, listados y búsquedas."
      />
      <form
        action={upsertArtworkAction}
        className="mt-5 grid gap-5"
      >
        <HiddenId id={artwork?.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="title" label="Título" defaultValue={artwork?.title} required />
          <TextField name="slug" label="Slug" defaultValue={artwork?.slug} />
          <TextField
            name="inventoryNumber"
            label="Inventario"
            defaultValue={artwork?.inventoryNumber}
            required
          />
          <SelectField
            name="artistId"
            label="Artista"
            defaultValue={artwork?.artistId}
            options={artists.map((artist) => ({
              value: artist.id,
              label: artist.name,
            }))}
          />
          <SelectField
            name="museumId"
            label="Museo"
            defaultValue={artwork?.museumId}
            options={museums.map((museum) => ({
              value: museum.id,
              label: museum.name,
            }))}
          />
          <TextField
            name="year"
            label="Año"
            defaultValue={artwork?.yearLabel ?? artwork?.year}
          />
          <TextField name="technique" label="Técnica" defaultValue={artwork?.technique} />
          <TextField name="dimensions" label="Medidas" defaultValue={artwork?.dimensions} />
          <TextField
            name="location"
            label="Ubicación"
            defaultValue={artwork?.locationNote ?? artwork?.location}
          />
          <TextField
            name="exhibitionStatus"
            label="Exhibición"
            defaultValue={artwork?.exhibitionStatus}
          />
          <TextField name="sourceUrl" label="Fuente" defaultValue={artwork?.sourceUrl} />
          <TextField
            name="imageUrl"
            label="Imagen de obra"
            defaultValue={artwork?.imageSrc ?? artwork?.imageUrl}
          />
          <FileField name="imageFile" label="Subir imagen de obra" />
        </div>
        <FormActions />
      </form>
      {artwork && (
        <DeleteForm
          id={artwork.id}
          action={deleteArtworkAction}
          label="Eliminar obra"
          warning="Tambien se quita de exposiciones vinculadas."
        />
      )}
    </div>
  );
}

function ExhibitionForm({
  exhibition,
  artworks,
  museums,
}: {
  exhibition: Exhibition | null;
  artworks: Artwork[];
  museums: Museum[];
}) {
  return (
    <div>
      <FormHeading
        title={exhibition ? "Editar exposición" : "Nueva exposición"}
        description="Usa IDs de obra separados por coma o por línea para vincular obras."
      />
      <form action={upsertExhibitionAction} className="mt-5 grid gap-5">
        <HiddenId id={exhibition?.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="title" label="Título" defaultValue={exhibition?.title} required />
          <TextField name="slug" label="Slug" defaultValue={exhibition?.slug} />
          <SelectField
            name="museumId"
            label="Museo"
            defaultValue={exhibition?.museumId}
            options={museums.map((museum) => ({
              value: museum.id,
              label: museum.name,
            }))}
          />
          <TextField
            name="startDate"
            label="Fecha inicio"
            defaultValue={exhibition?.startDate}
          />
          <TextField
            name="endDate"
            label="Fecha fin"
            defaultValue={exhibition?.endDate}
          />
          <TextField name="location" label="Ubicación" defaultValue={exhibition?.location} />
          <TextField name="sourceUrl" label="Fuente" defaultValue={exhibition?.sourceUrl} />
        </div>
        <TextAreaField
          name="description"
          label="Descripción"
          defaultValue={exhibition?.description}
        />
        <TextAreaField
          name="artworkIds"
          label={`Obras vinculadas (${artworks.length} disponibles)`}
          defaultValue={exhibition?.artworkIds.join("\n")}
          placeholder="Un ID de obra por línea"
        />
        <FormActions />
      </form>
      {exhibition && (
        <DeleteForm
          id={exhibition.id}
          action={deleteExhibitionAction}
          label="Eliminar exposición"
          warning="No elimina las obras vinculadas."
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Landmark;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg border border-[#dde3ea] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className="flex size-8 items-center justify-center rounded-md bg-[#f1f5f9] text-[#475569]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-4 text-2xl font-semibold leading-none tracking-[-0.02em] text-[#0f172a]">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-[#64748b]">{label}</p>
    </article>
  );
}

function FormHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[#e5e9f0] pb-4">
      <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#0f172a]">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#64748b]">{description}</p>
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  type = "text",
  step,
  inputMode,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  step?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <Input
        name={name}
        type={type}
        step={step}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={fieldClass}
      />
    </label>
  );
}

function TextAreaField({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={textareaClass}
      />
    </label>
  );
}

function FileField({
  name,
  label,
  accept = "image/*",
}: {
  name: string;
  label: string;
  accept?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <Input
        name={name}
        type="file"
        accept={accept}
        className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#3E679F]`}
      />
    </label>
  );
}

function CheckboxField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-[#d7dee8] bg-[#f8fafc] p-4">
      <Input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 size-4 rounded border-[#b8c3d2]"
      />
      <span>
        <span className="block text-sm font-semibold text-[#172033]">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-[#64748b]">
          {description}
        </span>
      </span>
    </label>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
  includeEmptyOption,
  emptyLabel = "Sin seleccionar",
  required = true,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: Array<{ value: string; label: string }>;
  includeEmptyOption?: boolean;
  emptyLabel?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? (includeEmptyOption ? "" : options[0]?.value)}
        className={`${fieldClass} px-3 outline-none focus-visible:ring-[3px]`}
        required={required}
      >
        {includeEmptyOption && <option value="">{emptyLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function HiddenId({ id }: { id?: string }) {
  if (!id) {
    return null;
  }

  return <input type="hidden" name="id" value={id} />;
}

function FormActions() {
  return (
    <div className="flex justify-end border-t border-[#e5e9f0] pt-5">
      <Button type="submit" className="h-10 rounded-md bg-[#3E679F] px-4 hover:bg-[#315782]">
        Guardar cambios
      </Button>
    </div>
  );
}

function DeleteForm({
  id,
  action,
  label,
  warning,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  warning: string;
}) {
  return (
    <form action={action} className="mt-6 border-t border-[#e5e9f0] pt-5">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm leading-6 text-[#64748b]">{warning}</p>
      <Button
        type="submit"
        variant="outline"
        className="mt-3 h-9 rounded-md border-destructive/30 bg-white text-destructive hover:bg-destructive/10"
      >
        {label}
      </Button>
    </form>
  );
}

function getSelectedItem<T extends { id: string }>(
  items: T[],
  selectedId?: string,
) {
  if (!selectedId || selectedId === "new") {
    return null;
  }

  return items.find((item) => item.id === selectedId) ?? null;
}

function getMuseumImageFieldValue(museum: Museum | null) {
  const src = museum?.image.src?.trim() ?? "";

  return src.startsWith("/hero/home-artwork") ? "" : src;
}

function joinList(values?: string[] | null) {
  return values?.join("\n") ?? "";
}

function formatTimeline(timeline?: ArtistTimelineItem[] | null) {
  return (
    timeline
      ?.map((item) =>
        [item.year, item.title, item.description]
          .filter(Boolean)
          .join(" | "),
      )
      .join("\n") ?? ""
  );
}
