"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const LS_TOKENS = "rplace:tokens"
const LS_LAST_REFILL = "rplace:lastRefill"

const MAX_TOKENS_DEFAULT = 10
const REFILL_INTERVAL_MS_DEFAULT = 30_000 // 30s
const REFILL_AMOUNT_DEFAULT = 1

function now() {
  return Date.now()
}

export function useCooldown(config?: {
  maxTokens?: number
  refillIntervalMs?: number
  refillAmount?: number
}) {
  const maxTokens = config?.maxTokens ?? MAX_TOKENS_DEFAULT
  const refillIntervalMs = config?.refillIntervalMs ?? REFILL_INTERVAL_MS_DEFAULT
  const refillAmount = config?.refillAmount ?? REFILL_AMOUNT_DEFAULT

  // Initialize from localStorage
  const computeInitial = () => {
    const rawTokens = Number(localStorage.getItem(LS_TOKENS) ?? maxTokens)
    const rawLast = Number(localStorage.getItem(LS_LAST_REFILL) ?? now())
    const elapsed = now() - rawLast
    const steps = Math.floor(elapsed / refillIntervalMs)
    const gained = steps * refillAmount
    const nextTokens = Math.min(maxTokens, rawTokens + Math.max(0, gained))
    const newLast = rawLast + steps * refillIntervalMs
    localStorage.setItem(LS_TOKENS, String(nextTokens))
    localStorage.setItem(LS_LAST_REFILL, String(newLast))
    return { tokens: nextTokens, last: newLast }
  }

  const initial = typeof window !== "undefined" ? computeInitial() : { tokens: maxTokens, last: now() }
  const [tokens, setTokens] = useState(initial.tokens)
  const [lastRefill, setLastRefill] = useState(initial.last)
  const timerRef = useRef<number | null>(null)

  // Broadcast to other components
  const broadcast = (nextTokens: number) => {
    window.dispatchEvent(new CustomEvent("rplace:tokens", { detail: nextTokens }))
  }

  // Refill loop
  useEffect(() => {
    const tick = () => {
      const rawTokens = Number(localStorage.getItem(LS_TOKENS) ?? tokens)
      const rawLast = Number(localStorage.getItem(LS_LAST_REFILL) ?? lastRefill)
      const elapsed = now() - rawLast
      if (rawTokens >= maxTokens) {
        setTokens(rawTokens)
        setLastRefill(rawLast)
        return
      }
      if (elapsed >= refillIntervalMs) {
        const steps = Math.floor(elapsed / refillIntervalMs)
        const gained = steps * refillAmount
        const nextTokens = Math.min(maxTokens, rawTokens + gained)
        const newLast = rawLast + steps * refillIntervalMs
        localStorage.setItem(LS_TOKENS, String(nextTokens))
        localStorage.setItem(LS_LAST_REFILL, String(newLast))
        setTokens(nextTokens)
        setLastRefill(newLast)
        broadcast(nextTokens)
      }
    }
    timerRef.current = window.setInterval(tick, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [lastRefill, maxTokens, refillAmount, refillIntervalMs, tokens])

  // Listen to external updates
  useEffect(() => {
    const onTokens = (e: Event) => {
      const t = Number(localStorage.getItem(LS_TOKENS) ?? tokens)
      setTokens(t)
    }
    window.addEventListener("rplace:tokens", onTokens)
    return () => window.removeEventListener("rplace:tokens", onTokens)
  }, [tokens])

  const consumeToken = useCallback(() => {
    const current = Number(localStorage.getItem(LS_TOKENS) ?? tokens)
    if (current <= 0) return false
    const next = current - 1
    localStorage.setItem(LS_TOKENS, String(next))
    setTokens(next)
    broadcast(next)
    return true
  }, [tokens])

  const nextRefillSeconds = Math.max(
    0,
    Math.ceil((refillIntervalMs - (now() - Number(localStorage.getItem(LS_LAST_REFILL) ?? lastRefill))) / 1000),
  )

  return {
    tokens,
    maxTokens,
    nextRefillSeconds,
    consumeToken,
  }
}
