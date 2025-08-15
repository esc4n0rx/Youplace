// types/pixel.ts
export interface Pixel {
    id: string
    x: number
    y: number
    color: string
    userId: string
    username: string
    createdAt: string
  }
  
  export interface PixelArea {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  
  export interface UserStats {
    pixelCount: number
    timeframe: string
  }
  
  export interface CreditTransaction {
    id: string
    userId: string
    amount: number
    type: string
    description: string
    createdAt: string
  }
  
  export interface Coordinates {
    x: number
    y: number
  }