# Present Please! — backend

FastAPI service that does only the AI work (face + voice recognition).
Everything else (auth, subjects, enrollment, attendance CRUD) goes straight
from the React app to Supabase.

## Setup

```bash
python -m venv venv
./venv/Scripts/pip install -r requirements.txt
./venv/Scripts/pip install --no-deps resemblyzer==0.1.4
```

> **Note for this machine specifically:** the project folder lives deep
> inside OneDrive (`...\Claude Projects\Present Please!\backend`). Combined
> with `torch`'s deeply-nested license files, a venv created *inside* the
> project trips Windows' 260-character path limit. The working venv for
> this checkout lives at `C:\venvs\present-please-backend` instead — same
> `requirements.txt`, just a shorter path. If you clone this repo somewhere
> with a shorter path (or enable Windows long-path support), a normal
> in-project `venv/` works fine.

`resemblyzer` is installed with `--no-deps` on purpose: its declared
dependency is plain `webrtcvad`, which has no prebuilt Windows wheel and
needs MSVC build tools to compile. `webrtcvad-wheels` in requirements.txt
provides the same `webrtcvad` module with a prebuilt wheel, so installing
resemblyzer's actual dependencies (numpy, librosa, torch, webrtcvad)
separately and then resemblyzer itself with `--no-deps` avoids the
compile step entirely.

## Run

```bash
./venv/Scripts/uvicorn app.main:app --reload --port 8000
```

## Environment

Copy `.env.example` to `.env` and fill in your Supabase project's URL,
service_role secret key, and JWKS URL (Project Settings → API).
