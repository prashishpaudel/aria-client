import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ConnectionState } from '../types/server'

const CONFIG: Record<ConnectionState, { label: string; color: string }> = {
  connected:    { label: 'Connected',    color: '#22c55e' },
  connecting:   { label: 'Connecting…',  color: '#f59e0b' },
  disconnected: { label: 'Disconnected', color: '#6b7280' },
  error:        { label: 'Error',        color: '#ef4444' },
}

export default function ConnectionStatus({ state }: { state: ConnectionState }) {
  const { label, color } = CONFIG[state]

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 2, py: 1, justifyContent: 'flex-end' }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}
