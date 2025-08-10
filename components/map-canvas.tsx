"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet"
import "leaflet/dist/leaflet.css"
import { useToast } from "@/hooks/use-toast"
import { readCurrentColor } from "@/lib/user-color"
import { getOrCreateProfile } from "@/lib/profile"
import { useCooldown } from "@/hooks/use-cooldown"
import { getRealtime, type PixelCell } from "@/lib/realtime"
import { idFromLatLng, originFromLatLng, CELL_SIZE_DEG } from "@/lib/grid"
import { getMode, onModeChange, type Mode } from "@/lib/mode"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const MapContainer = dynamic(async () => (await import("react-leaflet")).MapContainer, { ssr: false })
const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, { ssr: false })
const Rectangle = dynamic(async () => (await import("react-leaflet")).Rectangle, { ssr: false })

export default function MapCanvas() {
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [cells, setCells] = useState<Record<string, PixelCell>>({})
  const [hoverCell, setHoverCell] = useState<{ lat: number; lng: number } | null>(null)
  const [mode, setModeState] = useState<Mode>(getMode())
  const { toast } = useToast()
  const { consumeToken, tokens } = useCooldown()
  const profileRef = useRef(getOrCreateProfile())
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Realtime (Yjs) subscription
  useEffect(() => {
    const { pixelsMap } = getRealtime()
    const snapshot: Record<string, PixelCell> = {}
    pixelsMap.forEach((val, key) => {
      snapshot[key] = val as PixelCell
    })
    setCells(snapshot)

    const sub = () => {
      const next: Record<string, PixelCell> = {}
      pixelsMap.forEach((v, k) => {
        next[k] = v as PixelCell
      })
      setCells(next)
    }
    pixelsMap.observe(sub)
    return () => {
      pixelsMap.unobserve(sub)
    }
  }, [])

  // Modo
  useEffect(() => {
    const off = onModeChange((m) => setModeState(m))
    return off
  }, [])

  // Função de pintura
  const paintAtLatLng = (lat: number, lng: number) => {
    if (getMode() !== "paint") return
    if (tokens <= 0) {
      toast({
        title: "Sem pixels disponíveis",
        description: "Aguarde a recarga para pintar novamente.",
        variant: "destructive",
      })
      return
    }
    const color = readCurrentColor()
    const origin = originFromLatLng(lat, lng)
    const id = idFromLatLng(origin.lat, origin.lng)

    const payload: PixelCell = {
      id,
      lat: origin.lat,
      lng: origin.lng,
      size: CELL_SIZE_DEG,
      color,
      updatedAt: Date.now(),
      userId: profileRef.current.id,
      userName: profileRef.current.name,
    }

    // Atualiza Yjs (tempo real)
    const { pixelsMap } = getRealtime()
    pixelsMap.set(id, payload)

    // Atualiza local imediatamente (feedback instantâneo)
    setCells((prev) => ({ ...prev, [id]: payload }))

    consumeToken()
    toast({ title: "Pixel pintado!" })
  }

  // Eventos do Leaflet
  useEffect(() => {
    if (!map) return

    const onClick = (e: LeafletMouseEvent) => {
      if (mode !== "paint") return
      paintAtLatLng(e.latlng.lat, e.latlng.lng)
    }

    const onMouseDown = (e: LeafletMouseEvent) => {
      // Mousedown dá mais confiabilidade quando Leaflet não emite 'click' após pequenos drags
      if (mode !== "paint") return
      // Só botão esquerdo
      // @ts-ignore
      if (e.originalEvent && "button" in e.originalEvent && e.originalEvent.button !== 0) return
      paintAtLatLng(e.latlng.lat, e.latlng.lng)
    }

    const onTouchEnd = (e: any) => {
      if (mode !== "paint") return
      const latlng = e.latlng
      if (!latlng) return
      paintAtLatLng(latlng.lat, latlng.lng)
    }

    const onMouseMove = (e: any) => {
      if (mode !== "paint") {
        setHoverCell(null)
        return
      }
      const latlng = e.latlng
      if (!latlng) return
      const origin = originFromLatLng(latlng.lat, latlng.lng)
      setHoverCell({ lat: origin.lat, lng: origin.lng })
    }

    map.on("click", onClick)
    map.on("mousedown", onMouseDown)
    map.on("touchend", onTouchEnd)
    map.on("mousemove", onMouseMove)

    // Alterna interações por modo
    const applyInteraction = () => {
      if (mode === "paint") {
        map.dragging.disable()
        map.scrollWheelZoom.disable()
        map.doubleClickZoom.disable()
        map.boxZoom.disable()
        map.keyboard.disable()
      } else {
        map.dragging.enable()
        map.scrollWheelZoom.enable()
        map.doubleClickZoom.enable()
        map.boxZoom.enable()
        map.keyboard.enable()
      }
    }
    applyInteraction()

    return () => {
      map.off("click", onClick)
      map.off("mousedown", onMouseDown)
      map.off("touchend", onTouchEnd)
      map.off("mousemove", onMouseMove)
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      map.doubleClickZoom.enable()
      map.boxZoom.enable()
      map.keyboard.enable()
    }
  }, [map, mode, tokens]) // eslint-disable-line react-hooks/exhaustive-deps

  // Células pintadas
  const rectangles = useMemo(() => {
    return Object.values(cells).map((cell) => {
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
            fillOpacity: 0.6,
            weight: 0,
          }}
          interactive={false}
          className="transition-all duration-300"
        />
      )
    })
  }, [cells])

  // Pré-visualização no modo pintura
  const hoverRect = useMemo(() => {
    if (!hoverCell || mode !== "paint") return null
    const b: [[number, number], [number, number]] = [
      [hoverCell.lat, hoverCell.lng],
      [hoverCell.lat + CELL_SIZE_DEG, hoverCell.lng + CELL_SIZE_DEG],
    ]
    return (
      <Rectangle
        bounds={b}
        pathOptions={{
          color: "#000000",
          weight: 1,
          dashArray: "4 4",
          fill: false,
        }}
      />
    )
  }, [hoverCell, mode])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div
      className={cn(
        "relative h-full w-full",
        mode === "paint" && "cursor-[url('/cursors/paint-bucket.png')_6_22,auto]",
      )}
    >
      <MapContainer
        center={[0, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        whenCreated={setMap}
        className={cn("outline-none")}
      >
        {isDark ? (
          <TileLayer
            attribution={
              'Mapa © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Tiles © <a href="https://carto.com/attributions">CARTO</a>'
            }
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"] as any}
            crossOrigin="anonymous"
          />
        ) : (
          <TileLayer
            attribution={'Mapa © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
          />
        )}

        {rectangles}
        {hoverRect}
      </MapContainer>

      {mode === "paint" ? (
        <div className="pointer-events-none absolute left-2 bottom-2 z-[500] rounded-md bg-background/70 backdrop-blur px-2 py-1 text-xs shadow border">
          Modo Pintura: clique para pintar • créditos: <span className="font-mono">{tokens}</span>
        </div>
      ) : null}
    </div>
  )
}
