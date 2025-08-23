// hooks/use-pixels.ts
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiPixels } from '@/lib/api-pixels'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useGamification } from '@/hooks/use-gamification'
import { latLngToApiCoords, apiCoordsToLatLng, normalizeColor, validateCoordinateSync } from '@/lib/grid'
import { LevelUpToast } from '@/components/gamification/level-up-toast'
import type { Pixel, PixelArea, Coordinates } from '@/types/pixel'
import type { LevelUpInfo } from '@/types/gamification'

interface UsePixelsReturn {
  pixels: Record<string, Pixel>
  loading: boolean
  error: string | null
  paintPixel: (lat: number, lng: number, color: string) => Promise<boolean>
  loadPixelsInArea: (area: PixelArea) => Promise<void>
  getPixelInfo: (lat: number, lng: number) => Promise<Pixel | null>
  refreshPixels: () => Promise<void>
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

  const clearLevelUpInfo = useCallback(() => {
    setLevelUpInfo(null)
  }, [])

  const paintPixel = useCallback(async (lat: number, lng: number, color: string): Promise<boolean> => {
    console.log('🎨 usePixels.paintPixel chamado:', { lat, lng, color })
    
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
      // VALIDAÇÃO 1: Coordenadas de entrada
      console.log('🔍 Validando coordenadas de entrada...')
      if (!isFinite(lat) || !isFinite(lng)) {
        throw new Error(`Coordenadas não finitas: lat=${lat}, lng=${lng}`)
      }
      
      // VALIDAÇÃO 2: Range válido
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error(`Coordenadas fora do range válido: lat=${lat} lng=${lng}`)
      }
      
      // VALIDAÇÃO 3: Sincronização de coordenadas
      console.log('🔍 Validando sincronização de coordenadas...')
      if (!validateCoordinateSync(lat, lng)) {
        throw new Error(`Coordenadas não sincronizadas: lat=${lat} lng=${lng}`)
      }
      
      // CONVERSÃO: Lat/lng para coordenadas da API
      console.log('🔄 Convertendo coordenadas para API...')
      const { x, y } = latLngToApiCoords(lat, lng)
      
      // VALIDAÇÃO 4: Coordenadas da API
      if (!Number.isInteger(x) || !Number.isInteger(y)) {
        throw new Error(`Coordenadas da API não são inteiros: x=${x}, y=${y}`)
      }
      
      if (x < 0 || x > 3600000 || y < 0 || y > 1800000) {
        throw new Error(`Coordenadas da API fora do range: x=${x}, y=${y}`)
      }
      
      // NORMALIZAÇÃO: Cor
      const normalizedColor = normalizeColor(color)
      
      console.log('🎨 Dados finais para API:', { 
        originalCoords: { lat, lng },
        apiCoords: { x, y }, 
        color: normalizedColor,
        userCredits: user.credits
      })
      
      // CHAMADA DA API
      const response = await apiPixels.paintPixel({ x, y, color: normalizedColor })
      
      if (response.success) {
        const pixel = response.data.pixel
        const pixelKey = `${pixel.x}_${pixel.y}`
        
        // Atualiza o estado local imediatamente
        setPixels(prev => ({
          ...prev,
          [pixelKey]: pixel
        }))
        
        // Atualiza créditos localmente (diminui 1)
        updateAuthCredits(user.credits - 1)
        
        // Verifica se houve level up
        if ('levelUp' in response && response.levelUp) {
          console.log('🎉 Level up detectado na resposta da API!', response.levelUp)
          const levelUpData = response.levelUp as LevelUpInfo
          setLevelUpInfo(levelUpData)
          handleLevelUp(levelUpData)
        }
        
        // Verifica se o pixel foi pintado no local correto
        const { lat: paintedLat, lng: paintedLng } = apiCoordsToLatLng(pixel.x, pixel.y)
        const latDiff = Math.abs(lat - paintedLat)
        const lngDiff = Math.abs(lng - paintedLng)
        
        console.log('✅ Verificação pós-pintura:', {
          solicitado: { lat, lng },
          pintado: { lat: paintedLat, lng: paintedLng },
          diferenças: { latDiff, lngDiff },
          pixel,
          levelUp: 'levelUp' in response ? response.levelUp : null
        })
        
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
        credits: user?.credits,
        stackTrace: err instanceof Error ? err.stack : undefined
      })
      return false
    }
  }, [user, updateAuthCredits, toast, handleLevelUp])

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
          
          // Validação adicional: verifica se as coordenadas fazem sentido
          try {
            const { lat, lng } = apiCoordsToLatLng(pixel.x, pixel.y)
            if (!isFinite(lat) || !isFinite(lng)) {
              console.warn('⚠️ Pixel com coordenadas inválidas:', pixel)
            }
          } catch (conversionError) {
            console.warn('⚠️ Erro na conversão do pixel:', pixel, conversionError)
          }
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
      // Validação de coordenadas
      if (!validateCoordinateSync(lat, lng)) {
        console.warn('⚠️ Coordenadas não sincronizadas para busca de pixel:', { lat, lng })
        return null
      }
      
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
    console.log('🔄 Limpando cache de pixels...')
    setPixels({})
    loadedAreas.current.clear()
    setError(null)
  }, [])

  // Efeito para validar pixels existentes periodicamente (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    
    const validateExistingPixels = () => {
      const pixelEntries = Object.entries(pixels)
      if (pixelEntries.length === 0) return
      
      let invalidCount = 0
      pixelEntries.forEach(([key, pixel]) => {
        try {
          const { lat, lng } = apiCoordsToLatLng(pixel.x, pixel.y)
          if (!isFinite(lat) || !isFinite(lng)) {
            console.warn('⚠️ Pixel com coordenadas inválidas detectado:', { key, pixel, converted: { lat, lng } })
            invalidCount++
          }
        } catch (error) {
          console.warn('⚠️ Erro na validação do pixel:', { key, pixel, error })
          invalidCount++
        }
      })
      
      if (invalidCount > 0) {
        console.warn(`⚠️ ${invalidCount} pixels inválidos encontrados de ${pixelEntries.length} total`)
      }
    }
    
    const interval = setInterval(validateExistingPixels, 30000) // Valida a cada 30s
    return () => clearInterval(interval)
  }, [pixels])

  return {
    pixels,
    loading,
    error,
    paintPixel,
    loadPixelsInArea,
    getPixelInfo,
    refreshPixels,
    levelUpInfo,
    clearLevelUpInfo
  }
}