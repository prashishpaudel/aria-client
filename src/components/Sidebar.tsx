import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import LightModeIcon from '@mui/icons-material/LightMode'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'

const DRAWER_WIDTH = 260
const MINI_WIDTH = 56

const HISTORY: { id: string; title: string }[] = [
  { id: '1', title: 'Voice test session' },
  { id: '2', title: 'Backend connection setup' },
  { id: '3', title: 'Hello world' },
]

interface SidebarProps {
  open: boolean
  theme: 'light' | 'dark'
  onToggleSidebar: () => void
  onToggleTheme: () => void
}

export default function Sidebar({ open, theme, onToggleSidebar, onToggleTheme }: SidebarProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : MINI_WIDTH,
        flexShrink: 0,
        transition: 'width 0.2s',
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : MINI_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          transition: 'width 0.2s',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 1.5, minHeight: 56 }}>
        {open && (
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1, pl: 1, whiteSpace: 'nowrap' }}>
            Aria
          </Typography>
        )}
        <Tooltip title={open ? 'Collapse' : 'Expand'} placement="right">
          <IconButton onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <ViewSidebarOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* New chat */}
      <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
        <Tooltip title={open ? '' : 'New chat'} placement="right">
          <ListItemButton onClick={() => {}} sx={{ borderRadius: 1, gap: 1, px: 1, minHeight: 40 }}>
            <AddCircleIcon fontSize="small" sx={{ flexShrink: 0 }} />
            {open && (
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                New chat
              </Typography>
            )}
          </ListItemButton>
        </Tooltip>
      </Box>

      {/* History label */}
      {open && (
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Recent
          </Typography>
        </Box>
      )}

      {/* History list */}
      <List dense disablePadding sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {HISTORY.map((item) => (
          <ListItem key={item.id} disablePadding>
            <Tooltip title={open ? '' : item.title} placement="right">
              <ListItemButton sx={{ px: 1, borderRadius: 1, mx: 1, gap: 1, minHeight: 40 }}>
                <ForumOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                {open && (
                  <ListItemText
                    primary={item.title}
                    slotProps={{ primary: { noWrap: true, sx: { fontSize: 14 } } }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Theme toggle */}
      <Box sx={{ px: 1, py: 1 }}>
        <Tooltip title={theme === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
          <IconButton onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  )
}
