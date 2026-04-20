from fastapi import FastAPI

from app.modules.health.router import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="greatest-portfolio-backend",
        version="0.1.0",
        description="Python backend for greatest-portfolio.",
    )
    app.include_router(health_router)
    return app


app = create_app()
