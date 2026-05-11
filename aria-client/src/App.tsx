import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import MenuIcon from '@mui/icons-material/Menu'
import { useTheme } from './hooks/useTheme'
import { useWebSocket } from './hooks/useWebSocket'
import { useVAD } from './hooks/useVAD'
import { useAudioPlayback } from './hooks/useAudioPlayback'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ConnectionStatus from './components/ConnectionStatus'
import type { Message } from './types/chat'
import type { PipelineState, ServerMessage } from './types/server'

function float32ToBase64(audio: Float32Array): string {
  const int16 = new Int16Array(audio.length)
  for (let i = 0; i < audio.length; i++) {
    const s = Math.max(-1, Math.min(1, audio[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const bytes = new Uint8Array(int16.buffer)
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

function App() {
  const { theme, toggle } = useTheme()
  const isMobile = useMediaQuery('(max-width:768px)')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768)
  const [messages, setMessages] = useState<Message[]>([])
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle')
  const [continuousMode, setContinuousMode] = useState(false)

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: { main: theme === 'light' ? '#000000' : '#ffffff' },
        },
      }),
    [theme],
  )

  const { enqueueAudio, clear: clearAudio } = useAudioPlayback()
  const enqueueAudioRef = useRef(enqueueAudio)
  enqueueAudioRef.current = enqueueAudio

  // Throttled word-by-word reveal for voice mode (paces text with TTS)
  const continuousModeRef = useRef(continuousMode)
  continuousModeRef.current = continuousMode
  const revealRef = useRef<{ messageId: string | null; target: string; shown: string; finalPending: boolean }>({
    messageId: null, target: '', shown: '', finalPending: false,
  })
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const REVEAL_INTERVAL_MS = 200

  const stopReveal = useCallback(() => {
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }, [])

  const tickReveal = useCallback(() => {
    const r = revealRef.current
    if (!r.messageId) { stopReveal(); return }
    if (r.shown.length < r.target.length) {
      const rest = r.target.slice(r.shown.length)
      const m = rest.match(/^\s*\S+/)
      const adv = m ? m[0].length : rest.length
      r.shown = r.target.slice(0, r.shown.length + adv)
      const id = r.messageId
      const text = r.shown
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content: text } : msg))
    } else if (r.finalPending) {
      const id = r.messageId
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, partial: false } : msg))
      revealRef.current = { messageId: null, target: '', shown: '', finalPending: false }
      stopReveal()
    }
  }, [stopReveal])

  const ensureRevealRunning = useCallback(() => {
    if (revealTimerRef.current) return
    revealTimerRef.current = setInterval(tickReveal, REVEAL_INTERVAL_MS)
  }, [tickReveal])

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'status':
        setPipelineState(msg.state)
        break
      case 'transcript_user':
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'user',
          content: msg.text,
          timestamp: new Date(),
        }])
        break
      case 'transcript_assistant':
        if (continuousModeRef.current) {
          // Voice mode: queue full text, reveal one word per tick to match TTS pace
          setMessages(prev => {
            const existing = prev.find(m => m.partial && m.role === 'assistant')
            if (!existing) {
              const id = crypto.randomUUID()
              revealRef.current = { messageId: id, target: msg.text, shown: '', finalPending: !msg.partial }
              ensureRevealRunning()
              return [...prev, { id, role: 'assistant', content: '', timestamp: new Date(), partial: true }]
            }
            revealRef.current.target = msg.text
            if (!msg.partial) revealRef.current.finalPending = true
            ensureRevealRunning()
            return prev
          })
        } else {
          // Text mode: render immediately as tokens arrive
          setMessages(prev => {
            const partialIdx = prev.findIndex(m => m.partial && m.role === 'assistant')
            if (msg.partial) {
              if (partialIdx === -1)
                return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: msg.text, timestamp: new Date(), partial: true }]
              return prev.map((m, i) => i === partialIdx ? { ...m, content: msg.text } : m)
            } else {
              if (partialIdx !== -1)
                return prev.map((m, i) => i === partialIdx ? { ...m, content: msg.text, partial: false } : m)
              return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: msg.text, timestamp: new Date() }]
            }
          })
        }
        break
      case 'audio':
        enqueueAudioRef.current(msg.data, msg.sampleRate)
        break
      case 'error':
        console.error('[aria]', msg.message)
        break
    }
  }, [ensureRevealRunning])

  const { connectionState, sendJSON } = useWebSocket({ onMessage: handleServerMessage })
  const sendJSONRef = useRef(sendJSON)
  sendJSONRef.current = sendJSON

  const handleSpeechEnd = useCallback((audio: Float32Array) => {
    sendJSONRef.current({ type: 'voice', audio: float32ToBase64(audio) })
  }, [])

  const { speechProb, listening, start: startVAD, pause: pauseVAD } = useVAD({
    onSpeechEnd: handleSpeechEnd,
  })

  // Pause VAD while pipeline busy to prevent AI voice triggering itself
  useEffect(() => {
    if (!continuousMode) return
    if (pipelineState === 'idle' && !listening) startVAD()
    else if (pipelineState !== 'idle' && listening) pauseVAD()
  }, [pipelineState, continuousMode, listening, startVAD, pauseVAD])

  const handleVoiceToggle = useCallback(async () => {
    if (continuousMode) {
      setContinuousMode(false)
      pauseVAD()
      return
    }
    try {
      await startVAD()
      setContinuousMode(true)
    } catch (err) {
      console.error('[vad]', err)
    }
  }, [continuousMode, startVAD, pauseVAD])

  const handleInterrupt = useCallback(() => {
    clearAudio()
    sendJSON({ type: 'interrupt' })
    revealRef.current = { messageId: null, target: '', shown: '', finalPending: false }
    stopReveal()
    if (continuousMode) {
      setContinuousMode(false)
      pauseVAD()
    }
  }, [clearAudio, sendJSON, continuousMode, pauseVAD, stopReveal])

  const handleSend = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }])
    sendJSON({ type: 'chat', text })
  }, [sendJSON])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setPipelineState('idle')
    revealRef.current = { messageId: null, target: '', shown: '', finalPending: false }
    stopReveal()
    if (isMobile) setSidebarOpen(false)
  }, [isMobile, stopReveal])

  const micProps = {
    onVoiceToggle: handleVoiceToggle,
    onInterrupt: handleInterrupt,
    micLevel: speechProb,
    continuousMode,
    pipelineState,
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          open={sidebarOpen}
          isMobile={isMobile}
          theme={theme}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          onToggleTheme={toggle}
          onNewChat={handleNewChat}
        />
        <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" size="small">
                <MenuIcon fontSize="small" />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <ConnectionStatus state={connectionState} />
          </Box>
          <ChatArea messages={messages} onSend={handleSend} micProps={micProps} />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
