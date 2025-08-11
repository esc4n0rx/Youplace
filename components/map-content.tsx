// components/map-content.tsx
"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Rectangle, useMapEvents } from "react-leaflet"
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet"
import "leaflet/dist/leaflet.css"
import { useToast } from "@/hooks/use-toast"
import { readCurrentColor } from "@/lib/user-color"
import { useCooldown } from "@/hooks/use-cooldown"
import { idFromLatLng, originFromLatLng, CELL_SIZE_DEG } from "@/lib/grid"
import { getMode, onModeChange, type Mode } from "@/lib/mode"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { updateUserCredits } from "@/lib/auth"
import { LoginDialog } from "@/components/auth/login-dialog"

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

// Componente para gerenciar eventos do mapa
function MapEventHandler({ 
  mode, 
  onPaint, 
  onHover 
}: { 
  mode: Mode
  onPaint: (lat: number, lng: number) => void
  onHover: (lat: number, lng: number) => void
}) {
  const map = useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (mode === "paint") {
        console.log("🖱️ Click detectado:", e.latlng)
        onPaint(e.latlng.lat, e.latlng.lng)
      }
    },
    mousemove: (e: LeafletMouseEvent) => {
      if (mode === "paint") {
        onHover(e.latlng.lat, e.latlng.lng)
      }
    }
  })

  useEffect(() => {
    if (!map) return

    if (mode === "paint") {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
      map.boxZoom.disable()
      map.keyboard.disable()
      
      const container = map.getContainer()
      if (container) {
        container.style.cursor = 'crosshair'
      }
    } else {
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      map.doubleClickZoom.enable()
      map.boxZoom.enable()
      map.keyboard.enable()
      
      const container = map.getContainer()
      if (container) {
        container.style.cursor = ''
      }
    }
  }, [map, mode])

  return null
}

