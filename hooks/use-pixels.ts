// hooks/use-pixels.ts
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiPixels } from '@/lib/api-pixels'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useGamification } from '@/hooks/use-gamification'
import { latLngToApiCoords, apiCoordsToLatLng, normalizeColor, validateCoordinateSync } from '@/lib/grid'
import { socketManager } from '@/lib/realtime'
import type { Pixel, PixelArea } from '@/types/pixel'
import type { LevelUpInfo } from '@/types/gamification'

interface UsePixelsReturn {
  pixels: Record<string, Pixel>
  loading: boolean
  error: string | null
  paintPixel: (lat: number, lng: number, color: string) => Promise<boolean>
  loadPixelsInArea: (area: PixelArea) => Promise<void>
  getPixelInfo: (lat: number, lng: number) => Promise<Pixel | null>
  refreshPixels: () => Promise<void>
  updateViewport: (bounds: { minX: number; maxX: number; minY: number; maxY: number }) => void
  levelUpInfo: LevelUpInfo | null
  clearLevelUpInfo: () => void
}

export function usePixels(): UsePixelsReturn {
  const [pixels, setPixels] = useState<Record<string, Pixel>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null)
  
  const { user, updateCredits: updateAuthCredits } = useAuth()
  const { toast } = useToast()
  const { handleLevelUp } = useGamification()
  const loadedAreas = useRef<Set<string>>(new Set())

  const updatePixelsState = useCallback((newPixels: Pixel[]) => {
    setPixels(prev => {
      const updatedPixels = { ...prev }
      newPixels.forEach(pixel => {
        const pixelKey = `${pixel.x}_${pixel.y}`
        updatedPixels[pixelKey] = pixel
      })
      return updatedPixels
    })
  }, [])

  useEffect(() => {
    if (user) {
      socketManager.connect(
        (newPixels) => updatePixelsState(newPixels), // onPixelsUpdate
        (initialPixels) => updatePixelsState(initialPixels) // onInitialState
      )
    }
    return () => {
      socketManager.disconnect()
    }
  }, [user, updatePixelsState])

  const updateViewport = useCallback((bounds: { minX: number; maxX: number; minY: number; maxY: number }) => {
    socketManager.updateViewport(bounds)
  }, [])

  const clearLevelUpInfo = useCallback(() => {
    setLevelUpInfo(null)
  }, [])

  const paintPixel = useCallback(async (lat: number, lng: number, color: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para pintar pixels",
        variant: "destructive"
      })
      return false
    }

    if (user.credits <= 0) {
      toast({
        title: "Sem créditos",
        description: "Você não tem créditos suficientes para pintar",
        variant: "destructive"
      })
      return false
    }

    try {
      if (!validateCoordinateSync(lat, lng)) {
        throw new Error(`Coordenadas não sincronizadas: lat=${lat} lng=${lng}`)
      }
      
      const { x, y } = latLngToApiCoords(lat, lng)
      const normalizedColor = normalizeColor(color)
      
      const response = await apiPixels.paintPixel({ x, y, color: normalizedColor })
      
      if (response.success) {
        const pixel = response.data.pixel
        
        // A atualização do pixel virá via WebSocket, mas podemos ser otimistas
        updatePixelsState([pixel])
        
        updateAuthCredits(user.credits - 1)
        
        if (response.levelUp) {
          const levelUpData = response.levelUp as LevelUpInfo
          setLevelUpInfo(levelUpData)
          handleLevelUp(levelUpData)
        }
        
        toast({
          title: "Pixel pintado!",
          description: `Pintado em (${x}, ${y}) com cor ${normalizedColor}`,
        })
        
        setError(null)
        return true
      }
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao pintar pixel'
      setError(errorMessage)
      toast({
        title: "Erro ao pintar",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('❌ Erro detalhado ao pintar pixel:', {
        originalCoords: { lat, lng },
        error: err,
      })
      return false
    }
  }, [user, updateAuthCredits, toast, handleLevelUp, updatePixelsState])

  const loadPixelsInArea = useCallback(async (area: PixelArea) => {
    const areaKey = `${area.minX}-${area.maxX}-${area.minY}-${area.maxY}`
    if (loadedAreas.current.has(areaKey)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiPixels.getPixelsByArea(area)
      if (response.success) {
        updatePixelsState(response.data.pixels)
        loadedAreas.current.add(areaKey)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pixels'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [updatePixelsState])

  const getPixelInfo = useCallback(async (lat: number, lng: number): Promise<Pixel | null> => {
    try {
      if (!validateCoordinateSync(lat, lng)) return null
      const { x, y } = latLngToApiCoords(lat, lng)
      const response = await apiPixels.getPixelInfo(x, y)
      return response.success ? response.data.pixel : null
    } catch (err) {
      return null
    }
  }, [])

  const refreshPixels = useCallback(async () => {
    setPixels({})
    loadedAreas.current.clear()
    setError(null)
    // A reconexão ou um evento de refresh no socket poderia ser chamado aqui
  }, [])

  return {
    pixels,
    loading,
    error,
    paintPixel,
    loadPixelsInArea,
    getPixelInfo,
    refreshPixels,
    updateViewport,
    levelUpInfo,
    clearLevelUpInfo
  }
}
