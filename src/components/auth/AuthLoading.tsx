'use client'

import React from 'react'

interface AuthLoadingProps {
  message?: string
  showProgress?: boolean
}

export default function AuthLoading({ 
  message = 'Chargement...', 
  showProgress = true 
}: AuthLoadingProps) {
  // Déterminer si on affiche l'oiseau (uniquement pour "Chargement...")
  const showBird = message === 'Chargement...'
  
  return (
    <div className="fixed inset-0 z-[60] min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative">
      <div className="flex-1 flex items-center justify-center mt-8">
        <div className="text-center max-w-sm mx-auto">
        
        {/* Animation conditionnelle */}
        {showBird ? (
          /* Cercle avec oiseau qui vole et traînée - uniquement pour "Chargement..." */
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Oiseau qui vole en cercle avec traînée de vent */}
            <div className="absolute inset-0 animate-fly-circle">
              {/* Petit point devant la tête de l'oiseau */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -z-10 left-8 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/90 rounded-full"></div>
              </div>
              
              {/* Traînée de petits nuages qui s'effacent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Nuage 1 - le plus récent */}
                <div className="absolute -z-20 -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1 bg-white/60 rounded-full animate-cloud-1"></div>
                {/* Nuage 2 */}
                <div className="absolute -z-20 -left-7 top-1/2 -translate-y-1/2 w-1.5 h-1 bg-white/50 rounded-full animate-cloud-2"></div>
                {/* Nuage 3 */}
                <div className="absolute -z-20 -left-10 top-1/2 -translate-y-1/2 w-1 h-0.5 bg-white/40 rounded-full animate-cloud-3"></div>
                {/* Nuage 4 */}
                <div className="absolute -z-20 -left-13 top-1/2 -translate-y-1/2 w-1 h-0.5 bg-white/30 rounded-full animate-cloud-4"></div>
                {/* Nuage 5 - le plus ancien */}
                <div className="absolute -z-20 -left-16 top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-white/20 rounded-full animate-cloud-5"></div>
              </div>
              

              {/* Rapace majestueux */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg 
                  className="w-20 h-20 text-white/95" 
                  viewBox="0 0 100 100" 
                  fill="currentColor"
                  style={{ transform: 'rotate(90deg)' }}
                >
                  {/* Corps robuste et élégant */}
                  <ellipse cx="50" cy="38" rx="2.5" ry="7" opacity="0.95"/>
                  
                  {/* Grande aile gauche - forme caractéristique */}
                  <path d="M47.5 35 Q35 30 20 20 Q16 25 25 35 Q40 42 47.5 46 Z" opacity="0.9">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="10 47.5 35"
                      to="-40 47.5 35"
                      dur="0.8s"
                      repeatCount="indefinite"
                      additive="sum"
                    />
                  </path>
                  
                  {/* Grande aile droite - symétrique */}
                  <path d="M52.5 35 Q65 30 80 20 Q84 25 75 35 Q60 42 52.5 46 Z" opacity="0.9">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="-10 52.5 35"
                      to="40 52.5 35"
                      dur="0.8s"
                      repeatCount="indefinite"
                      additive="sum"
                    />
                  </path>
                  
                  {/* Queue évasée */}
                  <path d="M47.5 45 L45 58 L50 55 L55 58 L52.5 45 Z" opacity="0.85"/>
                </svg>
              </div>
            </div>
          </div>
        ) : (
          /* Indicateurs de chargement simples (3 points) - pour "Synchronisation du profil..." */
          <div className="flex justify-center space-x-2 mb-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
        </div>
      </div>
      
      {/* 1 olivier en blanc, très grand et à gauche */}
      <div className="mb-8 flex justify-start">
        <img 
          src="/olivier.png" 
          alt="Olivier" 
          className="w-64 h-80 brightness-0 invert opacity-90"
          loading="eager"
        />
      </div>

      {/* Titre animé avec points qui clignotent */}
      <div className="mb-32">
        <h2 className="text-2xl font-medium text-gray-200">
          Chargement
          <span className="inline-block ml-1">
            <span className="animate-pulse" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '200ms' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '400ms' }}>.</span>
          </span>
        </h2>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes fly-circle {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes flap-loading {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.6); }
        }
        
        @keyframes trail {
          0% {
            opacity: 1;
            width: 2rem;
          }
          100% {
            opacity: 0;
            width: 0.5rem;
          }
        }
        
        .animate-fly-circle {
          animation: fly-circle 3s linear infinite;
        }
        
        .animate-flap-loading {
          animation: flap-loading 0.3s ease-in-out infinite;
        }
        
        .animate-trail {
          animation: trail 0.8s ease-out infinite;
        }
        
        @keyframes float {
          0%, 100% { 
            transform: rotate(90deg) translate(15px, -25px) translateY(0px);
          }
          50% { 
            transform: rotate(90deg) translate(15px, -25px) translateY(-8px);
          }
        }
        
        @keyframes figure8 {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(20px) translateY(-15px); }
          50% { transform: translateX(0px) translateY(-30px); }
          75% { transform: translateX(-20px) translateY(-15px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        
        @keyframes cloud-1 {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0.4; transform: scale(0.8); }
        }
        
        @keyframes cloud-2 {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 0.2; transform: scale(0.6); }
        }
        
        @keyframes cloud-3 {
          0% { opacity: 0.4; transform: scale(0.8); }
          100% { opacity: 0.1; transform: scale(0.4); }
        }
        
        @keyframes cloud-4 {
          0% { opacity: 0.3; transform: scale(0.7); }
          100% { opacity: 0.05; transform: scale(0.3); }
        }
        
        @keyframes cloud-5 {
          0% { opacity: 0.2; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(0.2); }
        }
        
        .animate-cloud-1 { animation: cloud-1 0.6s ease-out infinite; }
        .animate-cloud-2 { animation: cloud-2 0.8s ease-out infinite; }
        .animate-cloud-3 { animation: cloud-3 1.0s ease-out infinite; }
        .animate-cloud-4 { animation: cloud-4 1.2s ease-out infinite; }
        .animate-cloud-5 { animation: cloud-5 1.4s ease-out infinite; }
      `}</style>
    </div>
  )
}
