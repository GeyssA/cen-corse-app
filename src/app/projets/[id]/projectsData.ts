export interface Project {
  id: number
  title: string
  description: string
  status: string
  progress: number
  members: number
  deadline: string
  startDate: string
  thematic: string
  pole: string
  employees: string[]
  partners: string[]
}

export const defaultProjects: Project[] = [
  {
    id: 1,
    title: 'Analyse du génome humain',
    description: 'Étude des variations génétiques dans la population avec partenaires: CNRS, Université Paris',
    status: 'active',
    progress: 75,
    members: 4,
    deadline: '2024-06-15',
    startDate: '2024-01-15',
    thematic: 'Génétique',
    pole: 'Herpétologie',
    employees: ['Marie Dubois', 'Jean Martin', 'Sophie Chen'],
    partners: ['CNRS', 'Université Paris']
  },
  {
    id: 2,
    title: 'Développement de nouveaux médicaments',
    description: 'Recherche sur les composés anti-cancéreux avec partenaires: INSERM, Sanofi',
    status: 'active',
    progress: 45,
    members: 6,
    deadline: '2024-08-20',
    startDate: '2024-02-01',
    thematic: 'Biochimie',
    pole: 'Ornithologie',
    employees: ['Thomas Leroy', 'Emma Rodriguez', 'Lucas Bernard'],
    partners: ['INSERM', 'Sanofi']
  },
  {
    id: 3,
    title: 'Étude des cellules souches',
    description: 'Différenciation cellulaire et régénération avec partenaires: Institut Pasteur',
    status: 'completed',
    progress: 100,
    members: 3,
    deadline: '2024-03-10',
    startDate: '2023-09-01',
    thematic: 'Biologie Cellulaire',
    pole: 'Mesures compensatoires',
    employees: ['Camille Moreau', 'Alexandre Petit'],
    partners: ['Institut Pasteur']
  },
  {
    id: 4,
    title: 'Protéomique avancée',
    description: 'Analyse des protéines dans les tissus cancéreux avec partenaires: CNRS, Roche',
    status: 'planning',
    progress: 10,
    members: 5,
    deadline: '2024-12-01',
    startDate: '2024-05-01',
    thematic: 'Biologie Moléculaire',
    pole: 'Flore',
    employees: ['Marie Dubois', 'Thomas Leroy', 'Emma Rodriguez'],
    partners: ['CNRS', 'Roche']
  }
]

