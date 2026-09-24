# Weather App

Real-time, responsive full-stack weather intelligence dashboard built with vanilla web standards and a Python Flask backend. The application delivers global atmospheric telemetry, multi-metric environmental diagnostics, and dynamic adaptive themes while strictly enforcing server-side custody over third-party API credentials.

---

## Preview

![Weather App Desktop Preview](./assets/screenshots/weather-app-preview.png)

---

## Features

- **Global Municipality Search**: Real-time weather lookup across cities, municipalities, and regions worldwide.
- **6-Metric Environmental Dashboard**:
  - Live ambient temperature and perceived "Feels Like" index (&deg;C)
  - Atmospheric pressure rating (hPa)
  - Relative humidity percentage (%)
  - Wind velocity measurement (m/s)
  - Visibility distance calculation (km)
  - OpenWeather condition artwork and qualitative description
- **Dynamic Atmospheric Theming**: Context-aware color themes that automatically adjust background palettes and glow accents based on live conditions (`clear`, `clouds`, `rain`, `storm`, `snow`, `mist`).
- **Zero Client-Side Secret Custody**: All third-party OpenWeatherMap API requests are proxied server-side via Flask, ensuring private keys are never exposed in browser network inspection.
- **Accessible User Interface (WCAG 2.1 AA Compliant)**: Semantic HTML5 document outline, keyboard-navigable interactive controls, high-contrast color ratios, and ARIA live regions (`role="status"` and `role="alert"`).
- **Service Observability**: Built-in `/api/health` endpoint for automated health checks, container probes, and uptime monitoring.
- **Resilient Error Normalization**: Standardized user feedback for empty inputs, queries exceeding character limits, unknown locations, upstream timeouts, and rate limits.

---

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Structure** | HTML5 (Semantic & Accessible) | Landmark regions, ARIA live states, accessible form controls |
| **Styling & Theming** | CSS3 (Design Tokens & Variables) | Glassmorphism surfaces, responsive Grid/Flexbox, dynamic themes |
| **Client Scripting** | JavaScript (ES6+ Vanilla) | Asynchronous fetch requests, input clearing, safe DOM binding |
| **Backend Runtime** | Python 3 (3.10+) | Server execution environment |
| **Web Framework** | Flask (v3.0+) | REST API routing, query proxying, and static asset delivery |
| **HTTP Client** | Requests (v2.31+) | Bounded network requests to upstream weather services |
| **Configuration** | python-dotenv (v1.0+) | Environment variable management and secret isolation |
| **Production WSGI** | Gunicorn (v22.0+) | Multi-worker WSGI server for Linux/PaaS container deployments |
| **External API** | OpenWeatherMap API | Upstream provider for global weather telemetry |

---

## Architecture

The project implements a **Decoupled Client-Server Proxy Pattern**:

1. **User Interaction**: The client enters a city name into the accessible search form.
2. **Local API Proxy**: The browser issues a `GET` request exclusively to the Flask server endpoint (`/api/weather?city={city}`).
3. **Validation & Isolation**: Flask validates the input (checking for presence and a maximum length of 100 characters). It securely loads the private `WEATHER_API_KEY` from the local environment and constructs an outbound request to OpenWeatherMap with an enforced 8-second network timeout.
4. **Data Normalization**: Flask processes the raw upstream JSON, normalizes units (such as converting visibility meters to kilometers), handles upstream HTTP status codes (401, 404, 429, 502), and strips internal metadata.
5. **Safe Client Presentation**: The browser receives clean, predictable JSON and updates the UI safely using `textContent` and CSS attribute selectors, eliminating DOM-based script injection vulnerabilities.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Browser Client (Frontend)"]
        UI["User Interface (HTML5 / CSS3)"]
        JS["Client Controller (js/script.js)"]
        UI -->|Submits City Search| JS
        JS -->|Updates DOM via textContent & Themes| UI
    end

    subgraph Backend["Application Server (Python / Flask)"]
        Router["Flask Router & Static Server (app.py)"]
        Validation["Input Validation (Length & Sanitization)"]
        Proxy["API Proxy Handler (/api/weather)"]
        Env[".env Configuration (WEATHER_API_KEY)"]
        Normalizer["Payload Normalizer & Unit Converter"]

        Router -->|GET /api/weather?city=...| Validation
        Validation -->|Valid Query| Proxy
        Proxy -->|Injects Server Secret| Env
        Env --> Normalizer
    end

    subgraph External["External Weather Provider"]
        OWM["OpenWeatherMap REST API (v2.5)"]
    end

    JS -->|HTTP GET Request (JSON)| Router
    Env -->|HTTP GET /data/2.5/weather (Timeout: 8s)| OWM
    OWM -->|Raw Weather Payload| Normalizer
    Normalizer -->|Sanitized JSON Response| JS
