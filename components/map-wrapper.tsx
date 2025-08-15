// components/map-wrapper.tsx
"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { MapEventHandler } from "@/components/map-event-handler"
import type { LatLngBounds } from "leaflet"

interface MapWrapperProps {
  center: [number, number]
  zoom: number
  minZoom: number
  maxZoom: number
  isDark: boolean
  mode: any
  onPaint: (lat: number, lng: number) => void
  onHover: (lat: number, lng: number) => void
  onBoundsChange?: (bounds: LatLngBounds) => void
  rectangles: React.ReactNode
  hoverRect: React.ReactNode
  className?: string
}

// Componente para detectar mudanças de bounds
function BoundsWatcher({ onBoundsChange }: { onBoundsChange?: (bounds: LatLngBounds) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!onBoundsChange) return

    const updateBounds = () => {
      const bounds = map.getBounds()
      onBoundsChange(bounds)
    }

    // Dispara inicialmente
    updateBounds()

    // Escuta eventos de movimento
    map.on('moveend', updateBounds)
    map.on('zoomend', updateBounds)

    return () => {
      map.off('moveend', updateBounds)
      map.off('zoomend', updateBounds)
    }
  }, [map, onBoundsChange])

  return null
}

export function MapWrapper({
  center,
  zoom,
  minZoom,
  maxZoom,
  isDark,
  mode,
  onPaint,
  onHover,
  onBoundsChange,
  rectangles,
  hoverRect,
  className
}: MapWrapperProps) {
  // Gera uma chave única baseada em timestamp para garantir que o mapa seja recriado
  const mapKey = useMemo(() => `map-${Date.now()}`, [])

  // Limpa qualquer instância anterior do Leaflet
  useEffect(() => {
    // Cleanup function
    return () => {
      // Remove qualquer container Leaflet órfão
      const containers = document.querySelectorAll('.leaflet-container')
      containers.forEach(container => {
        if (container && container.parentNode) {
          // Remove todos os event listeners clonando o node
          const clone = container.cloneNode(false) as HTMLElement
          container.parentNode.replaceChild(clone, container)
        }
      })
    }
  }, [])

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      style={{ height: "100%", width: "100%" }}
      className={className}
    >
      {isDark ? (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}

      {/* Componente de eventos do mapa */}
      <MapEventHandler 
        mode={mode}
        onPaint={onPaint}
        onHover={onHover}
      />

      {/* Watcher para bounds */}
      <BoundsWatcher onBoundsChange={onBoundsChange} />

      {/* Renderiza os retângulos */}
      {rectangles}
      {hoverRect}
    </MapContainer>
  )
}