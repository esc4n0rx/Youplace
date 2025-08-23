"use client"

import type { User } from '@/types/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.youplace.space/api/v1'
const DEBUG_MODE = process.env.NODE_ENV === 'development'

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

    try {
      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error('❌ Erro na API de auth:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      if (DEBUG_MODE) {
        console.error('❌ Erro na requisição de auth:', endpoint, error)
      }
      
      // Tratamento específico para erros de CORS
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conectividade. Verifique se a API está rodando.')
      }
      
      throw error
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
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

      const response = await this.request<{
        success: boolean
        data: { userId: string; username: string }
      }>('/auth/me')
      
      return response.success ? response.data : null
    } catch (error) {
      this.removeToken()
      return null
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health')
      return true
    } catch (error) {
      return false
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return
    if (DEBUG_MODE) console.log('💾 Salvando token de autenticação')
    localStorage.setItem('auth_token', token)
  }

  removeToken(): void {
    if (typeof window === 'undefined') return
    if (DEBUG_MODE) console.log('🗑️ Removendo token de autenticação')
    localStorage.removeItem('auth_token')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const apiAuth = new ApiAuthClient()
