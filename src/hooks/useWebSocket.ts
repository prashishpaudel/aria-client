import { useCallback, useEffect, useRef, useState } from 'react'
import { WS_URL } from '../config'
import type { ConnectionState, ServerMessage } from '../types/server'

interface Options {
  onMessage: (msg: ServerMessage) => void
  enabled?: boolean
}

export function useWebSocket({ onMessage, enabled = true }: Options) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState('connecting')
    const ws = new WebSocket(WS_URL)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => setConnectionState('connected')

    ws.onmessage = (ev) => {
      if (typeof ev.data !== 'string') return
      try {
        const msg = JSON.parse(ev.data) as ServerMessage
        onMessageRef.current(msg)
      } catch {
        console.error('[ws] bad message', ev.data)
      }
    }

    ws.onerror = () => setConnectionState('error')

    ws.onclose = () => {
      setConnectionState('disconnected')
      reconnectTimer.current = setTimeout(connect, 3_000)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    if (!enabled) return
    connect()
    return disconnect
  }, [enabled, connect, disconnect])

  const sendAudio = useCallback((buf: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(buf)
  }, [])

  const sendJSON = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(msg))
  }, [])

  return { connectionState, sendAudio, sendJSON }
}
