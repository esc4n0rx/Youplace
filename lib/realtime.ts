"use client"

// Arquivo simplificado sem Y.js por enquanto
export type PixelCell = {
  id: string
  lat: number
  lng: number
  size: number
  color: string
  updatedAt: number
  userId: string
  userName: string
}

// Por enquanto, vamos usar apenas localStorage
// Mais tarde podemos implementar WebSockets ou outra solução
export function getRealtime() {
  return {
    // Placeholder - implementar depois
    doc: null,
    provider: null,
    pixelsMap: {
      set: () => {},
      forEach: () => {},
      observe: () => {},
      unobserve: () => {}
    }
  }
}