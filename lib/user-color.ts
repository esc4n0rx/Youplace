"use client"

const LS_COLOR = "rplace:color"

export function readCurrentColor(): string {
  if (typeof window === "undefined") return "#ff4d4f"
  const c = localStorage.getItem(LS_COLOR)
  return c ?? "#ff4d4f"
}

export function setCurrentColor(c: string) {
  if (typeof window === "undefined") return
  
  console.log("🎨 Salvando cor:", c)
  localStorage.setItem(LS_COLOR, c)
  
  // Dispara evento simples
  window.dispatchEvent(new Event("rplace:color"))
}