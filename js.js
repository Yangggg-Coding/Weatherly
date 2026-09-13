const searchForm = document.querySelector(".search");
const searchInput = document.querySelector("#city-search");
const clearButton = document.querySelector("#search-clear");
const suggestions = document.querySelector("#suggestions");
const searchButton = searchForm.querySelector("button[type='submit']");
const statusLabel = document.querySelector("#status-label");
const locationHeading = document.querySelector("#location-heading span");
const dateLabel = document.querySelector("#date-label");
const weatherSummary = document.querySelector("#weather-summary");
const weatherApp = document.querySelector(".weather-app");
const temperature = document.querySelector("#temperature");
const condition = document.querySelector("#condition");
const weatherSymbol = document.querySelector("#weather-symbol");
const feelsLike = document.querySelector("#feels-like");
const high = document.querySelector("#high");
const low = document.querySelector("#low");
const wind = document.querySelector("#wind");
const humidity = document.querySelector("#humidity");
const forecastList = document.querySelector("#forecast-list");
const updatedLabel = document.querySelector("#updated-label");
const locationMeta = document.querySelector("#location-meta");

let useCelsius = true;
let latestWeather = null;
let suggestionTimer;
let selectedPlace = null;
let suggestionPlaces = [];
let activeSuggestion = -1;
let searchRequestId = 0;

const PIN_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>';

const weatherTypes = {
  0: ["Clear sky", "☼", "sunny"],
  1: ["Mainly clear", "☼", "sunny"],
  2: ["Partly cloudy", "◐", "cloud"],
  3: ["Overcast", "☁", "cloud"],
  45: ["Foggy", "〰", "cloud"],
  48: ["Rime fog", "〰", "cloud"],
  51: ["Light drizzle", "☂", "rain"],
  53: ["Drizzle", "☂", "rain"],
  55: ["Heavy drizzle", "☂", "rain"],
  61: ["Light rain", "☂", "rain"],
  63: ["Rain", "☂", "rain"],
  65: ["Heavy rain", "☂", "rain"],
  71: ["Light snow", "❄", "snow"],
  73: ["Snow", "❄", "snow"],
  75: ["Heavy snow", "❄", "snow"],
  80: ["Rain showers", "☂", "rain"],
  81: ["Rain showers", "☂", "rain"],
  82: ["Heavy showers", "☂", "rain"],
  95: ["Thunderstorm", "ϟ", "rain"],
  96: ["Storm with hail", "ϟ", "rain"],
  99: ["Storm with hail", "ϟ", "rain"],
};

function getWeatherType(code) {
  return weatherTypes[code] || ["Unknown conditions", "☼", "sunny"];
}

function formatTemperature(value) {
  if (!useCelsius) {
    value = (value * 9) / 5 + 32;
  }

  return `${Math.round(value)}°`;
}

