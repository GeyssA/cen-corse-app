'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import ImageMapper from 'react-image-mapper'

// Types
interface Activite {
  id: string
  nom: string
  type: 'formation' | 'benevolat' | 'evenement'
  date: string
  description: string
  lieu: string
}

interface Zone {
  id: string
  nom: string
  description: string
  couleur: string
  activites: Activite[]
}

// Données des zones de la Corse
const zonesCorse: Zone[] = [
  {
    id: 'balagne',
    nom: 'Balagne',
    description: 'Région de la Balagne, connue pour ses plages et son patrimoine naturel.',
    couleur: '#cdd883',
    activites: [
      {
        id: 'balagne-formation-1',
        nom: 'Formation identification des oiseaux marins',
        type: 'formation',
        date: '15-16 mars 2024',
        description: 'Formation sur l\'identification des oiseaux marins côtiers de la Balagne.',
        lieu: 'Calvi'
      },
      {
        id: 'balagne-benevolat-1',
        nom: 'Nettoyage des plages',
        type: 'benevolat',
        date: '22 avril 2024',
        description: 'Action bénévole de nettoyage des plages de la Balagne.',
        lieu: 'Lumio'
      }
    ]
  },
  {
    id: 'cap-corse',
    nom: 'Cap Corse',
    description: 'Péninsule du Cap Corse, réserve naturelle et patrimoine exceptionnel.',
    couleur: '#f4e14d',
    activites: [
      {
        id: 'cap-formation-1',
        nom: 'Formation botanique du Cap Corse',
        type: 'formation',
        date: '10-11 mai 2024',
        description: 'Découverte de la flore endémique du Cap Corse.',
        lieu: 'Centuri'
      }
    ]
  },
  {
    id: 'centre-corse',
    nom: 'Centre Corse',
    description: 'Cœur montagneux de la Corse, forêts et rivières.',
    couleur: '#bd98bd',
    activites: [
      {
        id: 'centre-evenement-1',
        nom: 'Festival de la nature',
        type: 'evenement',
        date: '5-7 juillet 2024',
        description: 'Festival grand public sur la biodiversité du centre Corse.',
        lieu: 'Corte'
      }
    ]
  },
  {
    id: 'corte',
    nom: 'Région de Corte',
    description: 'Ville universitaire et centre historique de la Corse.',
    couleur: '#9ea3b9',
    activites: [
      {
        id: 'corte-formation-1',
        nom: 'Formation gestion des milieux humides',
        type: 'formation',
        date: '20-21 juin 2024',
        description: 'Formation sur la gestion et la restauration des zones humides.',
        lieu: 'Corte'
      }
    ]
  },
  {
    id: 'ajaccio',
    nom: 'Région d\'Ajaccio',
    description: 'Capitale de la Corse, riche patrimoine naturel et culturel.',
    couleur: '#f0956c',
    activites: [
      {
        id: 'ajaccio-benevolat-1',
        nom: 'Suivi des tortues marines',
        type: 'benevolat',
        date: '15 août 2024',
        description: 'Suivi et protection des sites de ponte des tortues marines.',
        lieu: 'Ajaccio'
      }
    ]
  },
  {
    id: 'sartene',
    nom: 'Région de Sartène',
    description: 'Sud de la Corse, paysages méditerranéens et patrimoine.',
    couleur: '#f2b936',
    activites: [
      {
        id: 'sartene-evenement-1',
        nom: 'Journée découverte des maquis',
        type: 'evenement',
        date: '12 septembre 2024',
        description: 'Sortie grand public pour découvrir la flore du maquis.',
        lieu: 'Sartène'
      }
    ]
  },
  {
    id: 'porto-vecchio',
    nom: 'Région de Porto-Vecchio',
    description: 'Sud-est de la Corse, plages et zones humides.',
    couleur: '#59c9b5',
    activites: [
      {
        id: 'porto-formation-1',
        nom: 'Formation zones humides',
        type: 'formation',
        date: '8-9 octobre 2024',
        description: 'Formation sur l\'écologie des zones humides côtières.',
        lieu: 'Porto-Vecchio'
      }
    ]
  },
  {
    id: 'bonifacio',
    nom: 'Région de Bonifacio',
    description: 'Extrême sud de la Corse, falaises et réserve naturelle.',
    couleur: '#6faf59',
    activites: [
      {
        id: 'bonifacio-benevolat-1',
        nom: 'Surveillance des falaises',
        type: 'benevolat',
        date: '25 octobre 2024',
        description: 'Surveillance et protection des oiseaux nicheurs des falaises.',
        lieu: 'Bonifacio'
      }
    ]
  },
  {
    id: 'alta-rocca',
    nom: 'Région de l\'Alta Rocca',
    description: 'Hautes terres du sud, forêts et montagnes.',
    couleur: '#ec8258',
    activites: [
      {
        id: 'alta-rocca-evenement-1',
        nom: 'Randonnée botanique',
        type: 'evenement',
        date: '3 novembre 2024',
        description: 'Randonnée guidée pour découvrir la flore d\'altitude.',
        lieu: 'Zonza'
      }
    ]
  }
]

// Types d'activités avec icônes et couleurs
const typesActivites = {
  formation: {
    label: 'Formation',
    icone: '🎓',
    couleur: 'bg-purple-100 text-purple-800'
  },
  benevolat: {
    label: 'Bénévolat',
    icone: '❤️',
    couleur: 'bg-red-100 text-red-800'
  },
  evenement: {
    label: 'Événement',
    icone: '🏛️',
    couleur: 'bg-blue-100 text-blue-800'
  }
}

