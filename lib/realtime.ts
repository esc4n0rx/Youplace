
"use client"

import { io, Socket } from "socket.io-client"
import { apiAuth } from "@/lib/api-auth"
import type { Pixel } from "@/types/pixel"

interface ServerToClientEvents {
  connect: () => void
  disconnect: () => void
  pixels_update: (data: { room: string; pixels: Pixel[] }) => void
  room_state: (data: { roomId: string; pixels: Pixel[] }) => void
  error: (error: { message: string }) => void
}

interface ClientToServerEvents {
  update_viewport: (data: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }) => void
}

const URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://api.youplace.space"

class SocketManager {
  private static instance: SocketManager
  public socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  public connect(
    onPixelsUpdate: (pixels: Pixel[]) => void,
    onInitialState: (pixels: Pixel[]) => void
  ) {
    if (this.socket && this.socket.connected) {
      console.log("Socket já conectado.")
      return
    }

    const token = apiAuth.getToken()
    if (!token) {
      console.error("Token de autenticação não encontrado.")
      return
    }

    console.log("Conectando ao servidor WebSocket...")

    this.socket = io(URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket", "polling"],
    })

    this.socket.on("connect", () => {
      console.log("✅ Conectado ao servidor WebSocket:", this.socket?.id)
    })

    this.socket.on("connect_error", (err) => {
      console.error("❌ Erro de conexão com o WebSocket:", err.message)
      // Se o erro for de autenticação, desloga o usuário
      if (err.message.includes("Token inválido")) {
        console.log("⚠️ Erro de autenticação no WebSocket, disparando evento de logout.")
        window.dispatchEvent(new CustomEvent("rplace:auth_error"))
      }
    })

    this.socket.on("disconnect", () => {
      console.log("🔌 Desconectado do servidor WebSocket.")
    })

    this.socket.on("error", (error) => {
      console.error("❌ Erro no WebSocket:", error.message)
    })

    this.socket.on("pixels_update", (data) => {
      console.log(`🎨 Recebidos ${data.pixels.length} pixels da sala ${data.room}`)
      onPixelsUpdate(data.pixels)
    })

    this.socket.on("room_state", (data) => {
      console.log(`🖼️ Recebido estado inicial com ${data.pixels.length} pixels da sala ${data.roomId}`)
      onInitialState(data.pixels)
    })
  }

  public disconnect() {
    if (this.socket) {
      console.log("Desconectando do WebSocket...")
      this.socket.disconnect()
      this.socket = null
    }
  }

  public updateViewport(bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }) {
    if (this.socket && this.socket.connected) {
      console.log("🚀 Atualizando viewport:", bounds)
      this.socket.emit("update_viewport", bounds)
    } else {
      console.warn("Socket não conectado. Não foi possível atualizar o viewport.")
    }
  }
}

export const socketManager = SocketManager.getInstance()
