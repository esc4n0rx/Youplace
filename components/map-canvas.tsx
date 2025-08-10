"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet"
import "leaflet/dist/leaflet.css"

export type PixelCell = {
  id: string
  lat: number
  lng: number
  size: number
  color: string
  updatedAt: number
  userId: string
  userName: string
}

const PIXELS_STORAGE_KEY = "rplace:pixels"

// Componente interno do mapa (será carregado dinamicamente)
const MapContent = dynamic(
  () => import("./map-content"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">Carregando mapa...</div>
      </div>
    )
  }
)

export default function MapCanvas() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">Inicializando...</div>
      </div>
    )
  }

  return <MapContent />
}