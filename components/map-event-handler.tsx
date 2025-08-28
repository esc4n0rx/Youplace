// components/map-event-handler.tsx
"use client"

import { useEffect } from "react"
import { useMap, useMapEvents } from "react-leaflet"
import type { LeafletMouseEvent, LatLngBounds } from "leaflet"
import { Mode } from "@/lib/mode"
import { latLngToApiCoords } from "@/lib/grid"

interface MapEventHandlerProps {
  mode: Mode
  onPaint: (lat: number, lng: number) => void
  onHover: (lat: number, lng: number) => void
  onViewportChange: (bounds: { minX: number; maxX: number; minY: number; maxY: number }) => void
}

export function MapEventHandler({ 
  mode, 
  onPaint, 
  onHover,
  onViewportChange
}: MapEventHandlerProps) {
  const map = useMap()

  const handleViewportChange = () => {
    const bounds: LatLngBounds = map.getBounds()
    const northEast = bounds.getNorthEast()
    const southWest = bounds.getSouthWest()

    const minCoords = latLngToApiCoords(southWest.lat, southWest.lng)
    const maxCoords = latLngToApiCoords(northEast.lat, northEast.lng)

    onViewportChange({
      minX: minCoords.x,
      maxX: maxCoords.x,
      minY: minCoords.y,
      maxY: maxCoords.y,
    })
  }

  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (mode === "paint") {
        onPaint(e.latlng.lat, e.latlng.lng)
      }
    },
    mousemove: (e: LeafletMouseEvent) => {
      if (mode === "paint") {
        onHover(e.latlng.lat, e.latlng.lng)
      }
    },
    moveend: () => handleViewportChange(),
    zoomend: () => handleViewportChange(),
  })

  useEffect(() => {
    // Gatilho inicial para carregar os pixels da primeira visualização
    handleViewportChange()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return

    if (mode === "paint") {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
      map.boxZoom.disable()
      map.keyboard.disable()
      
      const container = map.getContainer()
      if (container) {
        container.style.cursor = 'crosshair'
      }
    } else {
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      map.doubleClickZoom.enable()
      map.boxZoom.enable()
      map.keyboard.enable()
      
      const container = map.getContainer()
      if (container) {
        container.style.cursor = ''
      }
    }
  }, [map, mode])

  return null
}
