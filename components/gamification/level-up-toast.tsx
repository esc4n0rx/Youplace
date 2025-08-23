// components/gamification/level-up-toast.tsx
"use client"

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Crown, Sparkles, Star, Zap } from 'lucide-react'
import type { LevelUpInfo } from '@/types/gamification'

interface LevelUpToastProps {
  levelUpInfo: LevelUpInfo | null
  onShow?: () => void
}

const phaseIcons = {
  'Explorador': Sparkles,
  'Cartógrafo': Star,
  'Mestre': Crown,
  'Lenda': Zap,
  'Divindade': Crown
}

export function LevelUpToast({ levelUpInfo, onShow }: LevelUpToastProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (!levelUpInfo) return

    const isSignificant = levelUpInfo.isSignificantLevelUp || levelUpInfo.phaseChanged
    const duration = isSignificant ? 8000 : 5000

    toast({
      title: `🎉 Level Up! Nível ${levelUpInfo.newLevel}`,
      description: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{levelUpInfo.newTitle}</span>
          </div>
          
          {levelUpInfo.phaseChanged && (
            <div className="text-sm text-muted-foreground bg-primary/10 p-2 rounded">
              🌟 Nova fase desbloqueada!
            </div>
          )}
          
          {levelUpInfo.levelsGained > 1 && (
            <div className="text-sm font-medium text-primary">
              +{levelUpInfo.levelsGained} níveis de uma vez!
            </div>
          )}
        </div>
      ),
      duration
    })

    onShow?.()
  }, [levelUpInfo, toast, onShow])

  return null
}