import { useState, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import type { PipelineState } from '../types/server'

function AnimatedDots({ micLevel }: { micLevel: number }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 18 }}>
      {[0, 1, 2].map((i) => {
        const centerBoost = i === 1 ? 1 : 0.65
        const baseH = 4 + centerBoost * 2
        const maxH = 6 + centerBoost * 10
        const h = baseH + micLevel * (maxH - baseH)
        return (
          <Box
            key={i}
            sx={{
              width: 5,
              borderRadius: 3,
              bgcolor: 'secondary.main',
              height: h,
              opacity: 0.5 + micLevel * 0.5,
              transition: 'height 0.08s ease-out, opacity 0.08s ease-out',
              animation: 'dot-pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
              '@keyframes dot-pulse': {
                '0%, 100%': { transform: 'scaleY(1)' },
                '50%':      { transform: 'scaleY(1.25)' },
              },
            }}
          />
        )
      })}
    </Box>
  )
}

interface ChatInputProps {
  onSend: (text: string) => void
  onVoiceToggle: () => void
  onInterrupt: () => void
  micLevel: number
  continuousMode: boolean
  pipelineState: PipelineState
  disabled?: boolean
}

export default function ChatInput({
  onSend,
  onVoiceToggle,
  onInterrupt,
  micLevel,
  continuousMode,
  pipelineState,
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState('')

  const pipelineBusy = pipelineState !== 'idle'
  const hasText = value.trim().length > 0

  const submit = () => {
    if (!hasText || pipelineBusy || continuousMode) return
    onSend(value.trim())
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <Box sx={{ px: 2, pb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
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
          placeholder={continuousMode ? 'Listening for your voice…' : 'Message Aria…'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || continuousMode || pipelineBusy}
          sx={{ fontSize: 15, py: 0.5 }}
        />

        {continuousMode ? (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<AnimatedDots micLevel={micLevel} />}
            onClick={pipelineBusy ? onInterrupt : onVoiceToggle}
            sx={{ borderRadius: 8, textTransform: 'none', flexShrink: 0, gap: 0.5 }}
          >
            End
          </Button>
        ) : pipelineBusy ? (
          <Tooltip title="Stop">
            <IconButton size="medium" onClick={onInterrupt} aria-label="Stop" color="primary">
              <StopCircleIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        ) : hasText ? (
          <Tooltip title="Send">
            <span>
              <IconButton size="medium" onClick={submit} disabled={disabled} aria-label="Send" color="secondary">
                <ArrowCircleUpIcon fontSize="medium" />
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="Voice mode">
            <IconButton size="medium" onClick={onVoiceToggle} disabled={disabled} aria-label="Start voice mode" color="default">
              <GraphicEqIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
      </Paper>
    </Box>
  )
}
