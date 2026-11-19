-- Politiques RLS pour l'interface de validation (accès avec clé anon, sans connexion).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller ce fichier > Run.
-- Cela permet à la page validation-web (et à GitHub Pages) de lire et mettre à jour les validations.

-- Supprimer d'éventuelles politiques existantes (à ignorer si première exécution)
DROP POLICY IF EXISTS "anon_select_observations" ON public.observations;
DROP POLICY IF EXISTS "anon_select_observation_sites" ON public.observation_sites;
DROP POLICY IF EXISTS "anon_update_observations" ON public.observations;
DROP POLICY IF EXISTS "anon_update_observation_sites" ON public.observation_sites;

-- Lecture : le rôle anon peut SELECT sur toutes les lignes
CREATE POLICY "anon_select_observations"
  ON public.observations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_select_observation_sites"
  ON public.observation_sites
  FOR SELECT
  TO anon
  USING (true);

-- Mise à jour : le rôle anon peut UPDATE (pour le bouton Valider)
CREATE POLICY "anon_update_observations"
  ON public.observations
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_update_observation_sites"
  ON public.observation_sites
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Suppression depuis la page de validation (clé anon)
DROP POLICY IF EXISTS "anon_delete_observations" ON public.observations;
DROP POLICY IF EXISTS "anon_delete_observation_sites" ON public.observation_sites;

CREATE POLICY "anon_delete_observations"
  ON public.observations
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "anon_delete_observation_sites"
  ON public.observation_sites
  FOR DELETE
  TO anon
  USING (true);
