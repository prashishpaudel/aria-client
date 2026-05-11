import { useCallback, useRef, useState } from 'react'
import { CAPTURE_SAMPLE_RATE, LEVEL_UPDATE_MS, SEND_INTERVAL_MS } from '../config'

const WORKLET_SOURCE = /* js */ `
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;

    let sum = 0;
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
    const rms = Math.sqrt(sum / ch.length);

    const pcm = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.port.postMessage({ pcm: pcm.buffer, rms });
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`

export function useAudioCapture() {
  const [micLevel, setMicLevel] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)

  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const silenceRef = useRef<GainNode | null>(null)

  const onChunkRef = useRef<((pcm: ArrayBuffer) => void) | null>(null)
  const pcmBufferRef = useRef<Int16Array[]>([])
  const lastSendRef = useRef(0)
  const lastLevelRef = useRef(0)

  const flush = () => {
    const chunks = pcmBufferRef.current
    pcmBufferRef.current = []
    if (chunks.length === 0 || !onChunkRef.current) return
    const len = chunks.reduce((s, c) => s + c.length, 0)
    const merged = new Int16Array(len)
    let off = 0
    for (const c of chunks) { merged.set(c, off); off += c.length }
    onChunkRef.current(merged.buffer)
  }

  const startCapture = useCallback(async (onChunk: (pcm: ArrayBuffer) => void) => {
    onChunkRef.current = onChunk
    pcmBufferRef.current = []
    lastSendRef.current = Date.now()
    lastLevelRef.current = 0

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: CAPTURE_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    streamRef.current = stream

    const ctx = new AudioContext({ sampleRate: CAPTURE_SAMPLE_RATE })
    ctxRef.current = ctx

    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' })
    const blobUrl = URL.createObjectURL(blob)
    await ctx.audioWorklet.addModule(blobUrl)
    URL.revokeObjectURL(blobUrl)

    const source = ctx.createMediaStreamSource(stream)
    sourceRef.current = source

    const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
    workletRef.current = worklet

    const silence = ctx.createGain()
    silence.gain.value = 0
    silenceRef.current = silence
    silence.connect(ctx.destination)

    source.connect(worklet)
    worklet.connect(silence)

    worklet.port.onmessage = (ev: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => {
      const now = Date.now()

      if (now - lastLevelRef.current >= LEVEL_UPDATE_MS) {
        lastLevelRef.current = now
        setMicLevel(Math.min(1, ev.data.rms * 12))
      }

      pcmBufferRef.current.push(new Int16Array(ev.data.pcm))

      if (now - lastSendRef.current >= SEND_INTERVAL_MS) {
        lastSendRef.current = now
        flush()
      }
    }

    setIsCapturing(true)
  }, [])

  const stopCapture = useCallback(() => {
    flush()
    workletRef.current?.disconnect()
    workletRef.current = null
    sourceRef.current?.disconnect()
    sourceRef.current = null
    silenceRef.current?.disconnect()
    silenceRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    ctxRef.current?.close()
    ctxRef.current = null
    onChunkRef.current = null
    setMicLevel(0)
    setIsCapturing(false)
  }, [])

  return { micLevel, isCapturing, startCapture, stopCapture }
}
