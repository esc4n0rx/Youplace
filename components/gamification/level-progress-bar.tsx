// components/gamification/level-progress-bar.tsx
"use client"

import { memo } from 'react'
import { Progress } from '@/components/ui/progress'
import type { UserLevel } from '@/types/gamification'

interface LevelProgressBarProps {
  level: UserLevel
  showDetails?: boolean
  className?: string
}

export const LevelProgressBar = memo(function LevelProgressBar({ 
  level, 
  showDetails = true, 
  className 
}: LevelProgressBarProps) {
  // Validações defensivas
  if (!level) {
    console.warn('⚠️ LevelProgressBar: level prop is null/undefined')
    return null
  }

  const safeLevel = {
    currentLevel: level.currentLevel || 1,
    progressPercentage: typeof level.progressPercentage === 'number' ? level.progressPercentage : 0,
    pixelsForCurrentLevel: level.pixelsForCurrentLevel || 0,
    pixelsUntilNextLevel: level.pixelsUntilNextLevel || 0,
    pixelsForNextLevel: level.pixelsForNextLevel || 0,
    estimatedTimeToNextLevel: level.estimatedTimeToNextLevel || 'Desconhecido',
    levelPhase: level.levelPhase || { name: 'Explorador', color: '#6B7280' }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">
          Progresso para Nível {safeLevel.currentLevel + 1}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {safeLevel.progressPercentage}%
        </span>
      </div>
      
      <Progress 
        value={safeLevel.progressPercentage} 
        className="h-2"
        style={{
          background: `${safeLevel.levelPhase.color}20`
        }}
      />
      
      {showDetails && (
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>{safeLevel.pixelsForCurrentLevel} pixels</span>
          <span>
            Faltam <span className="font-mono font-bold text-foreground">
              {safeLevel.pixelsUntilNextLevel}
            </span> pixels
          </span>
          <span>{safeLevel.pixelsForNextLevel} pixels</span>
        </div>
      )}
      
      <div className="text-center mt-1">
        <span className="text-xs text-muted-foreground">
          ETA: {safeLevel.estimatedTimeToNextLevel}
        </span>
      </div>
    </div>
  )
})