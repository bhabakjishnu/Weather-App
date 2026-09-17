"""
Weather App - Flask Backend
Provides a secure API proxy for fetching weather data from OpenWeatherMap.
Protects the API key on the server and serves static frontend assets.
"""

import os
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from dotenv import load_dotenv
import requests

# Resolve paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# Load environment variables from backend/.env or root .env
dotenv_path = BASE_DIR / ".env"
if not dotenv_path.exists():
    dotenv_path = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=dotenv_path)

API_KEY = os.getenv("WEATHER_API_KEY") or os.getenv("OPENWEATHER_API_KEY")
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "127.0.0.1")
DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")


@app.after_request
def add_cors_headers(response):
    """Enable CORS so frontend can be hosted independently if desired."""
    response.headers["Access-Control-Allow-Origin"] = CORS_ORIGIN
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for deployment monitoring and uptime verification."""
    return jsonify({
        "ok": True,
        "status": "healthy",
        "service": "weather-api"
    }), 200


@app.route("/")
def serve_index():
    """Serve the main frontend application."""
    if (FRONTEND_DIR / "index.html").exists():
        return send_from_directory(str(FRONTEND_DIR), "index.html")
    return jsonify({"ok": False, "error": "Frontend assets not found"}), 404


@app.route("/<path:path>")
def serve_static_file(path):
    """Serve CSS, JS, and asset files for the frontend."""
    file_path = FRONTEND_DIR / path
    if file_path.exists() and file_path.is_file():
        return send_from_directory(str(FRONTEND_DIR), path)
    return jsonify({"ok": False, "error": "Resource not found"}), 404


@app.route("/api/weather", methods=["GET", "OPTIONS"])
def get_weather():
    """
    Fetch weather information for a requested city.
    Query parameters:
        city (str): The name of the city to look up.
    Returns:
        JSON response with normalized weather data or an error description.
    """
    if request.method == "OPTIONS":
        return "", 204

    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({
            "ok": False,
            "error": "Please enter a city name."
        }), 400

    if len(city) > 100:
        return jsonify({
            "ok": False,
            "error": "City name is too long."
        }), 400

    if not API_KEY:
        return jsonify({
            "ok": False,
            "error": "Server configuration error: Weather API key is not configured."
        }), 500

    api_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric",
    }

    try:
        response = requests.get(api_url, params=params, timeout=8)
    except requests.exceptions.Timeout:
        return jsonify({
            "ok": False,
            "error": "Weather service request timed out. Please try again."
        }), 504
    except requests.exceptions.ConnectionError:
        return jsonify({
            "ok": False,
            "error": "Unable to connect to the weather service. Check your network connection."
        }), 503
    except requests.exceptions.RequestException:
        return jsonify({
            "ok": False,
            "error": "Failed to communicate with the weather service."
        }), 502

    # Handle upstream HTTP response status
    if response.status_code == 404:
        return jsonify({
            "ok": False,
            "error": f"City '{city}' not found. Please check the spelling."
        }), 404

    if response.status_code == 401:
        return jsonify({
            "ok": False,
            "error": "Weather service authentication failed. Invalid API key."
        }), 502

    if response.status_code == 429:
        return jsonify({
            "ok": False,
            "error": "Weather service rate limit exceeded. Please wait a moment and try again."
        }), 429

    if response.status_code != 200:
        return jsonify({
            "ok": False,
            "error": "Weather service returned an unexpected error."
        }), 502

    try:
        data = response.json()
    except ValueError:
        return jsonify({
            "ok": False,
            "error": "Weather service returned an unreadable response."
        }), 502

    weather_item = data.get("weather", [{}])[0]
    main_item = data.get("main", {})
    wind_item = data.get("wind", {})
    sys_item = data.get("sys", {})

    # Calculate visibility in kilometers (OpenWeather reports in meters)
    raw_visibility = data.get("visibility")
    visibility_km = round(raw_visibility / 1000, 1) if isinstance(raw_visibility, (int, float)) else None

    # Normalized response structure
    payload = {
        "city": data.get("name", city.title()),
        "country": sys_item.get("country", ""),
        "condition": weather_item.get("main", "N/A"),
        "description": str(weather_item.get("description", "N/A")).capitalize(),
        "temperature": round(main_item.get("temp", 0), 1) if isinstance(main_item.get("temp"), (int, float)) else None,
        "feels_like": round(main_item.get("feels_like", 0), 1) if isinstance(main_item.get("feels_like"), (int, float)) else None,
        "humidity": main_item.get("humidity"),
        "pressure": main_item.get("pressure"),
        "wind_speed": round(wind_item.get("speed", 0), 1) if isinstance(wind_item.get("speed"), (int, float)) else None,
        "visibility_km": visibility_km,
        "icon_code": weather_item.get("icon", ""),
    }

    return jsonify({
        "ok": True,
        "data": payload
    }), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"ok": False, "error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"ok": False, "error": "An unexpected internal server error occurred"}), 500


if __name__ == "__main__":
    print(f"Weather app starting at http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=DEBUG)
