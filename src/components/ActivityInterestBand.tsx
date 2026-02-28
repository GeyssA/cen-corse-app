'use client'

import React, { useState, useEffect } from 'react'
import { addActivityInterest, removeActivityInterest, hasUserInterestInActivity, getActivityInterestCount } from '@/lib/activities'

interface ActivityInterestBandProps {
  activityId: string
}

export default function ActivityInterestBand({ activityId }: ActivityInterestBandProps) {
  const [isInterested, setIsInterested] = useState(false)
  const [interestCount, setInterestCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Vérifier l'état initial de l'intérêt
  useEffect(() => {
    const checkInitialState = async () => {
      if (!activityId) {
        setIsChecking(false)
        return
      }
      
      try {
        const [hasInterest, count] = await Promise.all([
          hasUserInterestInActivity(activityId),
          getActivityInterestCount(activityId)
        ])
        
        setIsInterested(hasInterest)
        setInterestCount(count)
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'état initial:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkInitialState()
  }, [activityId])

  const handleInterestToggle = async () => {
    if (isLoading || !activityId) return

    setIsLoading(true)
    
    try {
      if (isInterested) {
        // Supprimer l'intérêt
        const success = await removeActivityInterest(activityId)
        if (success) {
          setIsInterested(false)
          setInterestCount(prev => Math.max(0, prev - 1))
        }
      } else {
        // Ajouter l'intérêt
        const success = await addActivityInterest(activityId)
        if (success) {
          setIsInterested(true)
          setInterestCount(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement d\'intérêt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="h-8 bg-gray-200/20 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (!activityId) {
    return (
      <div className="h-8 bg-gray-200/20 rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-500">ID d'activité manquant</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleInterestToggle}
      disabled={isLoading}
      className={`w-full h-8 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
        isInterested
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
          : 'bg-emerald-400 hover:bg-emerald-500 text-white'
      } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <>
          {isInterested ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          <span className="text-xs font-medium">
            {isInterested ? 'Intéressé' : 'Cliquez si intéressé'}
          </span>
          {interestCount > 0 && (
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
              {interestCount}
            </span>
          )}
        </>
      )}
    </button>
  )
}
