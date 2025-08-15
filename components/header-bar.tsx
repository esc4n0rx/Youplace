// components/header-bar.tsx
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LogOut, PaintBucket, Sparkles, MousePointer2, User } from "lucide-react"
import { HexColorPicker } from "react-colorful"
import { readCurrentColor, setCurrentColor } from "@/lib/user-color"
import { useCooldown } from "@/hooks/use-cooldown"
import { setMode, getMode, type Mode, onModeChange } from "@/lib/mode"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { LoginDialog } from "@/components/auth/login-dialog"

export default function HeaderBar() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [color, setColor] = useState("#ff4d4f")
  const { tokens, nextRefillSeconds, maxTokens } = useCooldown()
  const [mode, setModeState] = useState<Mode>("navigate")
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Inicialização
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Carrega valores iniciais
    const initialColor = readCurrentColor()
    const initialMode = getMode()
    
    console.log("🎨 Cor inicial:", initialColor)
    console.log("🔄 Modo inicial:", initialMode)
    
    setColor(initialColor)
    setModeState(initialMode)
  }, [])

  // Listener para mudanças de cor
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const onColorChange = () => {
      const newColor = readCurrentColor()
      console.log("🎨 Cor alterada via evento:", newColor)
      setColor(newColor)
    }
    
    window.addEventListener("rplace:color", onColorChange)
    return () => window.removeEventListener("rplace:color", onColorChange)
  }, [])

  // Listener para mudanças de modo
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const unsubscribe = onModeChange((newMode) => {
      console.log("🔄 Modo alterado via evento:", newMode)
      setModeState(newMode)
    })
    return unsubscribe
  }, [])

  const initials = useMemo(() => {
    if (!user?.username) return "?"
    const parts = user.username.trim().split(" ")
    const s = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0]
    return s.toUpperCase()
  }, [user?.username])

  const switchMode = useCallback((next: Mode) => {
    console.log("🔄 Alterando modo:", next)
    setMode(next)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erro no logout:", error)
    }
  }

  const handleColorChange = useCallback((newColor: string) => {
    console.log("🎨 Usuário selecionou cor:", newColor)
    setColor(newColor)
    setCurrentColor(newColor)
  }, [])

  return (
    <>
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
                <AvatarFallback>
                  {user ? initials : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate">
                  {authLoading ? "Carregando..." : user?.username || "Visitante"}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  r/place • mapa mundial
                </span>
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
                  disabled={!user}
                >
                  <PaintBucket className="h-4 w-4" />
                  Pintar
                </Button>
              </div>

              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-mono">{user.credits}</span>
                    <span className="text-muted-foreground">créditos</span>
                  </Badge>
                  {tokens <= 0 ? (
                    <span className="text-xs text-muted-foreground">recarga em {Math.max(0, nextRefillSeconds)}s</span>
                  ) : null}
                </div>
              )}

              {/* Color Picker - Simplificado */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    aria-label="Selecionar cor"
                    className="relative hover:ring-2 hover:ring-primary/20 transition-all"
                  >
                    <div 
                      className="h-4 w-4 rounded-sm border-2 border-white shadow-lg" 
                      style={{ backgroundColor: color }} 
                    />
                    <span className="sr-only">Cor atual: {color}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-72 p-4" 
                  align="end" 
                  sideOffset={8}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PaintBucket className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Selecionar cor</p>
                      </div>
                      <div 
                        className="w-6 h-6 rounded border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <HexColorPicker
                        color={color}
                        onChange={handleColorChange}
                        style={{ width: '100%', height: '150px' }}
                      />
                      
                      <div className="flex items-center justify-center">
                        <input
                          type="text"
                          value={color.toUpperCase()}
                          onChange={(e) => {
                            const newColor = e.target.value
                            if (/^#[0-9A-F]{6}$/i.test(newColor)) {
                              handleColorChange(newColor)
                            }
                          }}
                          className="text-xs font-mono text-center bg-muted px-2 py-1 rounded border w-20"
                          placeholder="#FF0000"
                        />
                      </div>
                    </div>

                    {/* Cores predefinidas */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Cores populares</p>
                      <div className="grid grid-cols-8 gap-2">
                        {[
                          "#FF0000", "#FF8000", "#FFFF00", "#80FF00",
                          "#00FF00", "#00FF80", "#00FFFF", "#0080FF",
                          "#0000FF", "#8000FF", "#FF00FF", "#FF0080",
                          "#FFFFFF", "#C0C0C0", "#808080", "#404040",
                          "#000000", "#800000", "#808000", "#008000",
                          "#008080", "#000080", "#800080", "#8B4513"
                        ].map((presetColor) => (
                          <button
                            key={presetColor}
                            className={cn(
                              "w-6 h-6 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer",
                              color.toUpperCase() === presetColor ? "ring-2 ring-primary ring-offset-1" : ""
                            )}
                            style={{ backgroundColor: presetColor }}
                            onClick={() => handleColorChange(presetColor)}
                            aria-label={`Selecionar cor ${presetColor}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Sair
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowLoginDialog(true)}
                  disabled={authLoading}
                >
                  <User className="h-4 w-4 mr-1.5" />
                  {authLoading ? "Carregando..." : "Entrar"}
                </Button>
              )}
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
                disabled={!user}
              >
                <PaintBucket className="h-4 w-4" />
                Pintar
              </Button>
            </div>
            
            {/* Color picker para mobile */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                  >
                    <div 
                      className="h-3 w-3 rounded border border-white shadow-sm" 
                      style={{ backgroundColor: color }} 
                    />
                    Cor
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <div className="space-y-3">
                    <HexColorPicker
                      color={color}
                      onChange={handleColorChange}
                      style={{ width: '100%', height: '120px' }}
                    />
                    <div className="grid grid-cols-6 gap-1">
                      {[
                        "#FF0000", "#FF8000", "#FFFF00", "#00FF00", "#0000FF", "#FF00FF",
                        "#FFFFFF", "#808080", "#000000", "#800000", "#008000", "#000080"
                      ].map((presetColor) => (
                        <button
                          key={presetColor}
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: presetColor }}
                          onClick={() => handleColorChange(presetColor)}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {user && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-mono">{user.credits}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </>
  )
}