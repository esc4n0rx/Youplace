"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getCurrentUser } from '@/lib/auth'
import type { User, AuthState } from '@/types/auth'

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>
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

  useEffect(() => {
    console.log('🔄 Configurando listener de autenticação...')
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔔 Estado de autenticação mudou:', firebaseUser?.uid || 'não autenticado')
      
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        if (firebaseUser) {
          const user = await getCurrentUser()
          
          if (user) {
            console.log('✅ Usuário carregado:', user)
            setAuthState({
              user,
              loading: false,
              error: null
            })
          } else {
            console.log('⚠️ Usuário autenticado mas não encontrado no banco')
            setAuthState({
              user: null,
              loading: false,
              error: 'Usuário não encontrado. Por favor, faça login novamente.'
            })
          }
        } else {
          console.log('❌ Nenhum usuário autenticado')
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error)
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    })

    return () => {
      console.log('🔚 Removendo listener de autenticação')
      unsubscribe()
    }
  }, [])

  const signIn = async () => {
    try {
      console.log('🚀 Iniciando processo de login...')
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { signInWithGoogle } = await import('@/lib/auth')
      const user = await signInWithGoogle()
      
      if (user) {
        console.log('✅ Login bem-sucedido:', user)
        setAuthState({
          user,
          loading: false,
          error: null
        })
      } else {
        throw new Error('Falha ao obter dados do usuário após login')
      }
    } catch (error) {
      console.error('❌ Erro no login:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro no login'
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('👋 Iniciando logout...')
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { signOut: firebaseSignOut } = await import('@/lib/auth')
      await firebaseSignOut()
      
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
    
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, credits } : null
    }))
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