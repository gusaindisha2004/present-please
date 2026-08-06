"""
Voice recognition pipeline — ported from the original Streamlit app's
src/pipelines/voice_pipeline.py with as few changes as possible:

  - encoder: resemblyzer.VoiceEncoder, unchanged.
  - segmentation: librosa.effects.split(top_db=30), 0.5s minimum segment,
    unchanged.
  - match decision: cosine similarity (np.dot on unit embeddings) against
    a threshold, unchanged.

What changed: @st.cache_resource -> a module-level singleton, and
st.error(...) -> raised exceptions (the API layer turns these into HTTP
responses instead of writing to a Streamlit UI).
"""

import io
import threading

import librosa
import numpy as np
from resemblyzer import VoiceEncoder, preprocess_wav

_lock = threading.Lock()
_encoder: VoiceEncoder | None = None


class VoicePipelineError(Exception):
    pass


def load_voice_encoder() -> VoiceEncoder:
    global _encoder
    if _encoder is None:
        with _lock:
            if _encoder is None:
                _encoder = VoiceEncoder()
    return _encoder


def voice_encoder_loaded() -> bool:
    return _encoder is not None


def get_voice_embedding(audio_bytes: bytes) -> list[float]:
    try:
        encoder = load_voice_encoder()
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        wav = preprocess_wav(audio)
        embedding = encoder.embed_utterance(wav)
        return embedding.tolist()
    except Exception as e:
        raise VoicePipelineError("Voice recognition error") from e


def identify_speaker(
    new_embedding, candidates: dict[str, list[float]], threshold: float = 0.65
) -> tuple[str | None, float]:
    if new_embedding is None or not candidates:
        return None, 0.0

    best_sid = None
    best_score = -1.0

    for sid, stored_embedding in candidates.items():
        if stored_embedding:
            similarity = float(np.dot(new_embedding, stored_embedding))
            if similarity > best_score:
                best_score = similarity
                best_sid = sid

    if best_score >= threshold:
        return best_sid, best_score

    return None, best_score


def process_bulk_audio(
    audio_bytes: bytes, candidates: dict[str, list[float]], threshold: float = 0.65
) -> dict[str, float]:
    try:
        encoder = load_voice_encoder()
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        segments = librosa.effects.split(audio, top_db=30)

        identified_results: dict[str, float] = {}

        for start, end in segments:
            if (end - start) < sr * 0.5:
                continue

            segment_audio = audio[start:end]
            wav = preprocess_wav(segment_audio)
            embedding = encoder.embed_utterance(wav)

            sid, score = identify_speaker(embedding, candidates, threshold)

            if sid:
                if sid not in identified_results or score > identified_results[sid]:
                    identified_results[sid] = score

        return identified_results
    except Exception as e:
        raise VoicePipelineError("Bulk voice processing error") from e