function formatDay(dateString, index) {
  if (index === 0) return "Today";

  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function renderForecast(weather) {
  forecastList.innerHTML = "";

  weather.daily.time.slice(0, 5).forEach((date, index) => {
    const [label, icon, iconClass] = getWeatherType(
      weather.daily.weather_code[index],
    );
    const day = document.createElement("article");
    day.className = `forecast-day${index === 0 ? " active" : ""}`;
    day.innerHTML = `
			<span>${formatDay(date, index)}</span>
			<span class="mini-icon ${iconClass}">${icon}</span>
			<strong>${formatTemperature(weather.daily.temperature_2m_max[index])}</strong>
			<small>${formatTemperature(weather.daily.temperature_2m_min[index])}</small>
		`;
    day.title = label;
    forecastList.appendChild(day);
  });
}

function renderWeather(weather, place) {
  latestWeather = { weather, place };
  const currentType = getWeatherType(weather.current.weather_code);

  weatherApp.classList.remove("result-updated");
  requestAnimationFrame(() => weatherApp.classList.add("result-updated"));
  searchInput.value = place.name;
  updateClearVisibility();
  locationHeading.textContent = `${place.name}.`;
  dateLabel.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  weatherSummary.textContent = `${currentType[0]} conditions in ${place.name}, with a high of ${formatTemperature(weather.daily.temperature_2m_max[0])} today.`;
  temperature.innerHTML = `${Math.round(useCelsius ? weather.current.temperature_2m : (weather.current.temperature_2m * 9) / 5 + 32)}<span>°</span>`;
  condition.textContent = currentType[0];
  weatherSymbol.textContent = currentType[1];
  feelsLike.textContent = formatTemperature(
    weather.current.apparent_temperature,
  );
  high.textContent = formatTemperature(weather.daily.temperature_2m_max[0]);
  low.textContent = formatTemperature(weather.daily.temperature_2m_min[0]);
  wind.textContent = `${Math.round(weather.current.wind_speed_10m)} km/h`;
  humidity.textContent = `${Math.round(weather.current.relative_humidity_2m)}%`;
  updatedLabel.textContent = "Updated just now";
  locationMeta.innerHTML = `${place.name}, ${place.country} <b>·</b> ${place.latitude.toFixed(2)}° N, ${Math.abs(place.longitude).toFixed(2)}° W`;
  renderForecast(weather);
}

async function findPlaces(city) {
  const locationResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`,
  );
  const locationData = await locationResponse.json();
  return locationData.results || [];
}

async function loadWeather(placeOrCity) {
  const place =
    typeof placeOrCity === "string"
      ? (await findPlaces(placeOrCity))[0]
      : placeOrCity;

  if (!place) {
    throw new Error("City not found");
  }

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
  );
  const weather = await weatherResponse.json();
  renderWeather(weather, place);
}

function hideSuggestions() {
  suggestions.innerHTML = "";
  suggestions.classList.remove("visible");
  suggestions.setAttribute("aria-expanded", "false");
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  suggestionPlaces = [];
  activeSuggestion = -1;
}

function showSuggestionMessage(message, isError = false, isLoading = false) {
  suggestions.innerHTML = "";
  const row = document.createElement("div");
  row.className = `suggestion-message${isError ? " error" : ""}`;
  if (isLoading) {
    const spinner = document.createElement("span");
    spinner.className = "suggestion-spinner";
    spinner.setAttribute("aria-hidden", "true");
    row.appendChild(spinner);
  }
  row.appendChild(document.createTextNode(message));
  suggestions.appendChild(row);
  suggestions.classList.add("visible");
  suggestions.setAttribute("aria-expanded", "true");
  searchInput.setAttribute("aria-expanded", "true");
}

function addHighlightedText(element, text, query) {
  const start = text.toLowerCase().indexOf(query.toLowerCase());
  if (start < 0) {
    element.textContent = text;
    return;
  }

  element.append(document.createTextNode(text.slice(0, start)));
  const match = document.createElement("mark");
  match.textContent = text.slice(start, start + query.length);
  element.append(
    match,
    document.createTextNode(text.slice(start + query.length)),
  );
}

function setSearchLoading(isLoading, label = "Live forecast") {
  searchForm.classList.toggle("is-loading", isLoading);
  searchButton.disabled = isLoading;
  statusLabel.lastChild.textContent = label;
}

function updateClearVisibility() {
  searchForm.classList.toggle("has-value", searchInput.value.length > 0);
}

function setActiveSuggestion(index) {
  const options = suggestions.querySelectorAll(".suggestion");
  activeSuggestion = index;

  options.forEach((item, itemIndex) => {
    const isActive = itemIndex === activeSuggestion;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });

  if (activeSuggestion >= 0 && options[activeSuggestion]) {
    searchInput.setAttribute(
      "aria-activedescendant",
      options[activeSuggestion].id,
    );
    options[activeSuggestion].scrollIntoView({ block: "nearest" });
  } else {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

function showSuggestions(places, query) {
  suggestions.innerHTML = "";
  suggestionPlaces = places;
  activeSuggestion = -1;
  searchInput.removeAttribute("aria-activedescendant");

  places.forEach((place, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.id = `place-option-${index}`;
    option.className = "suggestion";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    const icon = document.createElement("span");
    icon.className = "place-icon";
    icon.innerHTML = PIN_ICON;
    const copy = document.createElement("span");
    copy.className = "place-copy";
    const name = document.createElement("strong");
    addHighlightedText(name, place.name, query);
    const details = document.createElement("small");
    details.textContent = `${place.admin1 || ""}${place.country ? `, ${place.country}` : ""}`;
    copy.append(name, details);
    option.append(icon, copy);
    option.addEventListener("mouseenter", () => setActiveSuggestion(index));
    option.addEventListener("click", async () => {
      selectedPlace = place;
      searchInput.value = place.name;
      updateClearVisibility();
      setSearchLoading(true, "Loading weather...");
      searchInput.disabled = true;
      hideSuggestions();
      try {
        await loadWeather(place);
      } catch (error) {
        condition.textContent = error.message;
        showSuggestionMessage(error.message, true);
      } finally {
        setSearchLoading(false);
        searchInput.disabled = false;
      }
    });
    suggestions.appendChild(option);
  });

  suggestions.classList.toggle("visible", places.length > 0);
  suggestions.setAttribute("aria-expanded", String(places.length > 0));
  searchInput.setAttribute("aria-expanded", String(places.length > 0));
}

searchInput.addEventListener("input", () => {
  clearTimeout(suggestionTimer);
  selectedPlace = null;
  updateClearVisibility();
  const query = searchInput.value.trim();

  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  suggestionTimer = setTimeout(async () => {
    const requestId = ++searchRequestId;
    showSuggestionMessage("Searching places...", false, true);
    try {
      const places = await findPlaces(query);
      if (requestId !== searchRequestId || searchInput.value.trim() !== query)
        return;
      if (places.length) {
        showSuggestions(places, query);
      } else {
        showSuggestionMessage("No places found", true);
      }
    } catch {
      showSuggestionMessage("Could not search places", true);
    }
  }, 300);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideSuggestions();
    return;
  }

  if (!suggestionPlaces.length) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const next =
      event.key === "ArrowDown"
        ? (activeSuggestion + 1) % suggestionPlaces.length
        : (activeSuggestion - 1 + suggestionPlaces.length) %
          suggestionPlaces.length;
    setActiveSuggestion(next);
  }

  if (event.key === "Enter" && activeSuggestion >= 0) {
    event.preventDefault();
    suggestions.querySelectorAll(".suggestion")[activeSuggestion].click();
  }
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  selectedPlace = null;
  updateClearVisibility();
  hideSuggestions();
  searchInput.focus();
});

document.addEventListener("click", (event) => {
  if (!searchForm.contains(event.target)) hideSuggestions();
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = searchInput.value.trim();
  if (!city) return;

  setSearchLoading(true, "Loading weather...");
  searchInput.disabled = true;
  searchInput.placeholder = "Loading...";
  showSuggestionMessage("Loading weather...", false, true);

  try {
    await loadWeather(selectedPlace || city);
    hideSuggestions();
  } catch (error) {
    condition.textContent = error.message;
    showSuggestionMessage(error.message, true);
  } finally {
    setSearchLoading(false);
    searchInput.disabled = false;
    searchInput.placeholder = "Search city";
  }
});

document.querySelector(".unit-toggle").addEventListener("click", (event) => {
  useCelsius = !useCelsius;
  event.currentTarget.innerHTML = useCelsius
    ? "°C <span>/ °F</span>"
    : "°F <span>/ °C</span>";
  if (latestWeather) renderWeather(latestWeather.weather, latestWeather.place);
});

loadWeather("Phnom Penh").catch(() => {
  condition.textContent = "Weather unavailable";
});