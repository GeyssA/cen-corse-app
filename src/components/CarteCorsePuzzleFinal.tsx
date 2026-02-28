'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

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
    id: 'Ouest',
    nom: 'Ouest',
    description: 'Région ouest de la Corse, plages et patrimoine naturel.',
    couleur: '#cdd883',
    activites: [
      {
        id: 'ouest-formation-1',
        nom: 'Formation identification des oiseaux marins',
        type: 'formation',
        date: '15-16 mars 2024',
        description: 'Formation sur l\'identification des oiseaux marins côtiers.',
        lieu: 'Calvi'
      },
      {
        id: 'ouest-benevolat-1',
        nom: 'Nettoyage des plages',
        type: 'benevolat',
        date: '22 avril 2024',
        description: 'Action bénévole de nettoyage des plages.',
        lieu: 'Lumio'
      }
    ]
  },
  {
    id: 'Sud',
    nom: 'Sud',
    description: 'Région sud de la Corse, montagnes et côtes sauvages.',
    couleur: '#f2b936',
    activites: [
      {
        id: 'sud-benevolat-1',
        nom: 'Protection des tortues marines',
        type: 'benevolat',
        date: 'Juin-Août 2024',
        description: 'Surveillance des plages de ponte des tortues marines.',
        lieu: 'Porto-Vecchio'
      }
    ]
  },
  {
    id: 'Corse Orientale',
    nom: 'Corse Orientale',
    description: 'Côte orientale de la Corse, zones humides et lagunes.',
    couleur: '#59c9b5',
    activites: [
      {
        id: 'orientale-formation-1',
        nom: 'Formation zones humides',
        type: 'formation',
        date: '20-22 avril 2024',
        description: 'Formation sur la gestion des zones humides littorales.',
        lieu: 'Aléria'
      }
    ]
  },
  {
    id: 'Sartenais',
    nom: 'Sartenais',
    description: 'Région de Sartène, patrimoine et biodiversité.',
    couleur: '#6faf59',
    activites: [
      {
        id: 'sartenais-evenement-1',
        nom: 'Festival de la biodiversité',
        type: 'evenement',
        date: '15-17 juin 2024',
        description: 'Participation au festival de la biodiversité.',
        lieu: 'Sartène'
      }
    ]
  },
  {
    id: 'Balagne',
    nom: 'Balagne',
    description: 'Région du nord-ouest, plages et patrimoine naturel.',
    couleur: '#f4e14d',
    activites: [
      {
        id: 'balagne-evenement-1',
        nom: 'Salon de l\'environnement',
        type: 'evenement',
        date: '8-10 septembre 2024',
        description: 'Participation au salon de l\'environnement.',
        lieu: 'Calvi'
      }
    ]
  },
  {
    id: 'Pays Ajaccien',
    nom: 'Pays Ajaccien',
    description: 'Région d\'Ajaccio, capitale et patrimoine.',
    couleur: '#f0956c',
    activites: [
      {
        id: 'ajaccien-formation-1',
        nom: 'Formation herpétologie',
        type: 'formation',
        date: '5-7 juillet 2024',
        description: 'Formation sur les amphibiens et reptiles.',
        lieu: 'Ajaccio'
      }
    ]
  },
  {
    id: 'Castagniccia',
    nom: 'Castagniccia',
    description: 'Région de la Castagniccia, forêts de châtaigniers.',
    couleur: '#9ea3b9',
    activites: [
      {
        id: 'castagniccia-benevolat-1',
        nom: 'Suivi des rapaces',
        type: 'benevolat',
        date: 'Toute l\'année',
        description: 'Suivi bénévole des populations de rapaces en montagne.',
        lieu: 'Castagniccia'
      }
    ]
  },
  {
    id: 'Centre Corse',
    nom: 'Centre Corse',
    description: 'Cœur montagneux de la Corse, forêts et rivières.',
    couleur: '#bd98bd',
    activites: [
      {
        id: 'centre-formation-1',
        nom: 'Formation botanique alpine',
        type: 'formation',
        date: '10-12 juin 2024',
        description: 'Formation sur la flore alpine du centre de la Corse.',
        lieu: 'Corte'
      }
    ]
  },
  {
    id: 'Pays Bastiais',
    nom: 'Pays Bastiais',
    description: 'Région de Bastia, capitale du nord.',
    couleur: '#ec8258',
    activites: [
      {
        id: 'bastiais-benevolat-1',
        nom: 'Suivi des espèces endémiques',
        type: 'benevolat',
        date: 'Toute l\'année',
        description: 'Suivi des populations d\'espèces endémiques.',
        lieu: 'Bastia'
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

export default function CarteCorsePuzzleFinal() {
  const { theme } = useTheme()
  const [zoneSelectionnee, setZoneSelectionnee] = useState<Zone | null>(null)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [svgContent, setSvgContent] = useState('')

  // Fonction pour gérer les clics sur les zones
  const handleZoneClick = (zoneId: string) => {
    console.log('Zone cliquée:', zoneId)
    const zone = zonesCorse.find(z => z.id === zoneId)
    if (zone) {
      setZoneSelectionnee(zone)
      setModalOuvert(true)
    }
  }

  const handleCloseModal = () => {
    setModalOuvert(false)
    setZoneSelectionnee(null)
  }

  // Charger le contenu du SVG
  useEffect(() => {
    fetch('/Corse_puzzle.svg')
      .then(response => response.text())
      .then(setSvgContent)
      .catch(error => console.error("Error loading SVG:", error))
  }, [])

  // Exposer la fonction globalement pour le SVG
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).handleZoneClick = handleZoneClick
    }
  }, [])

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Carte de la Corse avec zones cliquables */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-6xl">
          {/* Affichage du SVG avec zones cliquables par-dessus */}
          <div className="relative w-full h-full">
            {/* SVG de fond */}
            {svgContent ? (
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <div className={`flex items-center justify-center h-full text-lg ${
                theme === 'light' ? 'text-gray-800' : 'text-gray-200'
              }`}>
                Chargement de la carte...
              </div>
            )}
            
            {/* Zones cliquables simples et fonctionnelles */}
            <div className="absolute inset-0">
              {/* Zone Ouest - Côte ouest */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '25%',
                  left: '5%',
                  width: '20%',
                  height: '50%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 0% 100%)'
                }}
                onClick={() => handleZoneClick('Ouest')}
                title="Ouest"
              />
              
              {/* Zone Sud - Extrême sud */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '70%',
                  left: '10%',
                  width: '25%',
                  height: '25%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)'
                }}
                onClick={() => handleZoneClick('Sud')}
                title="Sud"
              />
              
              {/* Zone Corse Orientale - Côte est */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '20%',
                  left: '70%',
                  width: '25%',
                  height: '60%',
                  clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)'
                }}
                onClick={() => handleZoneClick('Corse Orientale')}
                title="Corse Orientale"
              />
              
              {/* Zone Sartenais - Sud-est */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '65%',
                  left: '50%',
                  width: '20%',
                  height: '30%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)'
                }}
                onClick={() => handleZoneClick('Sartenais')}
                title="Sartenais"
              />
              
              {/* Zone Balagne - Nord-ouest */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '5%',
                  left: '25%',
                  width: '35%',
                  height: '30%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'
                }}
                onClick={() => handleZoneClick('Balagne')}
                title="Balagne"
              />
              
              {/* Zone Pays Ajaccien - Centre-ouest */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '40%',
                  left: '20%',
                  width: '25%',
                  height: '35%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)'
                }}
                onClick={() => handleZoneClick('Pays Ajaccien')}
                title="Pays Ajaccien"
              />
              
              {/* Zone Castagniccia - Centre-est */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '45%',
                  left: '55%',
                  width: '20%',
                  height: '30%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'
                }}
                onClick={() => handleZoneClick('Castagniccia')}
                title="Castagniccia"
              />
              
              {/* Zone Centre Corse - Centre */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '50%',
                  left: '35%',
                  width: '30%',
                  height: '25%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)'
                }}
                onClick={() => handleZoneClick('Centre Corse')}
                title="Centre Corse"
              />
              
              {/* Zone Pays Bastiais - Nord-est */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '15%',
                  left: '75%',
                  width: '20%',
                  height: '40%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)'
                }}
                onClick={() => handleZoneClick('Pays Bastiais')}
                title="Pays Bastiais"
              />
            </div>
          </div>
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
