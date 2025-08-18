'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Liste des photos disponibles avec leurs noms
const PHOTOS = [
  {
    src: '/photos_page_accueil/Plaine de Linguizzetta-2025-© Geyssels A..jpg',
    name: 'Plaine de Linguizzetta\n2025\n© Geyssels A.'
  },
  {
    src: '/photos_page_accueil/Col du Monaco-Pianottoli Caldarello-2024-© Geyssels A..jpg',
    name: 'Col du Monaco\nPianottoli Caldarello\n2024\n© Geyssels A.'
  },
  {
    src: '/photos_page_accueil/Bufotes viridis balearicus-Lucciana-2011-© Hamoric N..jpg',
    name: 'Bufotes viridis balearicus\nLucciana\n2011\n© Hamoric N.'
  },
  {
    src: '/photos_page_accueil/Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
    name: 'Bufotes viridis balericus\nBoziu (1100 m)\n2025\n© Ertzscheid N.'
  },
  {
    src: '/photos_page_accueil/Amplexus de Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
    name: 'Amplexus de Bufotes viridis balericus\nBoziu (1100 m)\n2025\n© Ertzscheid N.'
  }
]

// Composant carrousel de photos
function PhotoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const router = useRouter()

  // Navigation
  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % PHOTOS.length)
  }

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + PHOTOS.length) % PHOTOS.length)
  }

  // Gestion du swipe pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextPhoto()
    }
    if (isRightSwipe) {
      prevPhoto()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const currentPhoto = PHOTOS[currentIndex]

  return (
    <div 
      className="relative w-full h-48 rounded-2xl shadow-2xl overflow-hidden group cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        console.log('Clic sur le carrousel détecté')
        router.push('/gallery')
      }}
    >
      <img 
        src={currentPhoto.src} 
        alt="Paysage CEN Corse" 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none pointer-events-none"
      />
      
      {/* Overlay avec gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-green-900/10 pointer-events-none"></div>
      
      {/* Boutons de navigation */}
      <button 
        onClick={(e) => {
          e.stopPropagation()
          prevPhoto()
        }}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        onClick={(e) => {
          e.stopPropagation()
          nextPhoto()
        }}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Indicateurs de position */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 pointer-events-none">
        {PHOTOS.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex(index)
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 pointer-events-auto ${
              index === currentIndex 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

interface Employee {
  id: string
  name: string
  position: string
  description: string
  photo: string
}

interface PresentationData {
  title: string
  subtitle: string
  description: string
  addresses: string[]
  phone: string
  email: string
  website: string
  mainPhoto: string
  employeeCount: number
  employees: Employee[]
  mission: string
  values: string[]
  activities: string[]
}

export default function Presentation() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%' })
  const [presentationData, setPresentationData] = useState<PresentationData>({
    title: "Conservatoire d'Espaces Naturels de Corse",
    subtitle: "Protéger et valoriser le patrimoine naturel de la Corse",
    description: " Le Conservatoire d’espaces naturels Corse (CEN Corse) est une association de loi 1901 à but non lucratif, agréée au titre de la protection de l’environnement. Créé en 1972 à l’initiative de naturalistes locaux, il œuvre pour préserver le patrimoine naturel et la biodiversité de l’île. Implanté à Borgo en Haute-Corse et à Ajaccio en Corse-du-Sud, le CEN Corse réunit une équipe de 16 salariés aux expertises variées : Suivis faunistiques, ornithologie, herpétologie, écologie terrestre, gestion de projets complexes, biostatistique, gestion et restauration d'espaces naturels, cartographie, et conception de projets de recherches expérimentaux (génétique, acoustique, écomorphologie, sanitaire, origine de mortalité, etc.). Cette diversité d’expertises rend l’équipe particulièrement polyvalente et capable de répondre efficacement à une large gamme d’enjeux environnementaux.",

    addresses: [
      "871, avenue de Borgo - 20290 Borgo",
      "40 avenue Noël Franchini - 20090 Ajaccio"
    ],
    phone: "04 95 32 71 63",
    email: "contact@cen-corse.org",
    website: "www.cen-corse.org",
    mainPhoto: "/photos_page_accueil/Plaine de Linguizzetta-2025-© Geyssels A..jpg",
    employeeCount: 16,
    employees: [
      {
        id: "3",
        name: "Audrey Favale",
        position: "Directrice",
        description: "Directrice du CEN Corse, responsable de la gestion globale de l'association et de la coordination des projets.",
        photo: "/photos_personnel/Audrey Favale.jpg"
      },
      {
        id: "4",
        name: "Laetitia Antonelli",
        position: "Responsable d'antenne et pôle foncier",
        description: "Responsable de l'antenne d'Ajaccio et du pôle foncier, spécialisée dans la gestion des espaces naturels.",
        photo: "/photos_personnel/Laetitia Antonelli.jpg"
      },
      {
        id: "5",
        name: "Maud Marsicano",
        position: "Assistante administrative et comptable",
        description: "Assistante administrative et comptable, responsable de la gestion administrative et financière de l'association.",
        photo: "/photos_personnel/Maud Marsicano.jpg"
      },
      {
        id: "6",
        name: "Margaux Bourot",
        position: "Chargée de communication",
        description: "Chargée de communication, responsable de la communication interne et externe de l'association.",
        photo: "/photos_personnel/Margaux Bourot.jpg"
      },
      {
        id: "7",
        name: "Carole Attie",
        position: "Chargée de mission Ornithologie",
        description: "Spécialiste en ornithologie et suivi des populations d'oiseaux de Corse.",
        photo: "/photos_personnel/Carole Attie.jpg"
      },
      {
        id: "8",
        name: "Nicolas Pailhes",
        position: "Chargé de mission Flore/hydrologie",
        description: "Expert en flore insulaire et hydrologie, spécialisé dans la gestion des écosystèmes aquatiques.",
        photo: "/photos_personnel/Nicolas Pailhes.jpg"
      },
      {
        id: "9",
        name: "Delphine Triponel",
        position: "Chargée de mission Mesures Compensatoires",
        description: "Spécialiste en mesures compensatoires et gestion des impacts environnementaux.",
        photo: "/photos_personnel/Delphine Triponel.jpg"
      },
      {
        id: "1",
        name: "Arnaud Geyssels",
        position: "Chargé de projet biodiversité",
        description: "Herpétologue et écologue impliqué dans les suivis faunistiques et projets de recherche en herpétologie.",
        photo: "/photos_personnel/Arnaud Geyssels.jpg"
      },
      {
        id: "2",
        name: "Thomas Muller",
        position: "Chargé d'étude herpétologue et animateur EEDD",
        description: "Spécialiste en écologie et conservation, impliqué dans les projets de protection de la biodiversité insulaire.",
        photo: "/photos_personnel/Thomas Muller.jpg"
      },
      {
        id: "10",
        name: "Ludovic Lepori",
        position: "Chargé de projets Ornithologie",
        description: "Spécialiste en ornithologie, impliqué dans les projets de suivi et de protection des oiseaux de Corse.",
        photo: "/photos_personnel/Ludovic Lepori.jpg"
      },
      {
        id: "11",
        name: "Marie-Paule Savelli",
        position: "Chargée de projets Faune",
        description: "Spécialiste en faune terrestre et marine, impliquée dans les projets de suivi et de protection des espèces animales.",
        photo: "/photos_personnel/Marie-Paule Savelli.jpg"
      },
      {
        id: "12",
        name: "Sarah Ferjani",
        position: "Chargée de projets Gestion de Site",
        description: "Spécialiste en gestion de sites naturels, impliquée dans la gestion et la protection des espaces naturels.",
        photo: "/photos_personnel/Sarah Ferjani.jpg"
      },
      {
        id: "13",
        name: "Sébastien Cart",
        position: "Chargé d'étude Ornithologie",
        description: "Spécialiste en ornithologie, impliqué dans les études et le suivi des populations d'oiseaux de Corse.",
        photo: "/photos_personnel/Sébastien Cart.jpg"
      },
      {
        id: "14",
        name: "Gabin Tijou",
        position: "Chargé d'étude Ornithologie",
        description: "Spécialiste en ornithologie, impliqué dans les études et le suivi des populations d'oiseaux de Corse.",
        photo: "/photos_personnel/Gabin Tijou.jpg"
      },
      {
        id: "15",
        name: "Fabien Valles",
        position: "Chargé d'étude Ornithologie & mesures compensatoires",
        description: "Spécialiste en ornithologie et mesures compensatoires, impliqué dans les études et la gestion des impacts environnementaux.",
        photo: "/photos_personnel/Fabien Valles.jpg"
      }
    ],
    mission: "Notre mission est de préserver la biodiversité exceptionnelle de la Corse en menant des actions de connaissance, de protection et de gestion des espaces naturels, tout en sensibilisant le public à la richesse de notre patrimoine naturel.",
    values: [
      "Excellence scientifique",
      "Respect de la biodiversité",
      "Implication citoyenne",
      "Développement durable"
    ],
    activities: [
      "Inventaires et suivis de la biodiversité",
      "Gestion d'espaces naturels protégés",
      "Actions de conservation d'espèces menacées",
      "Sensibilisation et éducation à l'environnement",
      "Accompagnement des politiques publiques"
    ]
  })

  const handleEdit = () => {
    if (profile?.role === 'admin') {
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    // Ici on pourrait sauvegarder les modifications en base
    setIsEditing(false)
  }

  const handleOpenInfoModal = () => {
    // Calculer la position au centre de la fenêtre visible
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    const scrollY = window.scrollY
    
    setModalPosition({
      top: `${scrollY + (windowHeight / 2)}px`,
      left: `${windowWidth / 2}px`
    })
    setShowInfoModal(true)
  }

  return (
    <ProtectedRoute>
      {/* Header avec navigation */}
      <div className="w-full glass-effect border-b border-white/10 h-16 overflow-hidden">
        <div className="max-w-md mx-auto px-4 py-3 h-full flex items-center justify-between w-full">
          <Link href="/" className="flex items-center space-x-4">
            <div className="bg-white rounded-2xl shadow-2xl flex items-center justify-center" style={{ width: '150px', height: '56px' }}>
              <img 
                src="/Logo_CENCorse.png" 
                alt="CEN Corse" 
                className="w-10/12 h-10/12 object-contain"
                style={{ display: 'block' }}
              />
            </div>
          </Link>
          
          {/* Bouton Infos */}
          <button
            onClick={handleOpenInfoModal}
            className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
            title="Informations"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fond sombre pour la section principale */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen w-full overflow-x-hidden">
        {/* Contenu principal */}
        <main className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-6 w-full overflow-x-hidden pl-4 pr-4 sm:pl-4 sm:pr-4">
          
          {/* Bouton retour */}
          <div className="flex items-center justify-start">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Retour</span>
            </Link>
          </div>

          {/* Titre principal */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-2 gradient-text">
              L'équipe du CEN Corse
            </h1>
            <p className="text-gray-300 text-sm">
              Protéger et connaitre le patrimoine naturel de Corse
            </p>
          </div>

          {/* Carrousel de photos */}
          <PhotoCarousel />

          {/* Description principale */}
          <div className="glass-effect p-6 rounded-2xl shadow-lg">
            <div>
              <div className={`text-gray-300 leading-relaxed text-sm text-justify transition-all duration-300 ${
                showFullDescription ? 'max-h-none' : 'max-h-40 overflow-hidden'
              }`}>
                <p className="mb-3">
                  Le Conservatoire d'espaces naturels Corse (CEN Corse) est une association de loi 1901 à but non lucratif, agréée au titre de la protection de l'environnement. Créé en 1972 à l'initiative de naturalistes locaux, il œuvre pour préserver le patrimoine naturel et la biodiversité de l'île.
                </p>
                
                {showFullDescription && (
                  <>
                    <p className="mb-3">
                      Implanté à Borgo en Haute-Corse et à Ajaccio en Corse-du-Sud, le CEN Corse réunit une équipe de 16 salariés aux expertises variées :
                    </p>
                    
                    <ul className="mb-3 space-y-1">
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2 mt-1">•</span>
                        <span>Suivis faunistiques : herpétologie, ornithologie - écologie terrestre</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2 mt-1">•</span>
                        <span>Gestion de projets européens ou régionaux</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2 mt-1">•</span>
                        <span>Gestion et restauration d'espaces naturels, droit de l'environnement, mesures compensatoires, ORE</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2 mt-1">•</span>
                        <span>Cartographie via SIG (système d'informations géographiques) et biostatistiques</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2 mt-1">•</span>
                        <span>Conception et réalisation de projets de recherches dans de nombreux domaines : génétique, acoustique, télémétrie, écomorphologie, étude sanitaire, étude de l'origine de mortalité de la faune sauvage</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2 mt-1">•</span>
                        <span>Création d'outils pédagogiques, sensibilisation tout public, conférences</span>
                      </li>
                    </ul>
                    
                    <p className="mb-3">
                      Cette diversité d'expertises rend l'équipe particulièrement polyvalente et capable de répondre efficacement à une large gamme d'enjeux environnementaux.
                    </p>
                  </>
            )}
          </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="py-1.5 px-3 text-gray-400 hover:text-gray-300 text-xs transition-all duration-300 hover:scale-105 active:scale-95 underline hover:no-underline"
                >
                  {showFullDescription ? 'Voir moins' : 'Voir plus'}
                </button>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="glass-effect p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Notre mission</span>
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {presentationData.mission}
            </p>
          </div>

          {/* Informations de contact */}
          <div className="glass-effect p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Nous contacter</span>
            </h2>
            <div className="space-y-3">
              {presentationData.addresses.map((address, index) => (
                <div key={index} className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-blue-400 text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer"
                  >
                    {address}
                  </a>
              </div>
              ))}
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a 
                  href={`tel:${presentationData.phone.replace(/\s/g, '')}`}
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer"
                >
                  {presentationData.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a 
                  href={`mailto:${presentationData.email}`}
                  className="text-gray-300 hover:text-blue-400 text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer"
                >
                  {presentationData.email}
                </a>
              </div>
            </div>
          </div>

          {/* Équipe */}
          <div className="glass-effect p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
                              <span>Notre équipe ({presentationData.employeeCount} salariés)</span>
            </h2>
            <div className="max-h-[28rem] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {presentationData.employees.map((employee) => (
                <div key={employee.id} className={`flex items-start space-x-4 p-4 rounded-xl ${
                  theme === 'light' ? 'bg-blue-50/80 border border-blue-100' : 'bg-white/5'
                }`}>
                  <Link href={`/presentation/${employee.id}`} className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300 relative group">
                    {/* Contour illuminé animé */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    <div className="absolute inset-0.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    {/* Image avec masque pour le contour */}
                    <div className="absolute inset-1.5 rounded-full overflow-hidden">
                      <img 
                        src={employee.photo} 
                        alt={employee.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${
                      theme === 'light' ? 'text-gray-800' : 'text-white'
                    }`}>{employee.name}</h3>
                    <p className={`text-xs mb-2 ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                    }`}>{employee.position}</p>
                    <p className={`text-xs leading-relaxed ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>{employee.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Valeurs */}
          <div className="glass-effect p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Nos valeurs</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {presentationData.values.map((value, index) => (
                <div key={index} className={`flex items-center space-x-2 p-3 rounded-lg ${
                  theme === 'light' ? 'bg-orange-50/80 border border-orange-100' : 'bg-white/5'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    theme === 'light' ? 'bg-orange-500' : 'bg-orange-400'
                  }`}></div>
                  <span className={`text-xs ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activités */}
          <div className="glass-effect p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Nos activités</span>
            </h2>
            <div className="space-y-3">
              {presentationData.activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    theme === 'light' ? 'bg-green-500' : 'bg-green-400'
                  }`}></div>
                  <span className={`text-sm ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>{activity}</span>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* Modal d'informations */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in duration-300 z-50" style={{ 
            position: 'fixed',
            top: modalPosition.top,
            left: modalPosition.left,
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Astuce</span>
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-300 text-sm leading-relaxed">
                📸 <strong>Découvrez notre galerie photo !</strong>
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                Cliquez sur le carrousel de photos en haut de cette page pour accéder à notre collection complète en format plus large.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 text-sm"
              >
                Compris !
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
