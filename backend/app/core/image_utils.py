import io

import numpy as np
from fastapi import HTTPException
from PIL import Image


def load_image_as_array(data: bytes) -> np.ndarray:
    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, "That doesn't look like a valid image") from e
    return np.array(image)
