/**
 * WeatherScope - Client Application
 * Communicates exclusively with the Python Flask backend (/api/weather).
 * Never exposes API keys or makes unproxied third-party requests.
 */

(() => {
  "use strict";

  /**
   * Determine Backend API Base URL
   * - Supports window.WEATHER_BACKEND_URL runtime override
   * - Supports optional production constant BACKEND_URL_OVERRIDE
   * - Automatically detects local dev servers (Live Server :5500, Vite :5173, etc.) or file://
   * - Uses relative path "" when served directly by the backend
   */
  const BACKEND_URL_OVERRIDE = "https://weather-app-backend-1h43.onrender.com"; // Set your production backend URL here if hosting frontend separately (e.g. "https://your-backend.onrender.com")

  function resolveApiBase() {
    if (typeof window.WEATHER_BACKEND_URL === "string" && window.WEATHER_BACKEND_URL.trim()) {
      return window.WEATHER_BACKEND_URL.trim().replace(/\/+$/, "");
    }
    if (BACKEND_URL_OVERRIDE.trim()) {
      return BACKEND_URL_OVERRIDE.trim().replace(/\/+$/, "");
    }
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "";

    if (isLocal) {
      const devPorts = ["5500", "3000", "5173", "8000", "8080"];
      if (devPorts.includes(window.location.port) || window.location.protocol === "file:") {
        return "http://127.0.0.1:5000";
      }
      return "";
    }
    return "";
  }

  const API_BASE = resolveApiBase();

  // DOM Element Selectors
  const form = document.querySelector("#weather-form");
  const cityInput = document.querySelector("#city-input");
  const clearInputBtn = document.querySelector("#clear-input-btn");
  const searchBtn = document.querySelector("#search-btn");
  const btnText = searchBtn.querySelector(".btn-text");
  const btnSpinner = searchBtn.querySelector(".btn-spinner");

  const statusText = document.querySelector("#status-text");
  const errorAlert = document.querySelector("#error-alert");
  const errorMessage = document.querySelector("#error-message");

  const weatherCard = document.querySelector("#weather-card");
  const cityNameEl = document.querySelector("#city-name");
  const countryBadgeEl = document.querySelector("#country-badge");
  const weatherDescEl = document.querySelector("#weather-description");
  const currentTempEl = document.querySelector("#current-temp");
  const weatherIconEl = document.querySelector("#weather-icon");

  const metricFeelsLike = document.querySelector("#metric-feels-like");
  const metricHumidity = document.querySelector("#metric-humidity");
  const metricWind = document.querySelector("#metric-wind");
  const metricPressure = document.querySelector("#metric-pressure");
  const metricVisibility = document.querySelector("#metric-visibility");
  const metricCondition = document.querySelector("#metric-condition");

  /**
   * Safe Number Formatter
   * @param {number|null|undefined} value
   * @param {number} decimals
   * @returns {string}
   */
  function formatNumber(value, decimals = 1) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "N/A";
    }
    return value.toFixed(decimals);
  }

  /**
   * Determine atmospheric theme key based on weather description/condition
   * @param {string} condition
   * @param {string} description
   * @returns {string} theme key
   */
  function determineTheme(condition = "", description = "") {
    const text = `${condition} ${description}`.toLowerCase();
    if (text.includes("thunder") || text.includes("storm")) return "storm";
    if (text.includes("rain") || text.includes("drizzle")) return "rain";
    if (text.includes("snow") || text.includes("sleet")) return "snow";
    if (text.includes("cloud")) return "clouds";
    if (
      text.includes("mist") ||
      text.includes("fog") ||
      text.includes("haze") ||
      text.includes("smoke") ||
      text.includes("dust")
    ) {
      return "mist";
    }
    if (text.includes("clear") || text.includes("sun")) return "clear";
    return "default";
  }

  /**
   * Update UI loading state
   * @param {boolean} isLoading
   * @param {string} [city=""]
   */
  function setLoadingState(isLoading, city = "") {
    searchBtn.disabled = isLoading;
    cityInput.disabled = isLoading;

    if (isLoading) {
      btnText.textContent = "Fetching...";
      btnSpinner.hidden = false;
      searchBtn.setAttribute("aria-busy", "true");
      clearError();
      statusText.textContent = `Gathering live atmospheric data for "${city}"...`;
    } else {
      btnText.textContent = "Check Weather";
      btnSpinner.hidden = true;
      searchBtn.removeAttribute("aria-busy");
    }
  }

  /**
   * Display accessible error banner
   * @param {string} message
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorAlert.hidden = false;
    statusText.textContent = "Search could not be completed.";
    weatherCard.hidden = true;
  }

  /**
   * Clear error state
   */
  function clearError() {
    errorAlert.hidden = true;
    errorMessage.textContent = "";
  }

  /**
   * Fetch weather data from the Flask API
   * @param {string} city
   * @returns {Promise<object>}
   */
  async function fetchWeather(city) {
    const targetUrl = `${API_BASE}/api/weather?city=${encodeURIComponent(city)}`;
    let response;

    try {
      response = await fetch(targetUrl, {
        headers: {
          Accept: "application/json",
        },
      });
    } catch (networkError) {
      const isRemoteStatic =
        !API_BASE &&
        !["localhost", "127.0.0.1", ""].includes(window.location.hostname);
      const hint = isRemoteStatic
        ? " Backend API URL is not configured. Please configure your backend service URL in js/script.js."
        : " Please verify the Flask server is running at http://127.0.0.1:5000.";
      throw new Error(`Unable to connect to the weather backend.${hint}`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch (parseError) {
      throw new Error("Received an unexpected response format from the server.");
    }

    if (!response.ok || !payload.ok) {
      const serverMsg = payload && payload.error ? payload.error : "Unable to retrieve weather data.";
      throw new Error(serverMsg);
    }

    return payload.data;
  }

  /**
   * Render retrieved weather information into DOM
   * @param {object} data
   */
  function renderWeather(data) {
    // Location & Description
    cityNameEl.textContent = data.city || "--";

    if (data.country) {
      countryBadgeEl.textContent = data.country;
      countryBadgeEl.hidden = false;
    } else {
      countryBadgeEl.hidden = true;
    }

    weatherDescEl.textContent = data.description || data.condition || "Clear";

    // Main Temperature
    currentTempEl.textContent =
      typeof data.temperature === "number" ? Math.round(data.temperature) : "--";

    // Weather Icon
    if (data.icon_code) {
      weatherIconEl.src = `https://openweathermap.org/img/wn/${encodeURIComponent(data.icon_code)}@2x.png`;
      weatherIconEl.alt = `${data.description || "Weather"} condition icon`;
      weatherIconEl.hidden = false;
    } else {
      weatherIconEl.hidden = true;
    }

    // 6-Metric Cards
    metricFeelsLike.textContent =
      typeof data.feels_like === "number" ? `${formatNumber(data.feels_like)} °C` : "N/A";

    metricHumidity.textContent =
      typeof data.humidity === "number" ? `${data.humidity}%` : "N/A";

    metricWind.textContent =
      typeof data.wind_speed === "number" ? `${formatNumber(data.wind_speed)} m/s` : "N/A";

    metricPressure.textContent =
      typeof data.pressure === "number" ? `${data.pressure} hPa` : "N/A";

    metricVisibility.textContent =
      typeof data.visibility_km === "number" ? `${formatNumber(data.visibility_km)} km` : "N/A";

    metricCondition.textContent = data.condition || "N/A";

    // Apply Atmospheric Dynamic Theme
    const theme = determineTheme(data.condition, data.description);
    document.body.dataset.theme = theme;

    // Show Card & Update Status
    weatherCard.hidden = false;
    statusText.textContent = `Displaying real-time weather conditions for ${data.city}.`;
  }

  /**
   * Handle Search Form Submission
   * @param {Event} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    const query = cityInput.value.trim();

    if (!query) {
      showError("Please enter a city name before searching.");
      cityInput.focus();
      return;
    }

    setLoadingState(true, query);

    try {
      const data = await fetchWeather(query);
      renderWeather(data);
      clearError();
    } catch (err) {
      showError(err.message || "An unexpected error occurred while fetching weather.");
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Handle dynamic clear button visibility
   */
  function handleInput() {
    clearInputBtn.hidden = cityInput.value.length === 0;
  }

  /**
   * Handle input clear button click
   */
  function handleClear() {
    cityInput.value = "";
    clearInputBtn.hidden = true;
    cityInput.focus();
  }

  // Event Listeners
  form.addEventListener("submit", handleSubmit);
  cityInput.addEventListener("input", handleInput);
  clearInputBtn.addEventListener("click", handleClear);

  window.addEventListener("DOMContentLoaded", () => {
    cityInput.focus();
  });
})();
