'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import MainNavigation from '@/components/navigation/MainNavigation'
import SubTabs from '@/components/navigation/SubTabs'
import { useTheme } from '@/contexts/ThemeContext'

// Données de présentation du CEN
// interface Employee { // Temporairement commenté car non utilisé
//   id: string
//   name: string
//   position: string
//   description: string
//   photo: string
// }

const presentationData = {
  title: "Conservatoire d'Espaces Naturels de Corse",
  subtitle: "Protéger et valoriser le patrimoine naturel de la Corse",
  description: "Le Conservatoire d'espaces naturels Corse (CEN Corse) est une association de loi 1901 à but non lucratif, agréée au titre de la protection de l'environnement. Créé en 1972 à l'initiative de naturalistes locaux, il œuvre pour préserver le patrimoine naturel et la biodiversité de l'île. Implanté à Borgo en Haute-Corse et à Ajaccio en Corse-du-Sud, le CEN Corse réunit une équipe de 16 salariés aux expertises variées : Suivis faunistiques, ornithologie, herpétologie, écologie terrestre, gestion de projets complexes, biostatistique, gestion et restauration d'espaces naturels, cartographie, et conception de projets de recherches expérimentaux (génétique, acoustique, écomorphologie, sanitaire, origine de mortalité, etc.). Cette diversité d'expertises rend l'équipe particulièrement polyvalente et capable de répondre efficacement à une large gamme d'enjeux environnementaux.",
  addresses: [
    "871, avenue de Borgo - 20290 Borgo",
    "40 avenue Noël Franchini - 20090 Ajaccio"
  ],
  phone: "04 95 32 71 63",
  email: "contact@cen-corse.org",
  website: "www.cen-corse.org",
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
    },
    {
      id: "16",
      name: "Clément Thomas",
      position: "Chargé de projet",
      description: "Chargé de projet dans le développement de la prise en compte des enjeux ornithologiques dans l'agriculture.",
      photo: "/photos_personnel/Clément Thomas.jpg"
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
}

const subTabs = [
  {
    id: 'cen',
    label: 'CEN Corse',
    icon: null
  },
  {
    id: 'equipe',
    label: 'Notre équipe',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    id: 'soutenir',
    label: 'Soutenir',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  }
]


