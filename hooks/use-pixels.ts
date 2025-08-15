// hooks/use-pixels.ts
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiPixels } from '@/lib/api-pixels'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { latLngToApiCoords, apiCoordsToLatLng } from '@/lib/grid'
import type { Pixel, PixelArea, Coordinates } from '@/types/pixel'

interface UsePixelsReturn {
  pixels: Record<string, Pixel>
  loading: boolean
  error: string | null
  paintPixel: (lat: number, lng: number, color: string) => Promise<boolean>
  loadPixelsInArea: (area: PixelArea) => Promise<void>
  getPixelInfo: (lat: number, lng: number) => Promise<Pixel | null>
  refreshPixels: () => Promise<void>
}

export function usePixels(): UsePixelsReturn {
  const [pixels, setPixels] = useState<Record<string, Pixel>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, updateCredits: updateAuthCredits } = useAuth()
  const { toast } = useToast()
  const loadedAreas = useRef<Set<string>>(new Set())

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
      const { x, y } = latLngToApiCoords(lat, lng)
      
      console.log('🎨 Pintando pixel:', { lat, lng, x, y, color })
      
      const response = await apiPixels.paintPixel({ x, y, color })
      
      if (response.success) {
        const pixel = response.data.pixel
        const pixelKey = `${pixel.x}_${pixel.y}`
        
        setPixels(prev => ({
          ...prev,
          [pixelKey]: pixel
        }))
        
        // Atualiza créditos localmente (diminui 1)
        updateAuthCredits(user.credits - 1)
        
        toast({
          title: "Pixel pintado!",
          description: `Pintado em (${x}, ${y})`,
        })
        
        return true
      }
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao pintar pixel'
      
      toast({
        title: "Erro ao pintar",
        description: errorMessage,
        variant: "destructive"
      })
      
      console.error('❌ Erro ao pintar pixel:', err)
      return false
    }
  }, [user, updateAuthCredits, toast])

  const loadPixelsInArea = useCallback(async (area: PixelArea) => {
    // Cria uma chave única para a área
    const areaKey = `${area.minX}-${area.maxX}-${area.minY}-${area.maxY}`
    
    // Evita recarregar a mesma área
    if (loadedAreas.current.has(areaKey)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Carregando pixels na área:', area)
      
      const response = await apiPixels.getPixelsByArea(area)
      
      if (response.success) {
        const newPixels: Record<string, Pixel> = {}
        
        response.data.pixels.forEach(pixel => {
          const pixelKey = `${pixel.x}_${pixel.y}`
          newPixels[pixelKey] = pixel
        })
        
        setPixels(prev => ({
          ...prev,
          ...newPixels
        }))
        
        loadedAreas.current.add(areaKey)
        console.log(`✅ Carregados ${response.data.count} pixels na área`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pixels'
      setError(errorMessage)
      console.error('❌ Erro ao carregar pixels:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPixelInfo = useCallback(async (lat: number, lng: number): Promise<Pixel | null> => {
    try {
      const { x, y } = latLngToApiCoords(lat, lng)
      
      const response = await apiPixels.getPixelInfo(x, y)
      
      if (response.success && response.data.pixel) {
        return response.data.pixel
      }
      return null
    } catch (err) {
      console.error('❌ Erro ao buscar info do pixel:', err)
      return null
    }
  }, [])

  const refreshPixels = useCallback(async () => {
    // Limpa pixels carregados e força recarregamento
    setPixels({})
    loadedAreas.current.clear()
  }, [])

  return {
    pixels,
    loading,
    error,
    paintPixel,
    loadPixelsInArea,
    getPixelInfo,
    refreshPixels
  }
}