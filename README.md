# Weather App

## Overview

A lightweight, modern, and secure full-stack weather intelligence dashboard built with vanilla web standards and a Python Flask backend. The application delivers real-time weather analytics, comprehensive atmospheric metrics, and dynamic adaptive themes while strictly protecting sensitive API credentials server-side.

---

## Demo

- **Live Demo**: Coming soon *(Deploy instructions below)*
- **Repository**: [https://github.com/bhabakjishnu/Weather-App](https://github.com/bhabakjishnu/Weather-App)

---

## Screenshots

### Desktop

![Weather App Desktop](assets/screenshots/weather-app-preview.png)

### Mobile

> *Placeholder: A dedicated mobile preview can be added to `assets/screenshots/mobile.png` (see [`assets/README.md`](assets/README.md)).*

---

## Features

- **Global City Search**: Query real-time weather conditions for any city worldwide.
- **Atmospheric Metric Dashboard**:
  - Live Temperature (&deg;C)
  - "Feels Like" Perceived Temperature (&deg;C)
  - Weather Condition & Descriptive Summary
  - Humidity Percentage (%)
  - Wind Speed (m/s)
  - Atmospheric Pressure (hPa)
  - Visibility Range (km)
  - Official OpenWeather Condition Artwork
- **Dynamic Atmospheric Theming**: Adaptive background palettes that transition automatically based on current weather conditions (Clear, Clouds, Rain, Storm, Snow, Mist).
- **Responsive Architecture**: Built mobile-first, ensuring fluid rendering from 320px smartphones to 4K ultra-wide displays.
- **Health Check & Observability**: Built-in `/api/health` endpoint for uptime monitoring and container probes.
- **Robust Error Handling**: Meaningful feedback for empty inputs, invalid city names, upstream service errors, and connectivity failures.
- **Accessible Design (WCAG 2.1 AA)**: Keyboard navigable, semantic HTML5 structure, ARIA live region status alerts, and contrast-compliant typography.
- **Zero Client-Side Secret Exposure**: All external third-party API communications are strictly proxied through the Flask backend.

---

## Tech Stack

### Frontend
- **HTML5**: Semantic document layout with ARIA landmarks.
- **CSS3**: Vanilla CSS design tokens (`:root`), Flexbox, CSS Grid, `clamp()` responsive fluid typography, and glassmorphism styling.
- **JavaScript (ES6+)**: Modular vanilla JavaScript utilizing `fetch`, `async`/`await`, and safe DOM manipulation (`textContent`).

### Backend
- **Python 3**: Runtime engine (Python 3.10+).
- **Flask**: Micro-web framework providing static asset delivery and REST API routing.
- **python-dotenv**: Secure environment variable configuration.
- **Requests**: Resilient HTTP client with built-in network timeouts.
- **Gunicorn**: Production WSGI server (for Linux / PaaS deployments).

### Weather Provider
- **OpenWeatherMap API**: Free Tier Current Weather Data API.

---

## Project Structure

```text
Weather-App/
├── frontend/
│   ├── index.html          # Semantic HTML5 user interface
│   ├── css/
│   │   └── style.css       # Design tokens, responsive layouts, and themes
│   └── js/
│       └── script.js       # Client application logic and API integration
│
├── backend/
│   ├── app.py              # Flask server, API proxy, and static file server
│   ├── requirements.txt    # Python dependencies (Flask, requests, dotenv, gunicorn)
│   ├── .env.example        # Template for environment variables
│   └── .env                # Local secrets (NEVER committed — gitignored)
│
├── assets/
│   ├── screenshots/
│   │   ├── .gitkeep        # Gitkeep marker
│   │   └── weather-app-preview.png # Desktop screenshot preview
│   └── README.md           # Asset and screenshot guidelines
│
├── .gitignore              # Git ignore rules for Python, IDE, and secrets
├── README.md               # Project documentation
└── LICENSE                 # MIT License
```

---

## API Architecture

```text
Browser Client (Vanilla JS)
      │
      ▼ GET /api/weather?city=London
Flask Backend Proxy (Python 3)
      │
      ▼ GET https://api.openweathermap.org/data/2.5/weather?q=London&appid={SECRET_KEY}
OpenWeatherMap API Service
      │
      ▼ Upstream JSON Response
Flask Backend (Normalizes payload, hides secret, handles HTTP codes)
      │
      ▼ Normalized Clean JSON
Browser Client (Renders metrics into DOM securely)
```

1. **User Interaction**: The user enters a city name into the accessible search input and submits the form.
2. **Proxied Request**: The frontend issues a `fetch` request exclusively to the backend endpoint (`/api/weather?city={city}`).
3. **Secure API Calling**: The Flask backend injects the private `WEATHER_API_KEY` stored securely in the server environment, query parameters, and executes a timeout-bounded HTTP request to OpenWeatherMap.
4. **Data Normalization**: Flask processes the response, extracts relevant metrics, normalizes units (e.g. converting visibility from meters to kilometers), and handles any upstream error codes.
5. **Safe Rendering**: The normalized payload is returned to the client as clean JSON, and the browser updates the DOM securely using `textContent` and SVG condition icons.

---

## Prerequisites

- **Python**: Version 3.10 or higher
- **Git**: Version 2.x or higher
- **Web Browser**: Modern standard browser (Chrome, Firefox, Safari, Edge)
- **OpenWeatherMap API Key**: Free registration at [OpenWeatherMap](https://openweathermap.org/api)

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/bhabakjishnu/Weather-App.git
cd Weather-App
```

### 2. Backend Setup

Navigate to the `backend/` folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment:

- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt):**
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **macOS / Linux:**
  ```bash
  source .venv/bin/activate
  ```

Install required dependencies:

```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create your local `.env` configuration file inside `backend/` from the provided `.env.example`:

- **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```

Open `backend/.env` in your editor and configure your variables:

```env
# OpenWeatherMap API Key (obtain from https://openweathermap.org/api)
WEATHER_API_KEY=your_actual_api_key_here

# Server Configuration
PORT=5000
HOST=127.0.0.1
FLASK_DEBUG=False

# Allowed CORS Origin (default * allows all origins; restrict in production)
CORS_ORIGIN=*
```

> [!CAUTION]
> **Security Rule**: The `.env` file contains sensitive private keys and must **NEVER** be committed to version control. The repository `.gitignore` automatically excludes `.env` files from Git tracking.

---

## Running the Backend

Ensure your virtual environment is active, then start the server:

```bash
python app.py
```

*(Alternatively from the repository root: `python backend/app.py`)*

The terminal will confirm:
```text
Weather app starting at http://127.0.0.1:5000
```

---

## Running the Frontend

### Option A: Served via Flask (Recommended for Local Dev & Full-Stack Deployment)

Open your web browser and navigate directly to:

```text
http://127.0.0.1:5000
```

The Flask backend automatically serves `frontend/index.html` and all static CSS/JS assets on the root path.

### Option B: Standalone Static Server (Decoupled Frontend)

If you prefer to run the frontend independently (e.g. using VS Code Live Server or Python's HTTP server):

```bash
python -m http.server 5500 --directory frontend
```

Then visit `http://127.0.0.1:5500`. The frontend JavaScript automatically detects dev server ports (5500, 3000, 5173, 8000, 8080) and directs API calls to the Flask backend at `http://127.0.0.1:5000`.

---

## API Endpoint Reference

### `GET /api/weather`

Fetches normalized atmospheric weather data for a specified municipality.

#### Request Parameters
| Parameter | Type   | Required | Description                     |
|-----------|--------|----------|---------------------------------|
| `city`    | string | Yes      | Name of the municipality or city |

#### Example Request
```http
GET /api/weather?city=London HTTP/1.1
Host: 127.0.0.1:5000
Accept: application/json
```

#### Successful Response (`200 OK`)
```json
{
  "ok": true,
  "data": {
    "city": "London",
    "country": "GB",
    "condition": "Clouds",
    "description": "Broken clouds",
    "temperature": 18.5,
    "feels_like": 17.8,
    "humidity": 65,
    "pressure": 1014,
    "wind_speed": 4.2,
    "visibility_km": 10.0,
    "icon_code": "04d"
  }
}
```

#### Error Response (`404 Not Found`)
```json
{
  "ok": false,
  "error": "City 'Atlantis' not found. Please check the spelling."
}
```

---

### `GET /api/health`

Health check endpoint for container probes, uptime monitoring, and deployment validation.

#### Successful Response (`200 OK`)
```json
{
  "ok": true,
  "status": "healthy",
  "service": "weather-api"
}
```

---

## Error Handling

The application maps server and client anomalies to standardized, friendly alerts:

| Condition | Status Code | User-Facing Message |
|-----------|-------------|---------------------|
| Missing / Blank City | `400 Bad Request` | "Please enter a city name before searching." |
| City Name > 100 chars | `400 Bad Request` | "City name is too long." |
| City Not Found | `404 Not Found` | "City '{name}' not found. Please check the spelling." |
| Upstream Rate Limit | `429 Too Many Requests` | "Weather service rate limit exceeded. Please wait a moment." |
| Missing Server Key | `500 Server Error` | "Server configuration error: Weather API key is not configured." |
| Upstream Auth Failure | `502 Bad Gateway` | "Weather service authentication failed. Invalid API key." |
| Network Timeout | `504 Gateway Timeout` | "Weather service request timed out. Please try again." |
| Backend Unreachable | Client Catch | "Unable to connect to the weather backend. Please verify the Flask server is running." |

---

## Deployment

The application supports both **monolithic deployment** (Flask serves both frontend and backend) and **decoupled deployment** (frontend on a static host, backend on a cloud container).

### 1. Backend Deployment (e.g., Render, Railway, Fly.io, Heroku)

1. Create a new **Web Service** pointing to your GitHub repository.
2. Configure settings:
   - **Root Directory**: `backend` (or repo root)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT` *(if root is `backend`)* or `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT`
3. Add **Environment Variables** in the hosting dashboard:
   - `WEATHER_API_KEY`: Your private OpenWeatherMap API key.
   - `HOST`: `0.0.0.0`
   - `FLASK_DEBUG`: `False`
   - `CORS_ORIGIN`: Your frontend URL (e.g. `https://username.github.io` or `*`).
4. Note your deployed backend URL (e.g., `https://weather-backend.onrender.com`).

### 2. Frontend Deployment (e.g., GitHub Pages, Netlify, Vercel)

If deploying the frontend separately:

1. In [`frontend/js/script.js`](frontend/js/script.js), set your production backend URL:
   ```javascript
   const BACKEND_URL_OVERRIDE = "https://weather-backend.onrender.com";
   ```
   *(Alternatively, inject `<script>window.WEATHER_BACKEND_URL = "https://weather-backend.onrender.com";</script>` into `index.html`.)*
2. For **GitHub Pages**:
   - Go to repository **Settings** > **Pages**.
   - Source: Deploy from branch.
   - Branch: `main`, Folder: `/ (root)` or `/frontend`.
3. For **Vercel / Netlify**:
   - Set publish directory to `frontend`.

---

## Security

- **Server-Side Secret Custody**: The API key is stored strictly on the server in environment variables (`WEATHER_API_KEY`). It is never delivered to or accessible by client-side JavaScript.
- **Git Protection**: The `.gitignore` file guarantees `.env`, `*.env`, build caches, and virtual environments are never committed.
- **Input Sanitization**: Search queries are sanitized and length-checked on both client and server.
- **Safe DOM Injection**: All dynamic metrics use `textContent` rather than `innerHTML`, preventing Cross-Site Scripting (XSS).
- **Key Rotation**: If an API key was ever committed in historic Git commits, revoke it immediately via your OpenWeatherMap dashboard and generate a fresh key.

---

## Accessibility

Built to conform to **WCAG 2.1 Level AA** standards:

- **Screen Reader Announcements**: Dedicated `role="alert"` with `aria-live="assertive"` for instantaneous error reporting and `role="status"` with `aria-live="polite"` for non-disruptive feedback.
- **Keyboard Navigation**: Full tab sequence with distinct `:focus-visible` styling on all interactive controls.
- **Color Contrast**: Compliant foreground-to-background contrast across all atmospheric themes.
- **Reduced Motion**: Respects system preferences via `@media (prefers-reduced-motion: reduce)`.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
