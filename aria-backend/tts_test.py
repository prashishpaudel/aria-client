from kokoro import KPipeline
import soundfile as sf
import numpy as np

# 1. Use 'a' for American English
pipeline = KPipeline(lang_code='a')

text = "24 hours ago, the war appeared to bend toward restraint. A truce between Israel and Lebanon took hold, with Hezbollah signaling acceptance. Iran declared the Strait of Hormuz open, and early tanker traffic tentatively resumed. Diplomats spoke, cautiously, of momentum, of a narrow window where escalation might give way to stabilization."

# 2. Generate audio
generator = pipeline(text, voice='af_heart')

audio_chunks = []

# (gs, ps, audio) -> graphemes, phonemes, audio_array
for i, (gs, ps, audio) in enumerate(generator):
    audio_chunks.append(audio)

# 3. Concatenate all chunks
audio = np.concatenate(audio_chunks)

# 4. Save to file using the standard 24000Hz rate
sf.write("output_kokoro.wav", audio, 24000)

print("Saved to output_kokoro.wav")

