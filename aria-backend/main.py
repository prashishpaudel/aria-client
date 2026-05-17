import asyncio
import json
import base64
import numpy as np
from fastapi import FastAPI, WebSocket
import nemo.collections.asr as nemo_asr
from kokoro import KPipeline
import httpx

app = FastAPI()

# ---------- CONFIG ----------
VLLM_URL = "http://localhost:8000/v1/chat/completions"
LLM_MODEL = "Qwen/Qwen2.5-14B-Instruct"

# ---------- LOAD MODELS ----------
print("Loading STT (Parakeet)...")
stt_model = nemo_asr.models.ASRModel.from_pretrained(
    model_name="nvidia/parakeet-tdt-0.6b-v3"
).to("cuda")
stt_model.eval()

print("Warming up Parakeet...")
_ = stt_model.transcribe([np.zeros(16000, dtype=np.float32)], verbose=False)

print("Loading TTS (Kokoro)...")
tts_pipeline = KPipeline(lang_code="a")

print("✓ Models ready")

# ---------- HELPERS ----------

async def run_stt(audio_np):
    """Run Parakeet on full audio buffer (16kHz mono float32)"""
    loop = asyncio.get_event_loop()

    def _transcribe():
        result = stt_model.transcribe([audio_np], verbose=False)
        return result[0].text

    text = await loop.run_in_executor(None, _transcribe)
    return text.strip()

VOICE_SYSTEM_PROMPT = (
    "You are a spoken voice assistant. Reply in 1-2 short sentences. "
    "Use plain conversational English — no markdown, no bullet lists, no code blocks. "
    "Skip preambles like 'Sure' or 'Of course'. Get to the point."
)


async def run_llm_stream(history: list, system: str | None = None):
    messages = ([{"role": "system", "content": system}] if system else []) + history
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            VLLM_URL,
            json={
                "model": LLM_MODEL,
                "messages": messages,
                "stream": True,
            },
        ) as resp:
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                if "[DONE]" in line:
                    break
                data = json.loads(line[5:])
                delta = data["choices"][0]["delta"].get("content", "")
                if delta:
                    yield delta

async def run_tts_stream(text):
    generator = tts_pipeline(text, voice="af_heart")
    for _, _, audio in generator:
        if hasattr(audio, "cpu"):
            audio = audio.cpu().numpy()
        yield audio

def pcm16_to_float32(audio_bytes):
    audio_int16 = np.frombuffer(audio_bytes, dtype=np.int16)
    return audio_int16.astype(np.float32) / 32768.0

def float32_to_base64(audio):
    audio_int16 = (audio * 32768).astype(np.int16)
    return base64.b64encode(audio_int16.tobytes()).decode()

# ---------- LLM PIPELINES ----------

async def handle_llm_text_only(ws: WebSocket, user_text: str, history: list):
    """Text chat: stream LLM response as transcript only, no TTS."""
    history.append({"role": "user", "content": user_text})
    full_text = ""

    try:
        async for token in run_llm_stream(history):
            full_text += token
            await ws.send_json({"type": "transcript_assistant", "text": full_text, "partial": True})

        await ws.send_json({"type": "transcript_assistant", "text": full_text, "partial": False})
        history.append({"role": "assistant", "content": full_text})
        await ws.send_json({"type": "status", "state": "idle"})

    except asyncio.CancelledError:
        if history and history[-1]["role"] == "user":
            history.pop()
        if full_text:
            try:
                await ws.send_json({"type": "transcript_assistant", "text": full_text, "partial": False})
            except Exception:
                pass
        raise


async def handle_llm_tts(ws: WebSocket, user_text: str, history: list):
    """Append user turn, stream LLM+TTS, append assistant turn. Cancellation-safe."""
    history.append({"role": "user", "content": user_text})
    full_text = ""
    buffer = ""

    try:
        await ws.send_json({"type": "status", "state": "speaking"})

        async for token in run_llm_stream(history, system=VOICE_SYSTEM_PROMPT):
            full_text += token
            buffer += token

            await ws.send_json({
                "type": "transcript_assistant",
                "text": full_text,
                "partial": True,
            })

            if any(p in token for p in ".!?"):
                async for audio_chunk in run_tts_stream(buffer):
                    b64 = float32_to_base64(audio_chunk)
                    await ws.send_json({"type": "audio", "data": b64, "sampleRate": 24000})
                buffer = ""

        # Flush remaining sentence
        if buffer:
            async for audio_chunk in run_tts_stream(buffer):
                b64 = float32_to_base64(audio_chunk)
                await ws.send_json({"type": "audio", "data": b64, "sampleRate": 24000})

        # Finalise transcript bubble
        await ws.send_json({
            "type": "transcript_assistant",
            "text": full_text,
            "partial": False,
        })

        history.append({"role": "assistant", "content": full_text})
        await ws.send_json({"type": "status", "state": "idle"})

    except asyncio.CancelledError:
        # Interrupted mid-response — roll back the user message we just appended
        if history and history[-1]["role"] == "user":
            history.pop()
        # Seal the partial bubble so it doesn't hang in the UI
        if full_text:
            try:
                await ws.send_json({
                    "type": "transcript_assistant",
                    "text": full_text,
                    "partial": False,
                })
            except Exception:
                pass
        raise

# ---------- MAIN WS ----------

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("Client connected")

    history = []
    active_task: asyncio.Task | None = None

    async def cancel_active():
        nonlocal active_task
        if active_task and not active_task.done():
            active_task.cancel()
            try:
                await active_task
            except asyncio.CancelledError:
                pass
        active_task = None

    try:
        while True:
            msg = await ws.receive()
            if "text" not in msg:
                continue

            data = json.loads(msg["text"])
            msg_type = data.get("type")

            if msg_type == "interrupt":
                await cancel_active()
                await ws.send_json({"type": "status", "state": "idle"})

            # Complete utterance from client-side Silero VAD
            elif msg_type == "voice":
                await cancel_active()
                await ws.send_json({"type": "status", "state": "processing"})
                audio_np = pcm16_to_float32(base64.b64decode(data["audio"]))
                user_text = await run_stt(audio_np)
                await ws.send_json({"type": "transcript_user", "text": user_text})
                active_task = asyncio.create_task(handle_llm_tts(ws, user_text, history))

            elif msg_type == "chat":
                user_text = data.get("text", "").strip()
                if not user_text:
                    continue
                await cancel_active()
                await ws.send_json({"type": "status", "state": "processing"})
                active_task = asyncio.create_task(handle_llm_text_only(ws, user_text, history))

    except Exception as e:
        print("Error:", e)
        await cancel_active()
        await ws.close()