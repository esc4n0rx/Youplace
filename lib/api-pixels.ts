// lib/api-pixels.ts
"use client"

import type { Pixel, PixelArea, UserStats, CreditTransaction, Coordinates } from '@/types/pixel'
import { apiAuth } from './api-auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

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
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async paintPixel(data: PaintPixelRequest): Promise<PaintPixelResponse> {
    console.log('🎨 Pintando pixel via API:', data)
    return this.request<PaintPixelResponse>('/pixels/paint', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPixelsByArea(area: PixelArea): Promise<GetPixelsByAreaResponse> {
    const params = new URLSearchParams({
      minX: area.minX.toString(),
      maxX: area.maxX.toString(),
      minY: area.minY.toString(),
      maxY: area.maxY.toString(),
    })
    
    console.log('🔍 Buscando pixels por área:', area)
    return this.request<GetPixelsByAreaResponse>(`/pixels/area?${params}`)
  }

  async getPixelInfo(x: number, y: number): Promise<GetPixelInfoResponse> {
    console.log('ℹ️ Buscando info do pixel:', { x, y })
    return this.request<GetPixelInfoResponse>(`/pixels/${x}/${y}`)
  }

  async getPixelHistory(x: number, y: number, limit: number = 5): Promise<GetPixelHistoryResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    console.log('📜 Buscando histórico do pixel:', { x, y, limit })
    return this.request<GetPixelHistoryResponse>(`/pixels/${x}/${y}/history?${params}`)
  }

  async getUserStats(timeframe: '24h' | '7d' | 'all' = '24h'): Promise<GetUserStatsResponse> {
    const params = new URLSearchParams({ timeframe })
    console.log('📊 Buscando estatísticas do usuário:', timeframe)
    return this.request<GetUserStatsResponse>(`/pixels/user/stats?${params}`)
  }

  async getCredits(): Promise<GetCreditsResponse> {
    console.log('💰 Buscando créditos do usuário')
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
    console.log('📋 Buscando histórico de créditos:', limit)
    return this.request<GetCreditHistoryResponse>(`/credits/history?${params}`)
  }
}

export const apiPixels = new ApiPixelsClient()