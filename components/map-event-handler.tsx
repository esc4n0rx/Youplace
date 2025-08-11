// components/map-event-handler.tsx
"use client"

import { useEffect } from "react"
import { useMapEvents } from "react-leaflet"
import type { LeafletMouseEvent } from "leaflet"
import { Mode } from "@/lib/mode"

interface MapEventHandlerProps {
  mode: Mode
  onPaint: (lat: number, lng: number) => void
  onHover: (lat: number, lng: number) => void
}

export function MapEventHandler({ 
  mode, 
  onPaint, 
  onHover 
}: MapEventHandlerProps) {
  const map = useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (mode === "paint") {
        console.log("🖱️ Click detectado:", e.latlng)
        onPaint(e.latlng.lat, e.latlng.lng)
      }
    },
    mousemove: (e: LeafletMouseEvent) => {
      if (mode === "paint") {
        onHover(e.latlng.lat, e.latlng.lng)
      }
    }
  })

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
