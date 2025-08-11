// components/auth/login-dialog.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Chrome } from "lucide-react"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await signIn()
      onOpenChange(false)
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao YouPlace. Você ganhou 1000 créditos para começar a pintar!"
      })
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Faça login para continuar</DialogTitle>
          <DialogDescription>
            Você precisa estar logado para pintar pixels no mapa. 
            Novos usuários ganham 1000 créditos grátis!
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Chrome className="mr-2 h-4 w-4" />
            {loading ? "Conectando..." : "Continuar com Google"}
          </Button>
        </div>

        <DialogFooter className="text-center">
          <p className="text-xs text-muted-foreground">
            Ao fazer login, você concorda com nossos termos de uso
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}