// components/ui/error-card.tsx
"use client"

import { AlertTriangle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorCardProps {
  title?: string
  message: string
  onDismiss?: () => void
  className?: string
}

export function ErrorCard({ 
  title = "Erro", 
  message, 
  onDismiss,
  className 
}: ErrorCardProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-1">
          {message}
        </AlertDescription>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  )
}