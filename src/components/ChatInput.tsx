import { useState, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import type { PipelineState } from '../types/server'

const STATE_LABEL: Partial<Record<PipelineState, string>> = {
  listening:  'Listening…',
  processing: 'Thinking…',
  speaking:   'Speaking…',
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

const BAR_COUNT = 28

function VoiceWaveform({ micLevel, visible }: { micLevel: number; visible: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: 44,
        maxWidth: 768,
        mx: 'auto',
        px: 2,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const pos = i / (BAR_COUNT - 1)
        const centerBoost = Math.sin(pos * Math.PI)
        const baseH = 3 + centerBoost * 3
        const maxH = 10 + centerBoost * 26
        const h = baseH + micLevel * (maxH - baseH)
        const hue = 195 + pos * 115           // cyan → violet → pink
        const lightness = 55 + micLevel * 18  // brightens when loud
        const color = `hsl(${hue}, 80%, ${lightness}%)`
        return (
          <Box
            key={i}
            sx={{
              width: 3,
              borderRadius: 4,
              bgcolor: color,
              flexShrink: 0,
              opacity: 0.45 + micLevel * 0.55,
              height: h,
              transition: 'height 0.07s ease-out, opacity 0.07s ease-out, background-color 0.07s ease-out',
              animation: 'waveform-idle 1.8s ease-in-out infinite',
              animationDelay: `${(i / BAR_COUNT) * 1.8}s`,
              '@keyframes waveform-idle': {
                '0%, 100%': { transform: 'scaleY(1)' },
                '50%': { transform: 'scaleY(1.9)' },
              },
            }}
          />
        )
      })}
    </Box>
  )
}

function VADButton({ micLevel, onClick }: { micLevel: number; onClick: () => void }) {
  const scale = 1 + micLevel * 0.25
  const ringOpacity = 0.25 + micLevel * 0.5

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer slow-pulse ring */}
      <Box sx={{
        position: 'absolute',
        inset: -8,
        borderRadius: '50%',
        border: '1.5px solid',
        borderColor: 'primary.main',
        opacity: ringOpacity,
        transform: `scale(${scale})`,
        transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
        animation: 'vad-outer 2.4s ease-in-out infinite',
        '@keyframes vad-outer': {
          '0%, 100%': { opacity: 0.15 },
          '50%': { opacity: 0.45 },
        },
      }} />
      {/* Inner tight ring */}
      <Box sx={{
        position: 'absolute',
        inset: -3,
        borderRadius: '50%',
        border: '1.5px solid',
        borderColor: 'primary.main',
        opacity: ringOpacity * 0.7,
        transform: `scale(${1 + micLevel * 0.15})`,
        transition: 'transform 0.08s ease-out, opacity 0.08s ease-out',
      }} />
      <Tooltip title="Stop voice mode">
        <IconButton onClick={onClick} color="primary" aria-label="Stop voice mode" size="medium">
          <GraphicEqIcon
            fontSize="medium"
            sx={{
              transform: `scale(${scale})`,
              transition: 'transform 0.08s ease-out',
            }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  )
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
  const stateLabel = continuousMode ? (STATE_LABEL[pipelineState] ?? 'Ready…') : STATE_LABEL[pipelineState]

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
      <VoiceWaveform micLevel={micLevel} visible={continuousMode} />
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
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          border: '1.5px solid transparent',
          borderColor: continuousMode ? 'transparent' : 'divider',
          borderRadius: 3,
          maxWidth: 768,
          mx: 'auto',
          transition: 'box-shadow 0.3s ease',
          background: continuousMode
            ? (theme) =>
                `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box,` +
                `linear-gradient(90deg, hsl(195,80%,60%), hsl(255,80%,65%), hsl(310,80%,65%), hsl(195,80%,60%)) border-box`
            : undefined,
          backgroundSize: continuousMode ? '200% 100%' : undefined,
          animation: continuousMode ? 'gradient-border-shift 4s linear infinite' : 'none',
          '@keyframes gradient-border-shift': {
            '0%':   { backgroundPosition: '0% 50%' },
            '100%': { backgroundPosition: '200% 50%' },
          },
          boxShadow: continuousMode
            ? '0 0 0 3px hsl(195, 80%, 60%, 0.12), 0 0 20px hsl(225, 80%, 65%, 0.15)'
            : 'none',
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

        {/* Right button: VAD animation | Stop (interrupt) | Send | GraphicEq */}
        {continuousMode && !pipelineBusy ? (
          <VADButton micLevel={micLevel} onClick={onVoiceToggle} />
        ) : pipelineBusy ? (
          <Tooltip title="Stop">
            <IconButton size="medium" onClick={onInterrupt} aria-label="Stop" color="primary">
              <StopCircleIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        ) : hasText ? (
          <Tooltip title="Send">
            <span>
              <IconButton size="medium" onClick={submit} disabled={disabled} aria-label="Send" color="primary">
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
