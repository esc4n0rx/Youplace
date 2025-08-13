// components/header-bar.tsx
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LogOut, PaintBucket, Sparkles, MousePointer2, User } from "lucide-react"
import { HexColorPicker } from "react-colorful"
import { readCurrentColor, setCurrentColor, onColorChange } from "@/lib/user-color"
import { useCooldown } from "@/hooks/use-cooldown"
import { setMode, getMode, type Mode, onModeChange } from "@/lib/mode"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { LoginDialog } from "@/components/auth/login-dialog"

export default function HeaderBar() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [color, setColor] = useState(readCurrentColor())
  const { tokens, nextRefillSeconds, maxTokens } = useCooldown()
  const [mode, setModeState] = useState<Mode>(getMode())
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  // Sincroniza a cor inicial e escuta mudanças
  useEffect(() => {
    // Define a cor inicial
    setColor(readCurrentColor())
    
    // Escuta mudanças de cor
    const unsubscribe = onColorChange((newColor) => {
      console.log("🎨 Cor alterada:", newColor)
      setColor(newColor)
    })
    
    return unsubscribe
  }, [])

  // Escuta mudanças de modo
  useEffect(() => {
    const unsubscribe = onModeChange((newMode) => {
      setModeState(newMode)
    })
    return unsubscribe
  }, [])

  const initials = useMemo(() => {
    if (!user?.name) return "?"
    const parts = user.name.trim().split(" ")
    const s = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0]
    return s.toUpperCase()
  }, [user?.name])

  const switchMode = useCallback((next: Mode) => {
    setMode(next)
    setModeState(next)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erro no logout:", error)
    }
  }

  const handleColorChange = useCallback((newColor: string) => {
    console.log("🎨 Mudando cor para:", newColor)
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
                {user?.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt="Avatar do usuário" />
                ) : (
                  <AvatarFallback>
                    {user ? initials : <User className="h-4 w-4" />}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate">
                  {authLoading ? "Carregando..." : user?.name || "Visitante"}
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

              <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    aria-label="Selecionar cor"
                    className="relative"
                  >
                    <div 
                      className="h-4 w-4 rounded-sm border shadow-inner transition-colors" 
                      style={{ backgroundColor: color }} 
                    />
                    <span className="sr-only">Selecionar cor atual: {color}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end" sideOffset={5}>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <PaintBucket className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Selecionar cor</p>
                    </div>
                    
                    <div className="space-y-3">
                      <HexColorPicker
                        color={color}
                        onChange={handleColorChange}
                        style={{ width: '100%' }}
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground font-mono">
                          {color.toUpperCase()}
                        </div>
                        <div 
                          className="w-8 h-8 rounded border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>

                    {/* Cores predefinidas */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Cores populares</p>
                      <div className="grid grid-cols-8 gap-1">
                        {[
                          "#ff4d4f", "#ff7a45", "#ffa940", "#ffec3d",
                          "#bae637", "#52c41a", "#13c2c2", "#1890ff",
                          "#2f54eb", "#722ed1", "#eb2f96", "#f5222d",
                          "#fa541c", "#fa8c16", "#fadb14", "#a0d911",
                          "#ffffff", "#f0f0f0", "#d9d9d9", "#bfbfbf",
                          "#8c8c8c", "#595959", "#262626", "#000000"
                        ].map((presetColor) => (
                          <button
                            key={presetColor}
                            className={cn(
                              "w-6 h-6 rounded border hover:scale-110 transition-transform",
                              color === presetColor ? "ring-2 ring-primary ring-offset-1" : ""
                            )}
                            style={{ backgroundColor: presetColor }}
                            onClick={() => handleColorChange(presetColor)}
                            aria-label={`Selecionar cor ${presetColor}`}
                          />
                        ))}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      onClick={() => setIsColorPickerOpen(false)}
                      className="w-full"
                    >
                      Confirmar
                    </Button>
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
            {user && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-mono">{user.credits}</span>
                <span className="text-muted-foreground">créditos</span>
              </Badge>
            )}
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