// types/auth.ts
export interface User {
  id: string
  username: string
  email: string | null
  credits: number
  isGoogleUser: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}