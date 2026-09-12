import io

import numpy as np
from fastapi import HTTPException
from PIL import Image

# A "decompression bomb" is a small file that expands to an enormous
# bitmap — a few hundred KB of PNG can decode to gigabytes of pixels. 40 MP
# comfortably covers any real camera photo while keeping a decoded RGB
# frame to ~120 MB worst case.
MAX_IMAGE_PIXELS = 40_000_000

# Backstop: Pillow raises on its own past twice this, in case a code path
# ever reaches Image.open() without going through load_image_as_array().
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


def load_image_as_array(data: bytes) -> np.ndarray:
    try:
        with Image.open(io.BytesIO(data)) as image:
            # Image.open only reads the header, so the dimensions are known
            # before anything is decoded — check them before paying for it.
            width, height = image.size
            if width * height > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    413,
                    f"That image is too large to process — {width}x{height} "
                    f"pixels, limit is {MAX_IMAGE_PIXELS // 1_000_000} megapixels",
                )
            return np.array(image.convert("RGB"))
    except HTTPException:
        raise
    except Image.DecompressionBombError as e:
        raise HTTPException(413, "That image is too large to process") from e
    except Exception as e:
        raise HTTPException(400, "That doesn't look like a valid image") from e
