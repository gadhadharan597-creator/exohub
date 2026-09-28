# Project Rules & Coding Standards

## 1. Scientific Framing & Disclaimers
- **ExoMiner Scope**: ExoMiner and ExoMiner++ classify transit signals (determining probability of a real planet vs a false positive). ExoMiner does **NOT** classify or measure habitability.
- **Habitability Output Framing**: All habitability outputs are computed **"potential habitability" estimates with uncertainty**. They must **NEVER** be presented as confirmation of habitability, liquid water, or life.
- **UI & System Prompt Enforcement**: The persistent disclaimer banner must be visible across all UI pages, and the AI assistant's system prompt must enforce this framing strictly.

## 2. Secrets Management & Security
- **No Hardcoded Secrets**: Never hardcode API keys, credentials, or tokens in source code, commit history, logs, or frontend bundles.
- **Server-Side Secret Storage**: All API keys (e.g., `GOOGLE_API_KEY`) must reside exclusively in server-side environment variables (`.env`).
- **Frontend Isolation**: Secrets must never be passed to, stored in, or exposed by the client-side React bundle.

## 3. Untrusted Data Handling & Prompt Safety
- **Web Text Safety**: Treat all text retrieved via Google Search Grounding or external web requests as **untrusted data**.
- **Indirect Prompt Injection Defense**: Web search text must never be executed or interpreted as system commands or instructions by the LLM.
- **Citation Transparency**: Always return search grounding citations and source links to the frontend.

## 4. Data Source Hierarchy & Conflict Resolution
- **Authoritative Numeric Source**: The NASA Exoplanet Archive TAP service is the single source of truth for numeric parameters (radius, orbital period, insolation, Teff, distance).
- **Descriptive Context Source**: Web search grounding is used solely for qualitative context (discovery background, news, follow-up observations).
- **Conflict Handling**: If web text conflicts with NASA Archive numerical parameters, display both in the UI, flag the conflict explicitly, and enforce the Archive numerical values in all calculations.

## 5. Coding & Testing Standards
- **Backend**: FastAPI with Python 3.11+, Pydantic v2 schemas for all requests and responses, type annotations, modular architecture.
- **Frontend**: React 18 + Vite + TypeScript (strict mode) + Tailwind CSS + Plotly.js. Mobile-friendly and accessible.
- **Testing**: Comprehensive pytest test suite for habitability logic, API endpoints, mock queries, and a 15-question evaluation benchmark for chatbot safety and accuracy.