```

---

## Project Structure

```text
Weather-App/
├── assets/
│   ├── README.md               # Asset guidelines and screenshot instructions
│   └── screenshots/
│       ├── .gitkeep            # Directory preservation marker
│       └── weather-app-preview.png # Application desktop preview image
├── backend/
│   ├── .env.example            # Environment configuration template
│   ├── app.py                  # Flask REST API, proxy logic, and static server
│   └── requirements.txt        # Pinned Python package dependencies
├── frontend/
│   ├── css/
│   │   └── style.css           # CSS design tokens, dynamic themes, and glassmorphic UI
│   ├── js/
│   │   └── script.js           # Client application controller and DOM manager
│   └── index.html              # Semantic, accessible HTML5 dashboard structure
├── .gitignore                  # Git exclusion rules for secrets, virtualenvs, and caches
├── LICENSE                     # MIT License (2026 Jishnu Bhabak)
└── README.md                   # Repository documentation
```

---

## Project Analysis

### Architecture Summary
The application follows a clean separation of concerns. Rather than querying third-party APIs directly from the browser (a common antipattern in beginner frontends), all external API calls are routed through a Python Flask proxy. This encapsulates secret management, enforces upstream timeout constraints, normalizes external data formats, and decouples the user interface from upstream API schema changes.

### Code Organization
- **`frontend/`**: Standalone vanilla web files. Contains zero framework overhead or build steps.
  - `index.html`: Fully semantic layout with distinct landmark regions (`header`, `main`, `section`, `footer`).
  - `css/style.css`: Structured with custom properties (`:root`), atmospheric theme scopes (`body[data-theme="..."]`), fluid scaling via `clamp()`, and accessibility media queries (`prefers-reduced-motion`).
  - `js/script.js`: Encapsulated within an IIFE (`(() => { ... })()`) to avoid global namespace pollution, using modern ES6+ async/await and strict mode.
- **`backend/`**: Lightweight micro-service containing:
  - `app.py`: Route handlers for static files (`/`, `/<path:path>`), health monitoring (`/api/health`), and the weather proxy (`/api/weather`).
  - `.env.example`: Explicitly documented environment variable template.
  - `requirements.txt`: Modern dependency definitions with version pinning.

### Main Application Flow
1. User enters a query into `#city-input` and triggers submission.
2. `script.js` prevents default form submission, disables inputs, activates the loading spinner, and issues an asynchronous `fetch` request to `/api/weather?city={query}`.
3. `app.py` extracts and strips the parameter, validates length (`<= 100`), checks server API key availability, and issues a GET request with an 8-second timeout to OpenWeatherMap.
4. Upstream responses are checked for errors:
   - Status `404` returns a friendly "City not found" error.
   - Status `401` returns a "Weather service authentication failed" error (502).
   - Status `429` forwards a rate limit advisory.
   - Status `200` extracts and normalizes the payload into a clean JSON structure.
5. `script.js` receives the JSON payload, assigns metrics safely into the DOM via `.textContent`, sets the condition icon, applies the atmospheric theme dataset attribute to `<body>`, and displays the weather card.

### Key Implementation Decisions
- **Vanilla Web Stack**: Avoided heavy JavaScript frameworks (React, Vue) to maintain instant load times, zero build overhead, and maximum compatibility across browsers.
- **Strict Server Custody**: Completely eliminated client-side API key injection. The client has no mechanism to access or expose the OpenWeatherMap credential.
- **Defense Against XSS**: Replaced all dynamic HTML string concatenation with explicit `.textContent` bindings and sanitized URL encoding for image paths.

### Strengths
- Exceptional performance with minimal asset footprint.
- Clean separation between presentation and backend services.
- Comprehensive accessibility considerations (screen-reader live updates, keyboard navigation, focus management).
- High visual aesthetics with atmospheric reactive themes.

### Technical Considerations & Limitations
- **Stateless Proxy**: The backend does not cache weather responses; consecutive lookups for identical cities produce redundant upstream HTTP requests.
- **Rate Limiting**: The proxy currently lacks local rate limiting, leaving the service dependent on upstream provider rate limits.
- **Single Provider Dependency**: The system is tightly integrated with OpenWeatherMap; fallback weather providers are not configured.

