// components/gamification/level-display.tsx
"use client"

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Crown, Star, Zap } from 'lucide-react'
import type { UserLevel } from '@/types/gamification'

interface LevelDisplayProps {
  level: UserLevel
  compact?: boolean
}

const phaseIcons = {
  'Explorador': Sparkles,
  'Cartógrafo': Star,
  'Mestre': Crown,
  'Lenda': Zap,
  'Divindade': Crown
}

export const LevelDisplay = memo(function LevelDisplay({ level, compact = false }: LevelDisplayProps) {
  const PhaseIcon = phaseIcons[level.levelPhase.name as keyof typeof phaseIcons] || Sparkles

  if (compact) {
    return (
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1.5 px-2 py-1"
        style={{ 
          backgroundColor: `${level.levelPhase.color}15`,
          borderColor: `${level.levelPhase.color}40`,
          color: level.levelPhase.color 
        }}
      >
        <PhaseIcon className="h-3 w-3" />
        <span className="font-mono font-bold">Nv. {level.currentLevel}</span>
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1.5"
        style={{ 
          backgroundColor: `${level.levelPhase.color}15`,
          borderColor: `${level.levelPhase.color}40`,
          color: level.levelPhase.color 
        }}
      >
        <PhaseIcon className="h-3.5 w-3.5" />
        <span className="font-mono font-bold">Nível {level.currentLevel}</span>
      </Badge>
      
      <div className="flex flex-col">
        <span className="text-sm font-medium">{level.title}</span>
        <span className="text-xs text-muted-foreground">{level.levelPhase.name}</span>
      </div>
    </div>
  )
})