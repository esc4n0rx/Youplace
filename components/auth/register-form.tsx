// components/auth/register-form.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiAuth } from "@/lib/api-auth"
import { Loader2, User, Lock } from "lucide-react"

interface RegisterFormProps {
  onSuccess: (user: any, token: string) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem",
        variant: "destructive"
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Erro na validação", 
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const response = await apiAuth.register({ username, password })
      
      if (response.success) {
        toast({
          title: "Conta criada com sucesso!",
          description: `Bem-vindo, ${response.data.user.username}! Você ganhou ${response.data.user.credits} créditos para começar.`
        })
        onSuccess(response.data.user, response.data.token)
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error)
      const errorMessage = error instanceof Error ? error.message : "Erro no registro. Tente novamente."
      
      toast({
        title: "Erro no registro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-username">Nome de usuário</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-username"
            type="text"
            placeholder="Escolha seu nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-10"
            required
            minLength={3}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
            type="password"
            placeholder="Crie uma senha segura"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
            minLength={6}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            required
            minLength={6}
            disabled={loading}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Criar conta"
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
          disabled={loading}
        >
          Já tem uma conta? Fazer login
        </button>
      </div>
    </form>
  )
}