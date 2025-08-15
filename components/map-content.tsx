// components/map-content.tsx
"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Rectangle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useToast } from "@/hooks/use-toast"
import { readCurrentColor } from "@/lib/user-color"
import { CELL_SIZE_DEG, originFromLatLng, latLngToApiCoords, apiCoordsToLatLng } from "@/lib/grid"
import { getMode, onModeChange, type Mode } from "@/lib/mode"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { usePixels } from "@/hooks/use-pixels"
import { useCredits } from "@/hooks/use-credits"
import { MapWrapper } from "./map-wrapper"
import type { PixelArea } from "@/types/pixel"

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

export default function MapContent() {
  const [hoverCell, setHoverCell] = useState<{ lat: number; lng: number } | null>(null)
  const [mode, setModeState] = useState<Mode>("navigate")
  const [currentColor, setCurrentColor] = useState(readCurrentColor())
  const [isMapMounted, setIsMapMounted] = useState(false)
  const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null)
  
  const { toast } = useToast()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const { pixels, loading: pixelsLoading, paintPixel, loadPixelsInArea } = usePixels()
  const { credits, refreshCredits } = useCredits()

  // Inicialização
  useEffect(() => {
    // Define o modo e cor iniciais
    setModeState(getMode())
    setCurrentColor(readCurrentColor())

    // Aguarda um tick antes de montar o mapa para garantir que o DOM esteja pronto
    const timer = setTimeout(() => {
      setIsMapMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Listener para mudanças de modo e cor
  useEffect(() => {
    const offMode = onModeChange((m) => setModeState(m))
    const onColorChange = () => setCurrentColor(readCurrentColor())
    window.addEventListener("rplace:color", onColorChange)
    
    return () => {
      offMode()
      window.removeEventListener("rplace:color", onColorChange)
    }
  }, [])

  // Carrega pixels quando os bounds do mapa mudam
  useEffect(() => {
    if (!currentBounds) return

    const loadPixelsForBounds = async () => {
      const sw = currentBounds.getSouthWest()
      const ne = currentBounds.getNorthEast()
      
      // Converte bounds para coordenadas da API
      const { x: minX, y: minY } = latLngToApiCoords(sw.lat, sw.lng)
      const { x: maxX, y: maxY } = latLngToApiCoords(ne.lat, ne.lng)
      
      // Limita a área máxima para não sobrecarregar a API (100x100)
      const areaWidth = maxX - minX
      const areaHeight = maxY - minY
      
      if (areaWidth > 100 || areaHeight > 100) {
        console.log('⚠️ Área muito grande, não carregando pixels')
        return
      }

      const area: PixelArea = { minX, maxX, minY, maxY }
      
      try {
        await loadPixelsInArea(area)
      } catch (error) {
        console.error('❌ Erro ao carregar pixels para bounds:', error)
      }
    }

    loadPixelsForBounds()
  }, [currentBounds, loadPixelsInArea])

  // Função de pintura
  const paintAtLatLng = useCallback(async (lat: number, lng: number) => {
    const { lat: cellLat, lng: cellLng } = originFromLatLng(lat, lng)

    console.log("🎨 Tentando pintar pixel em:", { lat: cellLat, lng: cellLng, mode, user: !!user })
    
    if (mode !== "paint") {
      console.log("❌ Não está no modo pintura")
      return
    }
    
    if (!user) {
      console.log("🔐 Usuário não autenticado, exibindo toast.")
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para pintar. Use o botão 'Entrar' no cabeçalho."
      })
      return
    }
    
    const success = await paintPixel(cellLat, cellLng, readCurrentColor())
    
    if (success) {
      // Atualiza créditos após pintura bem-sucedida
      refreshCredits()
    }
  }, [mode, user, paintPixel, refreshCredits, toast])

  const handleHover = useCallback((lat: number, lng: number) => {
    if (mode === "paint") {
      const { lat: cellLat, lng: cellLng } = originFromLatLng(lat, lng);
      setHoverCell({ lat: cellLat, lng: cellLng });
    } else {
      setHoverCell(null);
    }
  }, [mode]);

  const isDark = resolvedTheme === 'dark'

  // Gera retângulos para cada célula pintada
  const rectangles = useMemo(() => {
    return Object.values(pixels).map(pixel => {
      const { lat, lng } = apiCoordsToLatLng(pixel.x, pixel.y)
      
      return (
        <Rectangle
          key={pixel.id}
          bounds={[
            [lat, lng],
            [lat + CELL_SIZE_DEG, lng + CELL_SIZE_DEG]
          ]}
          pathOptions={{
            fillColor: pixel.color,
            color: 'transparent',
            fillOpacity: 1,
            weight: 0
          }}
          interactive={false}
        />
      )
    })
  }, [pixels])

  // Retângulo de hover - memoizado
  const hoverRect = useMemo(() => 
    mode === "paint" && hoverCell ? (
      <Rectangle
        key="hover"
        bounds={[
          [hoverCell.lat, hoverCell.lng],
          [hoverCell.lat + CELL_SIZE_DEG, hoverCell.lng + CELL_SIZE_DEG]
        ]}
        pathOptions={{
          fillColor: currentColor,
          color: isDark ? 'white' : 'black',
          fillOpacity: 0.7,
          weight: 1,
          dashArray: '2, 2'
        }}
        interactive={false}
      />
    ) : null,
    [hoverCell, mode, currentColor, isDark]
  )

  // Callback para atualizar bounds do mapa
  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    setCurrentBounds(bounds)
  }, [])

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
        <div className="absolute top-2 right-2 z-[1000] flex gap-2 map-overlay">
          <button
            onClick={() => refreshCredits()}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          >
            Refresh Créditos
          </button>
        </div>
      )}

      <MapWrapper
        center={[-23.5489, -46.6388]} // Centro em São Paulo
        zoom={18}  // Zoom maior para ver pixels pequenos
        minZoom={3}
        maxZoom={22} // Aumentado para permitir mais zoom
        isDark={isDark}
        mode={mode}
        onPaint={paintAtLatLng}
        onHover={handleHover}
        onBoundsChange={handleBoundsChange}
        rectangles={rectangles}
        hoverRect={hoverRect}
        className={cn(
          "outline-none",
          mode === "paint" && "[&_.leaflet-container]:cursor-crosshair"
        )}
      />

      {/* Loading indicator */}
      {pixelsLoading && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[900] map-overlay">
          <div className="bg-background/95 backdrop-blur rounded-lg border shadow-lg p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <div className="text-sm">Carregando pixels...</div>
            </div>
          </div>
        </div>
      )}

      {/* Interface do modo pintura */}
      {mode === "paint" && (
        <div className="pointer-events-none absolute left-4 bottom-4 z-[900] map-overlay">
          <div className="bg-background/95 backdrop-blur rounded-lg border shadow-lg p-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded border-2 border-white shadow-sm" 
               style={{ backgroundColor: currentColor }}
             />
             <div>
               <div className="font-medium text-sm">
                 {user ? "Modo Pintura" : "Login Necessário"}
               </div>
               <div className="text-xs text-muted-foreground">
                 {user ? (
                   <>Créditos: <span className="font-mono font-bold text-foreground">{credits !== null ? credits : user.credits}</span></>
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
     <div className="pointer-events-none absolute right-4 top-4 z-[900] map-overlay">
       <div className="bg-background/95 backdrop-blur rounded-lg border shadow-lg px-3 py-2">
         <div className="text-xs text-muted-foreground">
           Pixels carregados: <span className="font-mono font-bold text-foreground">
             {Object.keys(pixels).length}
           </span>
         </div>
       </div>
     </div>
   </div>
 )
}