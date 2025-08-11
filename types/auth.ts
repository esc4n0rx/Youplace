export interface User {
    id: string
    email: string
    name: string
    avatar_url: string
    credits: number
    created_at: string
    updated_at: string
  }
  
  export interface AuthState {
    user: User | null
    loading: boolean
    error: string | null
  }