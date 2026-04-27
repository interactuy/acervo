create table if not exists public.acervo_content (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_acervo_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_acervo_content_updated_at on public.acervo_content;

create trigger set_acervo_content_updated_at
before update on public.acervo_content
for each row
execute function public.set_acervo_updated_at();

alter table public.acervo_content enable row level security;

drop policy if exists "Public read acervo content" on public.acervo_content;

create policy "Public read acervo content"
on public.acervo_content
for select
to anon, authenticated
using (true);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'acervo-media',
  'acervo-media',
  true,
  10485760,
  array[
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read acervo media" on storage.objects;

create policy "Public read acervo media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'acervo-media');
