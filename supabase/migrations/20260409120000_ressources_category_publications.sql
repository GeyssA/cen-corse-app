-- Renomme la catégorie « Eau » → « Publications » (articles / travaux scientifiques)

update public.ressources_numeriques
set category = 'Publications'
where category = 'Eau';

alter table public.ressources_numeriques drop constraint if exists ressources_numeriques_category_check;

alter table public.ressources_numeriques
  add constraint ressources_numeriques_category_check
  check (
    category in (
      'Fascicule CEN',
      'Herpétologie',
      'Oiseaux',
      'Publications',
      'Flore'
    )
  );
