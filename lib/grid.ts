// lib/grid.ts
"use client"

export const CELL_SIZE_DEG = 0.0001 // Aproximadamente 11 metros

// Converte lat/lng para coordenadas x,y da API
export function latLngToApiCoords(lat: number, lng: number): { x: number, y: number } {
  // Validação de entrada
  if (!isFinite(lat) || !isFinite(lng)) {
    throw new Error(`Coordenadas inválidas: lat=${lat}, lng=${lng}`)
  }
  
  if (lat < -90 || lat > 90) {
    throw new Error(`Latitude fora do range: ${lat} (deve estar entre -90 e 90)`)
  }
  
  if (lng < -180 || lng > 180) {
    throw new Error(`Longitude fora do range: ${lng} (deve estar entre -180 e 180)`)
  }
  
  // Normaliza lat/lng para coordenadas inteiras positivas
  // Latitude: -90 a 90 → 0 a 1800000 (multiplicando por 10000)
  // Longitude: -180 a 180 → 0 a 3600000 (multiplicando por 10000)
  
  const x = Math.floor((lng + 180) * 10000)
  const y = Math.floor((lat + 90) * 10000)
  
  // Validação das coordenadas resultantes
  if (x < 0 || x > 3600000 || y < 0 || y > 1800000) {
    throw new Error(`Coordenadas convertidas fora do range: x=${x}, y=${y}`)
  }
  
  return { x, y }
}

// Converte coordenadas x,y da API para lat/lng
export function apiCoordsToLatLng(x: number, y: number): { lat: number, lng: number } {
  // Validação de entrada
  if (!isFinite(x) || !isFinite(y)) {
    throw new Error(`Coordenadas API inválidas: x=${x}, y=${y}`)
  }
  
  if (x < 0 || x > 3600000 || y < 0 || y > 1800000) {
    throw new Error(`Coordenadas API fora do range: x=${x}, y=${y}`)
  }
  
  const lng = (x / 10000) - 180
  const lat = (y / 10000) - 90
  
  return { lat: round6(lat), lng: round6(lng) }
}

export function originFromLatLng(lat: number, lng: number) {
  // Validação de entrada
  if (!isFinite(lat) || !isFinite(lng)) {
    throw new Error(`Coordenadas inválidas para origin: lat=${lat}, lng=${lng}`)
  }
  
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

// Função auxiliar para validar cor hexadecimal
export function validateHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color)
}

// Função auxiliar para normalizar cor
export function normalizeColor(color: string): string {
  if (!color) return "#000000"
  
  // Remove espaços e converte para uppercase
  const normalized = color.trim().toUpperCase()
  
  // Adiciona # se não tiver
  const withHash = normalized.startsWith('#') ? normalized : `#${normalized}`
  
  // Valida formato
  if (!validateHexColor(withHash)) {
    console.warn(`Cor inválida: ${color}, usando #000000`)
    return "#000000"
  }
  
  return withHash
}