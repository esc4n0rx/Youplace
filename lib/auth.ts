// lib/auth.ts
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { supabase } from './supabase'
import type { User } from '@/types/auth'

export async function signInWithGoogle(): Promise<User | null> {
  try {
    console.log('🔐 Iniciando login com Google...')
    const result = await signInWithPopup(auth, googleProvider)
    const firebaseUser = result.user
    
    if (!firebaseUser.email) {
      throw new Error('Email não encontrado na conta Google')
    }

    console.log('✅ Login Firebase bem-sucedido:', firebaseUser.uid)

    // Criar ou atualizar usuário no Supabase
    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || 'Usuário',
      avatar_url: firebaseUser.photoURL || '',
    }

    // Primeiro, tenta buscar o usuário existente usando maybeSingle()
    console.log('🔍 Buscando usuário no Supabase...')
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', firebaseUser.uid)
      .maybeSingle() // Usa maybeSingle ao invés de single para evitar erro quando não encontra

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário:', fetchError)
      throw fetchError
    }

    if (existingUser) {
      // Atualizar dados do usuário existente
      console.log('📝 Atualizando usuário existente...')
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: userData.name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', firebaseUser.uid)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError)
        throw updateError
      }

      console.log('✅ Usuário atualizado com sucesso:', updatedUser)
      return updatedUser
    } else {
      // Criar novo usuário com 1000 créditos
      console.log('🆕 Criando novo usuário...')
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          ...userData,
          credits: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Erro ao criar usuário:', insertError)
        throw insertError
      }

      console.log('✅ Novo usuário criado com sucesso:', newUser)
      return newUser
    }
  } catch (error) {
    console.error('❌ Erro no login:', error)
    throw error
  }
}

export async function signOut(): Promise<void> {
  try {
    console.log('👋 Fazendo logout...')
    await firebaseSignOut(auth)
    console.log('✅ Logout realizado com sucesso')
  } catch (error) {
    console.error('❌ Erro no logout:', error)
    throw error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe()
      
      if (!firebaseUser) {
        console.log('❌ Nenhum usuário autenticado')
        resolve(null)
        return
      }

      try {
        console.log('🔍 Buscando dados do usuário:', firebaseUser.uid)
        
        // Usa maybeSingle para evitar erro quando não encontra
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', firebaseUser.uid)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Erro ao buscar usuário:', error)
          resolve(null)
          return
        }

        if (!user) {
          console.log('⚠️ Usuário não encontrado no banco, tentando criar...')
          
          // Se o usuário não existe, tenta criar
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Usuário',
            avatar_url: firebaseUser.photoURL || '',
            credits: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single()

          if (insertError) {
            console.error('❌ Erro ao criar usuário:', insertError)
            resolve(null)
            return
          }

          console.log('✅ Usuário criado com sucesso:', newUser)
          resolve(newUser)
        } else {
          console.log('✅ Usuário encontrado:', user)
          resolve(user)
        }
      } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error)
        resolve(null)
      }
    })
  })
}

export async function updateUserCredits(userId: string, newCredits: number): Promise<User | null> {
  try {
    console.log('💰 Atualizando créditos no banco:', { userId, newCredits })
    
    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar créditos no Supabase:', error)
      throw error
    }
    
    console.log('✅ Créditos atualizados no banco:', user)
    return user
  } catch (error) {
    console.error('❌ Erro na função updateUserCredits:', error)
    return null
  }
}