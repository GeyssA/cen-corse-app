-- Ressources numériques : bucket Storage + format gallery recto/verso
--
-- gallery_paths (jsonb) — deux formes possibles (cumulables dans le même tableau) :
--   • Chaîne = une page pleine (carousel).
--   • Objet { "recto": "chemin/relatif.png", "verso": "chemin/2.png" } = une ressource à deux volets affichés ensemble.
-- Chemins relatifs au bucket `app-static` (sans / initial), ou URL absolue https://…

comment on column public.ressources_numeriques.gallery_paths is
  'jsonb: [ "f.png" | {"recto":"a.png","verso":"b.png"}, ... ]';

-- Bucket public pour les fichiers statiques de l’app (PNG, PDF, etc.)
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-static', 'app-static', true, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Lecture publique des objets (anon + authentifié)
drop policy if exists "app_static_select_anon" on storage.objects;
create policy "app_static_select_anon"
  on storage.objects for select to anon using (bucket_id = 'app-static');

drop policy if exists "app_static_select_authenticated" on storage.objects;
create policy "app_static_select_authenticated"
  on storage.objects for select to authenticated using (bucket_id = 'app-static');

-- Données : regrouper recto/verso là où les noms de fichiers l’indiquent
update public.ressources_numeriques
set gallery_paths = jsonb_build_array(
  jsonb_build_object(
    'recto', 'Nos fascicules/PAGE 1_recto_GP_AC.png',
    'verso', 'Nos fascicules/PAGE 2_verso_GP_AC.png'
  )
)
where title like '%Buglosse crépue%';

update public.ressources_numeriques
set gallery_paths = jsonb_build_array(
  jsonb_build_object(
    'recto', 'Nos fascicules/PAGE 1_LIMONIUM.png',
    'verso', 'Nos fascicules/PAGE 2_LIMONIUM.png'
  )
)
where title like '%Statices de Corse%';

update public.ressources_numeriques
set gallery_paths = jsonb_build_array(
  jsonb_build_object(
    'recto', 'Nos fascicules/PAGE1-SILENE-VELOUTE (1).png',
    'verso', 'Nos fascicules/PAGE2-SILENE-VELOUTE (2).png'
  )
)
where title like '%Silène velouté%';
