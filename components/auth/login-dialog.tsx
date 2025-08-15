// components/auth/login-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AuthTabs } from "./auth-tabs"
import { useAuth } from "@/hooks/use-auth"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signIn, loading: authLoading } = useAuth()

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Reset any local state if needed
    }
  }, [open])

  const handleAuthSuccess = (user: any, token: string) => {
    signIn(user, token)
    onOpenChange(false)
  }

  // Prevent dialog from opening if auth is loading
  if (authLoading && !open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar no YouPlace</DialogTitle>
          <DialogDescription>
            Faça login ou crie uma conta para começar a pintar no mapa. 
            Novos usuários ganham créditos grátis!
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <AuthTabs onSuccess={handleAuthSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}