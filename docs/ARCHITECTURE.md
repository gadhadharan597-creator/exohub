# Technical Architecture — Exoplanet Habitability Web Application

Overview of the system topology, data flow, dual-source resolution, and machine learning pipeline.

```mermaid
graph TD
    User[User / Web Browser] -->|HTTP / React UI| FE[Frontend React + Vite]
    FE -->|REST API Requests| BE[Backend FastAPI App]

    subgraph Backend Layer
        BE -->|Candidate Catalog Queries| CS[Candidate Service]
        BE -->|Habitability Calculator| HC[src/habitability Module]
        BE -->|Custom Detect & Monte Carlo| MC[Monte Carlo Uncertainty Engine]
        BE -->|AI Chatbot & Tool Router| GS[Gemini AI Service]
        BE -->|Live TAP Queries| NASA[NASA Archive Service]
    end

    subgraph External Sources & Services
        NASA -->|Authoritative Numbers| TAP[NASA Exoplanet Archive TAP API]
        GS -->|Search Grounding| GAI[Google AI Studio Gemini API]
        CS -->|Load Data| CSV[data/ranked_candidates.csv]
        CS -->|Load Model| ML[models/habitability_model.joblib]
    end
```

## System Components

1. **Frontend (React + TypeScript + Tailwind CSS)**:
   - 5 Views: Ranked Candidates, Planet Details, AI Chatbot, Custom Detector, About & Methods.
   - Persistent banner enforcing ExoMiner scientific framing.
2. **FastAPI Backend (`backend/app/main.py`)**:
   - High-performance async REST server with type validation via Pydantic.
   - Static asset serving for compiled single-page application.
3. **Data Layer & ML Classifier**:
   - Multi-stage rankings combining ExoMiner probability scores with Kopparapu Habitable Zone boundary models and scikit-learn GBDT classifiers.
4. **Dual-Source Resolution**:
   - NASA Archive TAP Service is the single authoritative source of truth for numeric values.
   - Gemini Search Grounding provides qualitative context and citations.
