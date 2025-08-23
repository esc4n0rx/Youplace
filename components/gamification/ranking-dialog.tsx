// components/gamification/ranking-dialog.tsx
"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Crown, Trophy, Medal, Sparkles, Star, Zap, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import type { LeaderboardUser, UserStats } from '@/types/gamification'

interface RankingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leaderboard: LeaderboardUser[]
  userStats: UserStats | null
  onRefreshLeaderboard: () => Promise<void>
  loading: boolean
}

const rankIcons = {
  1: Crown,
  2: Trophy,
  3: Medal
}

const phaseIcons = {
  'Explorador': Sparkles,
  'Cartógrafo': Star,
  'Mestre': Crown,
  'Lenda': Zap,
  'Divindade': Crown
}

// Fase padrão para fallback
const defaultPhase = {
  name: 'Explorador',
  color: '#6B7280',
  description: 'Fase inicial'
}

export function RankingDialog({ 
  open, 
  onOpenChange, 
  leaderboard, 
  userStats, 
  onRefreshLeaderboard,
  loading 
}: RankingDialogProps) {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefreshLeaderboard()
    } finally {
      setRefreshing(false)
    }
  }

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase()
  }

  const isCurrentUser = (userId: string) => user?.id === userId

  // Função para obter dados seguros da fase do usuário
  const getSafePhase = (player: LeaderboardUser) => {
    return player.levelPhase || defaultPhase
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking Mundial
          </DialogTitle>
          <DialogDescription>
            Os melhores pintores do YouPlace
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global">Ranking Global</TabsTrigger>
            <TabsTrigger value="stats">Suas Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Top {leaderboard.length} jogadores
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            <div className="space-y-2">
              {leaderboard.map((player, index) => {
                const position = index + 1
                const RankIcon = rankIcons[position as keyof typeof rankIcons]
                const safePhase = getSafePhase(player)
                const PhaseIcon = phaseIcons[safePhase.name as keyof typeof phaseIcons] || Sparkles
                const isUser = isCurrentUser(player.userId)

                console.log('🎮 Renderizando player no ranking:', {
                  player,
                  safePhase,
                  PhaseIcon: PhaseIcon.name
                })

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isUser 
                        ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    {/* Posição */}
                    <div className="flex items-center justify-center w-8 h-8">
                      {RankIcon ? (
                        <RankIcon 
                          className={`h-5 w-5 ${
                            position === 1 ? 'text-yellow-500' :
                            position === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} 
                        />
                      ) : (
                        <span className="font-bold text-muted-foreground">#{position}</span>
                      )}
                    </div>

                    {/* Avatar e Nome */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getUserInitials(player.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate ${isUser ? 'text-primary' : ''}`}>
                          {player.username}
                          {isUser && <span className="text-xs text-muted-foreground ml-1">(Você)</span>}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className="flex items-center gap-1 text-xs px-1.5 py-0.5"
                          style={{ 
                            backgroundColor: `${safePhase.color}15`,
                            borderColor: `${safePhase.color}40`,
                            color: safePhase.color 
                          }}
                        >
                          <PhaseIcon className="h-3 w-3" />
                          Nv. {player.currentLevel}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {player.title}
                        </span>
                      </div>
                    </div>

                    {/* Pixels */}
                    <div className="text-right">
                      <p className="font-mono font-bold">
                        {player.totalPixelsPainted.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">pixels</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {leaderboard.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-center">Nenhum dado de ranking disponível</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="mt-3"
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {userStats ? (
              <>
                {/* Posição no Ranking */}
                <div className="bg-card p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold">#{userStats.ranking}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Sua posição mundial</p>
                  </div>
                </div>

                {/* Conquistas Recentes */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Conquistas Recentes
                  </h3>
                  
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {userStats.achievements.slice(0, 5).map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 p-2 bg-card rounded border"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10">
                          <Star className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {userStats.achievements.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{userStats.achievements.length - 5} conquistas adicionais
                    </p>
                  )}

                  {userStats.achievements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <Star className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm text-center">Nenhuma conquista ainda</p>
                      <p className="text-xs text-center">Continue pintando para desbloquear!</p>
                    </div>
                  )}
                </div>

                {/* Próximos Marcos */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Próximos Marcos
                  </h3>
                  
                  <div className="space-y-2">
                    {userStats.milestones.slice(0, 3).map((milestone, index) => (
                      <div
                        key={index}
                        className="p-3 bg-card rounded border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{milestone.title}</p>
                          <Badge variant="outline" className="text-xs">
                            Nível {milestone.target}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {milestone.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {milestone.estimatedTime}
                        </p>
                      </div>
                    ))}
                  </div>

                  {userStats.milestones.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <Zap className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm text-center">Nenhum marco próximo</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="flex items-center justify-center mb-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Carregando suas estatísticas...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}