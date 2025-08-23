"use client"

import { apiAuth } from './api-auth'
import type { UserLevel, LeaderboardUser, Achievement, UserStats } from '@/types/gamification'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.youplace.space/api/v1'
const DEBUG_MODE = process.env.NODE_ENV === 'development'

export interface GetUserLevelResponse {
  success: boolean
  data: {
    level: UserLevel
  }
}

export interface GetUserStatsResponse {
  success: boolean
  data: UserStats
}

export interface GetLeaderboardResponse {
  success: boolean
  data: {
    leaderboard: LeaderboardUser[]
    lastUpdated: string
  }
}

export interface GetUserAchievementsResponse {
  success: boolean
  data: {
    achievements: Achievement[]
    totalUnlocked: number
  }
}

export interface GetLevelStatisticsResponse {
  success: boolean
  data: {
    statistics: Array<{
      current_level: number
      user_count: number
    }>
    totalLevels: number
  }
}

class ApiGamificationClient {
  private getAuthHeaders(): Record<string, string> {
    const token = apiAuth.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
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
        
        console.error('❌ Erro na API de gamificação:', {
          endpoint,
          status: response.status,
          errorData
        })
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return data
    } catch (error) {
      console.error('❌ Erro na requisição de gamificação:', {
        endpoint,
        error: error instanceof Error ? error.message : error
      })
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conectividade com API de gamificação')
      }
      
      throw error
    }
  }

  async getUserLevel(): Promise<GetUserLevelResponse> {
    return this.request<GetUserLevelResponse>('/gamification/level')
  }

  async getUserStats(): Promise<GetUserStatsResponse> {
    return this.request<GetUserStatsResponse>('/gamification/stats')
  }

  async getLeaderboard(limit: number = 10): Promise<GetLeaderboardResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    return this.request<GetLeaderboardResponse>(`/gamification/leaderboard?${params}`)
  }

  async getUserAchievements(): Promise<GetUserAchievementsResponse> {
    return this.request<GetUserAchievementsResponse>('/gamification/achievements')
  }

  async getLevelStatistics(): Promise<GetLevelStatisticsResponse> {
    return this.request<GetLevelStatisticsResponse>('/gamification/statistics')
  }
}

export const apiGamification = new ApiGamificationClient()