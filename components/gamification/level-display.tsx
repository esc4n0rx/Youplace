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

const defaultPhase = {
  name: 'Explorador',
  color: '#6B7280',
  description: 'Fase inicial'
}

export const LevelDisplay = memo(function LevelDisplay({ level, compact = false }: LevelDisplayProps) {
  // Validações defensivas
  if (!level) {
    console.warn('⚠️ LevelDisplay: level prop is null/undefined')
    return null
  }

  // Garante que levelPhase existe com valores padrão
  const safeLevel = {
    ...level,
    levelPhase: level.levelPhase || defaultPhase,
    currentLevel: level.currentLevel || 1,
    title: level.title || 'Iniciante'
  }

  // Garante que levelPhase.name existe
  const phaseName = safeLevel.levelPhase.name || defaultPhase.name
  const phaseColor = safeLevel.levelPhase.color || defaultPhase.color

  console.log('🎮 LevelDisplay render:', {
    level: safeLevel,
    phaseName,
    phaseColor,
    compact
  })

  const PhaseIcon = phaseIcons[phaseName as keyof typeof phaseIcons] || Sparkles

  if (compact) {
    return (
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1.5 px-2 py-1"
        style={{ 
          backgroundColor: `${phaseColor}15`,
          borderColor: `${phaseColor}40`,
          color: phaseColor 
        }}
      >
        <PhaseIcon className="h-3 w-3" />
        <span className="font-mono font-bold">Nv. {safeLevel.currentLevel}</span>
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1.5"
        style={{ 
          backgroundColor: `${phaseColor}15`,
          borderColor: `${phaseColor}40`,
          color: phaseColor 
        }}
      >
        <PhaseIcon className="h-3.5 w-3.5" />
        <span className="font-mono font-bold">Nível {safeLevel.currentLevel}</span>
      </Badge>
      
      <div className="flex flex-col">
        <span className="text-sm font-medium">{safeLevel.title}</span>
        <span className="text-xs text-muted-foreground">{phaseName}</span>
      </div>
    </div>
  )
})