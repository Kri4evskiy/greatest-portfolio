from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "greatest-portfolio-backend"
    app_env: str = "local"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/greatest_portfolio"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
