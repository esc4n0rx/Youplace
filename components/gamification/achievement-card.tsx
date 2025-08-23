// components/gamification/achievement-card.tsx
"use client"

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Trophy, Target } from 'lucide-react'
import type { Achievement } from '@/types/gamification'

interface AchievementCardProps {
  achievement: Achievement
  className?: string
}

const categoryIcons = {
  level: Trophy,
  pixels: Target
}

const categoryColors = {
  level: '#F59E0B',
  pixels: '#10B981'
}

export const AchievementCard = memo(function AchievementCard({ 
  achievement, 
  className 
}: AchievementCardProps) {
  const Icon = categoryIcons[achievement.category] || Star
  const color = categoryColors[achievement.category] || '#6B7280'

  return (
    <Card className={`transition-all hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon 
              className="h-5 w-5" 
              style={{ color }}
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">{achievement.name}</h4>
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: `${color}15`,
                  color 
                }}
              >
                {achievement.category === 'level' ? 'Nível' : 'Pixels'}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">
              {achievement.description}
            </p>
            
            <p className="text-xs text-muted-foreground">
              Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})