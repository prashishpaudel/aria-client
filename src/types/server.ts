export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'
export type PipelineState = 'idle' | 'listening' | 'processing' | 'speaking'

export type ServerMessage =
  | { type: 'transcript_user'; text: string }
  | { type: 'transcript_assistant'; text: string; partial?: boolean }
  | { type: 'audio'; data: string; sampleRate?: number }
  | { type: 'status'; state: PipelineState }
  | { type: 'error'; message: string }
