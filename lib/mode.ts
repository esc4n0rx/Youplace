"use client"

export type Mode = "navigate" | "paint"

const LS_MODE = "rplace:mode"
const EVT = "rplace:mode"

export function getMode(): Mode {
  if (typeof window === "undefined") return "navigate"
  const m = (localStorage.getItem(LS_MODE) as Mode) || "navigate"
  return m === "paint" ? "paint" : "navigate"
}

export function setMode(mode: Mode) {
  if (typeof window === "undefined") return
  
  localStorage.setItem(LS_MODE, mode)
  window.dispatchEvent(new CustomEvent(EVT, { detail: mode }))
}

export function onModeChange(cb: (mode: Mode) => void) {
  if (typeof window === "undefined") return () => {}
  
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as Mode
    cb(detail)
  }
  window.addEventListener(EVT, handler)
  return () => window.removeEventListener(EVT, handler)
}