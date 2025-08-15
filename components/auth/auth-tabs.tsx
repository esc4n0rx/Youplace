// components/auth/auth-tabs.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { Chrome, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiAuth } from "@/lib/api-auth"

interface AuthTabsProps {
  onSuccess: (user: any, token: string) => void
}

declare global {
  interface Window {
    google: any
  }
}

export function AuthTabs({ onSuccess }: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [googleLoading, setGoogleLoading] = useState(false)
  const { toast } = useToast()

  const handleGoogleAuth = async () => {
    setGoogleLoading(true)
    
    try {
      // Verifica se o Google Identity Services está carregado
      if (!window.google) {
        throw new Error('Google Identity Services não está carregado')
      }

      // Configura o callback para o Google OAuth
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            console.log('🔑 Token Google recebido, enviando para API...')
            
            const authResponse = await apiAuth.googleAuth(response.credential)
            
            if (authResponse.success) {
              toast({
                title: "Login com Google realizado!",
                description: `Bem-vindo, ${authResponse.data.user.username}!`
              })
              onSuccess(authResponse.data.user, authResponse.data.token)
            }
          } catch (error) {
            console.error('❌ Erro no login com Google:', error)
            toast({
              title: "Erro no login com Google",
              description: error instanceof Error ? error.message : "Erro desconhecido"
            })
          } finally {
            setGoogleLoading(false)
          }
        }
      })

      // Exibe o prompt do Google
      window.google.accounts.id.prompt()
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Google OAuth:', error)
      toast({
        title: "Erro no login com Google",
        description: "Não foi possível carregar o sistema de login do Google. Tente usar login com usuário/senha."
      })
      setGoogleLoading(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Entrar</TabsTrigger>
        <TabsTrigger value="register">Criar conta</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="space-y-4">
        <LoginForm 
          onSuccess={onSuccess}
          onSwitchToRegister={() => setActiveTab("register")}
        />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full"
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
      </TabsContent>

      <TabsContent value="register" className="space-y-4">
        <RegisterForm 
          onSuccess={onSuccess}
          onSwitchToLogin={() => setActiveTab("login")}
        />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full"
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
      </TabsContent>
    </Tabs>
  )
}