'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

interface Employee {
  id: string
  name: string
  position: string
  description: string
  photo: string
  bureau: string
  detailedDescription?: string
  formation?: string
  specialites?: string[]
  missions?: string[]
  email?: string
  phone?: string
}

// Données des employés avec descriptions détaillées
const employeesData: Employee[] = [
  {
    id: "1",
    name: "Arnaud Geyssels",
    position: "Chargé de projet biodiversité",
    description: "Herpétologue et écologue impliqué dans les suivis faunistiques et projets de recherche en herpétologie.",
    photo: "/photos_personnel/Arnaud Geyssels.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en herpétologie et écologie, je participe à l'élaboration et la réalisation des projets de recherche et de conservation des amphibiens et reptiles de Corse au sein de la structure. Je suis également impliqué dans les projets de conservation et de protection d'espèces menacées de la flore insulaire. Je m'intéresse particulièrement à la génétique, aux travaux en écophysiologie, à la science du rewilding, à la modélisation, aux SIG ainsi qu'aux technologies web/IA (dev. React (Cursor), LLMs…). Avec parcimonie, je suis convaincu que certaines innovations numériques et technologiques peuvent servir des projets à forte valeur ajoutée, notamment en biologie de la conservation.",
    formation: "Master en Biologie des organismes et écologie - Université catholique de Louvain-la-Neuve",
    specialites: [
      "Herpétologie (amphibiens et reptiles)",
      "Écologie terrestre",
      "Biostatistiques",
      "Cartographie (SIG)",
    ],
    email: "arnaud.geyssels@cen-corse.org",
    phone: "07 86 83 55 46"
  },
  {
    id: "2",
    name: "Thomas Muller",
    position: "Chargé d'étude herpétologue et animateur EEDD",
    description: "Spécialiste en écologie et conservation, impliqué dans les projets de protection de la biodiversité insulaire.",
    photo: "/photos_personnel/Thomas Muller.jpg",
    bureau: "Borgo",
    detailedDescription: "Passionné par la biodiversité insulaire, je travaille sur la conservation et la protection des espèces endémiques de Corse. Mon expertise couvre l'écologie des écosystèmes méditerranéens, la gestion des espaces naturels et la mise en œuvre de programmes de conservation. Je m'intéresse particulièrement à la flore insulaire, aux habitats naturels et aux interactions entre les espèces. Mon approche combine les connaissances scientifiques traditionnelles avec les nouvelles technologies de suivi et de cartographie pour optimiser les stratégies de conservation.",
    formation: "Master en Écologie et Gestion de la Biodiversité - Université de Montpellier",
    specialites: [
      "Écologie végétale",
      "Conservation des espèces",
      "Gestion d'espaces naturels",
      "Cartographie des habitats",
    ],
    missions: [
      "Suivi et protection des espèces végétales endémiques",
      "Gestion des espaces naturels protégés",
      "Coordination des programmes de conservation",
      "Formation et sensibilisation à la biodiversité"
    ],
    email: "thomas.muller@cen-corse.org",
    phone: "07 88 30 03 46"
  },
  {
    id: "10",
    name: "Ludovic Lepori",
    position: "Chargé de projets Ornithologie",
    description: "Spécialiste en ornithologie, impliqué dans les projets de suivi et de protection des oiseaux de Corse.",
    photo: "/photos_personnel/Ludovic Lepori.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en ornithologie, je coordonne les projets de suivi et de conservation des oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    email: "ludovic.lepori@cen-corse.org",
    phone: "06.73.06.31.71"
  },
  {
    id: "11",
    name: "Marie-Paule Savelli",
    position: "Chargée de projets Faune",
    description: "Spécialiste en faune terrestre et marine, impliquée dans les projets de suivi et de protection des espèces animales.",
    photo: "/photos_personnel/Marie-Paule Savelli.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en faune terrestre et marine, je coordonne les projets de suivi et de conservation des espèces animales de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, les mammifères marins et les espèces endémiques insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Faune terrestre",
      "Faune marine",
      "Suivi des populations",
      "Protection des habitats",
    ],
    email: "mariepaule.savelli@cen-corse.org",
    phone: "06.70.14.00.40"
  },
  {
    id: "12",
    name: "Sarah Ferjani",
    position: "Chargée de projets Gestion de Site",
    description: "Spécialiste en gestion de sites naturels, impliquée dans la gestion et la protection des espaces naturels.",
    photo: "/photos_personnel/Sarah Ferjani.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en gestion de sites naturels, je coordonne les projets de gestion et de protection des espaces naturels de Corse. Mon expertise couvre la planification de la gestion, le suivi écologique, la restauration d'habitats et la coordination des actions de conservation sur le terrain. Je travaille en étroite collaboration avec les gestionnaires de sites, les partenaires locaux et les équipes techniques pour assurer une gestion efficace et durable des espaces naturels.",
    formation: "Master en Gestion des Espaces Naturels - Université de Corse",
    specialites: [
      "Gestion de sites naturels",
      "Planification de la gestion",
      "Suivi écologique",
      "Restauration d'habitats",
    ],
    email: "sarah.ferjani@cen-corse.org",
    phone: "06.73.06.10.39"
  },
  {
    id: "3",
    name: "Audrey Favale",
    position: "Directrice",
    description: "Directrice du CEN Corse, responsable de la gestion globale de l'association et de la coordination des projets.",
    photo: "/photos_personnel/Audrey Favale.jpg",
    bureau: "Borgo",
    detailedDescription: "En tant que Directrice du CEN Corse, je pilote la stratégie globale de l'association et coordonne l'ensemble des actions de conservation et de protection de la biodiversité insulaire. Mon rôle consiste à assurer la cohérence des projets, la gestion des équipes et le développement des partenariats institutionnels. Je m'efforce de maintenir l'excellence scientifique tout en favorisant l'innovation dans nos approches de conservation.",
    formation: "Formation en gestion et direction d'association environnementale",
    specialites: [
      "Direction d'association",
      "Gestion de projet",
      "Partenariats institutionnels",
      "Stratégie de conservation",
    ],
    missions: [
      "Pilotage stratégique de l'association",
      "Coordination des équipes et projets",
      "Développement des partenariats",
      "Représentation institutionnelle"
    ],
    email: "audrey.favale@cen-corse.org",
    phone: "07.88.30.03.46"
  },
  {
    id: "4",
    name: "Laetitia Antonelli",
    position: "Responsable d'antenne et pôle foncier",
    description: "Responsable de l'antenne d'Ajaccio et du pôle foncier, spécialisée dans la gestion des espaces naturels.",
    photo: "/photos_personnel/Laetitia Antonelli.jpg",
    bureau: "Ajaccio",
    detailedDescription: "Responsable de l'antenne d'Ajaccio et du pôle foncier, je coordonne les actions de gestion et de protection des espaces naturels en Corse. Mon expertise couvre l'acquisition foncière, la gestion des terrains protégés et la coordination des actions de conservation sur le territoire. Je travaille en étroite collaboration avec les propriétaires, les collectivités et les partenaires pour assurer la préservation de notre patrimoine naturel.",
    formation: "Formation en gestion foncière et environnementale",
    specialites: [
      "Gestion foncière",
      "Coordination d'antenne",
      "Protection des espaces naturels",
      "Partenariats territoriaux",
    ],
    missions: [
      "Gestion du pôle foncier",
      "Coordination de l'antenne d'Ajaccio",
      "Acquisition et gestion de terrains",
      "Développement de partenariats locaux"
    ],
    email: "laetitia.antonelli@cen-corse.org",
    phone: "07.88.02.53.26"
  },
  {
    id: "5",
    name: "Maud Marsicano",
    position: "Assistante administrative et comptable",
    description: "Assistante administrative et comptable, responsable de la gestion administrative et financière de l'association.",
    photo: "/photos_personnel/Maud Marsicano.jpg",
    bureau: "Borgo",
    detailedDescription: "En tant qu'assistante administrative et comptable, je gère l'ensemble des aspects administratifs et financiers du CEN Corse. Mon rôle consiste à assurer le bon fonctionnement administratif de l'association, la gestion comptable, la préparation des dossiers administratifs et le suivi des procédures. Je contribue à la transparence et à la rigueur de la gestion de l'association.",
    formation: "Formation en administration et comptabilité associative",
    specialites: [
      "Administration associative",
      "Comptabilité",
      "Gestion administrative",
      "Procédures administratives",
    ],
    missions: [
      "Gestion administrative de l'association",
      "Comptabilité et suivi financier",
      "Préparation des dossiers administratifs",
      "Support administratif aux équipes"
    ]
  },
  {
    id: "6",
    name: "Margaux Bourot",
    position: "Chargée de communication",
    description: "Chargée de communication, responsable de la communication interne et externe de l'association.",
    photo: "/photos_personnel/Margaux Bourot.jpg",
    bureau: "Borgo",
    detailedDescription: "En tant que chargée de communication, je développe et coordonne la stratégie de communication du CEN Corse. Mon rôle consiste à valoriser nos actions de conservation, sensibiliser le public à la biodiversité insulaire et maintenir une image positive de l'association. Je travaille sur la communication digitale, les relations presse et l'organisation d'événements de sensibilisation.",
    formation: "Formation en communication et marketing",
    specialites: [
      "Communication digitale",
      "Relations presse",
      "Événementiel",
      "Sensibilisation environnementale",
    ],
    missions: [
      "Développement de la stratégie de communication",
      "Gestion des réseaux sociaux et du site web",
      "Relations presse et médias",
      "Organisation d'événements de sensibilisation"
    ]
  },
  {
    id: "7",
    name: "Carole Attie",
    position: "Chargée de mission Ornithologie",
    description: "Spécialiste en ornithologie et suivi des populations d'oiseaux de Corse.",
    photo: "/photos_personnel/Carole Attie.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en ornithologie, je coordonne les programmes de suivi et de conservation des oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    missions: [
      "Suivi des populations d'oiseaux de Corse",
      "Protection des espèces menacées",
      "Coordination des programmes de conservation",
      "Formation et sensibilisation"
    ],
    email: "carole.attie@cen-corse.org",
    phone: "04 95 32 71 63"
  },
  {
    id: "8",
    name: "Nicolas Pailhes",
    position: "Chargé de mission Flore/hydrologie",
    description: "Expert en flore insulaire et hydrologie, spécialisé dans la gestion des écosystèmes aquatiques.",
    photo: "/photos_personnel/Nicolas Pailhes.jpg",
    bureau: "Borgo",
    detailedDescription: "Expert en flore insulaire et hydrologie, je travaille sur la connaissance et la protection de la flore endémique de Corse ainsi que sur la gestion des écosystèmes aquatiques. Mon expertise couvre l'identification des espèces végétales, l'étude des habitats humides, la gestion des cours d'eau et la restauration écologique. Je m'intéresse particulièrement aux espèces rares et menacées, aux zones humides et aux interactions entre la flore et les milieux aquatiques.",
    formation: "Master en Biologie Végétale et Écologie - Université de Corse",
    specialites: [
      "Flore insulaire",
      "Hydrologie",
      "Gestion des écosystèmes aquatiques",
      "Restauration écologique",
    ],
    missions: [
      "Inventaire et suivi de la flore endémique",
      "Gestion des écosystèmes aquatiques",
      "Protection des zones humides",
      "Restauration des habitats"
    ],
    email: "nicolas.pailhes@cen-corse.org",
    phone: "04 95 32 71 63"
  },
  {
    id: "9",
    name: "Delphine Triponel",
    position: "Chargée de mission Mesures Compensatoires",
    description: "Spécialiste en mesures compensatoires et gestion des impacts environnementaux.",
    photo: "/photos_personnel/Delphine Triponel.jpg",
    bureau: "Ajaccio",
    detailedDescription: "Spécialiste en mesures compensatoires, je coordonne la mise en œuvre des actions de compensation environnementale pour les projets d'aménagement en Corse. Mon expertise couvre l'évaluation des impacts environnementaux, la conception de mesures compensatoires adaptées et le suivi de leur efficacité. Je travaille en étroite collaboration avec les maîtres d'ouvrage, les bureaux d'études et les services de l'État pour assurer une compensation environnementale efficace et durable.",
    formation: "Master en Droit de l'Environnement - Université de Corse",
    specialites: [
      "Mesures compensatoires",
      "Évaluation d'impacts environnementaux",
      "Droit de l'environnement",
      "Gestion de projets d'aménagement",
    ],
    missions: [
      "Coordination des mesures compensatoires",
      "Évaluation des impacts environnementaux",
      "Accompagnement des maîtres d'ouvrage",
      "Suivi de l'efficacité des compensations"
    ],
    email: "delphine.triponel@cen-corse.org",
    phone: "04 95 32 71 63"
  },
  {
    id: "13",
    name: "Sébastien Cart",
    position: "Chargé d'étude Ornithologie",
    description: "Spécialiste en ornithologie, impliqué dans les études et le suivi des populations d'oiseaux de Corse.",
    photo: "/photos_personnel/Sébastien Cart.jpg",
    bureau: "Ajaccio",
    detailedDescription: "Spécialiste en ornithologie, je réalise des études et des suivis des populations d'oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    email: "sebastien.cart@cen-corse.org",
    phone: "06.78.61.25.21"
  },
  {
    id: "14",
    name: "Gabin Tijou",
    position: "Chargé d'étude Ornithologie",
    description: "Spécialiste en ornithologie, impliqué dans les études et le suivi des populations d'oiseaux de Corse.",
    photo: "/photos_personnel/Gabin Tijou.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en ornithologie, je réalise des études et des suivis des populations d'oiseaux de Corse. Mon expertise couvre l'identification des espèces, le suivi des populations, l'étude des comportements et la protection des habitats. Je travaille sur des espèces emblématiques comme le Gypaète barbu, le Balbuzard pêcheur et les oiseaux marins. Mon approche combine les techniques traditionnelles d'observation avec les nouvelles technologies de suivi pour assurer une conservation efficace des avifaunes insulaires.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Suivi des populations d'oiseaux",
      "Protection des habitats",
      "Techniques de baguage",
    ],
    email: "gabin.tijou@cen-corse.org",
    phone: "07.55.59.16.80"
  },
  {
    id: "15",
    name: "Fabien Valles",
    position: "Chargé d'étude Ornithologie & mesures compensatoires",
    description: "Spécialiste en ornithologie et mesures compensatoires, impliqué dans les études et la gestion des impacts environnementaux.",
    photo: "/photos_personnel/Fabien Valles.jpg",
    bureau: "Borgo",
    detailedDescription: "Spécialiste en ornithologie et mesures compensatoires, je réalise des études sur les populations d'oiseaux et coordonne la mise en œuvre des actions de compensation environnementale. Mon expertise couvre l'identification des espèces, le suivi des populations, l'évaluation des impacts environnementaux et la conception de mesures compensatoires adaptées. Je travaille en étroite collaboration avec les équipes techniques et les partenaires pour assurer une conservation efficace des avifaunes et une compensation environnementale durable.",
    formation: "Master en Biologie de la Conservation - Université de Montpellier",
    specialites: [
      "Ornithologie",
      "Mesures compensatoires",
      "Suivi des populations d'oiseaux",
      "Évaluation d'impacts environnementaux",
    ],
    email: "fabien.valles@cen-corse.org",
    phone: "06.73.06.48.52"
  }
]

