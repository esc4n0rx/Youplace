// components/map-content.tsx
"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Rectangle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useToast } from "@/hooks/use-toast"
import { readCurrentColor } from "@/lib/user-color"
import { 
  CELL_SIZE_DEG, 
  originFromLatLng, 
  latLngToApiCoords, 
  apiCoordsToLatLng,
  validateCoordinateSync
} from "@/lib/grid"
import { getMode, onModeChange, type Mode } from "@/lib/mode"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { usePixels } from "@/hooks/use-pixels"
import { useCredits } from "@/hooks/use-credits"
import { MapWrapper } from "./map-wrapper"
import { ErrorCard } from "@/components/ui/error-card"
import { LevelUpToast } from "@/components/gamification/level-up-toast"
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
  const { 
    pixels, 
    loading: pixelsLoading, 
    error: pixelsError, 
    paintPixel, 
    loadPixelsInArea, 
    levelUpInfo, 
    clearLevelUpInfo 
  } = usePixels()
  const [hoverCell, setHoverCell] = useState<{ lat: number; lng: number } | null>(null)
  const [mode, setModeState] = useState<Mode>("navigate")
  const [currentColor, setCurrentColor] = useState(readCurrentColor())
  const [isMapMounted, setIsMapMounted] = useState(false)
  const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<{
    lastClickCoords?: { lat: number, lng: number }
    lastCellCoords?: { lat: number, lng: number }
    lastApiCoords?: { x: number, y: number }
    coordinateValidation?: boolean
  }>({})
  
  const { toast } = useToast()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
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
      try {
        const sw = currentBounds.getSouthWest()
        const ne = currentBounds.getNorthEast()
        
        // Converte bounds para coordenadas da API
        const { x: minX, y: minY } = latLngToApiCoords(sw.lat, sw.lng)
        const { x: maxX, y: maxY } = latLngToApiCoords(ne.lat, ne.lng)
        
        // Limita a área máxima para não sobrecarregar a API (100x100)
        const areaWidth = maxX - minX
        const areaHeight = maxY - minY
        
        if (areaWidth > 100 || areaHeight > 100) {
          console.log('⚠️ Área muito grande para carregar:', { areaWidth, areaHeight })
          return
        }

        const area: PixelArea = { minX, maxX, minY, maxY }
        await loadPixelsInArea(area)
        
        // Limpa erro se carregou com sucesso
        setMapError(null)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar pixels'
        setMapError(errorMessage)
        console.error('❌ Erro ao carregar pixels para bounds:', error)
      }
    }

    loadPixelsForBounds()
  }, [currentBounds, loadPixelsInArea])

  // Função de pintura com validação rigorosa
  const paintAtLatLng = useCallback(async (lat: number, lng: number) => {
    try {
      console.log('🖱️ INÍCIO DA PINTURA - Click detectado:', { lat, lng, mode, user: !!user })
      
      if (mode !== "paint") {
        console.log('❌ Não está no modo pintura, ignorando click')
        return
      }
      
      if (!user) {
        console.log('❌ Usuário não autenticado')
        toast({
          title: "Login necessário",
          description: "Você precisa fazer login para pintar. Use o botão 'Entrar' no cabeçalho."
        })
        return
      }
      
      // ETAPA 1: Validar coordenadas de entrada
      console.log('🔍 ETAPA 1: Validando coordenadas de entrada...')
      if (!isFinite(lat) || !isFinite(lng)) {
        throw new Error(`Coordenadas de entrada inválidas: lat=${lat}, lng=${lng}`)
      }
      
      // ETAPA 2: Obter origem da célula
      console.log('🔍 ETAPA 2: Calculando origem da célula...')
      const { lat: cellLat, lng: cellLng } = originFromLatLng(lat, lng)
      
      // ETAPA 3: Converter para coordenadas da API
      console.log('🔍 ETAPA 3: Convertendo para coordenadas da API...')
      const { x: apiX, y: apiY } = latLngToApiCoords(cellLat, cellLng)
      
      // ETAPA 4: Validar sincronização de coordenadas
      console.log('🔍 ETAPA 4: Validando sincronização...')
      const isValidSync = validateCoordinateSync(cellLat, cellLng)
      
      // ETAPA 5: Converter de volta para verificação
      console.log('🔍 ETAPA 5: Verificando conversão reversa...')
      const { lat: backLat, lng: backLng } = apiCoordsToLatLng(apiX, apiY)
      
      const currentColorValue = readCurrentColor()
      
      // Atualiza debug info
      setDebugInfo({
        lastClickCoords: { lat, lng },
        lastCellCoords: { lat: cellLat, lng: cellLng },
        lastApiCoords: { x: apiX, y: apiY },
        coordinateValidation: isValidSync
      })
      
      console.log('🎯 RESUMO COMPLETO DA CONVERSÃO:', {
        clickOriginal: { lat, lng },
        cellOrigin: { lat: cellLat, lng: cellLng },
        apiCoords: { x: apiX, y: apiY },
        convertedBack: { lat: backLat, lng: backLng },
        differences: {
          latDiff: Math.abs(cellLat - backLat),
          lngDiff: Math.abs(cellLng - backLng)
        },
        color: currentColorValue,
        userCredits: user.credits,
        isValidSync
      })
      
      if (!isValidSync) {
        throw new Error('Coordenadas não sincronizadas - possível erro na conversão')
      }
      
      // ETAPA 6: Executar pintura
      console.log('🎨 ETAPA 6: Executando pintura na API...')
      const success = await paintPixel(cellLat, cellLng, currentColorValue)
      
      if (success) {
        console.log('✅ PINTURA CONCLUÍDA COM SUCESSO!')
        // Atualiza créditos após pintura bem-sucedida
        refreshCredits()
        // Limpa erro se pintou com sucesso
        setMapError(null)
      } else {
        console.log('❌ FALHA NA PINTURA')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao pintar pixel'
      console.error('❌ ERRO DURANTE PINTURA:', error)
      setMapError(errorMessage)
      toast({
        title: "Erro ao pintar",
        description: errorMessage,
        variant: "destructive"
      })
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
          weight: 2,
          dashArray: '4, 4'
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
      {/* Erros de pixels/mapa */}
      {(mapError || pixelsError) && (
        <div className="absolute top-4 left-4 right-4 z-[1000] map-overlay">
          <ErrorCard
            title="Erro no mapa"
            message={mapError || pixelsError || "Erro desconhecido"}
            onDismiss={() => {
              setMapError(null)
              // Note: pixelsError é controlado pelo hook usePixels
            }}
            className="max-w-md"
          />
        </div>
      )}

      {/* Toast de Level Up */}
      <LevelUpToast levelUpInfo={levelUpInfo} onShow={clearLevelUpInfo} />

      {/* Debug info detalhado - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-[1000] map-overlay">
          <div className="bg-background/95 backdrop-blur rounded-lg border shadow-lg p-3 text-xs max-w-xs">
            <div className="font-medium mb-2">Debug de Coordenadas</div>
            {debugInfo.lastClickCoords && (
              <>
                <div><strong>Click:</strong> {debugInfo.lastClickCoords.lat.toFixed(6)}, {debugInfo.lastClickCoords.lng.toFixed(6)}</div>
                <div><strong>Célula:</strong> {debugInfo.lastCellCoords?.lat.toFixed(6)}, {debugInfo.lastCellCoords?.lng.toFixed(6)}</div>
                <div><strong>API:</strong> {debugInfo.lastApiCoords?.x}, {debugInfo.lastApiCoords?.y}</div>
                <div><strong>Válido:</strong> <span className={debugInfo.coordinateValidation ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.coordinateValidation ? '✓' : '✗'}
                </span></div>
              </>
            )}
            {hoverCell && (
              <div className="mt-2 pt-2 border-t">
                <strong>Hover:</strong> {hoverCell.lat.toFixed(6)}, {hoverCell.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botões de debug - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 z-[1000] flex gap-2 map-overlay">
          <button
            onClick={() => refreshCredits()}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          >
            Refresh Créditos
          </button>
          <button
            onClick={() => {
              setMapError(null)
              setDebugInfo({})
              console.clear()
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
          >
            Limpar Debug
          </button>
          <button
            onClick={() => {
              console.log('🐛 Debug Info Completo:', {
                mode,
                user: user?.username,
                credits: credits || user?.credits,
                currentColor,
                hoverCell,
                pixelsCount: Object.keys(pixels).length,
                currentBounds: currentBounds ? {
                  sw: currentBounds.getSouthWest(),
                  ne: currentBounds.getNorthEast()
                } : null,
                debugInfo,
                cellSize: CELL_SIZE_DEG
              })
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
          >
            Log Debug
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
             {user ? "Clique no mapa para pintar pixels" : "Entre com sua conta"}
           </div>
           {/* Info de debug no modo desenvolvimento */}
           {process.env.NODE_ENV === 'development' && user && (
             <div className="text-xs text-muted-foreground mt-1 border-t pt-1">
               Cor: {currentColor} | Hover: {hoverCell ? `${hoverCell.lat.toFixed(6)}, ${hoverCell.lng.toFixed(6)}` : 'nenhum'}
               {debugInfo.coordinateValidation !== undefined && (
                 <div>Coords: <span className={debugInfo.coordinateValidation ? 'text-green-600' : 'text-red-600'}>
                   {debugInfo.coordinateValidation ? '✓ OK' : '✗ ERRO'}
                 </span></div>
               )}
             </div>
           )}
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