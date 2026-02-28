'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface SubTab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface SubTabsProps {
  tabs: SubTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function SubTabs({ tabs, activeTab, onTabChange }: SubTabsProps) {
  const { theme } = useTheme()
  
  // Calculer la largeur exacte selon le nombre d'onglets (écran 411px)
  const tabWidth = 411 / tabs.length
  const tabWidthPx = `${tabWidth}px`

  return (
    <div className={`w-full border-b ${
      theme === 'light' 
        ? 'border-gray-200 bg-white' 
        : 'border-white/10 bg-gray-800/50'
    }`}>
      <div className="w-full flex justify-center">
        <div className="flex" style={{ width: '411px', margin: '0 auto' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? theme === 'light'
                      ? 'text-blue-600'
                      : 'text-blue-400'
                    : theme === 'light'
                      ? 'text-gray-600 hover:text-blue-600'
                      : 'text-gray-400 hover:text-blue-400'
                }`}
                style={{ width: tabWidthPx }}
              >
                {/* Arrière-plan pour l'onglet actif */}
                {isActive && (
                  <div className={`absolute inset-0 transition-all duration-200 ${
                    theme === 'light' 
                      ? 'bg-blue-50/30' 
                      : 'bg-white/3'
                  }`} 
                  style={{ width: '100%', height: '100%' }}
                  />
                )}
                
                {/* Barre inférieure très fine sur toute la largeur pour l'onglet actif */}
                {isActive && (
                  <div 
                    className={`absolute bottom-0 transition-all duration-200 ${
                      theme === 'light' 
                        ? 'bg-blue-600 shadow-sm' 
                        : 'bg-white shadow-glow'
                    }`} 
                    style={{ 
                      height: '1px',
                      width: '100%',
                      left: '0',
                      boxShadow: theme === 'light' ? '0 1px 3px rgba(37, 99, 235, 0.2)' : '0 1px 4px rgba(255, 255, 255, 0.3)' 
                    }}
                  />
                )}
                {tab.icon && (
                  <span className={`transition-transform duration-200 relative z-10 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}>
                    {tab.icon}
                  </span>
                )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}
