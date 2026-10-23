"""
Voice recognition pipeline.

  - encoder:       Resemblyzer VoiceEncoder, one 256 dimensional speaker
                   embedding per utterance
  - segmentation:  librosa.effects.split(top_db=30); segments shorter than
                   0.5s are discarded as too brief to identify anyone
  - decision:      cosine similarity against the enrolled speakers,
                   accepted when >= threshold

The encoder returns unit normalised embeddings, so a plain dot product is
already the cosine similarity and no separate normalisation step is needed.

The encoder loads once into a module level singleton behind a lock, since
constructing it reads model weights from disk.
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
) -> tuple[dict[str, float], int]:
    """Unchanged decision logic (silence-split segmentation, cosine-similarity
    threshold match). Also returns how many voiced segments didn't match any
    candidate, mirroring the face pipeline's unmatched-face count for the
    attendance review UI."""
    try:
        encoder = load_voice_encoder()
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        segments = librosa.effects.split(audio, top_db=30)

        identified_results: dict[str, float] = {}
        unmatched_segments = 0

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
            else:
                unmatched_segments += 1

        return identified_results, unmatched_segments
    except Exception as e:
        raise VoicePipelineError("Bulk voice processing error") from e
