'use client'

/**
 * Ancien onglet « Notre équipe » (retiré de la navigation À propos).
 * Conservé tel quel pour référence / réactivation éventuelle — non monté dans `page.tsx`.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { presentationData } from './presentationData'

export default function NotreEquipeContentArchived() {
  const { theme } = useTheme()
  const [activeOffice, setActiveOffice] = useState('borgo')

  const ajaccioEmployeeNames = ['Laetitia', 'Fabien', 'Sébastien', 'Delphine']

  const ajaccioEmployees = presentationData.employees.filter((emp) =>
    ajaccioEmployeeNames.some((name) => emp.name.includes(name))
  )

  const borgoEmployees = presentationData.employees.filter(
    (emp) => !ajaccioEmployeeNames.some((name) => emp.name.includes(name))
  )

  const renderEmployeeCard = (employee: (typeof presentationData.employees)[number]) => (
    <div
      key={employee.id}
      className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
        theme === 'light' ? 'bg-blue-50/80 border border-blue-100' : 'bg-white/5'
      }`}
    >
      <Link
        href={`/presentation/${employee.id}`}
        className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300 relative group"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
        <div
          className="absolute inset-0.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        <div
          className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute inset-1.5 rounded-full overflow-hidden">
          <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
        </div>
      </Link>
      <div className="flex-1">
        <h3 className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
          {employee.name}
        </h3>
        <p className={`text-xs mb-2 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{employee.position}</p>
        <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
          {employee.description}
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex space-x-3">
        <button
          type="button"
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
          <span>Borgo ({borgoEmployees.length})</span>
        </button>
        <button
          type="button"
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
          <span>Ajaccio ({ajaccioEmployees.length})</span>
        </button>
      </div>
      <div className="space-y-4">
        {activeOffice === 'borgo' ? borgoEmployees.map(renderEmployeeCard) : ajaccioEmployees.map(renderEmployeeCard)}
      </div>
    </div>
  )
}
