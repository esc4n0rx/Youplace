// components/auth/firebase-error.tsx
"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Settings } from "lucide-react"

interface FirebaseErrorProps {
  error: string
  onRetry?: () => void
}

export function FirebaseError({ error, onRetry }: FirebaseErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold mb-2">Erro de Configuração</h1>
        <p className="text-muted-foreground mb-6">
          {error}
        </p>
        
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Como resolver:
            </h3>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Crie um arquivo <code className="bg-muted px-1 rounded">.env.local</code> na raiz do projeto</li>
              <li>2. Adicione as variáveis do Firebase:</li>
              <li className="pl-4">
                <code className="bg-muted px-1 rounded">NEXT_PUBLIC_FIREBASE_API_KEY=...</code>
              </li>
              <li className="pl-4">
                <code className="bg-muted px-1 rounded">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...</code>
              </li>
              <li className="pl-4">
                <code className="bg-muted px-1 rounded">NEXT_PUBLIC_FIREBASE_PROJECT_ID=...</code>
              </li>
              <li>3. Reinicie o servidor de desenvolvimento</li>
            </ol>
          </div>
          
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
