"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiGamification } from '@/lib/api-gamification'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { UserLevel, UserStats, LeaderboardUser, Achievement, LevelUpInfo } from '@/types/gamification'

interface UseGamificationReturn {
  level: UserLevel | null
  stats: UserStats | null
  leaderboard: LeaderboardUser[]
  achievements: Achievement[]
  loading: boolean
  error: string | null
  refreshLevel: () => Promise<void>
  refreshStats: () => Promise<void>
  refreshLeaderboard: (limit?: number) => Promise<void>
  handleLevelUp: (levelUpInfo: LevelUpInfo) => void
}

const cache = {
  level: null as UserLevel | null,
  stats: null as UserStats | null,
  leaderboard: [] as LeaderboardUser[],
  lastLevelRefresh: 0,
  lastStatsRefresh: 0,
  lastLeaderboardRefresh: 0,
}

const CACHE_DURATION = 30000 // 30 segundos

export function useGamification(): UseGamificationReturn {
  const [level, setLevel] = useState<UserLevel | null>(cache.level)
  const [stats, setStats] = useState<UserStats | null>(cache.stats)
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(cache.leaderboard)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const { toast } = useToast()
  
  const refreshingRef = useRef(false)

  const refreshLevel = useCallback(async () => {
    if (!user || refreshingRef.current) return

    const now = Date.now()
    if (cache.level && now - cache.lastLevelRefresh < CACHE_DURATION) {
      setLevel(cache.level)
      return
    }

    refreshingRef.current = true
    setLoading(true)
    setError(null)

    try {
      console.log('🎮 Buscando nível do usuário...')
      const response = await apiGamification.getUserLevel()
      
      if (response.success) {
        const userLevel = response.data.level
        setLevel(userLevel)
        cache.level = userLevel
        cache.lastLevelRefresh = now
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar nível'
      setError(errorMessage)
      console.error('❌ Erro ao buscar nível:', err)
    } finally {
      setLoading(false)
      refreshingRef.current = false
    }
  }, [user])

  const refreshStats = useCallback(async () => {
    if (!user || refreshingRef.current) return

    const now = Date.now()
    if (cache.stats && now - cache.lastStatsRefresh < CACHE_DURATION) {
      setStats(cache.stats)
      setAchievements(cache.stats.achievements)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('📊 Buscando estatísticas do usuário...')
      const response = await apiGamification.getUserStats()
      
      if (response.success) {
        const userStats = response.data
        setStats(userStats)
        setLevel(userStats.level)
        setAchievements(userStats.achievements)
        
        cache.stats = userStats
        cache.level = userStats.level
        cache.lastStatsRefresh = now
        cache.lastLevelRefresh = now
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas'
      setError(errorMessage)
      console.error('❌ Erro ao buscar estatísticas:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const refreshLeaderboard = useCallback(async (limit: number = 10) => {
    const now = Date.now()
    if (cache.leaderboard.length > 0 && now - cache.lastLeaderboardRefresh < CACHE_DURATION) {
      setLeaderboard(cache.leaderboard)
      return
    }

    try {
      const response = await apiGamification.getLeaderboard(limit)
      
      if (response.success) {
        const leaderboardData = response.data.leaderboard
        setLeaderboard(leaderboardData)
        cache.leaderboard = leaderboardData
        cache.lastLeaderboardRefresh = now
      }
    } catch (err) {
      console.error('❌ Erro ao buscar ranking:', err)
    }
  }, [])

  const handleLevelUp = useCallback((levelUpInfo: LevelUpInfo) => {
    console.log('🎉 Level up detectado!', levelUpInfo)
    
    // Atualiza o nível localmente
    if (level) {
      const updatedLevel = {
        ...level,
        currentLevel: levelUpInfo.newLevel,
        title: levelUpInfo.newTitle
      }
      setLevel(updatedLevel)
      cache.level = updatedLevel
    }

    // Mostra toast de level up
    toast({
      title: `🎉 Level Up! Nível ${levelUpInfo.newLevel}`,
      description: `Você alcançou o título "${levelUpInfo.newTitle}"!`,
    })

    // Força refresh das estatísticas após um pequeno delay
    setTimeout(() => {
      cache.lastLevelRefresh = 0
      cache.lastStatsRefresh = 0
      refreshLevel()
    }, 1000)
  }, [level, toast, refreshLevel])

  // Carrega nível inicial quando o usuário muda
  useEffect(() => {
    if (user) {
      refreshLevel()
    } else {
      setLevel(null)
      setStats(null)
      setAchievements([])
      setError(null)
    }
  }, [user?.id, refreshLevel])

  return {
    level,
    stats,
    leaderboard,
    achievements,
    loading,
    error,
    refreshLevel,
    refreshStats,
    refreshLeaderboard,
    handleLevelUp
  }
}