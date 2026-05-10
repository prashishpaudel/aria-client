import { useCallback, useEffect, useRef, useState } from 'react'
import { MicVAD } from '@ricky0123/vad-web'

interface UseVADOptions {
  onSpeechEnd: (audio: Float32Array) => void
}

export function useVAD({ onSpeechEnd }: UseVADOptions) {
  const [listening, setListening] = useState(false)
  const [speechProb, setSpeechProb] = useState(0)
  const vadRef = useRef<MicVAD | null>(null)
  const onSpeechEndRef = useRef(onSpeechEnd)
  onSpeechEndRef.current = onSpeechEnd

  const start = useCallback(async () => {
    if (vadRef.current) {
      vadRef.current.start()
      setListening(true)
      return
    }
    const vad = await MicVAD.new({
      model: 'v5',
      baseAssetPath: '/vad/',
      onnxWASMBasePath: '/vad/',
      onSpeechEnd: (audio) => onSpeechEndRef.current(audio),
      onFrameProcessed: (probs) => setSpeechProb(probs.isSpeech),
    })
    vadRef.current = vad
    vad.start()
    setListening(true)
  }, [])

  const pause = useCallback(() => {
    vadRef.current?.pause()
    setListening(false)
    setSpeechProb(0)
  }, [])

  useEffect(() => () => {
    vadRef.current?.destroy()
    vadRef.current = null
  }, [])

  return { speechProb, listening, start, pause }
}
