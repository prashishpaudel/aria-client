# Aria

Browser-based voice assistant. Speak or type, get streaming voice + transcript replies.

```
mic → Silero VAD → WebSocket → Parakeet STT → Qwen2.5-14B (vLLM) → Kokoro TTS → audio playback
```

## Layout

| Folder | Stack | Runs on |
|---|---|---|
| [`aria-client/`](./aria-client) | React + TypeScript + Vite | Browser (any host) |
| [`aria-backend/`](./aria-backend) | FastAPI + NeMo (Parakeet) + Kokoro + httpx (vLLM) | GPU box (DGX Spark) |

Both halves talk over a single WebSocket. See each subfolder's README for setup.

## Quick start

**Backend** (on GPU machine):
```bash
cd aria-backend
# follow README — vLLM in Docker, then uvicorn main:app
```

**Client** (locally):
```bash
cd aria-client
npm install            # postinstall copies VAD assets to public/vad/
npm run dev
```

Point client at backend by setting `VITE_WS_URL` in `aria-client/.env`.
