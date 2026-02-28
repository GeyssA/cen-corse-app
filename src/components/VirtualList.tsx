'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
}

export default function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { throttle } = usePerformance()

  // Calculer les éléments visibles
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // Éléments visibles à rendre
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }))
  }, [items, visibleRange])

  // Gestion du scroll avec throttling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const throttledSetScrollTop = throttle(() => {
      setScrollTop(event.currentTarget.scrollTop)
    }, 16)
    throttledSetScrollTop()
  }, [throttle])

  // Calculer les styles de transformation
  const transformStyle = useMemo(() => {
    const offsetY = visibleRange.startIndex * itemHeight
    return {
      transform: `translateY(${offsetY}px)`,
      height: items.length * itemHeight
    }
  }, [visibleRange.startIndex, itemHeight, items.length])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={transformStyle}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{ height: itemHeight }}
            className="flex items-center"
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}
