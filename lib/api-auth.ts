// lib/api-auth.ts
"use client"

import type { User } from '@/types/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.youplace.space/api/v1'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface GoogleAuthRequest {
  idToken: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

export interface ApiError {
  success: false
  error: string
  details?: Array<{
    field: string
    message: string
  }>
}

class ApiAuthClient {
  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'omit', 
      mode: 'cors',
      ...options,
    }

    console.log('🔧 Opções da requisição:', {
      url,
      method: requestOptions.method,
      headers: requestOptions.headers,
      credentials: requestOptions.credentials,
      mode: requestOptions.mode
    })

    try {
      const response = await fetch(url, requestOptions)

      console.log('📡 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta de erro:', parseError)
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error('❌ Erro na resposta:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      
      // Tratamento específico para erros de CORS
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🚫 Possível erro de CORS ou conectividade')
        throw new Error('Erro de conectividade. Verifique se a API está rodando e se há problemas de CORS.')
      }
      
      throw error
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('🚀 Registrando usuário via API...')
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token)
    }
    
    return response
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('🔑 Fazendo login via API...')
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token)
    }
    
    return response
  }

  async googleAuth(idToken: string): Promise<AuthResponse> {
    console.log('🔑 Fazendo login com Google via API...')
    const response = await this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    })
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token)
    }
    
    return response
  }

  async getCurrentUser(): Promise<{ userId: string; username: string } | null> {
    try {
      const token = this.getToken()
      if (!token) return null

      console.log('👤 Buscando usuário atual via API...')
      const response = await this.request<{
        success: boolean
        data: { userId: string; username: string }
      }>('/auth/me')
      
      return response.success ? response.data : null
    } catch (error) {
      console.error('❌ Erro ao buscar usuário atual:', error)
      this.removeToken()
      return null
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      console.log('🏥 Verificando saúde da API...')
      await this.request('/health')
      console.log('✅ API está saudável')
      return true
    } catch (error) {
      console.error('❌ Health check falhou:', error)
      return false
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return
    console.log('💾 Salvando token de autenticação')
    localStorage.setItem('auth_token', token)
  }

  removeToken(): void {
    if (typeof window === 'undefined') return
    console.log('🗑️ Removendo token de autenticação')
    localStorage.removeItem('auth_token')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const apiAuth = new ApiAuthClient()
