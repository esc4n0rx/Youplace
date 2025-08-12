// hooks/use-auth.ts
"use client"

import { useContext } from 'react'
import { AuthContext } from '@/components/auth/auth-provider'

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    console.error('❌ useAuth deve ser usado dentro de AuthProvider')
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  
  // Verifica se o contexto tem todas as propriedades necessárias
  if (!context.signIn || !context.signOut || typeof context.updateCredits !== 'function') {
    console.error('❌ Contexto de autenticação inválido:', context)
    throw new Error('Contexto de autenticação inválido')
  }
  
  return context
}