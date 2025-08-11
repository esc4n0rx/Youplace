
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        if (firebaseUser) {
          const user = await getCurrentUser()
          setAuthState({
            user,
            loading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    })

    return unsubscribe
  }, [])

  const signIn = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const { signInWithGoogle } = await import('@/lib/auth')
      const user = await signInWithGoogle()
      setAuthState({
        user,
        loading: false,
        error: null
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro no login'
      }))
      throw error
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const { signOut: firebaseSignOut } = await import('@/lib/auth')
      await firebaseSignOut()
      setAuthState({
        user: null,
        loading: false,
        error: null
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro no logout'
      }))
      throw error
    }
  }

  const updateCredits = (credits: number) => {
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