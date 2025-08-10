"use client"

import * as Y from "yjs"
import { WebrtcProvider } from "y-webrtc"

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

let doc: Y.Doc | null = null
let provider: WebrtcProvider | null = null
let pixelsMap: Y.Map<PixelCell> | null = null

export function getRealtime() {
  if (!doc) {
    doc = new Y.Doc()
    // Use a stable public signaling set; y-webrtc provides defaults if none given
    provider = new WebrtcProvider("rplace-world-map", doc, {
      // You can provide custom signaling servers array here if desired.
      // signaling: ["wss://signaling.yjs.dev"],
      // password: undefined
      // awareness: doc awareness not needed right now
    })
    pixelsMap = doc.getMap<PixelCell>("pixels")
  }
  return { doc: doc!, provider: provider!, pixelsMap: pixelsMap! }
}
