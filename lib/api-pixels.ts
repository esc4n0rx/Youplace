// lib/api-pixels.ts
"use client"

import type { Pixel, PixelArea, UserStats, CreditTransaction, Coordinates } from '@/types/pixel'
import { apiAuth } from './api-auth'
import { validateHexColor, normalizeColor } from './grid'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.youplace.space/api/v1'
const DEBUG_MODE = process.env.NODE_ENV === 'development'

export interface PaintPixelRequest {
  x: number
  y: number
  color: string
}

export interface PaintPixelResponse {
  success: boolean
  message: string
  data: {
    pixel: Pixel
  }
}

export interface GetPixelsByAreaResponse {
  success: boolean
  data: {
    pixels: Pixel[]
    count: number
  }
}

export interface GetPixelInfoResponse {
  success: boolean
  data: {
    pixel: Pixel | null
  }
}

export interface GetPixelHistoryResponse {
  success: boolean
  data: {
    history: Pixel[]
    coordinates: Coordinates
  }
}

export interface GetUserStatsResponse {
  success: boolean
  data: UserStats
}

export interface GetCreditsResponse {
  success: boolean
  data: {
    credits: number
  }
}

export interface ClaimDailyBonusResponse {
  success: boolean
  message: string
  data: {
    credited: number
    totalCredits: number
  }
}

export interface GetCreditHistoryResponse {
  success: boolean
  data: {
    transactions: CreditTransaction[]
  }
}

// Função para validar dados de pintura
function validatePaintPixelData(data: PaintPixelRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validar coordenadas
  if (!Number.isInteger(data.x) || data.x < 0 || data.x > 3600000) {
    errors.push(`Coordenada X inválida: ${data.x} (deve ser inteiro entre 0 e 3600000)`)
  }
  
  if (!Number.isInteger(data.y) || data.y < 0 || data.y > 1800000) {
    errors.push(`Coordenada Y inválida: ${data.y} (deve ser inteiro entre 0 e 1800000)`)
  }
  
  // Validar cor
  if (!data.color || typeof data.color !== 'string') {
    errors.push(`Cor inválida: ${data.color} (deve ser string)`)
  } else if (!validateHexColor(data.color)) {
    errors.push(`Formato de cor inválido: ${data.color} (deve ser #RRGGBB)`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

class ApiPixelsClient {
  private getAuthHeaders(): Record<string, string> {
    const token = apiAuth.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    // Log apenas em desenvolvimento e para operações importantes
    if (DEBUG_MODE && !endpoint.includes('/credits')) {
      console.log('🌐 API Pixels request:', endpoint, options.method || 'GET')
    }
    
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'omit',
      mode: 'cors',
      ...options,
    }

    try {
      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error('❌ Erro na API de pixels:', {
          endpoint,
          status: response.status,
          errorData,
          requestBody: options.body
        })
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Log apenas para operações importantes (não para créditos)
      if (DEBUG_MODE && !endpoint.includes('/credits')) {
        console.log('✅ Resposta da API de pixels:', endpoint, data)
      }
      
      return data
    } catch (error) {
      console.error('❌ Erro na requisição de pixels:', {
        endpoint,
        error: error instanceof Error ? error.message : error,
        requestBody: options.body
      })
      
      // Tratamento específico para erros de CORS
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conectividade com API de pixels. Verifique se a API está rodando.')
      }
      
      throw error
    }
  }

  async paintPixel(data: PaintPixelRequest): Promise<PaintPixelResponse> {
    console.log('🎨 Validando dados para pintura:', data)
    
    // Normalizar cor
    const normalizedData = {
      ...data,
      color: normalizeColor(data.color)
    }
    
    // Validar dados antes de enviar
    const validation = validatePaintPixelData(normalizedData)
    if (!validation.valid) {
      const errorMessage = `Dados inválidos para pintura: ${validation.errors.join(', ')}`
      console.error('❌ Validação falhou:', errorMessage)
      throw new Error(errorMessage)
    }
    
    console.log('🎨 Enviando dados validados para API:', normalizedData)
    
    return this.request<PaintPixelResponse>('/pixels/paint', {
      method: 'POST',
      body: JSON.stringify(normalizedData),
    })
  }

  async getPixelsByArea(area: PixelArea): Promise<GetPixelsByAreaResponse> {
    const params = new URLSearchParams({
      minX: area.minX.toString(),
      maxX: area.maxX.toString(),
      minY: area.minY.toString(),
      maxY: area.maxY.toString(),
    })
    
    return this.request<GetPixelsByAreaResponse>(`/pixels/area?${params}`)
  }

  async getPixelInfo(x: number, y: number): Promise<GetPixelInfoResponse> {
    return this.request<GetPixelInfoResponse>(`/pixels/${x}/${y}`)
  }

  async getPixelHistory(x: number, y: number, limit: number = 5): Promise<GetPixelHistoryResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    return this.request<GetPixelHistoryResponse>(`/pixels/${x}/${y}/history?${params}`)
  }

  async getUserStats(timeframe: '24h' | '7d' | 'all' = '24h'): Promise<GetUserStatsResponse> {
    const params = new URLSearchParams({ timeframe })
    return this.request<GetUserStatsResponse>(`/pixels/user/stats?${params}`)
  }

  async getCredits(): Promise<GetCreditsResponse> {
    return this.request<GetCreditsResponse>('/credits')
  }

  async claimDailyBonus(): Promise<ClaimDailyBonusResponse> {
    console.log('🎁 Coletando bônus diário')
    return this.request<ClaimDailyBonusResponse>('/credits/daily-bonus', {
      method: 'POST',
    })
  }

  async getCreditHistory(limit: number = 10): Promise<GetCreditHistoryResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    return this.request<GetCreditHistoryResponse>(`/credits/history?${params}`)
  }
}

export const apiPixels = new ApiPixelsClient()