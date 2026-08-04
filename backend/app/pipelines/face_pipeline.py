"""
Face recognition pipeline — ported from the original Streamlit app's
src/pipelines/face_pipeline.py with as few changes as possible:

  - detector / shape predictor / face descriptor: dlib, unchanged.
  - classifier: SVC(kernel='linear'), unchanged.
  - match decision: np.linalg.norm(...) <= threshold, unchanged.

What changed and why:
  - @st.cache_resource -> plain module-level singletons (no Streamlit).
  - one embedding per student -> the classifier now trains on every row in
    student_faces, so multi-photo enrollment actually improves accuracy.
  - train_classifier() only clears the classifier cache now, not the dlib
    models (the original called st.cache_resource.clear(), which nuked
    everything on every signup).
"""

import threading

import dlib
import face_recognition_models
import numpy as np
from sklearn.svm import SVC

from app.core.supabase_client import get_service_client

_lock = threading.Lock()
_dlib_models: tuple | None = None
_classifier_cache: dict | None = None


def load_dlib_models():
    global _dlib_models
    if _dlib_models is None:
        with _lock:
            if _dlib_models is None:
                detector = dlib.get_frontal_face_detector()
                sp = dlib.shape_predictor(
                    face_recognition_models.pose_predictor_model_location()
                )
                facerec = dlib.face_recognition_model_v1(
                    face_recognition_models.face_recognition_model_location()
                )
                _dlib_models = (detector, sp, facerec)
    return _dlib_models


def get_face_embeddings(image_np: np.ndarray) -> list[np.ndarray]:
    detector, sp, facerec = load_dlib_models()
    faces = detector(image_np, 1)

    encodings = []
    for face in faces:
        shape = sp(image_np, face)
        face_descriptor = facerec.compute_face_descriptor(image_np, shape, 1)  # 128-d
        encodings.append(np.array(face_descriptor))
    return encodings


def _fetch_all_faces() -> list[dict]:
    client = get_service_client()
    response = client.table("student_faces").select("student_id, embedding").execute()
    return response.data


def get_trained_model() -> dict | None:
    global _classifier_cache
    if _classifier_cache is not None:
        return _classifier_cache

    rows = _fetch_all_faces()
    if not rows:
        return None

    X, y = [], []
    for row in rows:
        embedding = row.get("embedding")
        if embedding:
            X.append(np.array(embedding))
            y.append(row["student_id"])

    if len(X) == 0:
        return None

    clf = SVC(kernel="linear", probability=True, class_weight="balanced")
    try:
        clf.fit(X, y)
    except ValueError:
        pass

    _classifier_cache = {"clf": clf, "X": X, "y": y}
    return _classifier_cache


def train_classifier() -> bool:
    """Invalidate the classifier cache (not the dlib models) and retrain."""
    global _classifier_cache
    _classifier_cache = None
    model_data = get_trained_model()
    return bool(model_data)


def predict_attendance(
    class_image_np: np.ndarray, threshold: float = 0.6
) -> tuple[dict[str, bool], list[str], int]:
    """Unchanged decision logic: SVC narrows the candidate, a Euclidean
    distance check against that student's closest stored embedding
    confirms the match."""
    encodings = get_face_embeddings(class_image_np)

    detected_students: dict[str, bool] = {}
    model_data = get_trained_model()

    if not model_data:
        return detected_students, [], len(encodings)

    clf = model_data["clf"]
    X_train = model_data["X"]
    y_train = model_data["y"]

    all_students = sorted(set(y_train))

    for encoding in encodings:
        if len(all_students) >= 2:
            predicted_id = clf.predict([encoding])[0]
        else:
            predicted_id = all_students[0]

        # Compare against the closest stored embedding for that student
        # (multi-photo enrollment means there can be several).
        student_embeddings = [
            X_train[i] for i, sid in enumerate(y_train) if sid == predicted_id
        ]
        best_match_score = min(
            np.linalg.norm(stored - encoding) for stored in student_embeddings
        )

        if best_match_score <= threshold:
            detected_students[predicted_id] = True

    return detected_students, all_students, len(encodings)
