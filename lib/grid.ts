// lib/grid.ts
"use client"

export const CELL_SIZE_DEG = 0.0001 // Aproximadamente 11 metros

// Converte lat/lng para coordenadas x,y da API
export function latLngToApiCoords(lat: number, lng: number): { x: number, y: number } {
  // Normaliza lat/lng para coordenadas inteiras positivas
  // Latitude: -90 a 90 → 0 a 1800000 (multiplicando por 10000)
  // Longitude: -180 a 180 → 0 a 3600000 (multiplicando por 10000)
  
  const x = Math.floor((lng + 180) * 10000)
  const y = Math.floor((lat + 90) * 10000)
  
  return { x, y }
}

// Converte coordenadas x,y da API para lat/lng
export function apiCoordsToLatLng(x: number, y: number): { lat: number, lng: number } {
  const lng = (x / 10000) - 180
  const lat = (y / 10000) - 90
  
  return { lat: round6(lat), lng: round6(lng) }
}

export function originFromLatLng(lat: number, lng: number) {
  const latIndex = Math.floor((lat + 90) / CELL_SIZE_DEG)
  const lngIndex = Math.floor((lng + 180) / CELL_SIZE_DEG)
  const baseLat = latIndex * CELL_SIZE_DEG - 90
  const baseLng = lngIndex * CELL_SIZE_DEG - 180
  return { lat: round6(baseLat), lng: round6(baseLng) }
}

export function idFromLatLng(lat: number, lng: number) {
  return `${round6(lat)}:${round6(lng)}`
}

function round6(n: number) {
  return Math.round(n * 1_000_000) / 1_000_000
}