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

// Função para validar e sanitizar dados de nível
function validateAndSanitizeLevel(levelData: any): UserLevel | null {
  if (!levelData) {
    console.warn('⚠️ Level data is null/undefined')
    return null
  }

  try {
    // Valores padrão para campos obrigatórios
    const defaultPhase = {
      name: 'Explorador',
      color: '#6B7280',
      description: 'Fase inicial'
    }

    const sanitized: UserLevel = {
      id: levelData.id || 'unknown',
      userId: levelData.userId || 'unknown',
      currentLevel: typeof levelData.currentLevel === 'number' ? levelData.currentLevel : 1,
      totalPixelsPainted: typeof levelData.totalPixelsPainted === 'number' ? levelData.totalPixelsPainted : 0,
      pixelsForCurrentLevel: typeof levelData.pixelsForCurrentLevel === 'number' ? levelData.pixelsForCurrentLevel : 0,
      pixelsForNextLevel: typeof levelData.pixelsForNextLevel === 'number' ? levelData.pixelsForNextLevel : 10,
      title: levelData.title || 'Iniciante',
      experiencePoints: typeof levelData.experiencePoints === 'number' ? levelData.experiencePoints : 0,
      lastLevelUp: levelData.lastLevelUp || new Date().toISOString(),
      createdAt: levelData.createdAt || new Date().toISOString(),
      updatedAt: levelData.updatedAt || new Date().toISOString(),
      progressPercentage: typeof levelData.progressPercentage === 'number' ? levelData.progressPercentage : 0,
      pixelsUntilNextLevel: typeof levelData.pixelsUntilNextLevel === 'number' ? levelData.pixelsUntilNextLevel : 10,
      levelPhase: {
        name: levelData.levelPhase?.name || defaultPhase.name,
        color: levelData.levelPhase?.color || defaultPhase.color,
        description: levelData.levelPhase?.description || defaultPhase.description
      },
      estimatedTimeToNextLevel: levelData.estimatedTimeToNextLevel || 'Desconhecido',
      percentageToMaxLevel: typeof levelData.percentageToMaxLevel === 'number' ? levelData.percentageToMaxLevel : 0
    }

    console.log('✅ Level data sanitized:', {
      original: levelData,
      sanitized
    })

    return sanitized
  } catch (error) {
    console.error('❌ Erro ao sanitizar dados de nível:', error, levelData)
    return null
  }
}

// Função para sanitizar dados do leaderboard
function sanitizeLeaderboardUser(userData: any): LeaderboardUser | null {
  if (!userData || !userData.userId || !userData.username) {
    console.warn('⚠️ Dados inválidos no leaderboard:', userData)
    return null
  }

  try {
    // Valores padrão para levelPhase se não fornecido
    const defaultPhase = {
      name: 'Explorador',
      color: '#6B7280',
      description: 'Fase inicial'
    }

    const sanitized: LeaderboardUser = {
      id: userData.id || 'unknown',
      userId: userData.userId,
      username: userData.username,
      currentLevel: typeof userData.currentLevel === 'number' ? userData.currentLevel : 1,
      totalPixelsPainted: typeof userData.totalPixelsPainted === 'number' ? userData.totalPixelsPainted : 0,
      title: userData.title || 'Iniciante',
      experiencePoints: typeof userData.experiencePoints === 'number' ? userData.experiencePoints : 0,
      levelPhase: userData.levelPhase ? {
        name: userData.levelPhase.name || defaultPhase.name,
        color: userData.levelPhase.color || defaultPhase.color,
        description: userData.levelPhase.description || defaultPhase.description
      } : defaultPhase
    }

    return sanitized
  } catch (error) {
    console.error('❌ Erro ao sanitizar dados do leaderboard:', error, userData)
    return null
  }
}

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
      console.log('🎮 Buscando nível do usuário...', { userId: user.id })
      const response = await apiGamification.getUserLevel()
      
      console.log('🎮 Resposta da API de nível:', response)
      
      if (response.success) {
        const userLevel = validateAndSanitizeLevel(response.data.level)
        
        if (userLevel) {
          setLevel(userLevel)
          cache.level = userLevel
          cache.lastLevelRefresh = now
          console.log('✅ Nível do usuário carregado com sucesso:', userLevel)
        } else {
          console.error('❌ Dados de nível inválidos após sanitização')
          setError('Dados de nível inválidos recebidos da API')
        }
      } else {
        console.error('❌ API retornou sucesso=false:', response)
        setError('Falha ao buscar nível do usuário')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar nível'
      console.error('❌ Erro ao buscar nível:', {
        error: err,
        message: errorMessage,
        userId: user.id,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage)
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
      console.log('📊 Buscando estatísticas do usuário...', { userId: user.id })
      const response = await apiGamification.getUserStats()
      
      console.log('📊 Resposta da API de stats:', response)
      
      if (response.success) {
        const userStats = response.data
        
        // Valida e sanitiza o nível dentro das stats
        if (userStats.level) {
          userStats.level = validateAndSanitizeLevel(userStats.level)
        }
        
        if (userStats.level) {
          setStats(userStats)
          setLevel(userStats.level)
          setAchievements(userStats.achievements || [])
          
          cache.stats = userStats
          cache.level = userStats.level
          cache.lastStatsRefresh = now
          cache.lastLevelRefresh = now
          
          console.log('✅ Estatísticas do usuário carregadas com sucesso:', userStats)
        } else {
          console.error('❌ Dados de nível inválidos nas estatísticas')
          setError('Dados de estatísticas inválidos')
        }
      } else {
        console.error('❌ API de stats retornou sucesso=false:', response)
        setError('Falha ao buscar estatísticas do usuário')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas'
      console.error('❌ Erro ao buscar estatísticas:', {
        error: err,
        message: errorMessage,
        userId: user.id,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage)
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
      console.log('🏆 Buscando ranking...')
      const response = await apiGamification.getLeaderboard(limit)
      
      console.log('🏆 Resposta da API de ranking:', response)
      
      if (response.success) {
        const leaderboardData = response.data.leaderboard || []
        
        // Sanitiza cada item do leaderboard
        const sanitizedLeaderboard = leaderboardData
          .map(userData => sanitizeLeaderboardUser(userData))
          .filter((item): item is LeaderboardUser => item !== null)
        
        console.log('✅ Ranking sanitizado:', {
          original: leaderboardData,
          sanitized: sanitizedLeaderboard
        })
        
        setLeaderboard(sanitizedLeaderboard)
        cache.leaderboard = sanitizedLeaderboard
        cache.lastLeaderboardRefresh = now
        
        console.log('✅ Ranking carregado com sucesso:', sanitizedLeaderboard)
      } else {
        console.error('❌ API de leaderboard retornou sucesso=false:', response)
      }
    } catch (err) {
      console.error('❌ Erro ao buscar ranking:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error'
      })
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
      console.log('🎮 Usuário detectado, carregando gamificação:', user.id)
      refreshLevel()
    } else {
      console.log('👤 Usuário deslogado, limpando dados de gamificação')
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