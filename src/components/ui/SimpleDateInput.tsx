'use client'

import React, { useEffect, useMemo, useState } from 'react'

interface SimpleDateInputProps {
  value: string
  onChange: (nextIsoDate: string) => void
  isLight: boolean
  ariaLabel?: string
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function parseIsoDate(value: string): { year: number; month: number; day: number } {
  const now = new Date()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    }
  }
  const [y, m, d] = value.split('-').map((v) => parseInt(v, 10))
  return { year: y, month: m, day: d }
}

export default function SimpleDateInput({
  value,
  onChange,
  isLight,
  ariaLabel = 'Date',
}: SimpleDateInputProps) {
  const now = new Date()
  const selected = parseIsoDate(value)
  const [viewYear, setViewYear] = useState(selected.year)
  const [viewMonth, setViewMonth] = useState(selected.month)

  useEffect(() => {
    setViewYear(selected.year)
    setViewMonth(selected.month)
  }, [selected.year, selected.month, selected.day])

  const monthTitle = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  const daysInView = getDaysInMonth(viewYear, viewMonth)
  const firstDayJs = new Date(viewYear, viewMonth - 1, 1).getDay()
  const firstDayMondayBased = (firstDayJs + 6) % 7

  const dayCells = useMemo(() => {
    const cells: Array<number | null> = []
    for (let i = 0; i < firstDayMondayBased; i += 1) cells.push(null)
    for (let d = 1; d <= daysInView; d += 1) cells.push(d)
    return cells
  }, [firstDayMondayBased, daysInView])

  const containerClass = `rounded-xl border p-3 ${
    isLight ? 'bg-white border-gray-200' : 'bg-gray-800/80 border-gray-600'
  }`

  const navBtnClass = `inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${
    isLight
      ? 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
      : 'border-gray-600 bg-gray-700/70 text-gray-200 hover:bg-gray-700'
  }`

  const changeMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth() + 1)
  }

  const selectDay = (day: number) => {
    const iso = `${String(viewYear).padStart(4, '0')}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(iso)
  }

  const selectToday = () => {
    const iso = now.toISOString().slice(0, 10)
    onChange(iso)
    const p = parseIsoDate(iso)
    setViewYear(p.year)
    setViewMonth(p.month)
  }

  return (
    <div className={containerClass} aria-label={ariaLabel}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => changeMonth(-12)} className={navBtnClass} aria-label="Année précédente">«</button>
          <button type="button" onClick={() => changeMonth(-1)} className={navBtnClass} aria-label="Mois précédent">‹</button>
        </div>
        <p className={`text-sm font-semibold capitalize ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{monthTitle}</p>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => changeMonth(1)} className={navBtnClass} aria-label="Mois suivant">›</button>
          <button type="button" onClick={() => changeMonth(12)} className={navBtnClass} aria-label="Année suivante">»</button>
        </div>
      </div>

      <div className={`mb-1 grid grid-cols-7 text-center text-[11px] font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((w, i) => (
          <span key={`${w}-${i}`}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayCells.map((d, idx) => {
          if (d == null) return <span key={`empty-${idx}`} className="h-9" />
          const isSelected = d === selected.day && viewMonth === selected.month && viewYear === selected.year
          return (
            <button
              key={`d-${d}`}
              type="button"
              onClick={() => selectDay(d)}
              className={`h-9 rounded-md text-sm font-medium transition ${
                isSelected
                  ? 'bg-teal-600 text-white'
                  : isLight
                    ? 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                    : 'bg-gray-700/60 text-gray-200 hover:bg-gray-700'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={selectToday}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
            isLight ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-teal-900/30 text-teal-300 border border-teal-700/50'
          }`}
        >
          Aujourd’hui
        </button>
      </div>
    </div>
  )
}