// Configuration des zones cliquables pour react-image-mapper
// Coordonnées basées sur les paths du SVG Corse_svg.svg
const MAP_CONFIG = {
  name: 'corse-map',
  areas: [
    {
      name: 'balagne',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path de la Balagne dans le SVG
      coords: [142, 560, 180, 520, 220, 540, 240, 580, 220, 620, 180, 640, 140, 620, 120, 580],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'cap-corse',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path du Cap Corse
      coords: [328, 908, 350, 850, 380, 800, 400, 750, 420, 700, 400, 650, 360, 680, 340, 720],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'centre-corse',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path du centre Corse
      coords: [308, 665, 350, 650, 380, 680, 400, 720, 380, 760, 340, 780, 300, 750, 280, 700],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'corte',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path de Corte
      coords: [203, 832, 250, 820, 280, 850, 300, 900, 280, 950, 240, 970, 200, 950, 180, 900],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'ajaccio',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path d'Ajaccio
      coords: [158, 435, 200, 420, 240, 450, 260, 500, 240, 550, 200, 570, 160, 550, 140, 500],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'sartene',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path de Sartène
      coords: [133, 719, 180, 700, 220, 730, 240, 780, 220, 830, 180, 850, 140, 830, 120, 780],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'porto-vecchio',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path de Porto-Vecchio
      coords: [469, 472, 500, 450, 530, 480, 550, 530, 530, 580, 500, 600, 470, 580, 450, 530],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'bonifacio',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path de Bonifacio
      coords: [244, 529, 280, 520, 320, 550, 340, 600, 320, 650, 280, 670, 240, 650, 220, 600],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    },
    {
      name: 'alta-rocca',
      shape: 'poly',
      // Coordonnées approximatives basées sur le path de l'Alta Rocca
      coords: [244, 529, 280, 520, 320, 550, 340, 600, 320, 650, 280, 670, 240, 650, 220, 600],
      preFillColor: 'transparent',
      fillColor: 'transparent',
      strokeColor: 'rgba(255, 255, 255, 0.8)',
      lineWidth: 2
    }
  ]
}

// Modal pour afficher les détails d'une zone
const ModalZone = ({ zone, isOpen, onClose }: { zone: Zone | null, isOpen: boolean, onClose: () => void }) => {
  const { theme } = useTheme()
  
  if (!zone) return null
  
  return (
    <div className={`
      fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4
      ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      transition-opacity duration-300
    `}>
      <div className={`
        max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl
        ${theme === 'light' 
          ? 'bg-white border border-gray-200' 
          : 'bg-gray-800/95 backdrop-blur-sm border border-white/20'
        }
        transform transition-all duration-300
        ${isOpen ? 'scale-100' : 'scale-95'}
      `}>
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {zone.nom}
              </h2>
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                {zone.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                theme === 'light' 
                  ? 'hover:bg-gray-100' 
                  : 'hover:bg-gray-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Contenu */}
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Activités dans cette zone
          </h3>
          
          <div className="space-y-4">
            {zone.activites.map((activite, index) => (
              <div key={index} className={`
                p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                ${theme === 'light' 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-gray-700/50 border-gray-600'
                }
              `}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{typesActivites[activite.type].icone}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      theme === 'light' 
                        ? typesActivites[activite.type].couleur 
                        : 'bg-gray-600 text-gray-200'
                    }`}>
                      {typesActivites[activite.type].label}
                    </span>
                  </div>
                </div>
                
                <h4 className={`font-semibold mb-2 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {activite.nom}
                </h4>
                
                <p className={`text-sm mb-2 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  {activite.description}
                </p>
                
                <div className="flex justify-between text-xs">
                  <span className={`${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    📅 {activite.date}
                  </span>
                  <span className={`${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    📍 {activite.lieu}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CarteCorseMapper() {
  const { theme } = useTheme()
  const [zoneSelectionnee, setZoneSelectionnee] = useState<Zone | null>(null)
  const [modalOuvert, setModalOuvert] = useState(false)

  const handleZoneClick = (area: any) => {
    const zone = zonesCorse.find(z => z.id === area.name)
    if (zone) {
      setZoneSelectionnee(zone)
      setModalOuvert(true)
    }
  }

  const handleCloseModal = () => {
    setModalOuvert(false)
    setZoneSelectionnee(null)
  }

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Carte de la Corse avec zones cliquables */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-6xl">
          <ImageMapper
            src="/Corse_svg.svg"
            map={MAP_CONFIG}
            onClick={handleZoneClick}
            onMouseEnter={(area) => {
              // Effet de survol subtil
              const zone = zonesCorse.find(z => z.id === area.name)
              if (zone) {
                console.log('Survol de la zone:', zone.nom)
              }
            }}
            onMouseLeave={(area) => {
              console.log('Fin de survol de la zone:', area.name)
            }}
            width={558}
            height={954}
            className="w-full h-full object-contain cursor-pointer"
            imgWidth={558}
            imgHeight={954}
          />
        </div>
      </div>
      
      {/* Légende flottante en bas à droite */}
      <div className={`
        absolute bottom-4 right-4 p-4 rounded-xl shadow-lg max-w-xs
        ${theme === 'light'
          ? 'bg-white/90 border border-gray-200'
          : 'bg-gray-800/90 border border-gray-600'
        }
      `}>
        <h3 className={`font-semibold mb-3 text-sm ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Types d'activités
        </h3>
        <div className="space-y-2">
          {Object.entries(typesActivites).map(([type, config]) => (
            <div key={type} className="flex items-center space-x-2">
              <span className="text-sm">{config.icone}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                theme === 'light'
                  ? config.couleur
                  : 'bg-gray-600 text-gray-200'
              }`}>
                {config.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal des détails */}
      <ModalZone
        zone={zoneSelectionnee}
        isOpen={modalOuvert}
        onClose={handleCloseModal}
      />
    </div>
  )
}
