import { useEffect, useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Message } from '../types/chat'
import ChatInput from './ChatInput'

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hi! I\'m Aria. You can type or hold the mic button to talk.',
    timestamp: new Date(),
  },
  {
    id: '2',
    role: 'user',
    content: 'Hello, can you hear me?',
    timestamp: new Date(),
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Loud and clear! How can I help you today?',
    timestamp: new Date(),
  },
]

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

export default function ChatArea() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </Box>

      <ChatInput onSend={handleSend} />
    </Box>
  )
}
