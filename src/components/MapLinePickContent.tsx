'use client'

import React, { useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

interface MapLinePickContentProps {
  initialCenter: [number, number]
  path: [number, number][]
  onPathChange: (path: [number, number][]) => void
}

function MapClickHandler({
  onAddPoint
}: {
  onAddPoint: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      onAddPoint(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function MapLinePickContent({
  initialCenter,
  path,
  onPathChange
}: MapLinePickContentProps) {
  const handleAddPoint = useCallback(
    (lat: number, lng: number) => {
      onPathChange([...path, [lat, lng]])
    },
    [path, onPathChange]
  )

  const positions = path.map(([lat, lng]) => [lat, lng] as [number, number])

  return (
    <MapContainer
      center={initialCenter}
      zoom={10}
      className="w-full h-full z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onAddPoint={handleAddPoint} />
      {path.length >= 2 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#2563eb', weight: 4 }}
        />
      )}
      {path.map((pos, i) => (
        <Marker key={i} position={pos} />
      ))}
    </MapContainer>
  )
}
