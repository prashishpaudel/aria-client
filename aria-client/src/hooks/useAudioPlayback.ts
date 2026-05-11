import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAYBACK_SAMPLE_RATE } from '../config'

export function useAudioPlayback() {
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const nextTimeRef = useRef(0)
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastUpdateRef = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackLevel, setPlaybackLevel] = useState(0)

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      const ctx = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE })
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.6
      analyser.connect(ctx.destination)
      ctxRef.current = ctx
      analyserRef.current = analyser
      nextTimeRef.current = 0
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const stopLevelLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setPlaybackLevel(0)
  }, [])

  const startLevelLoop = useCallback(() => {
    if (rafRef.current !== null) return
    const buf = new Float32Array(1024)
    const tick = () => {
      const analyser = analyserRef.current
      if (!analyser) { rafRef.current = null; return }
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)
      const now = performance.now()
      if (now - lastUpdateRef.current >= 33) {
        lastUpdateRef.current = now
        setPlaybackLevel(Math.min(1, rms * 4))
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const enqueueAudio = useCallback((base64: string, sampleRate = PLAYBACK_SAMPLE_RATE) => {
    const ctx = getCtx()
    const analyser = analyserRef.current!

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
    source.connect(analyser)

    const now = ctx.currentTime
    const startTime = Math.max(now, nextTimeRef.current)
    source.start(startTime)
    nextTimeRef.current = startTime + audioBuf.duration

    setIsPlaying(true)
    startLevelLoop()

    if (endTimerRef.current) clearTimeout(endTimerRef.current)
    const msUntilEnd = (nextTimeRef.current - ctx.currentTime) * 1000
    endTimerRef.current = setTimeout(() => {
      setIsPlaying(false)
      stopLevelLoop()
    }, msUntilEnd + 250)
  }, [getCtx, startLevelLoop, stopLevelLoop])

  const clear = useCallback(() => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current)
    stopLevelLoop()
    ctxRef.current?.close()
    ctxRef.current = null
    analyserRef.current = null
    nextTimeRef.current = 0
    setIsPlaying(false)
  }, [stopLevelLoop])

  useEffect(() => () => stopLevelLoop(), [stopLevelLoop])

  return { enqueueAudio, isPlaying, playbackLevel, clear }
}
