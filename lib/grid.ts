// lib/grid.ts
"use client"

// Define the "pixel" size in latitude/longitude degrees.
// This creates a consistent grid regardless of zoom level.
// 0.001 graus é aproximadamente 111 metros no equador
// 0.0001 graus é aproximadamente 11 metros
// 0.00001 graus é aproximadamente 1.1 metro
export const CELL_SIZE_DEG = 0.00001 // Aproximadamente 1.1 metro - um "pixel"

export function originFromLatLng(lat: number, lng: number) {
  const latIndex = Math.floor((lat + 90) / CELL_SIZE_DEG) // shift to positive range, then index
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