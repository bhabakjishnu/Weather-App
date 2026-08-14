import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, urlparse
from urllib.request import urlopen

from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
HOST = "127.0.0.1"
PORT = 8000
BASE_DIR = Path(__file__).resolve().parent

def fetch_weather(city: str) -> dict:
    if not API_KEY:
        raise RuntimeError("Missing OPENWEATHER_API_KEY in .env file.")

    encoded_city = quote(city)
    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={encoded_city}&appid={API_KEY}&units=metric"
    )

    try:
        with urlopen(url, timeout=10) as response:
            data = json.load(response)
    except HTTPError as err:
        try:
            payload = json.loads(err.read().decode("utf-8"))
            message = payload.get("message", str(err.reason))
        except Exception:
            message = str(err.reason)
        raise RuntimeError(f"API error: {message}") from err
    except URLError as err:
        raise RuntimeError(f"Network error: {err.reason}") from err

    if str(data.get("cod")) != "200":
        raise RuntimeError(data.get("message", "Unknown weather API error"))

    weather = data.get("weather", [{}])[0]
    main = data.get("main", {})
    wind = data.get("wind", {})
    sys = data.get("sys", {})

    return {
        "city": data.get("name", city.title()),
        "country": sys.get("country", ""),
        "description": str(weather.get("description", "N/A")).capitalize(),
        "temperature": main.get("temp", "N/A"),
        "feels_like": main.get("feels_like", "N/A"),
        "humidity": main.get("humidity", "N/A"),
        "wind_speed": wind.get("speed", "N/A"),
        "icon_code": weather.get("icon", ""),
    }

class WeatherHandler(BaseHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, filename: str, content_type: str) -> None:
        file_path = BASE_DIR / filename
        if not file_path.exists():
            self.send_error(404, "File not found")
            return

        body = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            self._send_file("index.html", "text/html; charset=utf-8")
            return

        if path == "/styles.css":
            self._send_file("styles.css", "text/css; charset=utf-8")
            return

        if path == "/app.js":
            self._send_file("app.js", "application/javascript; charset=utf-8")
            return

        if path == "/api/weather":
            query = parse_qs(parsed.query)
            city = query.get("city", [""])[0].strip()

            if not city:
                self._send_json(400, {"ok": False, "error": "Please enter a city name."})
                return

            try:
                weather = fetch_weather(city)
            except RuntimeError as err:
                self._send_json(502, {"ok": False, "error": str(err)})
                return

            self._send_json(200, {"ok": True, "data": weather})
            return

        self.send_error(404, "Not Found")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def log_message(self, format: str, *args) -> None:
        return

def main() -> None:
    server = HTTPServer((HOST, PORT), WeatherHandler)
    print(f"Weather app running at http://{HOST}:{PORT}")
    server.serve_forever()

if __name__ == "__main__":
    main()