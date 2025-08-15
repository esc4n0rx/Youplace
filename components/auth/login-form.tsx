// components/auth/login-form.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiAuth } from "@/lib/api-auth"
import { Loader2, User, Lock } from "lucide-react"

interface LoginFormProps {
  onSuccess: (user: any, token: string) => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiAuth.login({ username, password })
      
      if (response.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo de volta, ${response.data.user.username}!`
        })
        onSuccess(response.data.user, response.data.token)
      }
    } catch (error) {
      console.error('❌ Erro no login:', error)
      const errorMessage = error instanceof Error ? error.message : "Erro no login. Verifique suas credenciais."
      
      toast({
        title: "Erro no login",
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-username">Nome de usuário</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-username"
            type="text"
            placeholder="Digite seu nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-10"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
            disabled={loading}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
          disabled={loading}
        >
          Não tem uma conta? Criar conta
        </button>
      </div>
    </form>
  )
}