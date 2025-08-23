// types/gamification.ts
export interface UserLevel {
    id: string
    userId: string
    currentLevel: number
    totalPixelsPainted: number
    pixelsForCurrentLevel: number
    pixelsForNextLevel: number
    title: string
    experiencePoints: number
    lastLevelUp: string
    createdAt: string
    updatedAt: string
    progressPercentage: number
    pixelsUntilNextLevel: number
    levelPhase: {
      name: string
      color: string
      description: string
    }
    estimatedTimeToNextLevel: string
    percentageToMaxLevel: number
  }
  
  export interface LeaderboardUser {
    id: string
    userId: string
    username: string
    currentLevel: number
    totalPixelsPainted: number
    title: string
    experiencePoints: number
    levelPhase?: {
      name: string
      color: string
      description: string
    }
  }
  
  export interface Achievement {
    id: string
    name: string
    description: string
    unlockedAt: string
    category: 'level' | 'pixels'
  }
  
  export interface Milestone {
    type: string
    target: number
    title: string
    pixelsRequired: number
    phase: string
    description: string
    estimatedTime: string
  }
  
  export interface UserStats {
    level: UserLevel
    ranking: number
    achievements: Achievement[]
    milestones: Milestone[]
  }
  
  export interface LevelUpInfo {
    oldLevel: number
    newLevel: number
    newTitle: string
    levelsGained: number
    isSignificantLevelUp: boolean
    phaseChanged: boolean
  }
  
  export interface LevelProgress {
    level: number
    title: string
    progressPercentage: number
    pixelsUntilNextLevel: number
  }