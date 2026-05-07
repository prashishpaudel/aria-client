import { useState, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import MicIcon from '@mui/icons-material/Mic'
import MicNoneIcon from '@mui/icons-material/MicNone'
import SendIcon from '@mui/icons-material/Send'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import type { PipelineState } from '../types/server'

const STATE_LABEL: Partial<Record<PipelineState, string>> = {
  listening:  'Listening…',
  processing: 'Thinking…',
  speaking:   'Speaking…',
}

interface ChatInputProps {
  onSend: (text: string) => void
  onMicStart: () => void
  onMicEnd: () => void
  onInterrupt: () => void
  micLevel: number
  isCapturing: boolean
  pipelineState: PipelineState
  disabled?: boolean
}

export default function ChatInput({
  onSend,
  onMicStart,
  onMicEnd,
  onInterrupt,
  micLevel,
  isCapturing,
  pipelineState,
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const busy = pipelineState !== 'idle'

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || busy) return
    onSend(trimmed)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleMicDown = () => { if (!busy) onMicStart() }
  const handleMicUp   = () => { if (isCapturing) onMicEnd() }

  const stateLabel = STATE_LABEL[pipelineState]

  return (
    <Box sx={{ px: 2, pb: 3 }}>
      {stateLabel && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
        >
          {stateLabel}
        </Typography>
      )}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 2,
          py: 1,
          border: '1px solid',
          borderColor: isCapturing ? 'primary.main' : 'divider',
          borderRadius: 3,
          maxWidth: 768,
          mx: 'auto',
          transition: 'border-color 0.2s',
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
          disabled={disabled || busy}
          sx={{ fontSize: 15, py: 0.5 }}
        />

        <Tooltip title={isCapturing ? 'Release to send' : 'Hold to talk'}>
          <IconButton
            size="small"
            aria-label="Push to talk"
            disabled={disabled || pipelineState === 'processing' || pipelineState === 'speaking'}
            onMouseDown={handleMicDown}
            onMouseUp={handleMicUp}
            onMouseLeave={handleMicUp}
            onTouchStart={handleMicDown}
            onTouchEnd={handleMicUp}
            sx={{
              color: isCapturing ? 'primary.main' : 'text.secondary',
              transform: isCapturing ? `scale(${1 + micLevel * 0.4})` : 'scale(1)',
              transition: isCapturing ? 'transform 0.05s ease-out' : 'transform 0.2s ease-out, color 0.2s',
            }}
          >
            {isCapturing ? <MicIcon fontSize="small" /> : <MicNoneIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {pipelineState === 'speaking' ? (
          <Tooltip title="Stop">
            <IconButton size="small" onClick={onInterrupt} aria-label="Stop" color="primary">
              <StopCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Send">
            <span>
              <IconButton
                size="small"
                onClick={submit}
                disabled={disabled || busy || !value.trim()}
                aria-label="Send message"
                color="primary"
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Paper>
    </Box>
  )
}
