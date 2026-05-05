# Aria

Browser-based voice assistant with push-to-talk and text chat.

Streams microphone audio over WebSocket to a backend running **Parakeet STT → Qwen LLM → Kokoro TTS**. Responses stream back in real time with live transcript and audio playback.

## Stack

- **Frontend:** React + Vite
- **Transport:** WebSocket (mic audio out, streamed audio/transcript in)
- **Backend (separate repo):** Parakeet STT, Qwen LLM, Kokoro TTS

## Features

- Push-to-talk mic capture
- Text chat input
- Real-time streaming transcript
- Streamed audio playback

## Getting Started

```bash
npm install
npm run dev
```

Set backend WebSocket URL in `.env`:

```env
VITE_WS_URL=ws://localhost:8000/ws
```

## Project Structure

```
src/
  components/   # UI components
  hooks/        # WebSocket, mic, audio hooks
  lib/          # Utilities
```
