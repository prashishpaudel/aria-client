import { useEffect, useRef } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Message } from '../types/chat'
import ChatInput from './ChatInput'
import ariaLogo from '../assets/aria-logo.svg'

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        maxWidth: 768,
        width: '100%',
        mx: 'auto',
      }}
    >
      {!isUser && (
        <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main', color: 'primary.contrastText', mt: 0.5 }}>
          A
        </Avatar>
      )}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          bgcolor: isUser ? 'primary.main' : 'action.hover',
          color: isUser ? 'primary.contrastText' : 'text.primary',
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

function WelcomeScreen({ onSend }: { onSend: (text: string) => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', px: 2, gap: 3 }}>
      <img src={ariaLogo} alt="Aria" style={{ width: 80, height: 80 }} />
      <Typography variant="h5" sx={{ fontWeight: 600, textAlign: 'center' }}>
        What's on your mind?
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        <ChatInput onSend={onSend} />
      </Box>
    </Box>
  )
}

interface ChatAreaProps {
  messages: Message[]
  onSend: (text: string) => void
}

export default function ChatArea({ messages, onSend }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return <WelcomeScreen onSend={onSend} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </Box>
      <ChatInput onSend={onSend} />
    </Box>
  )
}
