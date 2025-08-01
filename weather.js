const form = document.querySelector(".top-banner form");
const input = form.querySelector("input");
const msg = document.querySelector(".top-banner .msg");
const list = document.querySelector(".ajax-section .cities");
const suggestions = form.querySelector(".suggestions");
const clearBtn = document.getElementById("clear-btn");

const apiKey = "";  // Replace with your OpenWeatherMap API key


// Clear suggestions list
function clearSuggestions() {
  suggestions.innerHTML = "";
}

// Fetch city suggestions from OpenWeatherMap Geocoding API
async function fetchCitySuggestions(query) {
  if (query.length < 3) {
    clearSuggestions();
    return;
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error fetching city suggestions");
    const data = await res.json();

    clearSuggestions();

    if (data.length === 0) return;

    data.forEach(city => {
      const li = document.createElement("li");
      li.textContent = `${city.name}, ${city.state ? city.state + ", " : ""}${city.country}`;
      li.dataset.name = city.name;
      li.dataset.lat = city.lat;
      li.dataset.lon = city.lon;
      li.dataset.fullName = li.textContent;
      suggestions.appendChild(li);
    });
  } catch (error) {
    clearSuggestions();
    console.error(error);
  }
}

// When user clicks a suggestion
suggestions.addEventListener("click", e => {
  if (e.target.tagName === "LI") {
    input.value = e.target.dataset.fullName;
    clearSuggestions();
    input.focus();
  }
});

// Debounce helper
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Listen to input changes
input.addEventListener("input", debounce(e => {
  fetchCitySuggestions(e.target.value);
}, 300));

// Fetch weather on form submit
form.addEventListener("submit", async e => {
  e.preventDefault();
  clearSuggestions();

  const inputVal = input.value.trim();
  if (!inputVal) {
    msg.textContent = "Please enter a city name";
    return;
  }

  const unit = document.querySelector('input[name="units"]:checked').value;
  const cityName = inputVal.split(",")[0];
  msg.textContent = "Loading...";

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=${unit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();

    const { main, name, sys, weather } = data;
    const cityId = `${name},${sys.country}`.toLowerCase().trim();

    // Prevent duplicate
    if ([...list.children].some(li => li.dataset.name.toLowerCase().trim() === cityId)) {
      msg.textContent = `You already know the weather for ${name}, ${sys.country} 😉`;
      form.reset();
      input.focus();
      return;
    }

    const icon = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    const li = document.createElement("li");
    li.classList.add("city");
    li.dataset.name = `${name},${sys.country}`;
    li.innerHTML = `
      <h2 class="city-name">
        <span>${name}</span>
        <sup>${sys.country}</sup>
      </h2>
      <div class="city-temp">${Math.round(main.temp)}<sup>${unit === "metric" ? "°C" : "°F"}</sup></div>
      <figure>
        <img class="city-icon" src="${icon}" alt="${weather[0].main}">
        <figcaption>${weather[0].description}</figcaption>
      </figure>
    `;
    list.appendChild(li);
    msg.textContent = "";
  } catch (error) {
    msg.textContent = error.message;
  } finally {
    form.reset();
    input.focus();
  }
});

// Clear all cities
clearBtn.addEventListener("click", () => {
  list.innerHTML = "";
  msg.textContent = "All cities cleared.";
});
