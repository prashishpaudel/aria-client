import { useCallback, useMemo, useState } from 'react'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import Box from '@mui/material/Box'
import { useTheme } from './hooks/useTheme'
import { useWebSocket } from './hooks/useWebSocket'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ConnectionStatus from './components/ConnectionStatus'
import type { Message } from './types/chat'
import type { ServerMessage } from './types/server'

function App() {
  const { theme, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])

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

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    console.log('[ws]', msg)
  }, [])

  const { connectionState, sendJSON } = useWebSocket({ onMessage: handleServerMessage })

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() },
    ])
    sendJSON({ type: 'chat', text })
  }

  const handleNewChat = () => setMessages([])

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
          <ChatArea messages={messages} onSend={handleSend} />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
