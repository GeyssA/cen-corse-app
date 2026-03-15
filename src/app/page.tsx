'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import UserMenu from '@/components/navigation/UserMenu'
import MainNavigation from '@/components/navigation/MainNavigation'
import { LazyPWAInstallPrompt, LazyOnboardingModal } from '@/components/LazyComponent'
import ObservationModal from '@/components/ObservationModal'
import AddSiteModal from '@/components/AddSiteModal'
import VoiceObservationFab from '@/components/VoiceObservationFab'
import ObservationsSitesMapModal, { preloadMapChunk } from '@/components/ObservationsSitesMapModal'
import { isCapacitorNative, requestLocationPermissionIfNeeded } from '@/lib/geolocation'
// import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { getSitesByUser } from '@/lib/sites'
import { getObservationsByUser } from '@/lib/observations'
import { setCachedMapData } from '@/lib/mapDataCache'
import { useProjectsContext } from '@/contexts/ProjectsContext'
import { getActivities, Activity } from '@/lib/activities'

// Liste des photos disponibles avec leurs noms
const PHOTOS = [
  {
    src: '/photos_page_accueil/Plaine de Linguizzetta-2025-© Geyssels A..jpg',
    name: 'Plaine de Linguizzetta',
    location: '2025',
    author: '© Geyssels A.'
  },
  {
    src: '/photos_page_accueil/Col du Monaco-Pianottoli Caldarello-2024-© Geyssels A..jpg',
    name: 'Col du Monaco',
    location: 'Pianottoli Caldarello',
    author: '© Geyssels A.'
  },
  {
    src: '/photos_page_accueil/Bufotes viridis balearicus-Lucciana-2011-© Hamoric N..jpg',
    name: 'Bufotes viridis balearicus',
    location: 'Lucciana',
    author: '© Hamoric N.'
  },
  {
    src: '/photos_page_accueil/Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
    name: 'Bufotes viridis balearicus',
    location: 'Boziu (1100 m)',
    author: '© Ertzscheid N.'
  },
  {
    src: '/photos_page_accueil/Amplexus de Bufotes viridis balericus-Boziu (1100 mètres d\'altitude)-2025-© Ertzscheid N..jpg',
    name: 'Amplexus de Bufotes viridis balearicus',
    location: 'Boziu (1100 m)',
    author: '© Ertzscheid N.'
  }
]

