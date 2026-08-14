const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city-input");
const statusEl = document.querySelector("#status");
const cardEl = document.querySelector("#weather-card");

const locationEl = document.querySelector("#location");
const descriptionEl = document.querySelector("#description");
const temperatureEl = document.querySelector("#temperature");
const feelsLikeEl = document.querySelector("#feels-like");
const humidityEl = document.querySelector("#humidity");
const windEl = document.querySelector("#wind");
const iconEl = document.querySelector("#icon");
const API_BASE = window.location.port === "8000" ? "" : "http://127.0.0.1:8000";

// Safely load the key from config.js (if it exists)
const apiKey = typeof DIRECT_API_KEY !== "undefined" ? DIRECT_API_KEY : "";

function toNumberOrNull(value) {
  return typeof value === "number" ? value : null;
}

function formatNumber(value, digits = 1) {
  const num = toNumberOrNull(value);
  if (num === null) {
    return "N/A";
  }
  return num.toFixed(digits);
}

function detectTheme(description) {
  const text = String(description || "").toLowerCase();
  if (text.includes("thunder")) return "storm";
  if (text.includes("rain") || text.includes("drizzle")) return "rain";
  if (text.includes("snow")) return "snow";
  if (text.includes("cloud")) return "clouds";
  if (
    text.includes("mist") ||
    text.includes("haze") ||
    text.includes("fog") ||
    text.includes("smoke")
  ) {
    return "mist";
  }
  return "clear";
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b42121" : "";
}

async function parseJsonResponse(response, invalidMessage) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(invalidMessage);
  }

  return response.json();
}

async function loadFromBackend(city) {
  let response;

  try {
    response = await fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}`);
  } catch (error) {
    throw new Error("backend_unreachable");
  }

  const payload = await parseJsonResponse(
    response,
    "Weather API returned invalid response. Open app at http://127.0.0.1:8000"
  );

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Unable to fetch weather right now.");
  }

  return payload.data;
}

async function loadDirect(city) {
  if (!apiKey) {
      throw new Error("API key missing. Run Python backend or check config.js.");
  }

  const directUrl =
    "https://api.openweathermap.org/data/2.5/weather" +
    `?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  let response;
  try {
    response = await fetch(directUrl);
  } catch (error) {
    throw new Error("Unable to reach weather service.");
  }

  const payload = await parseJsonResponse(
    response,
    "Weather service returned an invalid response."
  );

  if (!response.ok || String(payload.cod) !== "200") {
    throw new Error(payload.message || "Unable to fetch weather right now.");
  }

  const weather = payload.weather?.[0] || {};
  const main = payload.main || {};
  const wind = payload.wind || {};
  const sys = payload.sys || {};

  return {
    city: payload.name || city,
    country: sys.country || "",
    description: String(weather.description || "N/A").replace(
      /^./,
      (match) => match.toUpperCase()
    ),
    temperature: main.temp,
    feels_like: main.feels_like,
    humidity: main.humidity,
    wind_speed: wind.speed,
    icon_code: weather.icon || "",
  };
}

async function loadWeather(city) {
  setStatus("Fetching weather...");

  try {
    const data = await loadFromBackend(city);
    return { data, source: "backend" };
  } catch (backendError) {
    try {
      const data = await loadDirect(city);
      return { data, source: "direct" };
    } catch (directError) {
      if (String(backendError.message) === "backend_unreachable") {
        throw new Error(
          "Cannot reach weather backend. Run: python Weather.py or use http://127.0.0.1:8000"
        );
      }
      throw directError;
    }
  }
}

function renderWeather(data) {
  const country = data.country ? `, ${data.country}` : "";
  locationEl.textContent = `${data.city}${country}`;
  descriptionEl.textContent = data.description || "N/A";
  temperatureEl.textContent = formatNumber(data.temperature);
  feelsLikeEl.textContent = `${formatNumber(data.feels_like)} \u00B0C`;
  humidityEl.textContent =
    typeof data.humidity === "number" ? `${data.humidity}%` : "N/A";
  windEl.textContent =
    typeof data.wind_speed === "number"
      ? `${data.wind_speed.toFixed(1)} m/s`
      : "N/A";

  if (data.icon_code) {
    iconEl.src = `https://openweathermap.org/img/wn/${data.icon_code}@2x.png`;
    iconEl.alt = `${data.description || "Weather"} icon`;
    iconEl.hidden = false;
  } else {
    iconEl.hidden = true;
  }

  document.body.dataset.theme = detectTheme(data.description);
  cardEl.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Please enter a city name.", true);
    return;
  }

  try {
    const { data, source } = await loadWeather(city);
    renderWeather(data);
    if (source === "backend") {
      setStatus(`Updated weather for ${data.city}.`);
    } else {
      setStatus(`Updated weather for ${data.city} (direct mode).`);
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  cityInput.focus();
});