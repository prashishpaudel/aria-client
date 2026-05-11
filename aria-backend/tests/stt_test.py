
#Parakeet
import nemo.collections.asr as nemo_asr

model = nemo_asr.models.ASRModel.from_pretrained(
    model_name="nvidia/parakeet-tdt-0.6b-v2"
)

result = model.transcribe(["audio.wav"])
print(result[0].text)

#Whisper
# from faster_whisper import WhisperModel

# model = WhisperModel("large-v3", device="cuda", compute_type="float16") #tiny → base → small → medium → large-v1/v2/v3

# segments, _ = model.transcribe("audio.wav")

# for segment in segments:
#     print(segment.text)