---

## Installation

### Prerequisites
- **Python**: Version 3.10 or higher
- **Git**: Version 2.x or higher
- **Browser**: Modern web browser (Chrome, Edge, Firefox, Safari)
- **OpenWeatherMap Account**: Free API key from [OpenWeatherMap](https://openweathermap.org/api)

### 1. Clone Repository
```bash
git clone https://github.com/bhabakjishnu/Weather-App.git
cd Weather-App
```

### 2. Backend Setup
Navigate into the `backend` directory:
```bash
cd backend
```

Create a Python virtual environment:
```bash
python -m venv .venv
```

Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  ```

Install project dependencies:
```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create your local `.env` configuration file inside the `backend/` directory based on the provided `.env.example`:

- **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
- **macOS / Linux**:
  ```bash
  cp .env.example .env
  ```

Configure your variables in `backend/.env`:

```env
# OpenWeatherMap API Key (obtain from https://openweathermap.org/api)
WEATHER_API_KEY=your_actual_api_key_here

# Server Configuration
PORT=5000
HOST=127.0.0.1
FLASK_DEBUG=False

# Allowed CORS Origin (restrict to your frontend origin in production)
CORS_ORIGIN=*
```

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `WEATHER_API_KEY` | **Yes** | None | Private OpenWeatherMap API key |
| `PORT` | No | `5000` | Local port for Flask server |
| `HOST` | No | `127.0.0.1` | Network interface binding |
| `FLASK_DEBUG` | No | `False` | Flask debug mode (must be `False` in production) |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins for external frontend clients |

> [!CAUTION]
> **Credential Protection**: Never commit `.env` files to version control. The repository `.gitignore` automatically excludes all `.env` variants from Git tracking.

---

## Running the Project

### Option A: Monolithic Server (Recommended)
When running the Flask backend, it automatically serves both the API endpoints and the frontend static assets (`frontend/index.html`, CSS, and JS):

Ensure your virtual environment is active, then start the server from the `backend/` directory:
```bash
python app.py
```
*(Or from the repository root: `python backend/app.py`)*

Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

### Option B: Decoupled Static Server
If you prefer running the frontend independently (e.g., via VS Code Live Server or Python's built-in HTTP server):

Start the frontend server:
```bash
python -m http.server 5500 --directory frontend
```

Navigate to `http://127.0.0.1:5500`. Ensure the backend Flask server is running concurrently at `http://127.0.0.1:5000`.

---

## Build & Production Deployment

Because this project utilizes standard vanilla web technologies and an interpreted Python runtime, **no compilation or bundling step is required**.

### Production WSGI Server (Gunicorn)
For production deployments on Linux containers or PaaS platforms (Render, Railway, Fly.io, Heroku):

```bash
gunicorn --chdir backend app:app --bind 0.0.0.0:5000 --workers 4
```

### Deployment Configuration Matrix
1. **Container / PaaS Deployment (Render / Railway)**:
   - **Root Directory**: `backend` (or repository root with `--chdir backend`)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Environment Variables**: Add `WEATHER_API_KEY`, `FLASK_DEBUG=False`, `HOST=0.0.0.0`.
2. **Static Frontend Hosting (GitHub Pages / Netlify / Vercel)**:
   - Host the `frontend/` directory.
   - In `frontend/js/script.js`, configure `BACKEND_URL_OVERRIDE` or inject `window.WEATHER_BACKEND_URL` pointing to your hosted Flask backend service.

---

## Testing

Automated tests are not currently included in this repository.

### Manual Verification Checklist
- [x] **Health Check Verification**: `curl http://127.0.0.1:5000/api/health` returns status `healthy`.
- [x] **Valid City Query**: Searching `London` returns HTTP 200 and populates 6 metric cards and condition icon.
- [x] **Invalid City Query**: Searching an imaginary location displays a descriptive 404 alert.
- [x] **Empty Input Validation**: Submitting an empty input triggers client-side validation without sending an API request.
- [x] **Theme Transition**: Searching cities with distinct weather states (e.g. `Cairo`, `Seattle`, `Reykjavik`) activates corresponding CSS themes.
- [x] **Keyboard Navigation**: Entire application is operable using only `Tab`, `Enter`, and `Space`.

---

## Security

Security considerations identified during the repository review are documented below and managed in the project remediation plan.

- **Server-Side Secret Isolation**: Third-party API credentials exist solely within the server environment. The browser client never receives or stores the API key.
- **XSS Prevention**: DOM mutations strictly employ `.textContent` assignments rather than `.innerHTML`, eliminating script injection via malicious payload strings.
- **Bounded HTTP Requests**: Upstream API requests enforce an explicit 8-second timeout, preventing connection pooling exhaustion or thread-locking.
- **Input Boundaries**: Input strings are trimmed and capped at a maximum of 100 characters before forwarding upstream.
- **Repository Hygiene**: Standard `.gitignore` policies prevent secrets, caches, and virtual environments from entering version control.

---

## Security Audit Summary

A comprehensive repository-level security audit was conducted across the codebase and commit history:

| Audit Domain | Status / Evaluation | Notes |
| :--- | :--- | :--- |
| **Secrets & Credentials** | Remediation Documented | An API key was committed in historic commit `1e8fbd4`; key must be revoked/rotated in provider dashboard |
| **Environment Configuration** | Secure | `.env.example` provides safe placeholders; `.env` is properly excluded via `.gitignore` |
| **Authentication & AuthZ** | Low Risk / Read-Only | Public, stateless read-only proxy; no user authentication or sessions required |
| **Injection Vulnerabilities** | Verified Safe | Parameterized HTTP requests; strict `.textContent` DOM insertion eliminates XSS |
| **API Rate Limiting** | Improvement Required | Endpoint lacks local rate limiting; vulnerable to upstream quota exhaustion |
| **Response Caching** | Improvement Required | No caching mechanism; identical queries generate redundant upstream requests |
| **Security Headers** | Improvement Required | Standard defense-in-depth headers (CSP, X-Content-Type-Options) not yet attached |
| **Dependency Health** | Verified Up-to-Date | Dependencies in `requirements.txt` are modern and pinned to safe major ranges |
| **OWASP Top 10 Alignment** | Reviewed | Mapped against OWASP Top 10 (A02 Cryptographic Failures, A04 Insecure Design) |

---

## Limitations

- **No Local Request Rate Limiting**: The `/api/weather` endpoint does not restrict request frequency per IP address.
- **No Response Caching Layer**: Every search triggers an upstream API call, consuming network bandwidth and provider quotas.
- **Single Weather Data Source**: The service depends entirely on OpenWeatherMap; downtime on the provider's end will result in service degradation.
- **Historical Git Commit Artifact**: An API key committed in early Git history remains visible to clones of the repository unless purged with `git-filter-repo` and rotated.

---

## Future Improvements

### Security Improvements
- Integrate `Flask-Limiter` to enforce per-IP rate limiting (e.g., 60 requests/minute).
- Implement standard security headers using `Flask-Talisman` (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- Add a GitHub Actions CI workflow with `pip-audit` and `gitleaks` to detect vulnerabilities and accidental secret pushes automatically.

### Testing Improvements
- Implement a test suite using `pytest` and `pytest-mock` to test `/api/weather` success, error, and timeout conditions without hitting the live OpenWeatherMap API.
- Add browser integration tests using Playwright or Cypress to validate UI interactions and accessibility announcements.

### Architecture Improvements
- Introduce an in-memory TTL cache (e.g., `cachetools.TTLCache`) to store recent weather data for 5–10 minutes, significantly reducing upstream latency and quota usage.
- Add multi-provider fallback support (e.g., WeatherAPI or Open-Meteo) for high availability.

### Performance Improvements
- Serve static frontend assets via an edge CDN (Cloudflare, Vercel) while keeping the Flask microservice solely for API proxying.
- Add WebP weather artwork alternatives to minimize asset transfer sizes.

### Maintainability Improvements
- Introduce Docker containerization (`Dockerfile` and `docker-compose.yml`) for one-command local onboarding and deployment consistency.
- Add pre-commit hooks for Python formatting (`ruff` / `black`) and linting (`flake8`).

---

## Contributing

Contributions are welcome. Please follow these steps:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "feat: description of your improvement"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against the `main` branch.

---

## License

This project is open-source and distributed under the terms of the [MIT License](LICENSE).

```text
Copyright (c) 2026 Jishnu Bhabak
```

---

## Author & Acknowledgments

- **Author**: Jishnu Bhabak ([@bhabakjishnu](https://github.com/bhabakjishnu))
- **Weather Data**: Weather metrics and condition icons provided by [OpenWeatherMap](https://openweathermap.org/).
- **Typography**: Space Grotesk and Plus Jakarta Sans provided by [Google Fonts](https://fonts.google.com/).
