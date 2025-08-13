"use client"

const LS_COLOR = "rplace:color"
const EVT_COLOR = "rplace:color"

export function readCurrentColor(): string {
  if (typeof window === "undefined") return "#ff4d4f"
  const c = localStorage.getItem(LS_COLOR)
  return c ?? "#ff4d4f"
}

export function setCurrentColor(c: string) {
  if (typeof window === "undefined") return
  
  localStorage.setItem(LS_COLOR, c)
  window.dispatchEvent(new CustomEvent(EVT_COLOR, { detail: c }))
}

export function onColorChange(cb: (color: string) => void) {
  if (typeof window === "undefined") return () => {}
  
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as string
    cb(detail)
  }
  
  window.addEventListener(EVT_COLOR, handler)
  return () => window.removeEventListener(EVT_COLOR, handler)
}