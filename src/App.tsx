import { useMemo, useState } from 'react'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import Box from '@mui/material/Box'
import { useTheme } from './hooks/useTheme'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import type { Message } from './types/chat'

function App() {
  const { theme, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: {
            main: theme === 'light' ? '#000000' : '#ffffff',
          },
        },
      }),
    [theme],
  )

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() },
    ])
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
          <ChatArea messages={messages} onSend={handleSend} />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
