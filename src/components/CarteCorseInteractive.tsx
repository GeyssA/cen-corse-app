'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ZoneInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  characteristics: string[];
  population?: string;
  area?: string;
  mainCities?: string[];
}

interface ZoneInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  characteristics: string[];
  population?: string;
  area?: string;
  mainCities?: string[];
  activities: string[];
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

const zonesData: Record<string, ZoneInfo> = {
  'Ouest': {
    id: 'ouest',
    name: 'Corse de l\'Ouest',
    description: 'La côte ouest de la Corse, célèbre pour ses plages de sable fin et ses falaises spectaculaires.',
    color: '#cdd883',
    characteristics: ['Plages paradisiaques', 'Falaises de Bonifacio', 'Porto-Vecchio', 'Propriano'],
    population: '~45 000 habitants',
    area: '~1 200 km²',
    mainCities: ['Porto-Vecchio', 'Propriano', 'Sartène'],
    activities: ['Plongée sous-marine', 'Randonnées côtières', 'Visite de Bonifacio', 'Baignade', 'Voile', 'Pêche'],
    centerX: 100,
    centerY: 780,
    width: 100,
    height: 100
  },
  'Sud': {
    id: 'sud',
    name: 'Corse du Sud',
    description: 'Le sud de l\'île avec ses paysages variés, de la montagne à la mer.',
    color: '#f2b936',
    characteristics: ['Montagnes escarpées', 'Vallées profondes', 'Traditions pastorales', 'Villages perchés'],
    population: '~35 000 habitants',
    area: '~1 000 km²',
    mainCities: ['Sartène', 'Zonza', 'Levie'],
    activities: ['Randonnées en montagne', 'Escalade', 'Visite de villages', 'Dégustation de vins', 'Traditions locales'],
    centerX: 180,
    centerY: 880,
    width: 120,
    height: 120
  },
  'Corse_Orientale': {
    id: 'corse-orientale',
    name: 'Corse Orientale',
    description: 'La côte est de la Corse, plus sauvage et préservée, avec ses étangs et ses marais.',
    color: '#59c9b5',
    characteristics: ['Étangs et marais', 'Plages sauvages', 'Réserves naturelles', 'Pêche traditionnelle'],
    population: '~25 000 habitants',
    area: '~800 km²',
    mainCities: ['Aléria', 'Ghisonaccia', 'Linguizzetta'],
    activities: ['Observation d\'oiseaux', 'Pêche', 'Randonnées dans les marais', 'Visite de réserves', 'Plages sauvages'],
    centerX: 400,
    centerY: 680,
    width: 100,
    height: 100
  },
  'Sartenais': {
    id: 'sartenais',
    name: 'Sartenais',
    description: 'Région historique du sud, berceau de la culture corse traditionnelle.',
    color: '#6faf59',
    characteristics: ['Traditions ancestrales', 'Architecture de pierre', 'Vignobles', 'Artisanat local'],
    population: '~15 000 habitants',
    area: '~600 km²',
    mainCities: ['Sartène', 'Olmeto', 'Monacia-d\'Aullène'],
    activities: ['Dégustation de vins', 'Visite de caves', 'Artisanat local', 'Traditions corses', 'Architecture historique'],
    centerX: 250,
    centerY: 820,
    width: 80,
    height: 80
  },
  'Balagne': {
    id: 'balagne',
    name: 'Balagne',
    description: 'La "jardin de la Corse", région fertile et verdoyante au nord-ouest.',
    color: '#f4e14d',
    characteristics: ['Oliviers millénaires', 'Vergers', 'Villages pittoresques', 'Artisanat'],
    population: '~30 000 habitants',
    area: '~700 km²',
    mainCities: ['Calvi', 'L\'Île-Rousse', 'Calenzana'],
    activities: ['Visite d\'oliveraies', 'Dégustation d\'huile d\'olive', 'Villages pittoresques', 'Artisanat local', 'Plages de sable'],
    centerX: 80,
    centerY: 180,
    width: 100,
    height: 100
  },
  'Pays_Ajaccien': {
    id: 'pays-ajaccien',
    name: 'Pays Ajaccien',
    description: 'Région autour d\'Ajaccio, capitale de la Corse, mélange de modernité et tradition.',
    color: '#f0956c',
    characteristics: ['Capitale administrative', 'Port principal', 'Histoire napoléonienne', 'Vie culturelle'],
    population: '~80 000 habitants',
    area: '~1 500 km²',
    mainCities: ['Ajaccio', 'Bastelica', 'Cargèse'],
    activities: ['Visite d\'Ajaccio', 'Musées napoléoniens', 'Port de plaisance', 'Vie culturelle', 'Restaurants', 'Shopping'],
    centerX: 180,
    centerY: 580,
    width: 120,
    height: 120
  },
  'Castagniccia': {
    id: 'castagniccia',
    name: 'Castagniccia',
    description: 'Région montagneuse du centre-est, couverte de châtaigniers et de forêts.',
    color: '#9ea3b9',
    characteristics: ['Forêts de châtaigniers', 'Montagnes', 'Villages isolés', 'Traditions pastorales'],
    population: '~20 000 habitants',
    area: '~900 km²',
    mainCities: ['Morosaglia', 'Piedicroce', 'Piedipartino'],
    activities: ['Randonnées en forêt', 'Cueillette de châtaignes', 'Villages traditionnels', 'Traditions pastorales', 'Nature sauvage'],
    centerX: 360,
    centerY: 320,
    width: 100,
    height: 100
  },
  'Centre_Corse': {
    id: 'centre-corse',
    name: 'Centre Corse',
    description: 'Le cœur montagneux de l\'île, avec ses sommets et ses lacs d\'altitude.',
    color: '#bd98bd',
    characteristics: ['Sommets élevés', 'Lacs d\'altitude', 'Randonnées', 'Pâturages'],
    population: '~25 000 habitants',
    area: '~1 100 km²',
    mainCities: ['Corte', 'Vivario', 'Ghisoni'],
    activities: ['Randonnées en montagne', 'Lacs d\'altitude', 'Escalade', 'VTT', 'Observation de la faune', 'Corte historique'],
    centerX: 300,
    centerY: 480,
    width: 100,
    height: 100
  },
  'Pays_Bastiais': {
    id: 'pays-bastiais',
    name: 'Pays Bastiais',
    description: 'Région autour de Bastia, deuxième ville de Corse, port industriel et commercial.',
    color: '#ec8258',
    characteristics: ['Port industriel', 'Vieille ville', 'Commerce', 'Université'],
    population: '~70 000 habitants',
    area: '~1 300 km²',
    mainCities: ['Bastia', 'Furiani', 'Biguglia'],
    activities: ['Vieille ville de Bastia', 'Port de commerce', 'Université', 'Vie nocturne', 'Shopping', 'Restaurants'],
    centerX: 420,
    centerY: 120,
    width: 100,
    height: 100
  }
};

