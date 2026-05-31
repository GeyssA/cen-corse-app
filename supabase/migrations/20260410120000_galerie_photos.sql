-- Galerie (accueil « photo du jour », onglet Ressources > Galerie, carrousel Présentation)
-- 1. Uploader les images dans le bucket public `app-static` (déjà créé pour les ressources)
-- 2. Les champs `image_path` = chemin relatif, ex. photos_page_accueil/xxx.jpg
-- 3. Variable optionnelle : NEXT_PUBLIC_APP_STATIC_MEDIA_BASE_URL = …/object/public/app-static

create table if not exists public.galerie_photos (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  title text not null,
  location text,
  date_label text,
  author text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists galerie_photos_published_sort_idx
  on public.galerie_photos (published, sort_order, created_at);

comment on table public.galerie_photos is 'Métadonnées des photos galerie ; fichiers binaires dans le bucket app-static (image_path relatif)';

comment on column public.galerie_photos.image_path is 'Relatif à la racine du bucket app-static, ou URL https://...';

comment on column public.galerie_photos.date_label is 'Texte d’exposition (année ou date libre)';

alter table public.galerie_photos enable row level security;

create policy "galerie_photos_select_published"
  on public.galerie_photos
  for select
  to anon, authenticated
  using (published = true);

-- Même règle que ressources_numeriques : pas d’insert/update côté client, gestion en SQL / dashboard (service rôle)

-- Jeu d’exemple (une seule fois, évite doublons si le fichier est relancé manuellement)
insert into public.galerie_photos
  (image_path, title, location, date_label, author, sort_order, published)
select
  s.image_path,
  s.title,
  s.location,
  s.date_label,
  s.author,
  s.sort_order,
  s.published
from (values
  ($g$photos_page_accueil/Plaine de Linguizzetta-2025-© Geyssels A..jpg$g$, 'Plaine de Linguizzetta', 'Plaine de Linguizzetta', '2025', '© Geyssels A.', 1, true::boolean),
  ($g$photos_page_accueil/Col du Monaco-Pianottoli Caldarello-2024-© Geyssels A..jpg$g$, 'Col du Monaco', 'Pianottoli Caldarello', '2024', '© Geyssels A.', 2, true),
  ($g$photos_page_accueil/Bufotes viridis balearicus-Lucciana-2011-© Hamoric N..jpg$g$, 'Bufotes viridis balearicus', 'Lucciana', '2011', '© Hamoric N.', 3, true),
  ($g$photos_page_accueil/Bufotes viridis balericus-Boziu (1100 mètres d'altitude)-2025-© Ertzscheid N..jpg$g$, 'Bufotes viridis balearicus', 'Boziu (1100 m)', '2025', '© Ertzscheid N.', 4, true),
  ($g$photos_page_accueil/Amplexus de Bufotes viridis balericus-Boziu (1100 mètres d'altitude)-2025-© Ertzscheid N..jpg$g$, 'Amplexus de Bufotes viridis balearicus', 'Boziu (1100 m)', '2025', '© Ertzscheid N.', 5, true)
) as s(image_path, title, location, date_label, author, sort_order, published)
where (select count(*) from public.galerie_photos) = 0;
