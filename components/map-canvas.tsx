// components/map-canvas.tsx
"use client"

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Importa dinamicamente o MapContent apenas no cliente
const MapContent = dynamic(() => import('./map-content'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <div className="text-sm text-gray-600">Carregando mapa...</div>
      </div>
    </div>
  )
})

export default function MapCanvas() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Garante que estamos no cliente
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Inicializando...</div>
        </div>
      </div>
    )
  }

  return <MapContent />
}