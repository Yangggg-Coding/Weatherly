# Weatherly

A local forecast weather app. Search any city, see current conditions, and check a 5-day forecast.

## Features

- Search a city and get live weather
- Autocomplete with keyboard navigation (arrow keys, enter, escape)
- Toggle between Celsius and Fahrenheit
- 5-day forecast with weather icons
- Works on mobile and desktop

## Tech used

- HTML, CSS, JavaScript. No frameworks.
- [Open-Meteo](https://open-meteo.com/) for geocoding and weather data
- Google Fonts (DM Sans, Space Grotesk)

## Run it

Open `index.html` in a browser. No build step, no install.

## AI assistance disclosure

I used Claude (Anthropic's AI assistant) while building this project. Specifically:

- Debugging the search autocomplete UI, which had a rendering bug (the location icon and place names weren't showing correctly)
- Improving the search UX: a working clear button, loading states, and keyboard accessibility
- Drafting this README

The core app logic, structure, and design direction are mine. I reviewed and understood every change before including it.

## Credits

- Weather and location data from [Open-Meteo](https://open-meteo.com/)