// Bande défilante Collaborateurs & Partenaires (slider infini)
function CollaborateursBande() {
  const { theme } = useTheme()
  const logos = [
    { src: "/Logos_soutien/SHF.png", alt: "SHF" },
    { src: "/Logos_soutien/Fonds Vert.png", alt: "Fonds Vert" },
    { src: "/Logos_soutien/MNHN.png", alt: "MNHN" },
    { src: "/Logos_soutien/EDF.png", alt: "EDF" },
    { src: "/Logos_soutien/CBNC.jpg", alt: "CBNC" },
    { src: "/Logos_soutien/CdCorse.jpg", alt: "CdCorse" },
    { src: "/Logos_soutien/CPIE CORTE.jpg", alt: "CPIE Corte" },
    { src: "/Logos_soutien/biophonia.png", alt: "Biophonia" },
    { src: "/Logos_soutien/CEN Lorraine.jpg", alt: "CEN Lorraine" },
    { src: "/Logos_soutien/Logo_Soptom.png", alt: "SOPTOM" }
  ]
  const duplicated = [...logos, ...logos]
  const isLight = theme === 'light'
  return (
    <div className={`w-full py-5 px-4 overflow-hidden ${isLight ? 'bg-gray-100/80' : 'bg-gray-800/50'}`}>
      <p className={`text-center text-[11px] font-medium uppercase tracking-widest mb-3 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
        Collaborateurs & Partenaires
      </p>
      <div className="relative w-full overflow-hidden">
        <div 
          className="flex gap-10 w-max animate-scroll-logos"
          style={{ width: 'max-content' }}
        >
          {duplicated.map((logo, i) => (
            <div key={i} className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-white rounded-xl p-1.5 shadow-sm">
              <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain opacity-90" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Composant photo du jour avec changement quotidien
function PhotoOfTheDay() {
  const router = useRouter()
  const { theme } = useTheme()

  // Calculer l'index de la photo basé sur la date du jour
  const getPhotoIndex = () => {
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    return dayOfYear % PHOTOS.length
  }
  
  const currentPhoto = PHOTOS[getPhotoIndex()]

  return (
    <div className="relative w-full h-[26vh] min-h-[190px] max-h-[240px] overflow-hidden group">
      <img 
        src={currentPhoto.src} 
        alt="Photo du jour CEN Corse" 
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] select-none pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90 mb-0.5">Photo du jour</p>
            <p className="text-lg font-bold text-white drop-shadow-md truncate">{currentPhoto.name}</p>
          </div>
          <button
            onClick={() => router.push('/ressources?tab=galerie')}
            className={`flex-shrink-0 rounded-full p-3 transition-all duration-300 hover:scale-105 backdrop-blur-md border border-white/20 ${
              theme === 'light' ? 'bg-white/95 hover:bg-white text-gray-800' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            aria-label="Voir la galerie"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function HomeContent() {
  const { user, profile } = useAuth(); // Utiliser useAuth pour vérifier l'auth
  const { projects } = useProjectsContext(); // Récupérer les projets
  const router = useRouter();
  const searchParams = useSearchParams();
  // const { isOnline, pendingSync, isSyncing, forceSync } = useOfflineSync();
  const isOnline = true;
  const pendingSync: any[] = [];
  const isSyncing = false;
  const forceSync = () => {};
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [voiceInitialForm, setVoiceInitialForm] = useState<Partial<{
    groupe: string
    nom_espece: string
    stade: string
    sexe: string
    effectif: string
    remarques: string
  }> | undefined>(undefined);
  const [voiceInitialPosition, setVoiceInitialPosition] = useState<{ latitude: number; longitude: number } | null | undefined>(undefined);
  const [voiceTranscript, setVoiceTranscript] = useState<string | undefined>(undefined);
  const [showVoiceInfo, setShowVoiceInfo] = useState(false);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [sitesRefreshKey, setSitesRefreshKey] = useState(0);
  const { theme } = useTheme();
  const [upcomingActivitiesCount, setUpcomingActivitiesCount] = useState(0);
  
  // Compter les projets en cours (status === 'active')
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;

  // Précharger le chunk de la carte en arrière-plan pour ouvrir "Voir la map" plus vite
  useEffect(() => {
    if (!user?.id) return;
    const t = setTimeout(() => {
      preloadMapChunk();
      // Précharger aussi les données (sites + obs) pour que la 1ère ouverture soit plus rapide
      Promise.all([getObservationsByUser(user.id), getSitesByUser(user.id)])
        .then(([observations, sites]) => setCachedMapData(user.id, { observations, sites }))
        .catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [user?.id]);

  // Plus besoin d'intercepter - les templates redirigent directement

  // Vérifier si c'est la première connexion - SEULEMENT si connecté ET a un nom (après modale Prénom Nom)
  useEffect(() => {
    if (!user || !profile) {
      setShowOnboarding(false);
      return;
    }
    // Ne pas afficher l'onboarding tant que l'utilisateur n'a pas renseigné son Prénom Nom (modale affichée avant)
    if (!profile.full_name?.trim() || profile.full_name === 'Utilisateur') {
      setShowOnboarding(false);
      return;
    }
    
    // Vérifier si CET utilisateur a déjà vu l'onboarding
    const userOnboardingKey = `hasSeenOnboarding_${user.id}`;
    const hasSeenOnboarding = localStorage.getItem(userOnboardingKey);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('🔍 Vérification onboarding:', { 
      userId: user.id,
      hasSeenOnboarding,
      userOnboardingKey,
      isPWA, 
      user: `CONNECTÉ: ${user.email}`,
      profile: 'PROFIL PRÉSENT'
    });
    
    // L'onboarding ne s'affiche que si :
    // 1. L'utilisateur est connecté, a un profil avec un nom
    // 2. ET qu'il n'a pas encore vu l'onboarding (pour CET utilisateur)
    if (!hasSeenOnboarding) {
      console.log('🔧 Première connexion de cet utilisateur - Affichage onboarding');
      setShowOnboarding(true);
    } else {
      console.log('🔧 Utilisateur a déjà vu l\'onboarding');
      setShowOnboarding(false);
    }
  }, [user, profile]); // Dépend de user et profile

  // DÉSACTIVER le service worker pour tester
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log('🚫 Désactivation du Service Worker:', registration)
          registration.unregister()
        })
      })
    }
  }, [])

  // Charger les activités à venir dans le mois
  useEffect(() => {
    const loadUpcomingActivities = async () => {
      try {
        const activities = await getActivities();
        const now = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        // Filtrer les activités à venir dans le mois
        const upcomingActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.activity_date);
          return activityDate >= now && activityDate <= oneMonthLater;
        });

        setUpcomingActivitiesCount(upcomingActivities.length);
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
      }
    };

    loadUpcomingActivities();
  }, [])

  return (
    <ProtectedRoute>
      {/* Bandeau fixe : même couleur que la barre système, sans ligne de séparation */}
      <header className="app-header-bar w-full flex items-center justify-center">
        <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl mx-auto px-0 sm:px-3 md:px-5 w-full h-full flex items-center justify-between py-0.5">
          <div className="flex items-center min-h-0">
            <button
              onClick={() => setShowOnboarding(true)}
              className="rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg bg-white"
              style={{ width: 'clamp(120px, 30vw, 172px)', height: 'clamp(34px, 9vw, 44px)' }}
            >
              <img src="/Logo_CENCorse.png" alt="CEN Corse" className="h-9 w-auto max-w-[160px] object-contain block" />
            </button>
          </div>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Contenu (la réserve pour le bandeau fixe est dans .scroll-container) */}
      <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950' 
          : 'bg-gradient-to-b from-slate-50 via-blue-50/80 to-emerald-50/50'
      }`}>
        {/* Photo du jour — en premier, pleine largeur, sans bords arrondis */}
        <section className="w-full">
          <PhotoOfTheDay />
        </section>

        <main className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-8 w-full overflow-x-hidden">
          {/* Projets en cours + Activités du mois — encadrés côte à côte, typos similaires */}
          <section className="flex items-stretch gap-2">
            <div
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium min-w-0 border ${
                theme === 'light'
                  ? 'bg-white/80 border-gray-200 text-gray-700'
                  : 'bg-gray-800/60 border-gray-600/70 text-gray-300'
              }`}
            >
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="truncate">
                {activeProjectsCount} projet{activeProjectsCount > 1 ? 's' : ''} en cours
              </span>
            </div>
            <button
              onClick={() => router.push('/communaute?tab=activites&subtab=upcoming')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 min-w-0 border ${
                theme === 'light'
                  ? 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-800/60 border-gray-600/70 text-gray-300 hover:bg-gray-800/80'
              }`}
            >
              <svg className={`w-4 h-4 flex-shrink-0 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="truncate">Activités du mois</span>
              {upcomingActivitiesCount > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                  {upcomingActivitiesCount}
                </span>
              )}
            </button>
          </section>

          {/* Données naturalistes — encart soigné avec touches de couleur */}
          <section className={`mt-6 relative overflow-hidden rounded-2xl border ${
            theme === 'light'
              ? 'bg-white/95 shadow-md shadow-slate-200/50 border-emerald-200/60'
              : 'bg-slate-800/50 shadow-lg shadow-black/20 border-emerald-800/40'
          }`}>
            {/* Bandeau d’accent à gauche — vert doux */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
              theme === 'light' ? 'bg-emerald-500/80' : 'bg-emerald-500/70'
            }`} />
            <div className="pl-5 pr-4 py-5">
              <div className="flex items-center gap-3 mb-1">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  theme === 'light' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <div>
                  <h2 className={`text-lg font-bold tracking-tight ${
                    theme === 'light' ? 'text-slate-800' : 'text-slate-100'
                  }`}>
                    Données naturalistes
                  </h2>
                  <p className={`text-sm mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Contribuez à la connaissance de la biodiversité en enregistrant vos observations sur le terrain.
                  </p>
                </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    if (isCapacitorNative()) await requestLocationPermissionIfNeeded()
                    setShowObservationModal(true)
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 hover:opacity-95 active:scale-[0.99] border w-full ${
                    theme === 'light'
                      ? 'bg-emerald-50/80 hover:bg-emerald-100/80 text-slate-700 border-emerald-200/60 shadow-sm hover:shadow'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-slate-200 border-emerald-500/20'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'light' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-emerald-500/25 text-emerald-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2V5a2 2 0 00-2-2h-2" />
                      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium block">Ajouter une observation</span>
                    <span className="text-xs opacity-80">Espèce, lieu, effectif…</span>
                  </div>
                </button>
                <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'text-emerald-700/80' : 'text-emerald-400/80'}`}>
                  <div className={`animate-voice-ring rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/40'}`}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setVoiceModeEnabled((v) => !v)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVoiceModeEnabled((v) => !v); } }}
                      className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border w-full cursor-pointer ${
                        voiceModeEnabled
                          ? theme === 'light'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                            : 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                          : theme === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/60'
                            : 'bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 border-slate-600/50'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${
                        voiceModeEnabled
                          ? theme === 'light' ? 'bg-emerald-200/80 text-emerald-700' : 'bg-emerald-500/30 text-emerald-400'
                          : theme === 'light' ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      </span>
                      {voiceModeEnabled ? 'Saisie vocale activée' : 'Activer la saisie vocale'}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowVoiceInfo((v) => !v); }}
                        aria-label="Info saisie vocale"
                        className={`ml-2 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-0 transition-colors ${
                          showVoiceInfo
                            ? theme === 'light'
                              ? 'bg-sky-100 text-sky-700 shadow-sm'
                              : 'bg-sky-500/30 text-sky-300 shadow-sm'
                            : theme === 'light'
                              ? 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                              : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 11v5M12 7v1" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {showVoiceInfo && (
                    <p className={`mt-2 px-3 pb-3 text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      En activant la saisie vocale, un bouton apparaît en bas à droite de l&apos;écran (et sur l&apos;écran de verrouillage) pour décrire votre observation de façon succincte et distincte à l&apos;oral. Il ne vous restera plus qu&apos;à vérifier et valider l&apos;observation.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (isCapacitorNative()) await requestLocationPermissionIfNeeded()
                  setShowAddSiteModal(true)
                }}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 hover:opacity-95 active:scale-[0.99] border ${
                  theme === 'light'
                    ? 'bg-sky-50/80 hover:bg-sky-100/80 text-slate-700 border-sky-200/60 shadow-sm hover:shadow'
                    : 'bg-sky-500/10 hover:bg-sky-500/20 text-slate-200 border-sky-500/20'
                }`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'light' ? 'bg-sky-100 text-sky-700 shadow-sm' : 'bg-sky-500/25 text-sky-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-medium block">Ajouter un site</span>
                  <span className="text-xs opacity-80">Lieu d’observation récurrent</span>
                </div>
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-3 px-1">
              <button
                onClick={() => setShowMapModal(true)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/60'
                    : 'bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 border-slate-600/50'
                }`}
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.45-2.72A1 1 0 013 16.382V5.618a1 1 0 011.55-.832L9 7m0 13l6-3m-6 3V7m6 10l4.55 2.27a1 1 0 001.45-.83V5.618a1 1 0 00-.55-.832L15 4m0 0V4m0 0L9 7" />
                </svg>
                Voir mes données sur la map
              </button>
              <button
                onClick={() => router.push('/validation')}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  theme === 'light'
                    ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-200/70'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border-amber-500/30'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Exportez vos données (.csv)
              </button>
            </div>
            </div>
          </section>

          {/* Réseaux — intégré, sans encadré */}
          <section className="!mt-1 mb-2">
            <p className={`text-center text-[11px] font-medium uppercase tracking-widest mb-1 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
              Suivez-nous
            </p>
            <div className="flex items-center justify-center gap-4">
            <a href="https://www.facebook.com/CENcorse" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-105 transition-transform">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/cen_corse/" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center text-white hover:scale-105 transition-transform">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/conservatoire-d-espaces-naturels-corse/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-[#0A66C2] flex items-center justify-center text-white hover:scale-105 transition-transform">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://www.cen-corse.org/" target="_blank" rel="noopener noreferrer" className={`w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform bg-white ${theme === 'dark' ? 'border border-gray-600' : ''}`}>
              <img src="/small_cen.png" alt="CEN" className="w-9 h-9 object-contain" />
            </a>
            </div>
          </section>
        </main>

        {/* Collaborateurs & Partenaires — bande grisée sur toute la largeur */}
        <section className="w-full mt-1">
          <CollaborateursBande />
        </section>

          {/* Indicateur de synchronisation */}
          {!isOnline && (
            <div className="fixed top-4 right-4 z-50">
              <div className="glass-effect text-orange-400 px-3 py-2 rounded-lg text-xs font-medium shadow-2xl border border-orange-500/30">
                📡 Hors ligne
              </div>
            </div>
          )}
              
          {pendingSync.length > 0 && (
            <div className="fixed top-4 left-4 z-50">
              <div className="glass-effect text-blue-400 px-3 py-2 rounded-lg text-xs font-medium shadow-2xl flex items-center space-x-2 border border-blue-500/30">
                <span>🔄 {pendingSync.length} en attente</span>
                {isOnline && !isSyncing && (
                  <button
                    onClick={forceSync}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-2 py-1 rounded text-xs transition-all duration-300 hover:scale-105"
                  >
                    Sync
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Prompt d'installation PWA */}
          <LazyPWAInstallPrompt />

          {/* Modal d'onboarding */}
          <LazyOnboardingModal 
            isOpen={showOnboarding} 
            onClose={() => setShowOnboarding(false)}
            userId={user?.id}
          />

        {/* Footer — marge augmentée pour que les 2 lignes sous Conservatoire soient visibles */}
        <footer className="w-full pt-6 pb-10 px-4">
          <div className="max-w-lg mx-auto text-center space-y-4">
            <div className={`w-20 h-px mx-auto ${
              theme === 'light' ? 'bg-gradient-to-r from-transparent via-gray-300 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-500 to-transparent'
            }`} />
            <div className={`text-xs space-y-2 ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            }`}>
                <div className="font-medium">
                  © 2026 Conservatoire d'espaces naturels de Corse
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <span>Développé par</span>
                  <span className="font-semibold text-blue-500 hover:text-blue-600 transition-colors duration-200">
                    BukaLab
                  </span>
                </div>
                <div className="opacity-80">Tous droits réservés • Confidentialité • CGU</div>
            </div>
          </div>
        </footer>

          {/* Modal observation naturaliste géolocalisée */}
          <ObservationModal
            isOpen={showObservationModal}
            onClose={() => {
              setShowObservationModal(false)
              setVoiceInitialForm(undefined)
              setVoiceInitialPosition(undefined)
              setVoiceTranscript(undefined)
            }}
            sitesRefreshKey={sitesRefreshKey}
            initialForm={voiceInitialForm}
            initialPosition={voiceInitialPosition ?? undefined}
            voiceTranscript={voiceTranscript}
          />

          <VoiceObservationFab
            visible={voiceModeEnabled}
            onObservationParsed={(initialForm, position, transcript) => {
              setVoiceInitialForm(initialForm)
              setVoiceInitialPosition(position)
              setVoiceTranscript(transcript ?? undefined)
              setShowObservationModal(true)
            }}
          />

          {/* Modal ajouter un site */}
          <AddSiteModal
            isOpen={showAddSiteModal}
            onClose={() => setShowAddSiteModal(false)}
            onSuccess={() => setSitesRefreshKey((k) => k + 1)}
          />

          <ObservationsSitesMapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
          />

      </div>

      {/* Navigation principale en bas */}
      <MainNavigation />
    </ProtectedRoute>
  )
}

export default function Home() {
  return <HomeContent />
}
