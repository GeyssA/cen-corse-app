'use client';

import React, { useState } from 'react';

interface ZoneInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  activities: string[];
  population?: string;
  area?: string;
  mainCities?: string[];
}

const zonesData: Record<string, ZoneInfo> = {
  'Ouest': {
    id: 'ouest',
    name: 'Corse de l\'Ouest',
    description: 'La côte ouest de la Corse, célèbre pour ses plages de sable fin et ses falaises spectaculaires.',
    color: '#cdd883',
    activities: ['Plongée sous-marine', 'Randonnées côtières', 'Visite de Bonifacio', 'Baignade', 'Voile', 'Pêche'],
    population: '~45 000 habitants',
    area: '~1 200 km²',
    mainCities: ['Porto-Vecchio', 'Propriano', 'Sartène']
  },
  'Sud': {
    id: 'sud',
    name: 'Corse du Sud',
    description: 'Le sud de l\'île avec ses paysages variés, de la montagne à la mer.',
    color: '#f2b936',
    activities: ['Randonnées en montagne', 'Escalade', 'Visite de villages', 'Dégustation de vins', 'Traditions locales'],
    population: '~35 000 habitants',
    area: '~1 000 km²',
    mainCities: ['Sartène', 'Zonza', 'Levie']
  },
  'Corse_Orientale': {
    id: 'corse-orientale',
    name: 'Corse Orientale',
    description: 'La côte est de la Corse, plus sauvage et préservée, avec ses étangs et ses marais.',
    color: '#59c9b5',
    activities: ['Observation d\'oiseaux', 'Pêche', 'Randonnées dans les marais', 'Visite de réserves', 'Plages sauvages'],
    population: '~25 000 habitants',
    area: '~800 km²',
    mainCities: ['Aléria', 'Ghisonaccia', 'Linguizzetta']
  },
  'Sartenais': {
    id: 'sartenais',
    name: 'Sartenais',
    description: 'Région historique du sud, berceau de la culture corse traditionnelle.',
    color: '#6faf59',
    activities: ['Dégustation de vins', 'Visite de caves', 'Artisanat local', 'Traditions corses', 'Architecture historique'],
    population: '~15 000 habitants',
    area: '~600 km²',
    mainCities: ['Sartène', 'Olmeto', 'Monacia-d\'Aullène']
  },
  'Balagne': {
    id: 'balagne',
    name: 'Balagne',
    description: 'La "jardin de la Corse", région fertile et verdoyante au nord-ouest.',
    color: '#f4e14d',
    activities: ['Visite d\'oliveraies', 'Dégustation d\'huile d\'olive', 'Villages pittoresques', 'Artisanat local', 'Plages de sable'],
    population: '~30 000 habitants',
    area: '~700 km²',
    mainCities: ['Calvi', 'L\'Île-Rousse', 'Calenzana']
  },
  'Pays_Ajaccien': {
    id: 'pays-ajaccien',
    name: 'Pays Ajaccien',
    description: 'Région autour d\'Ajaccio, capitale de la Corse, mélange de modernité et tradition.',
    color: '#f0956c',
    activities: ['Visite d\'Ajaccio', 'Musées napoléoniens', 'Port de plaisance', 'Vie culturelle', 'Restaurants', 'Shopping'],
    population: '~80 000 habitants',
    area: '~1 500 km²',
    mainCities: ['Ajaccio', 'Bastelica', 'Cargèse']
  },
  'Castagniccia': {
    id: 'castagniccia',
    name: 'Castagniccia',
    description: 'Région montagneuse du centre-est, couverte de châtaigniers et de forêts.',
    color: '#9ea3b9',
    activities: ['Randonnées en forêt', 'Cueillette de châtaignes', 'Villages traditionnels', 'Traditions pastorales', 'Nature sauvage'],
    population: '~20 000 habitants',
    area: '~900 km²',
    mainCities: ['Morosaglia', 'Piedicroce', 'Piedipartino']
  },
  'Centre_Corse': {
    id: 'centre-corse',
    name: 'Centre Corse',
    description: 'Le cœur montagneux de l\'île, avec ses sommets et ses lacs d\'altitude.',
    color: '#bd98bd',
    activities: ['Randonnées en montagne', 'Lacs d\'altitude', 'Escalade', 'VTT', 'Observation de la faune', 'Corte historique'],
    population: '~25 000 habitants',
    area: '~1 100 km²',
    mainCities: ['Corte', 'Vivario', 'Ghisoni']
  },
  'Pays_Bastiais': {
    id: 'pays-bastiais',
    name: 'Pays Bastiais',
    description: 'Région autour de Bastia, deuxième ville de Corse, port industriel et commercial.',
    color: '#ec8258',
    activities: ['Vieille ville de Bastia', 'Port de commerce', 'Université', 'Vie nocturne', 'Shopping', 'Restaurants'],
    population: '~70 000 habitants',
    area: '~1 300 km²',
    mainCities: ['Bastia', 'Furiani', 'Biguglia']
  }
};

