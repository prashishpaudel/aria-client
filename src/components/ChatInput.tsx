import { useState, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
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

  const voiceActive = isCapturing || pipelineState !== 'idle'
  const hasText = value.trim().length > 0
  const stateLabel = STATE_LABEL[pipelineState]

  const submit = () => {
    if (!hasText || voiceActive) return
    onSend(value.trim())
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleStop = () => {
    if (isCapturing || pipelineState === 'listening') {
      onMicEnd()
    } else {
      onInterrupt()
    }
  }

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
          borderColor: voiceActive ? 'primary.main' : 'divider',
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
          disabled={disabled || voiceActive}
          sx={{ fontSize: 15, py: 0.5 }}
        />

        {voiceActive ? (
          <Tooltip title="Stop">
            <IconButton
              size="small"
              onClick={handleStop}
              aria-label="Stop"
              color="primary"
              sx={{
                transform: isCapturing ? `scale(${1 + micLevel * 0.35})` : 'scale(1)',
                transition: 'transform 0.05s ease-out',
              }}
            >
              <StopCircleIcon />
            </IconButton>
          </Tooltip>
        ) : hasText ? (
          <Tooltip title="Send">
            <span>
              <IconButton
                size="small"
                onClick={submit}
                disabled={disabled}
                aria-label="Send message"
                color="primary"
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="Voice">
            <IconButton
              size="small"
              onClick={onMicStart}
              disabled={disabled}
              aria-label="Start voice"
              color="default"
            >
              <MicNoneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Paper>
    </Box>
  )
}
