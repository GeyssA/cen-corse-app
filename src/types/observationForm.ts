/** Données du formulaire d’observation (modal) — partagé pour éviter les dépendances circulaires. */
export interface ObservationForm {
  date: string
  protocole: string
  passage: string
  site: string
  presence: boolean
  groupe: string
  nom_espece: string
  effectif: string
  stade: string
  sexe: string
  remarques: string
}

export type ObservationFormKey = keyof ObservationForm