export default function CarteCorseInteractive() {
  const [selectedZone, setSelectedZone] = useState<ZoneInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef<HTMLDivElement>(null);

  // Charger le SVG au montage du composant
  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch('/Corse_puzzle.svg');
        const svgText = await response.text();
        setSvgContent(svgText);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement du SVG:', error);
        setIsLoading(false);
      }
    };

    loadSvg();
  }, []);

  // Fonction pour gérer les clics sur les zones
  const handleZoneClick = (zoneName: string) => {
    const zone = zonesData[zoneName];
    if (zone) {
      setSelectedZone(zone);
      setIsModalOpen(true);
    }
  };

  // Exposer la fonction globalement pour le SVG
  useEffect(() => {
    (window as any).handleZoneClick = handleZoneClick;
    
    return () => {
      delete (window as any).handleZoneClick;
    };
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedZone(null);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Découvrez les Régions de la Corse
      </h2>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="relative w-full h-auto" style={{ maxHeight: '600px' }}>
          {/* Carte SVG en arrière-plan */}
          <div 
            ref={svgRef}
            className="w-full h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          
          {/* Zones cliquables invisibles par-dessus chaque région */}
          {Object.values(zonesData).map((zone) => (
            <button
              key={zone.id}
              onClick={() => handleZoneClick(zone.name)}
              className="absolute opacity-0 hover:opacity-10 transition-opacity duration-200 group"
              style={{
                left: `${(zone.centerX / 558) * 100}%`,
                top: `${(zone.centerY / 954) * 100}%`,
                width: `${zone.width || 80}px`,
                height: `${zone.height || 80}px`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: zone.color,
                borderRadius: '50%',
                cursor: 'pointer'
              }}
              title={zone.name}
            >
              {/* Zone cliquable invisible */}
              <div className="w-full h-full rounded-full border-2 border-white shadow-lg" />
              
              {/* Nom de la zone au hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black bg-opacity-90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {zone.name}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Cliquez sur les régions colorées de la carte pour découvrir leurs activités
          </p>
        </div>
      </div>

      {/* Modal pour afficher les détails de la zone */}
      {isModalOpen && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedZone.name}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <div 
                  className="w-full h-4 rounded mb-2"
                  style={{ backgroundColor: selectedZone.color }}
                />
                <p className="text-gray-700 text-lg leading-relaxed">
                  {selectedZone.description}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">🎯 Activités à découvrir</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedZone.activities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-blue-500 text-lg">•</span>
                        <span className="text-gray-700 font-medium">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">ℹ️ Informations</h4>
                  <div className="space-y-3">
                    {selectedZone.population && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Population:</span>
                        <span className="font-medium text-gray-800">{selectedZone.population}</span>
                      </div>
                    )}
                    {selectedZone.area && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Superficie:</span>
                        <span className="font-medium text-gray-800">{selectedZone.area}</span>
                      </div>
                    )}
                    {selectedZone.mainCities && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 block mb-1 text-sm">Villes principales:</span>
                        <span className="font-medium text-gray-800">{selectedZone.mainCities.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">🏞️ Caractéristiques</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedZone.characteristics.map((char, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
