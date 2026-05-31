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
    <div
      className={`sticky z-40 w-full border-b backdrop-blur-sm ${
        theme === 'light'
          ? 'border-slate-200/90 bg-white/90'
          : 'border-white/10 bg-slate-900/50'
      }`}
      style={{ top: 0 }}
    >
      <div className="flex w-full justify-center">
        <div className="flex overflow-hidden rounded-t-2xl" style={{ width: '411px', margin: '0 auto' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center justify-center space-x-2 rounded-t-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? theme === 'light'
                      ? 'text-teal-800'
                      : 'text-teal-200'
                    : theme === 'light'
                      ? 'text-slate-600 hover:text-teal-700'
                      : 'text-slate-400 hover:text-teal-200/90'
                }`}
                style={{ width: tabWidthPx }}
              >
                {isActive && (
                  <div
                    className={`absolute inset-0 transition-all duration-200 ${
                      theme === 'light' ? 'bg-teal-50/60' : 'bg-teal-500/12'
                    }`}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}

                {isActive && (
                  <div
                    className={`absolute bottom-0 h-[2px] w-full transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-teal-600 shadow-sm shadow-teal-600/25'
                        : 'bg-teal-400/90'
                    }`}
                    style={{ left: 0 }}
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
