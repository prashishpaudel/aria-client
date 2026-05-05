import { useMemo } from 'react'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { useTheme } from './hooks/useTheme'

function App() {
  const { theme, toggle } = useTheme()

  const muiTheme = useMemo(
    () => createTheme({ palette: { mode: theme } }),
    [theme],
  )

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AppBar position="static" elevation={0} variant="outlined">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Aria
          </Typography>
          <IconButton onClick={toggle} aria-label="Toggle theme" color="inherit">
            {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  )
}

export default App
