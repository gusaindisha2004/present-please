from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_secret_key: str
    supabase_jwks_url: str

    frontend_origin: str = "http://localhost:5173"

    face_match_threshold: float = 0.6
    voice_match_threshold: float = 0.65

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