export default function CarteCorseSimple() {
  const [selectedZone, setSelectedZone] = useState<ZoneInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleZoneClick = (zoneName: string) => {
    const zone = zonesData[zoneName];
    if (zone) {
      setSelectedZone(zone);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedZone(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Découvrez les Régions de la Corse
      </h2>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="relative w-full h-auto flex justify-center">
          {/* Votre SVG original en arrière-plan */}
          <img 
            src="/Corse_puzzle.svg" 
            alt="Carte de la Corse" 
            className="max-w-full h-auto"
            style={{ maxHeight: '600px' }}
          />
          
          {/* Zones cliquables invisibles par-dessus votre SVG */}
          <div className="absolute inset-0">
            {/* Ouest - Côte ouest */}
            <button
              onClick={() => handleZoneClick('Ouest')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '8%',
                top: '25%',
                width: '15%',
                height: '20%',
                backgroundColor: '#cdd883'
              }}
              title="Corse de l'Ouest"
            />
            
            {/* Sud - Sud de l'île */}
            <button
              onClick={() => handleZoneClick('Sud')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '15%',
                top: '60%',
                width: '18%',
                height: '25%',
                backgroundColor: '#f2b936'
              }}
              title="Corse du Sud"
            />
            
            {/* Corse Orientale - Côte est */}
            <button
              onClick={() => handleZoneClick('Corse_Orientale')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '60%',
                top: '30%',
                width: '20%',
                height: '25%',
                backgroundColor: '#59c9b5'
              }}
              title="Corse Orientale"
            />
            
            {/* Sartenais - Région de Sartène */}
            <button
              onClick={() => handleZoneClick('Sartenais')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '25%',
                top: '70%',
                width: '12%',
                height: '15%',
                backgroundColor: '#6faf59'
              }}
              title="Sartenais"
            />
            
            {/* Balagne - Nord-ouest */}
            <button
              onClick={() => handleZoneClick('Balagne')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '5%',
                top: '10%',
                width: '20%',
                height: '20%',
                backgroundColor: '#f4e14d'
              }}
              title="Balagne"
            />
            
            {/* Pays Ajaccien - Centre-ouest */}
            <button
              onClick={() => handleZoneClick('Pays_Ajaccien')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '20%',
                top: '40%',
                width: '25%',
                height: '25%',
                backgroundColor: '#f0956c'
              }}
              title="Pays Ajaccien"
            />
            
            {/* Castagniccia - Centre-est */}
            <button
              onClick={() => handleZoneClick('Castagniccia')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '65%',
                top: '25%',
                width: '15%',
                height: '20%',
                backgroundColor: '#9ea3b9'
              }}
              title="Castagniccia"
            />
            
            {/* Centre Corse - Centre de l'île */}
            <button
              onClick={() => handleZoneClick('Centre_Corse')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '45%',
                top: '45%',
                width: '20%',
                height: '20%',
                backgroundColor: '#bd98bd'
              }}
              title="Centre Corse"
            />
            
            {/* Pays Bastiais - Nord-est */}
            <button
              onClick={() => handleZoneClick('Pays_Bastiais')}
              className="absolute opacity-0 hover:opacity-20 transition-opacity duration-200"
              style={{
                left: '75%',
                top: '5%',
                width: '20%',
                height: '25%',
                backgroundColor: '#ec8258'
              }}
              title="Pays Bastiais"
            />
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Cliquez directement sur les régions colorées pour découvrir leurs activités
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
