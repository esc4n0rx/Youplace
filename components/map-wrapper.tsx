// components/map-wrapper.tsx
"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer } from "react-leaflet"
import { MapEventHandler } from "@/components/map-event-handler"

interface MapWrapperProps {
  center: [number, number]
  zoom: number
  minZoom: number
  maxZoom: number
  isDark: boolean
  mode: any
  onPaint: (lat: number, lng: number) => void
  onHover: (lat: number, lng: number) => void
  rectangles: React.ReactNode
  hoverRect: React.ReactNode
  className?: string
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

      {/* Renderiza os retângulos */}
      {rectangles}
      {hoverRect}
    </MapContainer>
  )
}