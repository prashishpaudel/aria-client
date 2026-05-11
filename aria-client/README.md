# Aria

Browser-based voice assistant with push-to-talk and text chat.

Streams microphone audio over WebSocket to a backend running **Parakeet STT → Qwen LLM → Kokoro TTS**. Responses stream back in real time with live transcript and audio playback.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Transport:** WebSocket (mic audio out, streamed audio/transcript in)
- **Backend (separate repo):** Parakeet STT, Qwen LLM, Kokoro TTS

## Features

- Push-to-talk mic capture
- Text chat input
- Real-time streaming transcript
- Streamed audio playback

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running (see backend repo)

### Setup

```bash
npm install
```

Create `.env` in project root:

```env
VITE_WS_URL=ws://localhost:8000/ws
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at `http://localhost:5173` |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
  components/   # UI components
  hooks/        # WebSocket, mic, audio hooks
  lib/          # Utilities
```
