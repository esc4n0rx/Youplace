// components/map-canvas.tsx
"use client"

import dynamic from 'next/dynamic'

// Importa dinamicamente o MapContent apenas no cliente
const MapContent = dynamic(() => import('./map-content'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <div className="text-sm text-muted-foreground">Carregando mapa...</div>
      </div>
    </div>
  )
})

export default function MapCanvas() {
  return <MapContent />
}