export default function EmployeeDetail() {
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fonction pour obtenir l'émoji du bureau
  const getBureauEmoji = (bureau: string) => {
    switch (bureau) {
      case "Borgo":
        return "🏢"
      case "Ajaccio":
        return "🏢"
      default:
        return "🏢"
    }
  }

  // Fonction pour naviguer vers le profil suivant
  const goToNextProfile = () => {
    const currentIndex = employeesData.findIndex(emp => emp.id === params.id)
    const nextIndex = (currentIndex + 1) % employeesData.length
    router.push(`/presentation/${employeesData[nextIndex].id}`)
  }

  // Fonction pour naviguer vers le profil précédent
  const goToPreviousProfile = () => {
    const currentIndex = employeesData.findIndex(emp => emp.id === params.id)
    const previousIndex = currentIndex === 0 ? employeesData.length - 1 : currentIndex - 1
    router.push(`/presentation/${employeesData[previousIndex].id}`)
  }

  useEffect(() => {
    const employeeId = params.id as string
    const foundEmployee = employeesData.find(emp => emp.id === employeeId)
    
    if (foundEmployee) {
      setEmployee(foundEmployee)
    } else {
      // Rediriger vers la page équipe si l'employé n'existe pas
      router.push('/presentation')
    }
    setIsLoading(false)
  }, [params.id, router])

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200' 
          : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
      }`}>
        <div className={`text-lg ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>Chargement...</div>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  return (
    <div className={`min-h-screen ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200' 
        : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-md border-b ${
        theme === 'light' 
          ? 'bg-white/20 border-gray-200/50' 
          : 'bg-black/20 border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                           <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                          <Link href="/presentation" className={`transition-colors duration-300 px-3 py-1.5 rounded-lg border ${
                            theme === 'light' 
                              ? 'text-gray-800 hover:text-blue-600 border-gray-300/50 hover:border-gray-400/70' 
                              : 'text-white hover:text-blue-400 border-white/20 hover:border-white/40'
                          }`}>
                            <span className="text-sm font-medium">Retour</span>
                          </Link>
                                                     <div className={`flex items-center space-x-2 ml-4 ${
                            theme === 'light' ? 'text-gray-800' : 'text-white'
                          }`}>
                             <span className="text-xl">{getBureauEmoji(employee.bureau)}</span>
                             <span className="text-lg font-medium">Bureau {employee.bureau === "Ajaccio" ? "d'" : "de "}{employee.bureau}</span>
                           </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button 
                            onClick={goToPreviousProfile}
                            className={`transition-colors duration-300 ${
                              theme === 'light' 
                                ? 'text-gray-800 hover:text-blue-600' 
                                : 'text-white hover:text-blue-400'
                            }`}
                            disabled={employeesData.length <= 1}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button 
                            onClick={goToNextProfile}
                            className={`transition-colors duration-300 ${
                              theme === 'light' 
                                ? 'text-gray-800 hover:text-blue-600' 
                                : 'text-white hover:text-blue-400'
                            }`}
                            disabled={employeesData.length <= 1}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl ${
          theme === 'light' 
            ? 'bg-white/80 border border-gray-200/50' 
            : 'bg-white/5 border border-white/10'
        }`}>
          {/* Photo et informations principales */}
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-blue-900/50 to-indigo-900/50">
              <img
                src={employee.photo}
                alt={employee.name}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                             <h1 className="text-2xl font-bold text-white mb-2" style={{ color: 'white' }}>{employee.name}</h1>
               <p className="text-lg text-blue-300 font-medium" style={{ color: '#93c5fd' }}>{employee.position}</p>
            </div>
          </div>

          {/* Contenu détaillé */}
          <div className="p-8 space-y-8">
                         {/* Description détaillée */}
             {employee.detailedDescription && (
               <div>
                 <p className={`text-base leading-relaxed text-justify ${
                   theme === 'light' ? 'text-gray-700' : 'text-white'
                 }`}>{employee.detailedDescription}</p>
               </div>
             )}

                         {/* Formation */}
             {employee.formation && (
               <div>
                 <h2 className={`text-xl font-bold mb-4 flex items-center ${
                   theme === 'light' ? 'text-gray-800' : 'text-white'
                 }`}>
                   <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                     theme === 'light' ? 'bg-green-500/30' : 'bg-green-500/20'
                   }`}>
                     <svg className={`w-4 h-4 ${
                       theme === 'light' ? 'text-green-600' : 'text-green-400'
                     }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                     </svg>
                   </span>
                   Formation
                 </h2>
                                 <p className={`text-base ${
                   theme === 'light' ? 'text-gray-700' : 'text-white'
                 }`}>{employee.formation}</p>
              </div>
            )}

                         {/* Spécialités */}
             {employee.specialites && employee.specialites.length > 0 && (
               <div>
                 <h2 className={`text-xl font-bold mb-4 flex items-center ${
                   theme === 'light' ? 'text-gray-800' : 'text-white'
                 }`}>
                   <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                     theme === 'light' ? 'bg-purple-500/30' : 'bg-purple-500/20'
                   }`}>
                     <svg className={`w-4 h-4 ${
                       theme === 'light' ? 'text-purple-600' : 'text-purple-400'
                     }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                     </svg>
                   </span>
                   Spécialités
                 </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employee.specialites.map((specialite, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        theme === 'light' ? 'bg-purple-500' : 'bg-purple-400'
                      }`}></div>
                                             <span className={`text-sm ${
                        theme === 'light' ? 'text-gray-700' : 'text-white'
                      }`}>{specialite}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

                         

                           {/* Coordonnées */}
              <div>
                <h2 className={`text-xl font-bold mb-4 flex items-center ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    theme === 'light' ? 'bg-blue-500/30' : 'bg-blue-500/20'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Coordonnées
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a 
                      href={`mailto:${employee.email || ''}`}
                      className="text-white hover:text-blue-400 text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer"
                    >
                      {employee.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a 
                      href={`tel:${employee.phone?.replace(/\s/g, '') || ''}`}
                      className="text-white hover:text-green-400 text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer"
                    >
                      {employee.phone}
                    </a>
                  </div>
                </div>
              </div>

                             {/* Bouton Projets */}
               <div className="flex justify-center pt-6">
                 <Link 
                   href={`/projets?employe=${encodeURIComponent(employee.name.split(' ').pop() || employee.name)}`}
                   className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/50 hover:via-indigo-600/50 hover:to-purple-600/50 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 active:scale-95 backdrop-blur-md border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                   <svg className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                   <span className="relative z-10 text-lg">Découvrir mes projets</span>
                 </Link>
               </div>
           </div>
         </div>
       </main>
     </div>
   )
 }
