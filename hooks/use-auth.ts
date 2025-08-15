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
  
  return context
}