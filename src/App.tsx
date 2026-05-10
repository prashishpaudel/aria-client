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
        break
      case 'audio':
        enqueueAudioRef.current(msg.data, msg.sampleRate)
        break
      case 'error':
        console.error('[aria]', msg.message)
        break
    }
  }, [])

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
  }, [clearAudio, sendJSON])

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
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

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