// Composant pour l'onglet "Le CEN"
function LeCenContent() {
  const { theme } = useTheme()

  return (
    <div className="space-y-8 text-center">
      {/* Présentation */}
      <div>
        <div className={`leading-relaxed text-sm ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
        }`}>
          <p className="mb-4 mt-2">
            Le Conservatoire d'espaces naturels Corse (CEN Corse) est une association de loi 1901 à but non lucratif, agréée au titre de la protection de l'environnement. Créé en 1972 à l'initiative de naturalistes locaux, il œuvre pour préserver le patrimoine naturel et la biodiversité de l'île.
          </p>
          
          <p className="mb-4">
            Implanté à Borgo en Haute-Corse et à Ajaccio en Corse-du-Sud, le CEN Corse réunit une équipe de 16 salariés aux expertises variées :
          </p>
          
          <ul className="mb-4 space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start">
              <span className={`mr-3 mt-1 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>•</span>
              <span>Suivis faunistiques : herpétologie, ornithologie - écologie terrestre</span>
            </li>
            <li className="flex items-start">
              <span className={`mr-3 mt-1 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>•</span>
              <span>Gestion de projets européens ou régionaux</span>
            </li>
            <li className="flex items-start">
              <span className={`mr-3 mt-1 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>•</span>
              <span>Gestion et restauration d'espaces naturels, droit de l'environnement, mesures compensatoires, ORE</span>
            </li>
            <li className="flex items-start">
              <span className={`mr-3 mt-1 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>•</span>
              <span>Cartographie via SIG (système d'informations géographiques) et biostatistiques</span>
            </li>
            <li className="flex items-start">
              <span className={`mr-3 mt-1 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>•</span>
              <span>Conception et réalisation de projets de recherches dans de nombreux domaines : génétique, acoustique, télémétrie, écomorphologie, étude sanitaire, étude de l'origine de mortalité de la faune sauvage</span>
            </li>
            <li className="flex items-start">
              <span className={`mr-3 mt-1 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>•</span>
              <span>Création d'outils pédagogiques, sensibilisation tout public, conférences</span>
            </li>
          </ul>
          
          <p className="mb-4">
            Cette diversité d'expertises rend l'équipe particulièrement polyvalente et capable de répondre efficacement à une large gamme d'enjeux environnementaux.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div>
        <h2 className={`text-xl font-bold mb-4 flex items-center space-x-3 ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          <svg className={`w-6 h-6 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Notre mission</span>
        </h2>
        <p className={`text-sm leading-relaxed text-left ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
        }`}>
          {presentationData.mission}
        </p>
      </div>

      {/* Valeurs */}
      <div>
        <h2 className={`text-xl font-bold mb-4 flex items-center space-x-3 ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          <svg className={`w-6 h-6 ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Nos valeurs</span>
        </h2>
        <div className="space-y-3">
          {presentationData.values.map((value, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                theme === 'light' ? 'bg-orange-500' : 'bg-orange-400'
              }`}></div>
              <span className={`text-sm ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activités */}
      <div>
        <h2 className={`text-xl font-bold mb-4 flex items-center space-x-3 ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          <svg className={`w-6 h-6 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Nos activités</span>
        </h2>
        <div className="space-y-3">
          {presentationData.activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                theme === 'light' ? 'bg-green-500' : 'bg-green-400'
              }`}></div>
              <span className={`text-sm ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>{activity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Informations de contact */}
      <div>
        <h2 className={`text-xl font-bold mb-3 flex items-center space-x-3 ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          <svg className={`w-6 h-6 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Nous contacter</span>
        </h2>
        <div className="space-y-2">
          {presentationData.addresses.map((address, index) => (
            <div key={index} className="flex items-center space-x-3">
              <svg className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer ${
                  theme === 'light' ? 'text-gray-600 hover:text-blue-600' : 'text-gray-300 hover:text-blue-400'
                }`}
              >
                {address}
              </a>
            </div>
          ))}
          <div className="flex items-center space-x-3">
            <svg className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a 
              href={`tel:${presentationData.phone.replace(/\s/g, '')}`}
              className={`text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer ${
                theme === 'light' ? 'text-gray-600 hover:text-green-600' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              {presentationData.phone}
            </a>
          </div>
          <div className="flex items-center space-x-3 mb-3">
            <svg className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a 
              href={`mailto:${presentationData.email}`}
              className={`text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer ${
                theme === 'light' ? 'text-gray-600 hover:text-blue-600' : 'text-gray-300 hover:text-blue-400'
              }`}
            >
              {presentationData.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour l'onglet "Notre équipe"
function NotreEquipeContent() {
  const { theme } = useTheme()
  const [activeOffice, setActiveOffice] = useState('borgo')

  // Organiser les employés par bureau
  const ajaccioEmployeeNames = ['Laetitia', 'Fabien', 'Sébastien', 'Delphine']
  
  const ajaccioEmployees = presentationData.employees.filter(emp => 
    ajaccioEmployeeNames.some(name => emp.name.includes(name))
  )
  
  const borgoEmployees = presentationData.employees.filter(emp => 
    !ajaccioEmployeeNames.some(name => emp.name.includes(name))
  )

  // Fonction pour rendre une carte d'employé
  const renderEmployeeCard = (employee: { id: string; name: string; position: string; description: string; photo: string }) => (
    <div key={employee.id} className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
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
  )

  return (
    <div className="space-y-6">
      {/* Onglets élégants pour les bureaux */}
      <div className="flex space-x-3">
          <button
          onClick={() => setActiveOffice('borgo')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeOffice === 'borgo'
              ? theme === 'light'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : theme === 'light'
                ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                : 'bg-gray-800/30 text-gray-400 hover:bg-gray-700/30 border border-gray-600/30'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          <span>Borgo ({borgoEmployees.length})</span>
          </button>
          
          <button
          onClick={() => setActiveOffice('ajaccio')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeOffice === 'ajaccio'
              ? theme === 'light'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : theme === 'light'
                ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                : 'bg-gray-800/30 text-gray-400 hover:bg-gray-700/30 border border-gray-600/30'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          <span>Ajaccio ({ajaccioEmployees.length})</span>
          </button>
        </div>

      {/* Contenu des employés selon l'onglet actif */}
      <div className="space-y-4">
        {activeOffice === 'borgo' ? (
          borgoEmployees.map(renderEmployeeCard)
        ) : (
          ajaccioEmployees.map(renderEmployeeCard)
        )}
      </div>
    </div>
  )
}

// Composant pour l'onglet "Nous soutenir"
function NousSoutenirContent() {
  const { theme } = useTheme()

  const handleContactClick = (subject: string) => {
    const email = 'contact@cen-corse.org'
    const body = encodeURIComponent(`Bonjour,\n\nJe souhaite ${subject.toLowerCase()}.\n\nCordialement,`)
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`)
  }

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="text-center space-y-3 mt-2">
        <h2 className={`text-xl font-bold ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          Soutenez notre mission
        </h2>
        <p className={`text-sm leading-relaxed ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          Rejoignez-nous dans la protection du patrimoine naturel de la Corse
        </p>
      </div>

      {/* Actions principales */}
      <div className="space-y-4">
        {/* Devenez adhérent */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
          theme === 'light' 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg' 
            : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:shadow-xl'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'light' 
                ? 'bg-green-100' 
                : 'bg-green-500/20'
            }`}>
              <svg className={`w-6 h-6 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${
                theme === 'light' ? 'text-gray-800' : 'text-white'
              }`}>
                Devenez adhérent
              </h3>
              <p className={`text-xs mt-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                Rejoignez notre communauté et participez à nos actions
              </p>
            </div>
            <a 
              href="https://www.helloasso.com/associations/conservatoire-d-espaces-naturels-de-corse-cen-corse/adhesions/campagne-adhesion-2025" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 hover:scale-105 bg-green-600 text-white hover:bg-green-700"
            >
              Adhérer
            </a>
          </div>
        </div>

        {/* Consultez notre rapport d'activité */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
          theme === 'light' 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg' 
            : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 hover:shadow-xl'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'light' 
                ? 'bg-blue-100' 
                : 'bg-blue-500/20'
            }`}>
              <svg className={`w-6 h-6 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${
                theme === 'light' ? 'text-gray-800' : 'text-white'
              }`}>
                Consultez notre rapport d'activité
              </h3>
              <p className={`text-xs mt-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                Découvrez nos actions et résultats de l'année 2024
              </p>
            </div>
            <button 
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/Rapport d\'activité 2024_compressed.pdf'
                link.download = 'Rapport d\'activité 2024_compressed.pdf'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 hover:scale-105 bg-blue-600 text-white hover:bg-blue-700"
            >
              Télécharger
            </button>
          </div>
        </div>
      </div>

      {/* Section Contactez-nous */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${
            theme === 'light' ? 'text-gray-800' : 'text-white'
          }`}>
            Contactez-nous
          </h3>
          <p className={`text-sm mt-1 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
          }`}>
            Pour toute demande spécifique
          </p>
        </div>

        <div className="space-y-0">
          {/* Faire un don */}
          <button
            onClick={() => handleContactClick('Faire un don (pécunier ou matériel)')}
            className="w-full py-4 px-0 text-left transition-all duration-300 hover:opacity-80 border-b-2 border-white/60"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'light' 
                  ? 'bg-gray-100' 
                  : 'bg-gray-700/50'
              }`}>
                <svg className={`w-5 h-5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  Faire un don (pécunier ou matériel)
                </h4>
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  Soutenez nos projets de conservation
                </p>
              </div>
            </div>
          </button>

          {/* Confier la gestion de votre terrain */}
          <button
            onClick={() => handleContactClick('Confier la gestion de votre terrain au CEN Corse')}
            className="w-full py-4 px-0 text-left transition-all duration-300 hover:opacity-80 border-b-2 border-white/60"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'light' 
                  ? 'bg-gray-100' 
                  : 'bg-gray-700/50'
              }`}>
                <svg className={`w-5 h-5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  Confier la gestion de votre terrain au CEN Corse
                </h4>
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  Protégez votre patrimoine naturel avec nos experts
                </p>
              </div>
            </div>
          </button>

          {/* Collaborer ou devenir mécène */}
          <button
            onClick={() => handleContactClick('Collaborer ou devenir mécène')}
            className="w-full py-4 px-0 text-left transition-all duration-300 hover:opacity-80 border-b-2 border-white/60"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'light' 
                  ? 'bg-gray-100' 
                  : 'bg-gray-700/50'
              }`}>
                <svg className={`w-5 h-5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  Collaborer ou devenir mécène
                </h4>
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  Partenariats et soutien institutionnel
                </p>
              </div>
            </div>
          </button>

          {/* Intégrer le conseil d'administration */}
          <button
            onClick={() => handleContactClick('Intégrer le conseil d\'administration')}
            className="w-full py-4 px-0 text-left transition-all duration-300 hover:opacity-80"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'light' 
                  ? 'bg-gray-100' 
                  : 'bg-gray-700/50'
              }`}>
                <svg className={`w-5 h-5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  Intégrer le conseil d'administration
                </h4>
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  Participez à la gouvernance de l'association
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Informations de contact directes */}
      <div className={`p-4 rounded-xl border ${
        theme === 'light' 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-gray-800/30 border-gray-600/30'
      }`}>
        <h4 className={`font-medium text-sm mb-3 ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          Contact direct
        </h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <svg className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a 
              href="mailto:contact@cen-corse.org"
              className={`text-sm transition-colors duration-300 ${
                theme === 'light' ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              contact@cen-corse.org
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <svg className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a 
              href="tel:0495327163"
              className={`text-sm transition-colors duration-300 ${
                theme === 'light' ? 'text-green-600 hover:text-green-800' : 'text-green-400 hover:text-green-300'
              }`}
            >
              04 95 32 71 63
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AProposPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('cen')

  // Gérer le paramètre de requête pour l'onglet actif
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'equipe') {
      setActiveTab('equipe')
    }
  }, [])

  return (
    <ProtectedRoute>
      {/* Header uniforme avec logo et menu utilisateur */}
      <div className="w-full glass-effect border-b border-white/10 h-16 overflow-hidden">
        <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl mx-auto px-0 sm:px-3 md:px-5 py-3 h-full flex items-center justify-between w-full">
          {/* Logo à gauche */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className={`bg-white rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                theme === 'light' ? 'border border-gray-800' : ''
              }`}
              style={{ 
                width: 'clamp(130px, 32vw, 170px)', 
                height: 'clamp(48px, 13vw, 64px)' 
              }}
            >
              <img 
                src="/Logo_CENCorse.png" 
                alt="CEN Corse" 
                className="w-10/12 h-10/12 object-contain"
                style={{ display: 'block' }}
              />
            </button>
          </div>

          {/* UserMenu à droite */}
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Sous-onglets */}
      <SubTabs 
        tabs={subTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Fond adaptatif pour la section principale */}
      <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 pb-20 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'
      }`}>
        {/* Contenu principal */}
        <main className="max-w-lg mx-auto px-4 pt-3 pb-4 space-y-6 w-full overflow-x-hidden">
          {activeTab === 'cen' && <LeCenContent />}
          {activeTab === 'equipe' && <NotreEquipeContent />}
          {activeTab === 'soutenir' && <NousSoutenirContent />}
        </main>
      </div>

      {/* Navigation principale en bas */}
      <MainNavigation />
    </ProtectedRoute>
  )
}
