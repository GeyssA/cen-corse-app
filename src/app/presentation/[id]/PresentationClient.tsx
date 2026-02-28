'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { employeesData, Employee } from './employeesData'

interface PresentationClientProps {
  id: string
}

export default function PresentationClient({ id }: PresentationClientProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const getBureauIcon = (bureau?: string) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )

  const getBureauShortName = (bureau: string) => {
    switch (bureau) {
      case 'Borgo':
        return 'Borgo'
      case 'Ajaccio':
        return 'Ajaccio'
      default:
        return bureau
    }
  }

  const goToNextProfile = () => {
    const currentIndex = employeesData.findIndex(emp => emp.id === id)
    const nextIndex = (currentIndex + 1) % employeesData.length
    router.push(`/presentation/${employeesData[nextIndex].id}`)
  }

  const goToPreviousProfile = () => {
    const currentIndex = employeesData.findIndex(emp => emp.id === id)
    const previousIndex = currentIndex === 0 ? employeesData.length - 1 : currentIndex - 1
    router.push(`/presentation/${employeesData[previousIndex].id}`)
  }

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsSwiping(true)
    setSwipeDirection(null)
    setShowSwipeHint(false)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)

    if (touchStart && e.targetTouches[0].clientX) {
      const distance = touchStart - e.targetTouches[0].clientX
      if (Math.abs(distance) > 20) {
        setSwipeDirection(distance > 0 ? 'left' : 'right')
      }
    }
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsSwiping(false)
      setSwipeDirection(null)
      return
    }

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      setSwipeDirection('left')
      setTimeout(() => {
        goToNextProfile()
        setIsSwiping(false)
        setSwipeDirection(null)
      }, 200)
    } else if (isRightSwipe) {
      setSwipeDirection('right')
      setTimeout(() => {
        goToPreviousProfile()
        setIsSwiping(false)
        setSwipeDirection(null)
      }, 200)
    } else {
      setIsSwiping(false)
      setSwipeDirection(null)
    }
  }

  useEffect(() => {
    const foundEmployee = employeesData.find(emp => emp.id === id)

    if (foundEmployee) {
      setEmployee(foundEmployee)
    } else {
      router.push('/presentation')
    }
    setIsLoading(false)

    const timer = setTimeout(() => {
      setShowSwipeHint(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [id, router])

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light'
          ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200'
          : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
      }`}>
        <div className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Chargement...</div>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen relative ${
        theme === 'light'
          ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200'
          : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
      }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {showSwipeHint && (
        <>
          <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm ${
              theme === 'light'
                ? 'bg-white/60 text-gray-500'
                : 'bg-black/40 text-gray-400'
            }`}>
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>

          <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm ${
              theme === 'light'
                ? 'bg-white/60 text-gray-500'
                : 'bg-black/40 text-gray-400'
            }`}>
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </>
      )}

      {isSwiping && (
        <div className={`fixed inset-0 z-40 pointer-events-none ${
          swipeDirection === 'left'
            ? 'bg-gradient-to-r from-transparent via-blue-500/20 to-transparent'
            : swipeDirection === 'right'
            ? 'bg-gradient-to-l from-transparent via-blue-500/20 to-transparent'
            : ''
        }`} />
      )}

      <header className={`backdrop-blur-md border-b ${
        theme === 'light'
          ? 'bg-white/20 border-gray-200/50'
          : 'bg-black/20 border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/apropos?tab=equipe"
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 ${
                  theme === 'light'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Retour</span>
              </Link>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full mr-3 ${
              employee.bureau === 'Borgo'
                ? theme === 'light'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : theme === 'light'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {getBureauIcon(employee.bureau)}
              <span className="text-sm font-medium">{getBureauShortName(employee.bureau)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isSwiping
            ? swipeDirection === 'left'
              ? 'transform -translate-x-4 opacity-80'
              : swipeDirection === 'right'
              ? 'transform translate-x-4 opacity-80'
              : ''
            : 'transform translate-x-0 opacity-100'
        } ${
          theme === 'light'
            ? 'bg-white/80 border border-gray-200/50'
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-blue-900/50 to-indigo-900/50">
              <img
                src={employee.photo}
                alt={employee.name}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
              <h1 className="text-2xl font-bold text-white mb-2" style={{ color: 'white' }}>{employee.name}</h1>
              <p className="text-lg text-blue-300 font-medium" style={{ color: '#93c5fd' }}>{employee.position}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {employee.detailedDescription && (
              <div>
                <p className={`text-base leading-relaxed text-justify ${
                  theme === 'light' ? 'text-gray-700' : 'text-white'
                }`}>{employee.detailedDescription}</p>
              </div>
            )}

            {employee.formation && (
              <div>
                <h2 className={`text-xl font-bold mb-4 flex items-center ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    theme === 'light' ? 'bg-green-500/30' : 'bg-green-500/20'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      theme === 'light' ? 'text-green-600' : 'text-green-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </span>
                  Formation
                </h2>
                <p className={`text-base ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>
                  {employee.formation}
                </p>
              </div>
            )}

            {employee.specialites && employee.specialites.length > 0 && (
              <div>
                <h2 className={`text-xl font-bold mb-4 flex items-center ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    theme === 'light' ? 'bg-purple-500/30' : 'bg-purple-500/20'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      theme === 'light' ? 'text-purple-600' : 'text-purple-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </span>
                  Spécialités
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employee.specialites.map((specialite, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        theme === 'light' ? 'bg-purple-500' : 'bg-purple-400'
                      }`} />
                      <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>
                        {specialite}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${
                theme === 'light' ? 'text-gray-800' : 'text-white'
              }`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  theme === 'light' ? 'bg-blue-500/30' : 'bg-blue-500/20'
                }`}>
                  <svg className={`w-4 h-4 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                Coordonnées
              </h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a
                    href={`mailto:${employee.email || ''}`}
                    className="text-white hover:text-blue-400 text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer"
                  >
                    {employee.email}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href={`tel:${employee.phone?.replace(/\s/g, '') || ''}`}
                    className="text-white hover:text-green-400 text-sm transition-colors duration-300 underline hover:no-underline cursor-pointer"
                  >
                    {employee.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Link
                href={`/projets?employe=${encodeURIComponent(employee.name.split(' ').pop() || employee.name)}`}
                className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/50 hover:via-indigo-600/50 hover:to-purple-600/50 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 active:scale-95 backdrop-blur-md border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <svg className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="relative z-10 text-lg">Découvrir mes projets</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

