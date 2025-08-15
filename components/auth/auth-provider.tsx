// components/auth/auth-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser, signOut as authSignOut, storeUserData, clearUserData } from '@/lib/auth'
import { apiAuth } from '@/lib/api-auth'
import type { User, AuthState } from '@/types/auth'

interface AuthContextType extends AuthState {
  signIn: (user: User, token: string) => void
  signOut: () => Promise<void>
  updateCredits: (credits: number) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  // Verifica se há um usuário autenticado na inicialização
  useEffect(() => {
    console.log('🔄 Verificando autenticação...')
    
    const checkAuth = async () => {
      try {
        // Verifica se há token salvo
        const token = apiAuth.getToken()
        
        if (!token) {
          console.log('❌ Nenhum token encontrado')
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
          return
        }

        // Verifica se o token é válido buscando dados do usuário
        const user = await getCurrentUser()
        
        if (user) {
          console.log('✅ Usuário autenticado encontrado:', user)
          setAuthState({
            user,
            loading: false,
            error: null
          })
        } else {
          console.log('⚠️ Token inválido, removendo...')
          apiAuth.removeToken()
          clearUserData()
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error)
        apiAuth.removeToken()
        clearUserData()
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro na autenticação'
        })
      }
    }

    checkAuth()
  }, [])

  const signIn = (user: User, token: string) => {
    console.log('✅ Usuário logado com sucesso:', user)
    apiAuth.setToken(token)
    storeUserData(user) // Armazena os dados completos do usuário
    setAuthState({
      user,
      loading: false,
      error: null
    })
  }

  const signOut = async () => {
    try {
      console.log('👋 Iniciando logout...')
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      await authSignOut()
      clearUserData() // Remove os dados do usuário do localStorage
      
      console.log('✅ Logout realizado com sucesso')
      setAuthState({
        user: null,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro no logout'
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      
      throw error
    }
  }

  const updateCredits = (credits: number) => {
    console.log('💰 Atualizando créditos localmente:', credits)
    
    setAuthState(prev => {
      if (prev.user) {
        const updatedUser = { ...prev.user, credits }
        storeUserData(updatedUser) // Atualiza também no localStorage
        return {
          ...prev,
          user: updatedUser
        }
      }
      return prev
    })
  }

  return (
    <AuthContext.Provider value={{
      ...authState,
      signIn,
      signOut,
      updateCredits
    }}>
      {children}
    </AuthContext.Provider>
  )
}