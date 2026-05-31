-- Corrige les policies RLS pour permettre à chaque utilisateur
-- de supprimer / modifier uniquement ses propres données.

alter table if exists public.observations enable row level security;
alter table if exists public.observation_sites enable row level security;

-- OBSERVATIONS
drop policy if exists "observations_select_own" on public.observations;
create policy "observations_select_own"
on public.observations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "observations_insert_own" on public.observations;
create policy "observations_insert_own"
on public.observations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "observations_update_own" on public.observations;
create policy "observations_update_own"
on public.observations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "observations_delete_own" on public.observations;
create policy "observations_delete_own"
on public.observations
for delete
to authenticated
using (auth.uid() = user_id);

-- SITES
drop policy if exists "observation_sites_select_own" on public.observation_sites;
create policy "observation_sites_select_own"
on public.observation_sites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "observation_sites_insert_own" on public.observation_sites;
create policy "observation_sites_insert_own"
on public.observation_sites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "observation_sites_update_own" on public.observation_sites;
create policy "observation_sites_update_own"
on public.observation_sites
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "observation_sites_delete_own" on public.observation_sites;
create policy "observation_sites_delete_own"
on public.observation_sites
for delete
to authenticated
using (auth.uid() = user_id);
