'use client'

import React, { useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

interface MapPickContentProps {
  initialCenter: [number, number]
  position: [number, number] | null
  onPositionChange: (pos: [number, number] | null) => void
}

function MapClickHandler({ onPositionChange }: { onPositionChange: (pos: [number, number]) => void }) {
  useMapEvents({
    click: (e) => {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    }
  })
  return null
}

export default function MapPickContent({ initialCenter, position, onPositionChange }: MapPickContentProps) {
  const handleClick = useCallback((pos: [number, number]) => onPositionChange(pos), [onPositionChange])

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
      <MapClickHandler onPositionChange={handleClick} />
      {position && <Marker position={position} />}
    </MapContainer>
  )
}
