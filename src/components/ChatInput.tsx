import { useState, KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import MicIcon from '@mui/icons-material/Mic'
import SendIcon from '@mui/icons-material/Send'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <Box sx={{ p: 2, pb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 2,
          py: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          maxWidth: 768,
          mx: 'auto',
        }}
      >
        <InputBase
          fullWidth
          multiline
          maxRows={6}
          placeholder="Message Aria…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          sx={{ fontSize: 15, py: 0.5 }}
        />
        <Tooltip title="Push to talk">
          <IconButton size="small" color="default" aria-label="Push to talk">
            <MicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Send">
          <span>
            <IconButton
              size="small"
              onClick={submit}
              disabled={disabled || !value.trim()}
              aria-label="Send message"
              color="primary"
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>
    </Box>
  )
}
