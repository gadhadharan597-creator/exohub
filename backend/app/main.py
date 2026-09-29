import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .api import health, candidates, planet_details, chat, detect, systems

app = FastAPI(
    title="Exoplanet Habitability API & Web Explorer",
    description="Backend API and web application for browsing ranked exoplanets, querying live NASA archive & web data, AI chatbot assistance, and custom habitability detection.",
    version="1.0.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(candidates.router, prefix="/api", tags=["Candidates"])
app.include_router(planet_details.router, prefix="/api", tags=["Planet Details"])
app.include_router(systems.router, prefix="/api", tags=["Multi-Planet Systems"])
app.include_router(chat.router, prefix="/api", tags=["AI Assistant Chat"])
app.include_router(detect.router, prefix="/api", tags=["Custom Habitability Detector"])

# Serve static frontend dist files if compiled
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            return None
        file_p = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_p) and os.path.isfile(file_p):
            return FileResponse(file_p)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Exoplanet Habitability API is running.",
            "docs": "/docs",
            "health": "/api/health",
            "disclaimer": "ExoMiner classifies transit signals, not habitability. Habitability scores are computed potential habitability estimates with uncertainty."
        }

