// components/map-content.tsx
"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Rectangle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useToast } from "@/hooks/use-toast"
import { readCurrentColor } from "@/lib/user-color"
import { useCooldown } from "@/hooks/use-cooldown"
import { CELL_SIZE_DEG } from "@/lib/grid"
import { getMode, onModeChange, type Mode } from "@/lib/mode"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { MapWrapper } from "./map-wrapper"

// Fix para o Leaflet no Next.js
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

// Configuração dos ícones padrão do Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
  })
}

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

const PIXELS_STORAGE_KEY = "rplace:pixels"

export default function MapContent() {
  const [cells, setCells] = useState<Record<string, PixelCell>>({})
  const [hoverCell, setHoverCell] = useState<{ lat: number; lng: number } | null>(null)
  const [mode, setModeState] = useState<Mode>("navigate")
  const [isMapMounted, setIsMapMounted] = useState(false)
  const { toast } = useToast()
  const { consumeToken, tokens } = useCooldown()
  const { user, updateCredits } = useAuth()
  const { resolvedTheme } = useTheme()

  // Inicialização
  useEffect(() => {
    // Define o modo inicial
    setModeState(getMode())
    
    // Carrega pixels do localStorage
    try {
      const stored = localStorage.getItem(PIXELS_STORAGE_KEY)
      if (stored) {
        const parsedCells = JSON.parse(stored)
        setCells(parsedCells)
        console.log("Loaded pixels from localStorage:", Object.keys(parsedCells).length)
      }
    } catch (error) {
      console.error("Error parsing stored pixels:", error)
    }

    // Aguarda um tick antes de montar o mapa para garantir que o DOM esteja pronto
    const timer = setTimeout(() => {
      setIsMapMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Salva pixels no localStorage sempre que mudar
  useEffect(() => {
    if (Object.keys(cells).length > 0) {
      localStorage.setItem(PIXELS_STORAGE_KEY, JSON.stringify(cells))
    }
  }, [cells])

  // Listener para mudanças de modo
  useEffect(() => {
    const off = onModeChange((m) => setModeState(m))
    return off
  }, [])

  // Função de pintura
  const paintAtLatLng = useCallback(async (lat: number, lng: number) => {
    console.log("🎨 Tentando pintar pixel em:", { lat, lng, mode, tokens, user: !!user })
    
    if (mode !== "paint") {
      console.log("❌ Não está no modo pintura")
      return
    }
    
    if (!user) {
      console.log("🔐 Usuário não autenticado, exibindo toast.")
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para pintar. Use o botão 'Entrar' no cabeçalho.",
        variant: "destructive"
      })
      return
    }
    
    if (tokens <= 0) {
      toast({
        title: "Sem tokens disponíveis",
        description: "Aguarde o cooldown para pintar novamente",
        variant: "destructive"
      })
      return
    }
    
    if (user.credits <= 0) {
      toast({
        title: "Sem créditos",
        description: "Você não tem créditos suficientes para pintar",
        variant: "destructive"
      })
      return
    }
    
    // Consome um token
    consumeToken()
    
    // Calcula o ID único da célula
    const cellId = `${lat.toFixed(6)}_${lng.toFixed(6)}`
    
    // Cria ou atualiza a célula
    const newCell: PixelCell = {
      id: cellId,
      lat,
      lng,
      size: CELL_SIZE_DEG,
      color: readCurrentColor(),
      updatedAt: Date.now(),
      userId: user.id,
      userName: user.name || user.email || 'Usuário'
    }
    
    setCells(prev => ({
      ...prev,
      [cellId]: newCell
    }))
    
    // Atualiza créditos do usuário
    updateCredits(user.credits - 1)
    
    toast({
      title: "Pixel pintado!",
      description: `Pintado em ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    })
    
    console.log("✅ Pixel pintado com sucesso:", newCell)
  }, [mode, tokens, user, consumeToken, updateCredits, toast])

  const handleHover = useCallback((lat: number, lng: number) => {
    setHoverCell({ lat, lng })
  }, [])

  const clearAllPixels = () => {
    setCells({})
    localStorage.removeItem(PIXELS_STORAGE_KEY)
    toast({
      title: "Pixels limpos",
      description: "Todos os pixels foram removidos",
    })
  }

  const isDark = resolvedTheme === 'dark'

  // Gera retângulos para cada célula - memoizado para evitar recriações desnecessárias
  const rectangles = useMemo(() => 
    Object.values(cells).map(cell => (
      <Rectangle
        key={cell.id}
        bounds={[
          [cell.lat, cell.lng],
          [cell.lat + CELL_SIZE_DEG, cell.lng + CELL_SIZE_DEG]
        ]}
        pathOptions={{
          fillColor: cell.color,
          color: 'transparent',
          fillOpacity: 0.8,
          weight: 0
        }}
        interactive={false}
      />
    )), [cells]
  )

  // Retângulo de hover - memoizado
  const hoverRect = useMemo(() => 
    hoverCell ? (
      <Rectangle
        key="hover"
        bounds={[
          [hoverCell.lat, hoverCell.lng],
          [hoverCell.lat + CELL_SIZE_DEG, hoverCell.lng + CELL_SIZE_DEG]
        ]}
        pathOptions={{
          fillColor: readCurrentColor(),
          color: 'white',
          fillOpacity: 0.6,
          weight: 1,
          dashArray: '3,3'
        }}
        interactive={false}
      />
    ) : null,
    [hoverCell]
  )

  // Não renderiza o mapa até estar pronto
  if (!isMapMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <div className="text-sm text-muted-foreground">Inicializando mapa...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative h-full w-full bg-background")}>
      {/* Botões de debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 z-[1000] flex gap-2">
          <button
            onClick={clearAllPixels}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
          >
            Limpar Pixels
          </button>
        </div>
      )}

      <MapWrapper
        center={[-23.5489, -46.6388]} // Centro em São Paulo
        zoom={13}  // Zoom bom para ver pixels pequenos
        minZoom={3}
        maxZoom={20}
        isDark={isDark}
        mode={mode}
        onPaint={paintAtLatLng}
        onHover={handleHover}
        rectangles={rectangles}
        hoverRect={hoverRect}
        className={cn(
          "outline-none",
          mode === "paint" && "[&_.leaflet-container]:cursor-crosshair"
        )}
      />

      {/* Interface do modo pintura */}
      {mode === "paint" && (
        <div className="pointer-events-none absolute left-4 bottom-4 z-[500]">
          <div className="bg-background/95 backdrop-blur rounded-lg border shadow-lg p-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded border-2 border-white shadow-sm" 
                style={{ backgroundColor: readCurrentColor() }}
              />
              <div>
                <div className="font-medium text-sm">
                  {user ? "Modo Pintura" : "Login Necessário"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user ? (
                    <>Créditos: <span className="font-mono font-bold text-foreground">{user.credits}</span></>
                  ) : (
                    "Faça login para pintar"
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {user ? "Clique no mapa para pintar pixels" : "Entre com sua conta Google"}
            </div>
          </div>
        </div>
      )}

      {/* Contador de pixels */}
      <div className="pointer-events-none absolute right-4 top-4 z-[500]">
        <div className="bg-background/95 backdrop-blur rounded-lg border shadow-lg px-3 py-2">
          <div className="text-xs text-muted-foreground">
            Pixels pintados: <span className="font-mono font-bold text-foreground">
              {Object.keys(cells).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}