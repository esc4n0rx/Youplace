"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LogOut, PaintBucket, Sparkles, MousePointer2 } from "lucide-react"
import { HexColorPicker } from "react-colorful"
import { getOrCreateProfile, signOutProfile } from "@/lib/profile"
import { readCurrentColor, setCurrentColor } from "@/lib/user-color"
import { useCooldown } from "@/hooks/use-cooldown"
import { setMode, getMode, type Mode } from "@/lib/mode"
import { cn } from "@/lib/utils"

export default function HeaderBar() {
  const [profile, setProfile] = useState(getOrCreateProfile())
  const [color, setColor] = useState(readCurrentColor())
  const { tokens, nextRefillSeconds, maxTokens } = useCooldown()
  const [mode, setModeState] = useState<Mode>(getMode())

  useEffect(() => {
    const onColor = () => setColor(readCurrentColor())
    window.addEventListener("rplace:color", onColor)
    return () => window.removeEventListener("rplace:color", onColor)
  }, [])

  useEffect(() => {
    // Sync with persisted mode across tabs/components
    const off = (() => {
      const handler = () => setModeState(getMode())
      window.addEventListener("rplace:mode", handler as any)
      return () => window.removeEventListener("rplace:mode", handler as any)
    })()
    return off
  }, [])

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(" ")
    const s = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0]
    return s.toUpperCase()
  }, [profile.name])

  const switchMode = (next: Mode) => {
    setMode(next)
    setModeState(next)
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60",
        "dark:bg-neutral-900/60 supports-[backdrop-filter]:dark:bg-neutral-900/50",
        "border-b",
      )}
      role="banner"
      aria-label="Barra superior do app"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 ring-1 ring-black/10">
              <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar do usuário" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate">{profile.name}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">r/place • mapa mundial</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="hidden md:flex items-center rounded-full border bg-background/50 backdrop-blur px-1 py-1">
              <Button
                variant={mode === "navigate" ? "default" : "ghost"}
                size="sm"
                className={cn("gap-1 rounded-full", mode === "navigate" ? "" : "opacity-80")}
                onClick={() => switchMode("navigate")}
                aria-pressed={mode === "navigate"}
              >
                <MousePointer2 className="h-4 w-4" />
                Navegar
              </Button>
              <Button
                variant={mode === "paint" ? "default" : "ghost"}
                size="sm"
                className={cn("gap-1 rounded-full", mode === "paint" ? "" : "opacity-80")}
                onClick={() => switchMode("paint")}
                aria-pressed={mode === "paint"}
              >
                <PaintBucket className="h-4 w-4" />
                Pintar
              </Button>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-mono">{tokens}</span>
                <span className="text-muted-foreground">/ {maxTokens}</span>
              </Badge>
              {tokens <= 0 ? (
                <span className="text-xs text-muted-foreground">recarga em {Math.max(0, nextRefillSeconds)}s</span>
              ) : null}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Selecionar cor">
                  <div className="h-4 w-4 rounded-sm border shadow-inner" style={{ backgroundColor: color }} />
                  <span className="sr-only">Selecionar cor</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <PaintBucket className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Cor atual</p>
                  </div>
                  <HexColorPicker
                    color={color}
                    onChange={(c) => {
                      setColor(c)
                      setCurrentColor(c)
                    }}
                  />
                  <div className="text-xs text-muted-foreground font-mono text-center">{color}</div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOutProfile()
                setProfile(getOrCreateProfile(true))
              }}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sair
            </Button>
          </div>
        </div>

        {/* Mobile row */}
        <div className="md:hidden pb-2 -mt-2 flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              variant={mode === "navigate" ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => switchMode("navigate")}
            >
              <MousePointer2 className="h-4 w-4" />
              Nav
            </Button>
            <Button
              variant={mode === "paint" ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => switchMode("paint")}
            >
              <PaintBucket className="h-4 w-4" />
              Pintar
            </Button>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono">{tokens}</span>
            <span className="text-muted-foreground">/ {maxTokens}</span>
          </Badge>
        </div>
      </div>
    </header>
  )
}
