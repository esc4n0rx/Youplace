"use client"

import { nanoid } from "nanoid"

type Profile = {
  id: string
  name: string
}

const LS_PROFILE = "rplace:profile"

const NAMES = [
  "Aquarela",
  "Atlas",
  "Pixelara",
  "Nômade",
  "Venturo",
  "Croma",
  "Aurora",
  "Brisa",
  "Horizonte",
  "Marola",
  "Sertão",
  "Selva",
  "Neblina",
  "Luzia",
  "Orvalho",
]

export function getOrCreateProfile(forceNew?: boolean): Profile {
  if (!forceNew) {
    const raw = localStorage.getItem(LS_PROFILE)
    if (raw) {
      try {
        return JSON.parse(raw) as Profile
      } catch {}
    }
  }
  const id = nanoid(10)
  const name = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${id.slice(0, 4)}`
  const profile: Profile = { id, name }
  localStorage.setItem(LS_PROFILE, JSON.stringify(profile))
  return profile
}

export function signOutProfile() {
  localStorage.removeItem(LS_PROFILE)
  // Reset tokens too for a fresh start
  localStorage.removeItem("rplace:tokens")
  localStorage.removeItem("rplace:lastRefill")
}
