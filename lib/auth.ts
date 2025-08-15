// lib/auth.ts
"use client"

import { apiAuth } from './api-auth'
import type { User } from '@/types/auth'

export async function signInWithUsernamePassword(username: string, password: string): Promise<User | null> {
  try {
    console.log('🔐 Iniciando login com username/password...')
    const response = await apiAuth.login({ username, password })
    
    if (response.success) {
      console.log('✅ Login bem-sucedido:', response.data.user)
      return response.data.user
    }
    
    throw new Error(response.message || 'Falha no login')
  } catch (error) {
    console.error('❌ Erro no login:', error)
    throw error
  }
}

export async function registerWithUsernamePassword(username: string, password: string): Promise<User | null> {
  try {
    console.log('🆕 Registrando novo usuário...')
    const response = await apiAuth.register({ username, password })
    
    if (response.success) {
      console.log('✅ Registro bem-sucedido:', response.data.user)
      return response.data.user
    }
    
    throw new Error(response.message || 'Falha no registro')
  } catch (error) {
    console.error('❌ Erro no registro:', error)
    throw error
  }
}

export async function signInWithGoogle(idToken: string): Promise<User | null> {
  try {
    console.log('🔐 Iniciando login com Google...')
    const response = await apiAuth.googleAuth(idToken)
    
    if (response.success) {
      console.log('✅ Login com Google bem-sucedido:', response.data.user)
      return response.data.user
    }
    
    throw new Error(response.message || 'Falha no login com Google')
  } catch (error) {
    console.error('❌ Erro no login com Google:', error)
    throw error
  }
}

export async function signOut(): Promise<void> {
  try {
    console.log('👋 Fazendo logout...')
    apiAuth.removeToken()
    console.log('✅ Logout realizado com sucesso')
  } catch (error) {
    console.error('❌ Erro no logout:', error)
    throw error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const currentUserData = await apiAuth.getCurrentUser()
    
    if (!currentUserData) {
      console.log('❌ Nenhum usuário autenticado')
      return null
    }

    // A API /auth/me retorna apenas userId e username
    // Precisamos buscar os dados completos do usuário de outra forma
    // Por enquanto, vamos armazenar os dados do usuário no localStorage após login/registro
    // e usar esses dados para reconstruir o objeto User
    
    const storedUserData = localStorage.getItem('user_data')
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData) as User
        // Verifica se o ID do usuário armazenado corresponde ao ID retornado pela API
        if (userData.id === currentUserData.userId) {
          console.log('✅ Dados do usuário recuperados do localStorage:', userData)
          return userData
        }
      } catch (error) {
        console.error('❌ Erro ao parsear dados do usuário:', error)
      }
    }

    // Se não conseguiu recuperar do localStorage, cria um objeto básico
    const basicUser: User = {
      id: currentUserData.userId,
      username: currentUserData.username,
      email: null,
      credits: 0, // Será atualizado quando necessário
      isGoogleUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('⚠️ Usando dados básicos do usuário:', basicUser)
    return basicUser
  } catch (error) {
    console.error('❌ Erro ao buscar usuário atual:', error)
    return null
  }
}

// Função auxiliar para armazenar dados do usuário após login/registro
export function storeUserData(user: User): void {
  try {
    localStorage.setItem('user_data', JSON.stringify(user))
    console.log('✅ Dados do usuário armazenados localmente:', user)
  } catch (error) {
    console.error('❌ Erro ao armazenar dados do usuário:', error)
  }
}

// Função auxiliar para limpar dados do usuário após logout
export function clearUserData(): void {
  try {
    localStorage.removeItem('user_data')
    console.log('✅ Dados do usuário removidos localmente')
  } catch (error) {
    console.error('❌ Erro ao remover dados do usuário:', error)
  }
}