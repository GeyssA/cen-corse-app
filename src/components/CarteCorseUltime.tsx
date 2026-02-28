'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

// Données des zones de la Corse
const zonesCorse = [
  {
    id: 'ouest',
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
    id: 'sud',
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
    id: 'corse-orientale',
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
    id: 'sartenais',
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
    id: 'balagne',
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
    id: 'pays-ajaccien',
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
    id: 'castagniccia',
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
    id: 'centre-corse',
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
    id: 'pays-bastiais',
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

// Composant Modal pour afficher les détails d'une zone
function ModalZone({ zone, isOpen, onClose }: { zone: any, isOpen: boolean, onClose: () => void }) {
  const { theme } = useTheme()

  if (!isOpen || !zone) return null

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'formation': return 'bg-blue-100 text-blue-800'
      case 'benevolat': return 'bg-green-100 text-green-800'
      case 'evenement': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'formation': return 'Formation'
      case 'benevolat': return 'Bénévolat'
      case 'evenement': return 'Événement'
      default: return type
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`
        relative max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl
        ${theme === 'light' 
          ? 'bg-white border border-gray-200' 
          : 'bg-gray-800 border border-white/20'
        }
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {zone.nom}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                theme === 'light' 
                  ? 'hover:bg-gray-100 text-gray-500' 
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className={`text-lg mb-6 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            {zone.description}
          </p>

          <div className="space-y-4">
            <h3 className={`text-xl font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Activités
            </h3>
            
            {zone.activites.map((activite: any) => (
              <div key={activite.id} className={`
                p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                ${theme === 'light' 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }
              `}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`font-semibold ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {activite.nom}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(activite.type)}`}>
                    {getTypeLabel(activite.type)}
                  </span>
                </div>
                
                <p className={`text-sm mb-2 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {activite.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`flex items-center ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {activite.date}
                  </span>
                  <span className={`flex items-center ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {activite.lieu}
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

export default function CarteCorseUltime() {
  const { theme } = useTheme()
  const [zoneSelectionnee, setZoneSelectionnee] = useState<any>(null)
  const [modalOuvert, setModalOuvert] = useState(false)

  const handleZoneClick = (zoneId: string) => {
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

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Carte de la Corse avec zones cliquables */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-6xl">
          {/* Image de fond de la Corse */}
          <div className="relative w-full h-full">
            <img 
              src="/Corse_puzzle.svg" 
              alt="Carte de la Corse"
              className="w-full h-full object-contain"
            />
            
            {/* Zones cliquables par-dessus l'image */}
            <div className="absolute inset-0">
              {/* Zone Ouest */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '25%',
                  left: '5%',
                  width: '20%',
                  height: '50%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 0% 100%)'
                }}
                onClick={() => handleZoneClick('ouest')}
                title="Ouest"
              />
              
              {/* Zone Sud */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '70%',
                  left: '10%',
                  width: '25%',
                  height: '25%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)'
                }}
                onClick={() => handleZoneClick('sud')}
                title="Sud"
              />
              
              {/* Zone Corse Orientale */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '20%',
                  left: '70%',
                  width: '25%',
                  height: '60%',
                  clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)'
                }}
                onClick={() => handleZoneClick('corse-orientale')}
                title="Corse Orientale"
              />
              
              {/* Zone Sartenais */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '65%',
                  left: '50%',
                  width: '20%',
                  height: '30%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)'
                }}
                onClick={() => handleZoneClick('sartenais')}
                title="Sartenais"
              />
              
              {/* Zone Balagne */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '5%',
                  left: '25%',
                  width: '35%',
                  height: '30%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'
                }}
                onClick={() => handleZoneClick('balagne')}
                title="Balagne"
              />
              
              {/* Zone Pays Ajaccien */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '40%',
                  left: '20%',
                  width: '25%',
                  height: '35%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)'
                }}
                onClick={() => handleZoneClick('pays-ajaccien')}
                title="Pays Ajaccien"
              />
              
              {/* Zone Castagniccia */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '45%',
                  left: '55%',
                  width: '20%',
                  height: '30%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'
                }}
                onClick={() => handleZoneClick('castagniccia')}
                title="Castagniccia"
              />
              
              {/* Zone Centre Corse */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '50%',
                  left: '35%',
                  width: '30%',
                  height: '25%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)'
                }}
                onClick={() => handleZoneClick('centre-corse')}
                title="Centre Corse"
              />
              
              {/* Zone Pays Bastiais */}
              <div 
                className="absolute cursor-pointer hover:bg-white/20 transition-colors rounded-lg"
                style={{
                  top: '15%',
                  left: '75%',
                  width: '20%',
                  height: '40%',
                  clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)'
                }}
                onClick={() => handleZoneClick('pays-bastiais')}
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
          ? 'bg-white border border-gray-200' 
          : 'bg-gray-800/95 backdrop-blur-sm border border-white/20'
        }
      `}>
        <h3 className={`text-lg font-semibold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Régions de la Corse
        </h3>
        <ul className="space-y-1">
          {zonesCorse.map(zone => (
            <li key={zone.id} className={`flex items-center space-x-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: zone.couleur }}
              ></span>
              <span className="text-sm">{zone.nom}</span>
            </li>
          ))}
        </ul>
      </div>

      <ModalZone zone={zoneSelectionnee} isOpen={modalOuvert} onClose={handleCloseModal} />
    </div>
  )
}




















