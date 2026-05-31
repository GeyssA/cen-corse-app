-- Supports numériques (onglet Ressources > Supports)
-- 1. Créer un bucket Storage public (ex. app-static) et y uploader les fichiers.
-- 2. Optionnel : NEXT_PUBLIC_APP_STATIC_MEDIA_BASE_URL = .../storage/v1/object/public/app-static
-- 3. Les chemins ci-dessous sont relatifs à la racine du bucket (sans / initial).

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

-- Lecture publique des supports publiés (app authentifiée ou anonyme pour consultation)
create policy "ressources_numeriques_select_published"
  on public.ressources_numeriques
  for select
  to anon, authenticated
  using (published = true);

-- Pas de policy INSERT/UPDATE/DELETE : gestion des lignes via le tableau Supabase (service role)
-- ou migrations SQL. Évite qu’un compte utilisateur lambda modifie le catalogue.

-- Données initiales (chemins = emplacement dans le bucket app-static, comme dans public/).
-- Ne ré-exécutez pas ce bloc tel quel si la table contient déjà des lignes (doublons) : TRUNCATE d’abord ou commentez les INSERT.
insert into public.ressources_numeriques
  (title, description, category, cover_image_path, gallery_paths, pdf_path, sort_order, published)
values
  (
    'REVUE ESPÈCES : L''origine du Crapaud Vert en Corse',
    'Découvrez l''histoire fascinante du Crapaud Vert (Bufotes viridis balearicus) et son origine en Corse à travers cette article détaillé.',
    'Herpétologie',
    'Nos fascicules/REVUE BVI PAGE 1.png',
    '["Nos fascicules/REVUE BVI PAGE 1.png","Nos fascicules/REVUE BVI PAGE 2.png","Nos fascicules/REVUE BVI PAGE 3.png"]'::jsonb,
    null,
    10,
    true
  ),
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
