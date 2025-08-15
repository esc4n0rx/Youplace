// hooks/use-credits.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import { apiPixels } from '@/lib/api-pixels'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { CreditTransaction } from '@/types/pixel'

interface UseCreditsReturn {
  credits: number | null
  loading: boolean
  error: string | null
  refreshCredits: () => Promise<void>
  claimDailyBonus: () => Promise<boolean>
  getCreditHistory: (limit?: number) => Promise<CreditTransaction[]>
}

export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, updateCredits: updateAuthCredits } = useAuth()
  const { toast } = useToast()

  const refreshCredits = useCallback(async () => {
    if (!user) {
      setCredits(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiPixels.getCredits()
      
      if (response.success) {
        setCredits(response.data.credits)
        // Atualiza também no contexto de auth
        updateAuthCredits(response.data.credits)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar créditos'
      setError(errorMessage)
      console.error('❌ Erro ao buscar créditos:', err)
    } finally {
      setLoading(false)
    }
  }, [user, updateAuthCredits])

  const claimDailyBonus = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await apiPixels.claimDailyBonus()
      
      if (response.success) {
        setCredits(response.data.totalCredits)
        updateAuthCredits(response.data.totalCredits)
        
        toast({
          title: "Bônus diário coletado!",
          description: `+${response.data.credited} créditos adicionados à sua conta`,
        })
        
        return true
      }
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao coletar bônus'
      
      toast({
        title: "Erro ao coletar bônus",
        description: errorMessage,
        variant: "destructive"
      })
      
      console.error('❌ Erro ao coletar bônus diário:', err)
      return false
    }
  }, [user, updateAuthCredits, toast])

  const getCreditHistory = useCallback(async (limit: number = 10): Promise<CreditTransaction[]> => {
    if (!user) return []

    try {
      const response = await apiPixels.getCreditHistory(limit)
      
      if (response.success) {
        return response.data.transactions
      }
      return []
    } catch (err) {
      console.error('❌ Erro ao buscar histórico de créditos:', err)
      return []
    }
  }, [user])

  // Carrega créditos quando usuário muda
  useEffect(() => {
    if (user) {
      refreshCredits()
    } else {
      setCredits(null)
      setError(null)
    }
  }, [user, refreshCredits])

  return {
    credits,
    loading,
    error,
    refreshCredits,
    claimDailyBonus,
    getCreditHistory
  }
}