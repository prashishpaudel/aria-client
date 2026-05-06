import { useMemo, useState } from 'react'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import Box from '@mui/material/Box'
import { useTheme } from './hooks/useTheme'
import Sidebar from './components/Sidebar'

function App() {
  const { theme, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          open={sidebarOpen}
          theme={theme}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onToggleTheme={toggle}
        />

        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }} />
      </Box>
    </ThemeProvider>
  )
}

export default App
