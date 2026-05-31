'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
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
    // Thème (ne pas remplacer tout le className : polices, antialiased, etc.)
    document.body.classList.remove('dark-theme', 'light-theme')
    document.body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme')
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      // Page /auth (ScrollContainer) : teinte sombre figée pour la barre d’état, quel que soit le thème
      const onAuth = document.body.getAttribute('data-auth-route') === 'true'
      const content = onAuth ? '#111827' : theme === 'dark' ? '#111827' : '#f1f5f9'
      metaThemeColor.setAttribute('content', content)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Ne pas afficher le contenu avant que le thème soit chargé
  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
