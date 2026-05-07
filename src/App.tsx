import { useCallback, useMemo, useRef, useState } from 'react'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import Box from '@mui/material/Box'
import { useTheme } from './hooks/useTheme'
import { useWebSocket } from './hooks/useWebSocket'
import { useAudioCapture } from './hooks/useAudioCapture'
import { useAudioPlayback } from './hooks/useAudioPlayback'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ConnectionStatus from './components/ConnectionStatus'
import type { Message } from './types/chat'
import type { PipelineState, ServerMessage } from './types/server'

function App() {
  const { theme, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle')

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
  const { micLevel, isCapturing, startCapture, stopCapture } = useAudioCapture()
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
            if (partialIdx === -1) {
              return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: msg.text, timestamp: new Date(), partial: true }]
            }
            return prev.map((m, i) => i === partialIdx ? { ...m, content: msg.text } : m)
          } else {
            if (partialIdx !== -1) {
              return prev.map((m, i) => i === partialIdx ? { ...m, content: msg.text, partial: false } : m)
            }
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

  const { connectionState, sendAudio, sendJSON } = useWebSocket({ onMessage: handleServerMessage })

  const handleMicStart = useCallback(async () => {
    if (isCapturing) return
    sendJSON({ type: 'start' })
    try {
      await startCapture(sendAudio)
    } catch (err) {
      console.error('[mic]', err)
      sendJSON({ type: 'stop' })
    }
  }, [isCapturing, sendJSON, startCapture, sendAudio])

  const handleMicEnd = useCallback(() => {
    if (!isCapturing) return
    stopCapture()
    sendJSON({ type: 'stop' })
  }, [isCapturing, stopCapture, sendJSON])

  const handleInterrupt = useCallback(() => {
    stopCapture()
    clearAudio()
    sendJSON({ type: 'interrupt' })
  }, [stopCapture, clearAudio, sendJSON])

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
  }, [])

  const micProps = { onMicStart: handleMicStart, onMicEnd: handleMicEnd, onInterrupt: handleInterrupt, micLevel, isCapturing, pipelineState }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          open={sidebarOpen}
          theme={theme}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onToggleTheme={toggle}
          onNewChat={handleNewChat}
        />
        <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ConnectionStatus state={connectionState} />
          <ChatArea messages={messages} onSend={handleSend} micProps={micProps} />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
