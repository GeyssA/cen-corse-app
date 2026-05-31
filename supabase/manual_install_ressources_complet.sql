-- =============================================================================
-- INSTALLATION MANUELLE — à coller dans Supabase : SQL Editor → New query → Run
-- Corrige : "relation public.ressources_numeriques does not exist"
-- Exécutez UNE FOIS par projet (ou ré-exécutez seulement les blocs qui manquent).
-- =============================================================================

-- ─── 1) TABLE + RLS + lecture publique des lignes publiées ───────────────────

create table if not exists public.ressources_numeriques (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null
    check (category in ('Fascicule CEN', 'Herpétologie', 'Oiseaux', 'Publications', 'Flore')),
  cover_image_path text,
  gallery_paths jsonb not null default '[]'::jsonb,
  pdf_path text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ressources_numeriques_category_published_idx
  on public.ressources_numeriques (category, published, sort_order);

alter table public.ressources_numeriques enable row level security;

drop policy if exists "ressources_numeriques_select_published" on public.ressources_numeriques;
create policy "ressources_numeriques_select_published"
  on public.ressources_numeriques
  for select
  to anon, authenticated
  using (published = true);

comment on column public.ressources_numeriques.gallery_paths is
  'jsonb: chemins dans le bucket app-static, ex: ["dossier/f.png"] ou [{"recto":"a.png","verso":"b.png"}]';

-- ─── 2) Bucket Storage + lecture publique des fichiers ────────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values ('app-static', 'app-static', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "app_static_select_anon" on storage.objects;
create policy "app_static_select_anon"
  on storage.objects for select to anon using (bucket_id = 'app-static');

drop policy if exists "app_static_select_authenticated" on storage.objects;
create policy "app_static_select_authenticated"
  on storage.objects for select to authenticated using (bucket_id = 'app-static');

-- ─── 3) Données d’exemple (commentez tout le bloc si vous avez déjà des lignes) ─

insert into public.ressources_numeriques
  (title, description, category, cover_image_path, gallery_paths, pdf_path, sort_order, published)
values

  (
    'La Buglosse crépue (Anchusa crispa) - Espèce de la flore insulaire corse',
    'Découvrez cette espèce endémique de la flore corse : description, habitat, menaces et bons gestes pour sa préservation.',
    'Flore',
    'Nos fascicules/Anchusa_crispa_fleur.jpg',
    '[{"recto":"Nos fascicules/PAGE 1_recto_GP_AC.png","verso":"Nos fascicules/PAGE 2_verso_GP_AC.png"}]'::jsonb,
    null,
    20,
    true
  ),
  (
    'Les Statices de Corse (Limonium sp.) - Espèces menacées de la flore insulaire',
    'Découvrez ces espèces menacées de la flore insulaire corse qui font l''objet d''un Plan National d''Action (PNA) : description, habitat, menaces et actions de conservation.',
    'Flore',
    'Nos fascicules/photo_limonium.jpg',
    '[{"recto":"Nos fascicules/PAGE 1_LIMONIUM.png","verso":"Nos fascicules/PAGE 2_LIMONIUM.png"}]'::jsonb,
    null,
    30,
    true
  ),
  (
    'Le Silène velouté (Silene velutina) - Espèce de la flore insulaire corse',
    'Découvrez cette espèce endémique de la flore corse : description, habitat, menaces et bons gestes pour sa préservation.',
    'Flore',
    'Nos fascicules/SILENE VELOUTE.jpg',
    '[{"recto":"Nos fascicules/PAGE1-SILENE-VELOUTE (1).png","verso":"Nos fascicules/PAGE2-SILENE-VELOUTE (2).png"}]'::jsonb,
    null,
    40,
    true
  ),
  (
    'RAPPORT D''ACTIVITÉ 2024',
    'Découvrez les activités et réalisations du CEN Corse en 2024 : projets, études, actions de conservation et perspectives d''avenir.',
    'Fascicule CEN',
    null,
    '[]'::jsonb,
    'Rapport d''activité 2024_compressed.pdf',
    50,
    true
  );

-- Si erreur « duplicate key » ou doublons : la table existait déjà avec ces lignes — ignorez ou supprimez les INSERT ci-dessus.

-- =============================================================================
-- EXEMPLE : ajouter VOTRE propre fiche Flore (décommentez et adaptez les chemins)
-- Le chemin doit être EXACTEMENT celui dans le bucket app-static (ex. Nos fascicules/ma_photo.png)
-- =============================================================================
--
-- insert into public.ressources_numeriques
--   (title, description, category, cover_image_path, gallery_paths, sort_order, published)
-- values (
--   'Titre affiché dans l’app',
--   'Courte description.',
--   'Flore',
--   'Nos fascicules/ma_photo.png',
--   '["Nos fascicules/ma_photo.png"]'::jsonb,
--   100,
--   true
-- );
