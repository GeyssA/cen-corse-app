'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark') // Mode nuit par défaut
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Récupérer le thème sauvegardé depuis localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    // Appliquer le thème au body pour les styles globaux
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme'
    
    // Sauvegarder le thème dans localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Ne pas afficher le contenu avant que le thème soit chargé
  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