export default function MapContent() {
  const mapRef = useRef<LeafletMap | null>(null)
  const [cells, setCells] = useState<Record<string, PixelCell>>({})
  const [hoverCell, setHoverCell] = useState<{ lat: number; lng: number } | null>(null)
  const [mode, setModeState] = useState<Mode>("navigate")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [mapKey, setMapKey] = useState(0) // Chave para forçar re-render do mapa
  const { toast } = useToast()
  const { consumeToken, tokens } = useCooldown()
  const { user, updateCredits } = useAuth()
  const { resolvedTheme } = useTheme()

  // Inicialização
  useEffect(() => {
    setModeState(getMode())
    
    // Carrega pixels do localStorage
    const stored = localStorage.getItem(PIXELS_STORAGE_KEY)
    if (stored) {
      try {
        const parsedCells = JSON.parse(stored)
        setCells(parsedCells)
        console.log("Loaded pixels from localStorage:", Object.keys(parsedCells).length)
      } catch (error) {
        console.error("Error parsing stored pixels:", error)
      }
    }
  }, [])

  // Salva pixels no localStorage sempre que mudar
  useEffect(() => {
    if (Object.keys(cells).length > 0) {
      localStorage.setItem(PIXELS_STORAGE_KEY, JSON.stringify(cells))
      console.log("Saved pixels to localStorage:", Object.keys(cells).length)
    }
  }, [cells])

  // Listener para mudanças de modo
  useEffect(() => {
    const off = onModeChange((m) => setModeState(m))
    return off
  }, [])

  // Função para limpar e reinicializar o mapa
  const resetMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }
    setMapKey(prev => prev + 1)
  }, [])

  // Função de pintura
  const paintAtLatLng = useCallback(async (lat: number, lng: number) => {
    console.log("🎨 Tentando pintar pixel em:", { lat, lng, mode, tokens, user: !!user })
    
    if (mode !== "paint") {
      console.log("❌ Não está no modo pintura")
      return
    }
    
    if (!user) {
      console.log("❌ Usuário não autenticado")
      setShowLoginDialog(true)
      return
    }
    
    if (user.credits <= 0) {
      toast({
        title: "Sem créditos disponíveis",
        description: "Você não tem créditos suficientes para pintar.",
        variant: "destructive",
      })
      return
    }

    const color = readCurrentColor()
    const origin = originFromLatLng(lat, lng)
    const id = idFromLatLng(origin.lat, origin.lng)

    console.log("✅ Pintando pixel:", { origin, id, color })

    const payload: PixelCell = {
      id,
      lat: origin.lat,
      lng: origin.lng,
      size: CELL_SIZE_DEG,
      color,
      updatedAt: Date.now(),
      userId: user.id,
      userName: user.name,
    }

    // Atualiza estado local
    setCells(prev => ({ ...prev, [id]: payload }))

    // Atualiza créditos no Supabase
    try {
      const newCredits = user.credits - 1
      const updatedUser = await updateUserCredits(user.id, newCredits)
      
      if (updatedUser) {
        updateCredits(newCredits)
        toast({ 
          title: "🎨 Pixel pintado!",
          description: `Cor: ${color} • Créditos restantes: ${newCredits}`
        })
      } else {
        throw new Error("Erro ao atualizar créditos")
      }
    } catch (error) {
      console.error("Erro ao atualizar créditos:", error)
      // Reverter mudança local em caso de erro
      setCells(prev => {
        const newCells = { ...prev }
        delete newCells[id]
        return newCells
     })
     toast({
       title: "Erro ao pintar pixel",
       description: "Tente novamente em alguns instantes.",
       variant: "destructive",
     })
   }
 }, [mode, user, updateCredits, toast])

 // Função de hover
 const handleHover = useCallback((lat: number, lng: number) => {
   const origin = originFromLatLng(lat, lng)
   setHoverCell({ lat: origin.lat, lng: origin.lng })
 }, [])

 // Limpa hover quando sai do modo pintura
 useEffect(() => {
   if (mode !== "paint") {
     setHoverCell(null)
   }
 }, [mode])

 // Renderiza os pixels pintados
 const rectangles = useMemo(() => {
   const cellsArray = Object.values(cells)
   console.log("📊 Renderizando", cellsArray.length, "pixels")
   
   return cellsArray.map((cell) => {
     const bounds: [[number, number], [number, number]] = [
       [cell.lat, cell.lng],
       [cell.lat + cell.size, cell.lng + cell.size],
     ]
     
     return (
       <Rectangle
         key={cell.id}
         bounds={bounds}
         pathOptions={{
           color: cell.color,
           fillColor: cell.color,
           fillOpacity: 1,
           weight: 0,
           stroke: false
         }}
         interactive={false}
       />
     )
   })
 }, [cells])

 // Preview do pixel no hover
 const hoverRect = useMemo(() => {
   if (!hoverCell || mode !== "paint") return null
   
   const bounds: [[number, number], [number, number]] = [
     [hoverCell.lat, hoverCell.lng],
     [hoverCell.lat + CELL_SIZE_DEG, hoverCell.lng + CELL_SIZE_DEG],
   ]
   
   const currentColor = readCurrentColor()
   
   return (
     <Rectangle
       key="hover-preview"
       bounds={bounds}
       pathOptions={{
         color: currentColor,
         fillColor: currentColor,
         fillOpacity: user ? 0.4 : 0.2,
         weight: 1,
         dashArray: user ? "3, 3" : "5, 5",
       }}
       interactive={false}
     />
   )
 }, [hoverCell, mode, user])

 const isDark = resolvedTheme === "dark"

 // Função para limpar todos os pixels (apenas desenvolvimento)
 const clearAllPixels = () => {
   setCells({})
   localStorage.removeItem(PIXELS_STORAGE_KEY)
   toast({ title: "🗑️ Todos os pixels foram limpos" })
 }

 return (
   <div className={cn("relative h-full w-full")}>
     {/* Botão de debug */}
     {process.env.NODE_ENV === 'development' && (
       <div className="absolute top-2 right-2 z-[1000] flex gap-2">
         <button
           onClick={clearAllPixels}
           className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
         >
           Limpar Pixels
         </button>
         <button
           onClick={resetMap}
           className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
         >
           Reset Mapa
         </button>
       </div>
     )}

     <MapContainer
       key={mapKey}
       center={[-23.5489, -46.6388]} // Centro em São Paulo
       zoom={13}  // Zoom bom para ver pixels pequenos
       minZoom={3}
       maxZoom={20}
       style={{ height: "100%", width: "100%" }}
       ref={mapRef}
       className={cn(
         "outline-none",
         mode === "paint" && "[&_.leaflet-container]:cursor-crosshair"
       )}
     >
       {isDark ? (
         <TileLayer
           attribution="© OpenStreetMap contributors"
           url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
         />
       ) : (
         <TileLayer
           attribution="© OpenStreetMap contributors"
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
         />
       )}

       {/* Componente de eventos do mapa */}
       <MapEventHandler 
         mode={mode}
         onPaint={paintAtLatLng}
         onHover={handleHover}
       />

       {/* Renderiza os retângulos */}
       {rectangles}
       {hoverRect}
     </MapContainer>

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

     {/* Dialog de login quando não autenticado */}
     <LoginDialog 
       open={showLoginDialog} 
       onOpenChange={setShowLoginDialog} 
     />
   </div>
 )
}