import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Message } from '../types/chat'
import type { PipelineState } from '../types/server'
import ChatInput from './ChatInput'
import ariaLogo from '../assets/aria-logo.svg'

interface MicProps {
  onMicStart: () => void
  onMicEnd: () => void
  onInterrupt: () => void
  micLevel: number
  isCapturing: boolean
  pipelineState: PipelineState
}

const markdownSx = {
  fontSize: 14,
  lineHeight: 1.7,
  opacity: 1,
  '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
  '& ol, & ul': { pl: 2.5, m: 0, mb: 1 },
  '& li': { mb: 0.25 },
  '& pre': {
    bgcolor: 'action.hover',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1.5,
    p: 2,
    my: 1.5,
    overflowX: 'auto',
    fontSize: 13,
    fontFamily: 'monospace',
    whiteSpace: 'pre',
  },
  '& code': {
    fontFamily: 'monospace',
    fontSize: 13,
    bgcolor: 'action.hover',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 0.5,
    px: 0.5,
    py: 0.1,
  },
  '& pre code': { bgcolor: 'transparent', border: 'none', p: 0 },
  '& strong': { fontWeight: 600 },
  '& em': { fontStyle: 'italic' },
  '& h1, & h2, & h3': { fontWeight: 600, mt: 1.5, mb: 0.5 },
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 768, width: '100%', mx: 'auto' }}>
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderRadius: '18px 18px 4px 18px',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            maxWidth: '75%',
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        maxWidth: 768,
        width: '100%',
        mx: 'auto',
        opacity: message.partial ? 0.85 : 1,
      }}
    >
      <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main', color: 'primary.contrastText', mt: 0.25, flexShrink: 0 }}>
        A
      </Avatar>
      <Box sx={{ ...markdownSx, minWidth: 0, flexGrow: 1 }}>
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </Box>
    </Box>
  )
}

function TypingIndicator() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        maxWidth: 768,
        width: '100%',
        mx: 'auto',
      }}
    >
      <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main', color: 'primary.contrastText', mt: 0.5 }}>
        A
      </Avatar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pt: 0.5 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: 'text.secondary',
              animation: 'typing-bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
              '@keyframes typing-bounce': {
                '0%, 60%, 100%': { transform: 'translateY(0)' },
                '30%': { transform: 'translateY(-6px)' },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

function WelcomeScreen({ onSend, micProps }: { onSend: (t: string) => void; micProps: MicProps }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', px: 2, gap: 3 }}>
      <img src={ariaLogo} alt="Aria" style={{ width: 80, height: 80 }} />
      <Typography variant="h5" sx={{ fontWeight: 600, textAlign: 'center' }}>
        What's on your mind?
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        <ChatInput onSend={onSend} {...micProps} />
      </Box>
    </Box>
  )
}

interface ChatAreaProps {
  messages: Message[]
  onSend: (text: string) => void
  micProps: MicProps
}

export default function ChatArea({ messages, onSend, micProps }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { pipelineState } = micProps
  const hasPartial = messages.some(m => m.partial && m.role === 'assistant')
  const showTyping = pipelineState === 'processing' && !hasPartial

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  if (messages.length === 0 && !showTyping) {
    return <WelcomeScreen onSend={onSend} micProps={micProps} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </Box>
      <ChatInput onSend={onSend} {...micProps} />
    </Box>
  )
}
