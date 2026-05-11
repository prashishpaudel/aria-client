# Aria Backend

Voice assistant backend on DGX Spark.
Audio → STT (Parakeet) → LLM (Qwen2.5-14B via vLLM) → TTS (Kokoro) → Audio

## 1. System Setup

```bash
sudo apt update
sudo apt install -y python3.12-venv python3-dev build-essential libsndfile1 ffmpeg
```

## 2. Python Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# PyTorch nightly (Blackwell + CUDA 13)
pip install --pre torch torchvision torchaudio \
  --index-url https://download.pytorch.org/whl/nightly/cu130

# Everything else
pip install -r requirements.txt
```

## 3. Run vLLM

```bash
docker pull nvcr.io/nvidia/vllm:25.11-py3

docker run -d --name vllm --gpus all --ipc=host \
  -p 8000:8000 \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  --restart unless-stopped \
  nvcr.io/nvidia/vllm:25.11-py3 \
  vllm serve Qwen/Qwen2.5-14B-Instruct \
  --dtype bfloat16 --max-model-len 8192 --gpu-memory-utilization 0.55
```

## 4. Check vLLM

```bash
docker logs -f vllm
# Wait for: "Uvicorn running on http://0.0.0.0:8000"

curl http://localhost:8000/v1/models

curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2.5-14B-Instruct",
    "messages": [{"role": "user", "content": "Say hello in one short sentence."}]
  }'
```

## 5. Test STT and TTS

```bash
source venv/bin/activate
python stt_test.py
python tts_test.py
```

## 6. Run FastAPI

```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 9000
```