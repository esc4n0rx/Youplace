// hooks/use-credits.ts
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
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
  
  // Ref para evitar requests duplicadas
  const refreshingRef = useRef(false)
  const lastRefreshTime = useRef(0)
  
  // Debounce de 5 segundos para evitar requests muito frequentes
  const REFRESH_DEBOUNCE_MS = 5000

  const refreshCredits = useCallback(async () => {
    if (!user) {
      setCredits(null)
      return
    }

    // Evita requests duplicadas
    if (refreshingRef.current) {
      return
    }

    // Debounce - evita requests muito frequentes
    const now = Date.now()
    if (now - lastRefreshTime.current < REFRESH_DEBOUNCE_MS) {
      return
    }

    refreshingRef.current = true
    lastRefreshTime.current = now
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
      refreshingRef.current = false
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

  // Carrega créditos apenas quando usuário muda (não em cada render)
  useEffect(() => {
    if (user) {
      // Usa apenas os créditos do contexto de auth inicialmente
      if (user.credits !== undefined) {
        setCredits(user.credits)
      }
      // Faz refresh apenas se não temos créditos ou se passou tempo suficiente
      if (credits === null || Date.now() - lastRefreshTime.current > 30000) {
        refreshCredits()
      }
    } else {
      setCredits(null)
      setError(null)
      refreshingRef.current = false
    }
  }, [user?.id]) // Depend apenas do ID do usuário

  return {
    credits,
    loading,
    error,
    refreshCredits,
    claimDailyBonus,
    getCreditHistory
  }
}