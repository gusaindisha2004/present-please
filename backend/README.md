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

> **Note for Windows:** `torch` ships deeply-nested license files, so if
> the project itself sits under a long path (a synced OneDrive folder,
> for example), a venv created *inside* the project can trip Windows'
> 260-character path limit during install. Creating the venv somewhere
> short instead, such as `C:envs\present-please-backend`, avoids it:
> same `requirements.txt`, just a shorter path. Enabling Windows
> long-path support works too, as does cloning to a shorter directory.

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
