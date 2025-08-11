// lib/auth.ts
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { supabase } from './supabase'
import type { User } from '@/types/auth'

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const firebaseUser = result.user
    
    if (!firebaseUser.email) {
      throw new Error('Email não encontrado na conta Google')
    }

    // Criar ou atualizar usuário no Supabase
    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || 'Usuário',
      avatar_url: firebaseUser.photoURL || '',
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', firebaseUser.uid)
      .single()

    if (existingUser) {
      // Atualizar dados do usuário existente
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', firebaseUser.uid)
        .select()
        .single()

      if (error) throw error
      return updatedUser
    } else {
      // Criar novo usuário com 1000 créditos
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          credits: 1000
        })
        .select()
        .single()

      if (error) throw error
      return newUser
    }
  } catch (error) {
    console.error('Erro no login:', error)
    throw error
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Erro no logout:', error)
    throw error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe()
      
      if (!firebaseUser) {
        resolve(null)
        return
      }

      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', firebaseUser.uid)
          .single()

        if (error) {
          console.error('Erro ao buscar usuário:', error)
          resolve(null)
          return
        }

        resolve(user)
      } catch (error) {
        console.error('Erro ao buscar usuário:', error)
        resolve(null)
      }
    })
  })
}

export async function updateUserCredits(userId: string, credits: number): Promise<User | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        credits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return user
  } catch (error) {
    console.error('Erro ao atualizar créditos:', error)
    return null
  }
}