// hooks/use-pixels.ts
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiPixels } from '@/lib/api-pixels'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { latLngToApiCoords, apiCoordsToLatLng, normalizeColor } from '@/lib/grid'
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
      // Validação das coordenadas
      console.log('🎨 Convertendo coordenadas:', { lat, lng })
      const { x, y } = latLngToApiCoords(lat, lng)
      
      // Normalização da cor
      const normalizedColor = normalizeColor(color)
      
      console.log('🎨 Dados para API:', { x, y, color: normalizedColor })
      
      // Validação final antes de enviar
      if (!Number.isInteger(x) || !Number.isInteger(y)) {
        throw new Error(`Coordenadas não são inteiros: x=${x}, y=${y}`)
      }
      
      if (x < 0 || x > 3600000 || y < 0 || y > 1800000) {
        throw new Error(`Coordenadas fora do range válido: x=${x}, y=${y}`)
      }
      
      const response = await apiPixels.paintPixel({ x, y, color: normalizedColor })
      
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
          description: `Pintado em (${x}, ${y}) com cor ${normalizedColor}`,
        })
        
        // Limpa erro se teve sucesso
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
        user: user?.username,
        credits: user?.credits
      })
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
    setError(null)
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