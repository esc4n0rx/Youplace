import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Verifica se as variáveis de ambiente estão configuradas
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente do Firebase não configuradas:', missingVars)
  console.error('⚠️ Configure as variáveis de ambiente para o Firebase funcionar corretamente')
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Verifica se a configuração está válida
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Configuração do Firebase inválida:', firebaseConfig)
  throw new Error('Configuração do Firebase inválida. Verifique as variáveis de ambiente.')
}

console.log('✅ Configuração do Firebase carregada:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
})

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Configure Google provider
googleProvider.addScope('email')
googleProvider.addScope('profile')

// Adiciona listener para erros de autenticação
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ Usuário autenticado:', user.uid)
  } else {
    console.log('❌ Nenhum usuário autenticado')
  }
}, (error) => {
  console.error('❌ Erro na autenticação:', error)
})