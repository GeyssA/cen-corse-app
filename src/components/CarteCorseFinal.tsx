'use client'

import { useState } from 'react'
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

export default function CarteCorseFinal() {
  const { theme } = useTheme()
  const [zoneSelectionnee, setZoneSelectionnee] = useState<Zone | null>(null)
  const [modalOuvert, setModalOuvert] = useState(false)

  const handleZoneClick = (zone: Zone) => {
    setZoneSelectionnee(zone)
    setModalOuvert(true)
  }

  const handleCloseModal = () => {
    setModalOuvert(false)
    setZoneSelectionnee(null)
  }

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Carte de la Corse avec zones cliquables intégrées */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-6xl">
          {/* SVG intégré directement avec zones cliquables */}
          <svg
            version="1.1"
            id="svg1"
            width="558"
            height="954"
            viewBox="0 0 558 954"
            className="w-full h-full cursor-pointer"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsSvg="http://www.w3.org/2000/svg"
          >
            <defs id="defs1" />
            <g id="g1">
              <g
                id="g12078"
                transform="matrix(1.0318778,0,0,1.0410268,-18.721993,-23.294371)"
              >
                {/* Zone 1 - Balagne */}
                <path
                  d="m 142.99267,560.26054 c 2.36521,-4.03093 -0.60043,-13.97688 -4.67182,-15.66805 -3.8953,-1.61801 -6.40371,-4.79233 -8.24155,-10.42943 -2.02122,-6.19956 -4.43679,-7.78883 -12.15034,-7.99407 -4.60556,-0.12254 -6.87753,-0.74847 -9.70804,-2.67456 -2.03243,-1.38303 -7.11244,-3.55824 -11.288915,-4.83382 -10.553646,-3.22329 -11.125873,-4.04384 -10.828285,-15.52749 0.272828,-10.52817 -1.617952,-12.59814 -5.360556,-5.86856 -3.569025,6.41746 -5.38384,1.7339 -2.898945,-7.48141 3.41333,-12.65846 1.356245,-20.79861 -6.08386,-24.07462 -5.838169,-2.57066 -7.107257,-1.80713 15.435402,-9.28643 21.209119,-7.03684 22.663559,-7.321 31.342369,-6.12336 5.35086,0.7384 5.64989,0.66346 6.24955,-1.56614 1.62508,-6.04219 -0.47198,-10.82058 -4.74874,-10.82058 -2.85439,0 -5.0769,-1.62522 -9.13668,-6.68124 -3.84639,-4.79026 -3.84639,-4.79026 -0.28119,-1.46613 4.65293,4.33831 13.96182,5.79641 22.10576,3.46255 13.27325,-3.80381 14.28639,-3.86977 18.44788,-1.20097 5.90412,3.78637 9.04515,4.88827 13.93429,4.88827 4.88914,0 8.03017,-1.1019 13.93429,-4.88827 4.16149,-2.6688 5.17463,-2.60284 18.44788,1.20097 8.14394,2.33386 17.45483,0.87576 22.10576,-3.46255 3.5652,-3.32413 3.5652,-3.32413 -0.28119,1.46613 -4.05978,5.05602 -6.28229,6.68124 -9.13668,6.68124 -4.27676,0 -6.37382,4.77839 -4.74874,10.82058 0.59966,2.2296 0.89869,2.30454 6.24955,1.56614 8.67878,-1.19764 10.12332,-1.4828 31.342369,6.12336 21.209119,7.03684 21.273574,6.71577 15.435402,9.28643 -5.838169,2.57066 -7.107257,1.80713 -10.828285,15.52749 0.297588,11.48365 -0.274639,12.3042 -10.828285,15.52749 -4.176475,1.27558 -9.256485,3.45079 -11.288915,4.83382 -2.83051,1.92609 -5.10248,2.55202 -9.70804,2.67456 -7.71355,0.20524 -10.12912,1.79451 -12.15034,7.99407 -1.83784,5.6371 -4.34625,8.81142 -8.24155,10.42943 -4.07139,1.69117 -7.03703,11.63712 -4.67182,15.66805"
                  fill="#cdd883"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[0])}
                />
                
                {/* Zone 2 - Cap Corse */}
                <path
                  d="m 328.47143,908.74225 c -4.2215,-2.74318 -8.11858,-4.98761 -8.66018,-4.98761 -0.5416,0 -1.99325,-0.51897 -3.22589,-1.15326 -4.64978,-2.39269 -5.75868,-2.83682 -7.0828,-2.83682 -11.22488,0 -17.39604,-13.30104 -9.58814,-20.66584 6.0203,-5.67866 5.32655,-8.87779 -1.83085,-8.44264 -7.01292,0.42638 -10.52997,-2.67946 -10.27653,-9.07499 0.0918,-2.31616 0.12505,-4.99675 0.0739,-5.95687 -0.14428,-2.71017 -3.67107,-2.09716 -7.09342,1.23295 -5.82077,5.66387 -11.30437,5.25545 -21.58482,-1.60766 -8.50787,-5.67976 -12.74832,-7.20799 -19.82471,-7.14469 -4.13708,0.037 -6.30335,-0.50009 -8.60929,-2.13453 -3.99796,-2.83374 -19.46568,-10.04712 -21.54413,-10.04712 -6.57067,0 14.64978,-17.18603 36.97552,-29.94577 16.50581,-9.4335 23.51267,-17.51733 23.56825,-27.19079 0.0163,-2.83698 0.8419,-7.99712 3.94554,-24.66022 0.45984,-2.46887 1.57343,-8.52881 2.47463,-13.46654 1.71426,-9.3925 3.93985,-20.21433 5.52341,-26.85732 1.62022,-6.79676 7.78247,-17.88742 12.80126,-23.03936 8.24122,-8.45987 12.58"
                  fill="#f4e14d"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[1])}
                />
                
                {/* Zone 3 - Centre Corse */}
                <path
                  d="m 308.39358,665.18452 c -0.2437,-0.73361 -0.67893,-4.70048 -0.96718,-8.81525 -0.65097,-9.29259 -1.472,-14.86669 -2.57127,-17.45663 -0.46573,-1.09728 -1.60159,-4.01503 -2.52414,-6.48389 -0.92255,-2.46887 -4.45938,-9.65103 -7.85962,-15.96035 -3.40025,-6.30933 -8.60703,-16.85812 -11.57064,-23.44176 -14.18113,-31.50334 -20.10911,-39.29807 -31.80512,-41.82072 -5.90307,-1.27321 -7.2099,-3.52214 -7.2099,-12.40765 0,-8.39623 0.55342,-8.78151 13.83878,-9.63441 0.82675,-0.0531 2.85604,-0.64373 4.50953,-1.31257 1.6535,-0.66884 5.4866,-2.18904 8.51801,-3.37823 8.92234,-3.50014 20.99003,-10.06785 31.63985,-17.21965 10.42964,-7.00394 24.13254,-14.01205 33.56735,-17.16743 8.87481,-2.9681 20.86735,-10.28134 24.88243,-15.1737 6.94707,-8.46498 6.12165,-8.07213 16.96054,-8.07213 8.86581,0 29.36871,-2.33877 31.3868,-3.58029 0.44112,-0.27138 7.91703,-0.50429 16.61313,-0.51758 23.29313,-0.0356 33.78283,2.42986 41.45908,9.7444 1.98076,1.88742 4.57374,3.50458 5.76219,3.59369 2.46115,0.18455 3.2371"
                  fill="#bd98bd"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[2])}
                />
                
                {/* Zone 4 - Région de Corte */}
                <path
                  d="m 203.82814,832.01332 c -1.33245,-1.79397 -4.05515,-3.51846 -7.19318,-4.55596 -6.12794,-2.02604 -8.05665,-4.52555 -8.05665,-10.441 0,-6.06738 -13.38731,-19.4644 -18.39069,-18.40403 -2.69717,0.57161 -2.82781,0.44572 -2.3234,-2.23908 0.29395,-1.56462 1.05135,-5.7625 1.68311,-9.32864 1.86511,-10.52816 4.63925,-15.19632 10.01192,-16.8475 15.35315,-4.71848 24.03682,-11.70887 24.0471,-19.35801 0.002,-1.67898 1.05465,-3.83461 2.64489,-5.41756 3.32673,-3.31147 0.67979,-6.25798 -5.62174,-6.25798 -7.26185,0 -14.55463,-2.06288 -21.21317,-6.0005 -4.25096,-2.51387 -7.95608,-3.97471 -10.08102,-3.97471 -7.07937,0 -9.60416,-4.54717 -5.89069,-10.60919 1.68688,-2.75374 1.75281,-3.4409 0.5513,-5.74618 -1.3321,-2.55585 -1.25227,-2.67536 3.34137,-5.0024 23.84624,-12.08001 27.42608,-15.25541 31.70854,-28.12622 6.28211,-18.88066 8.28806,-21.70437 23.73231,-33.40715 9.77213,-7.40477 9.83283,-7.52433 10.17232,-20.03715 0.29912,-11.02466 -0.40286,-8.61251 10.77394,-37.02123 4.49787,-11.43248 4.79051"
                  fill="#9ea3b9"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[3])}
                />
                
                {/* Zone 5 - Région d'Ajaccio */}
                <path
                  d="m 158.20458,435.46571 c -0.8005,-0.79683 -1.69324,-1.21208 -1.98387,-0.92279 -0.29062,0.28929 -2.40721,-0.71165 -4.70352,-2.22431 -4.00055,-2.63529 -4.39198,-2.69954 -9.36155,-1.53659 -2.85254,0.66753 -5.87079,1.33168 -6.70722,1.47588 -0.83644,0.14421 -2.0806,0.60658 -2.7648,1.0275 -0.6842,0.42092 -2.19834,0.4638 -3.36476,0.0953 -1.4258,-0.45045 -1.89606,-0.30811 -1.43507,0.43437 0.38496,0.62002 0.0264,1.10439 -0.81748,1.10439 -0.82675,0 -1.75535,-0.40616 -2.06357,-0.90257 -0.30822,-0.49642 -2.43315,-0.65254 -4.72208,-0.34694 -2.79701,0.37344 -3.94663,0.20926 -3.50584,-0.50068 0.39803,-0.64108 -0.0403,-0.87511 -1.11503,-0.59535 -1.21991,0.31755 -3.89224,-1.76038 -8.58915,-6.6787 -3.75005,-3.92682 -6.26625,-6.80007 -5.59156,-6.385 0.77957,0.47959 0.96923,0.33997 0.52033,-0.38305 -1.18992,-1.9165 -5.041079,-0.64087 -6.401042,2.12023 -0.811631,1.64784 -1.828315,2.40404 -2.755826,2.04975 -2.339683,-0.8937 -1.710041,-3.99402 1.322145,-6.51016 1.535527,-1.2742 3.407306,-3.53583 4"
                  fill="#f0956c"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[4])}
                />
                
                {/* Zone 6 - Région de Sartène */}
                <path
                  d="m 133.4618,719.17392 c -4.03918,-2.13274 -6.9172,-2.91598 -10.77278,-2.93179 -6.29273,-0.0258 -6.72461,-1.28553 -2.19951,-6.4157 2.58084,-2.92593 3.6705,-3.44682 6.93901,-3.31708 8.21959,0.32627 14.50319,-7.13418 11.42342,-13.5629 -2.36166,-4.92974 -1.36956,-6.6484 3.848,-6.66605 12.06431,-0.0408 19.38636,-6.12778 13.05899,-10.8562 -3.18954,-2.38353 -2.42026,-3.35685 4.06527,-5.14357 10.289,-2.83453 13.77749,-10.05429 8.22041,-17.01293 -4.26919,-5.34593 -4.35517,-7.38735 -0.49478,-11.74705 3.82842,-4.32359 3.80107,-4.58573 -1.26154,-12.09059 -7.27702,-10.78752 -10.41548,-11.75517 -19.86222,-6.12394 -6.40006,3.81509 -6.5563,3.85032 -19.9791,4.5045 -17.86062,0.87047 -21.83774,2.00953 -27.953933,8.00612 -5.786881,5.67372 -6.547122,5.12777 -4.023307,-2.88923 2.768583,-8.79453 0.09566,-19.40882 -6.554604,-26.02858 -3.433475,-3.41772 -1.865331,-5.17504 7.466167,-8.36682 13.129817,-4.49098 20.702177,-10.7183 19.524347,-16.05633 -1.13826,-5.15871 6.93715,-11.85221 14.33708,-11.8836"
                  fill="#f2b936"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[5])}
                />
                
                {/* Zone 7 - Région de Porto-Vecchio */}
                <path
                  d="m 469.41321,472.83987 c -1.77229,-2.82488 -8.47676,-7.01951 -12.95538,-8.1055 -14.77008,-3.5815 -30.72934,-4.6529 -42.28731,-2.83889 -15.89819,2.4952 -19.38964,2.93569 -32.41775,4.08991 -14.86335,1.31681 -15.25357,1.25861 -14.0093,-2.08953 0.4718,-1.26956 0.34905,-5.32124 -0.28395,-9.3719 -0.61328,-3.92452 -0.79707,-8.2577 -0.40842,-9.62929 2.06929,-7.30271 0.81369,-11.91879 -5.6949,-20.93672 -1.88092,-2.60609 -3.41986,-5.4438 -3.41986,-6.30601 0,-0.86221 -0.39635,-1.81149 -0.88078,-2.10951 -2.92738,-1.80092 -3.61209,-30.35325 -1.49168,-62.20213 0.86894,-13.05157 -2.92025,-28.73061 -7.64601,-31.63789 -2.09251,-1.28731 0.23864,-2.49549 4.81649,-2.49629 5.53242,-9.6e-4 17.79612,-2.46711 29.75389,-5.9833 24.66276,-7.25212 24.9892,-7.30507 46.73159,-7.58083 34.90727,-0.44271 33.93321,-1.03199 34.31132,20.75724 0.28791,16.59091 0.6307,19.78432 3.16517,29.48608 2.80043,10.71986 2.82265,11.02783 1.50868,20.90993 -1.59709,12.01134 -0.9374,21.10821 2.47893,34.18369 1.3618,5.21205 3"
                  fill="#59c9b5"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[6])}
                />
                
                {/* Zone 8 - Région de Bonifacio */}
                <path
                  d="m 244.71176,529.06472 c 0.008,-0.48235 0.73216,-3.79474 1.60891,-7.36088 4.02418,-16.36813 2.11067,-23.54516 -8.82295,-33.09248 -3.97419,-3.4703 -9.50435,-8.67272 -12.28924,-11.56094 -4.42279,-4.58689 -6.27711,-5.66973 -14.65594,-8.55838 -12.7526,-4.39654 -17.48877,-7.84359 -25.26276,-18.38656 -4.85886,-6.58951 -7.50841,-9.24612 -10.61019,-10.63841 -4.00508,-1.79775 -4.38626,-4.54762 -0.63039,-4.54762 8.63399,0 19.53971,-11.66986 19.53971,-20.90883 0,-3.15273 1.95295,-8.08999 4.94159,-12.49283 1.11153,-1.63749 2.31881,-5.00412 2.68286,-7.48141 0.60025,-4.08471 2.84263,-8.44095 6.03183,-11.71799 2.85738,-2.93608 4.58754,-9.84162 3.46979,-13.84881 -2.31628,-8.30391 0.58639,-13.33649 7.69887,-13.34813 1.42442,-0.002 4.0671,-1.87164 7.05638,-4.99134 4.77909,-4.98761 4.77909,-4.98761 14.40464,-4.98761 9.62555,0 9.62555,0 17.13029,-6.7853 5.07466,-4.58818 8.92098,-7.1941 11.87845,-8.04777 2.40555,-0.69435 5.7586,-1.68093 7.45122,-2.19239 1.69263,-0.51146 4.03892,-0.92993 5.21397"
                  fill="#6faf59"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[7])}
                />
                
                {/* Zone 9 - Région de l'Alta Rocca */}
                <path
                  d="m 244.71176,529.06472 c 0.008,-0.48235 0.73216,-3.79474 1.60891,-7.36088 4.02418,-16.36813 2.11067,-23.54516 -8.82295,-33.09248 -3.97419,-3.4703 -9.50435,-8.67272 -12.28924,-11.56094 -4.42279,-4.58689 -6.27711,-5.66973 -14.65594,-8.55838 -12.7526,-4.39654 -17.48877,-7.84359 -25.26276,-18.38656 -4.85886,-6.58951 -7.50841,-9.24612 -10.61019,-10.63841 -4.00508,-1.79775 -4.38626,-4.54762 -0.63039,-4.54762 8.63399,0 19.53971,-11.66986 19.53971,-20.90883 0,-3.15273 1.95295,-8.08999 4.94159,-12.49283 1.11153,-1.63749 2.31881,-5.00412 2.68286,-7.48141 0.60025,-4.08471 2.84263,-8.44095 6.03183,-11.71799 2.85738,-2.93608 4.58754,-9.84162 3.46979,-13.84881 -2.31628,-8.30391 0.58639,-13.33649 7.69887,-13.34813 1.42442,-0.002 4.0671,-1.87164 7.05638,-4.99134 4.77909,-4.98761 4.77909,-4.98761 14.40464,-4.98761 9.62555,0 9.62555,0 17.13029,-6.7853 5.07466,-4.58818 8.92098,-7.1941 11.87845,-8.04777 2.40555,-0.69435 5.7586,-1.68093 7.45122,-2.19239 1.69263,-0.51146 4.03892,-0.92993 5.21397"
                  fill="#ec8258"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleZoneClick(zonesCorse[8])}
                />
              </g>
            </g>
          </svg>
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
