// components/map-canvas.tsx
"use client"

import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'

// Importa o componente do mapa dinamicamente apenas no cliente
const MapContent = dynamic(() => import('./map-content'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Carregando mapa...</p>
      </div>
    </div>
  )
})

export default function MapCanvas() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Inicializando...</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  )
}