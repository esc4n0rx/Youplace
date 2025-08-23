"use client"

export const CELL_SIZE_DEG = 0.0001 // Aproximadamente 11 metros

// Constantes para conversão
const LONGITUDE_OFFSET = 180
const LATITUDE_OFFSET = 90
const COORDINATE_MULTIPLIER = 10000
const MAX_X = 3600000 // (180 + 180) * 10000
const MAX_Y = 1800000 // (90 + 90) * 10000

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
  
  // Conversão precisa
  // Longitude: -180 a 180 → 0 a 3600000
  // Latitude: -90 a 90 → 0 a 1800000
  const x = Math.floor((lng + LONGITUDE_OFFSET) * COORDINATE_MULTIPLIER)
  const y = Math.floor((lat + LATITUDE_OFFSET) * COORDINATE_MULTIPLIER)
  
  // Garantir que estão dentro dos limites válidos
  const clampedX = Math.max(0, Math.min(MAX_X - 1, x))
  const clampedY = Math.max(0, Math.min(MAX_Y - 1, y))
  
  console.log('🔄 Conversão lat/lng → API coords:', {
    input: { lat, lng },
    calculated: { x, y },
    clamped: { x: clampedX, y: clampedY },
    wasClamped: x !== clampedX || y !== clampedY
  })
  
  return { x: clampedX, y: clampedY }
}

// Converte coordenadas x,y da API para lat/lng
export function apiCoordsToLatLng(x: number, y: number): { lat: number, lng: number } {
  // Validação de entrada
  if (!isFinite(x) || !isFinite(y)) {
    throw new Error(`Coordenadas API inválidas: x=${x}, y=${y}`)
  }
  
  if (x < 0 || x >= MAX_X || y < 0 || y >= MAX_Y) {
    throw new Error(`Coordenadas API fora do range: x=${x}, y=${y}`)
  }
  
  const lng = (x / COORDINATE_MULTIPLIER) - LONGITUDE_OFFSET
  const lat = (y / COORDINATE_MULTIPLIER) - LATITUDE_OFFSET
  
  const result = { lat: round6(lat), lng: round6(lng) }
  
  console.log('🔄 Conversão API coords → lat/lng:', {
    input: { x, y },
    output: result
  })
  
  return result
}

// Função para obter a origem da célula a partir de lat/lng
export function originFromLatLng(lat: number, lng: number) {
  // Validação de entrada
  if (!isFinite(lat) || !isFinite(lng)) {
    throw new Error(`Coordenadas inválidas para origin: lat=${lat}, lng=${lng}`)
  }
  
  // Calcula os índices da célula
  const latIndex = Math.floor((lat + LATITUDE_OFFSET) / CELL_SIZE_DEG)
  const lngIndex = Math.floor((lng + LONGITUDE_OFFSET) / CELL_SIZE_DEG)
  
  // Calcula a origem da célula (canto inferior esquerdo)
  const baseLat = latIndex * CELL_SIZE_DEG - LATITUDE_OFFSET
  const baseLng = lngIndex * CELL_SIZE_DEG - LONGITUDE_OFFSET
  
  const result = { lat: round6(baseLat), lng: round6(baseLng) }
  
  console.log('🎯 Calculando origem da célula:', {
    input: { lat, lng },
    cellIndices: { latIndex, lngIndex },
    cellOrigin: result,
    cellSize: CELL_SIZE_DEG
  })
  
  return result
}

// Função para criar ID único da célula
export function idFromLatLng(lat: number, lng: number) {
  return `${round6(lat)}:${round6(lng)}`
}

// Função auxiliar para arredondar para 6 casas decimais
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

// Função para validar se as coordenadas estão sincronizadas
export function validateCoordinateSync(lat: number, lng: number): boolean {
  try {
    // Converte lat/lng para coordenadas da API
    const { x, y } = latLngToApiCoords(lat, lng)
    
    // Converte de volta para lat/lng
    const { lat: backLat, lng: backLng } = apiCoordsToLatLng(x, y)
    
    // Verifica se a diferença é menor que a precisão da célula
    const latDiff = Math.abs(lat - backLat)
    const lngDiff = Math.abs(lng - backLng)
    
    const isValid = latDiff < CELL_SIZE_DEG && lngDiff < CELL_SIZE_DEG
    
    if (!isValid) {
      console.error('❌ Coordenadas não sincronizadas:', {
        original: { lat, lng },
        apiCoords: { x, y },
        converted: { lat: backLat, lng: backLng },
        differences: { latDiff, lngDiff },
        cellSize: CELL_SIZE_DEG
      })
    }
    
    return isValid
  } catch (error) {
    console.error('❌ Erro na validação de coordenadas:', error)
    return false
  }
}