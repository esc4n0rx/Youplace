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
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">
          Progresso para Nível {level.currentLevel + 1}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {level.progressPercentage}%
        </span>
      </div>
      
      <Progress 
        value={level.progressPercentage} 
        className="h-2"
        style={{
          background: `${level.levelPhase.color}20`
        }}
      />
      
      {showDetails && (
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>{level.pixelsForCurrentLevel} pixels</span>
          <span>
            Faltam <span className="font-mono font-bold text-foreground">
              {level.pixelsUntilNextLevel}
            </span> pixels
          </span>
          <span>{level.pixelsForNextLevel} pixels</span>
        </div>
      )}
      
      <div className="text-center mt-1">
        <span className="text-xs text-muted-foreground">
          ETA: {level.estimatedTimeToNextLevel}
        </span>
      </div>
    </div>
  )
})