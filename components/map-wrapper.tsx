// components/map-wrapper.tsx
"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer } from "react-leaflet"
import { MapEventHandler } from "@/components/map-event-handler"
import { cleanupMapContainer } from "@/lib/leaflet-config"

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
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapKey, setMapKey] = useState(0)
  const [isMapReady, setIsMapReady] = useState(false)

  // Função para limpar completamente o container
  const cleanupContainer = useCallback(() => {
    if (containerRef.current) {
      cleanupMapContainer(containerRef.current)
    }
  }, [])

  // Função para recriar o mapa
  const recreateMap = useCallback(() => {
    setIsMapReady(false)
    cleanupContainer()
    
    // Pequeno delay para garantir que a limpeza foi feita
    setTimeout(() => {
      setMapKey(prev => prev + 1)
      setTimeout(() => setIsMapReady(true), 100)
    }, 50)
  }, [cleanupContainer])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      cleanupContainer()
    }
  }, [cleanupContainer])

  // Se o mapa não estiver pronto, mostra loading
  if (!isMapReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Preparando mapa...</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <MapContainer
        key={`map-${mapKey}`}
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        style={{ height: "100%", width: "100%" }}
        className={className}
        whenReady={() => {
          console.log("🗺️ Mapa pronto!")
        }}
        ref={mapRef}
      >
        {isDark ? (
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution="© OpenStreetMap contributors"
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
    </div>
  )
}
