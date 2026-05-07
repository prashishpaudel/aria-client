import { useCallback, useRef, useState } from 'react'
import { PLAYBACK_SAMPLE_RATE } from '../config'

export function useAudioPlayback() {
  const ctxRef = useRef<AudioContext | null>(null)
  const nextTimeRef = useRef(0)
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE })
      nextTimeRef.current = 0
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const enqueueAudio = useCallback((base64: string, sampleRate = PLAYBACK_SAMPLE_RATE) => {
    const ctx = getCtx()

    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

    const int16 = new Int16Array(bytes.buffer)
    if (int16.length === 0) return

    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768

    const audioBuf = ctx.createBuffer(1, float32.length, sampleRate)
    audioBuf.copyToChannel(float32, 0)

    const source = ctx.createBufferSource()
    source.buffer = audioBuf
    source.connect(ctx.destination)

    const now = ctx.currentTime
    const startTime = Math.max(now, nextTimeRef.current)
    source.start(startTime)
    nextTimeRef.current = startTime + audioBuf.duration

    setIsPlaying(true)

    if (endTimerRef.current) clearTimeout(endTimerRef.current)
    const msUntilEnd = (nextTimeRef.current - ctx.currentTime) * 1000
    endTimerRef.current = setTimeout(() => setIsPlaying(false), msUntilEnd + 250)
  }, [getCtx])

  const clear = useCallback(() => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current)
    ctxRef.current?.close()
    ctxRef.current = null
    nextTimeRef.current = 0
    setIsPlaying(false)
  }, [])

  return { enqueueAudio, isPlaying, clear }
}
