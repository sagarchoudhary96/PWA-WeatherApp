(function () {
  "use strict";

  var weatherAPIUrlBase = "https://publicdata-weather.firebaseio.com/";

  Lockr.prefix = "lockr_weather_";
  const CITY_PREF_KEY = "city_preferences";

  var injectedForecast = {
    key: "newyork",
    label: "New York, NY",
    currently: {
      time: 1453489481,
      summary: "Clear",
      icon: "partly-cloudy-day",
      temperature: 52.74,
      apparentTemperature: 74.34,
      precipProbability: 0.2,
      humidity: 0.77,
      windBearing: 125,
      windSpeed: 1.52,
    },
    daily: {
      data: [
        { icon: "clear-day", temperatureMax: 55, temperatureMin: 34 },
        { icon: "rain", temperatureMax: 55, temperatureMin: 34 },
        { icon: "snow", temperatureMax: 55, temperatureMin: 34 },
        { icon: "sleet", temperatureMax: 55, temperatureMin: 34 },
        { icon: "fog", temperatureMax: 55, temperatureMin: 34 },
        { icon: "wind", temperatureMax: 55, temperatureMin: 34 },
        { icon: "partly-cloudy-day", temperatureMax: 55, temperatureMin: 34 },
      ],
    },
  };

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector(".loader"),
    cardTemplate: document.querySelector(".cardTemplate"),
    container: document.querySelector(".main"),
    addDialog: document.querySelector(".dialog-container"),
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  };

  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  /* Event listener for refresh button */
  document.getElementById("butRefresh").addEventListener("click", function () {
    app.updateForecasts();
  });

  /* Event listener for add new city button */
  document.getElementById("butAdd").addEventListener("click", function () {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  /* Event listener for add city button in add city dialog */
  document.getElementById("butAddCity").addEventListener("click", function () {
    var select = document.getElementById("selectCityToAdd");
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    Lockr.sadd(CITY_PREF_KEY, { key, label });
    app.getForecast(key, label);
    app.selectedCities.push({ key: key, label: label });
    app.toggleAddDialog(false);
  });

  /* Event listener for cancel button in add city dialog */
  document
    .getElementById("butAddCancel")
    .addEventListener("click", function () {
      app.toggleAddDialog(false);
    });

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function (visible) {
    if (visible) {
      app.addDialog.classList.add("dialog-container--visible");
    } else {
      app.addDialog.classList.remove("dialog-container--visible");
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateForecastCard = function (data) {
    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove("cardTemplate");
      card.querySelector(".location").textContent = data.label;
      card.removeAttribute("hidden");
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }

    var dateElem = card.querySelector(".date");
    if (dateElem.getAttribute("data-dt") >= data.currently.time) {
      return;
    }
    dateElem.setAttribute("data-dt", data.currently.time);
    card.querySelector(".description").textContent = data.currently.summary;
    card.querySelector(".date").textContent = new Date(
      data.currently.time * 1000
    );
    card.querySelector(".current .icon").classList.add(data.currently.icon);
    card.querySelector(".current .temperature .value").textContent = Math.round(
      data.currently.temperature
    );
    card.querySelector(".current .feels-like .value").textContent = Math.round(
      data.currently.apparentTemperature
    );
    card.querySelector(".current .precip").textContent =
      Math.round(data.currently.precipProbability * 100) + "%";
    card.querySelector(".current .humidity").textContent =
      Math.round(data.currently.humidity * 100) + "%";
    card.querySelector(".current .wind .value").textContent = Math.round(
      data.currently.windSpeed
    );
    card.querySelector(".current .wind .direction").textContent =
      data.currently.windBearing;
    var nextDays = card.querySelectorAll(".future .oneday");
    var today = new Date();
    today = today.getDay();
    for (var i = 0; i < 7; i++) {
      var nextDay = nextDays[i];
      var daily = data.daily.data[i];
      if (daily && nextDay) {
        nextDay.querySelector(".date").textContent =
          app.daysOfWeek[(i + today) % 7];
        nextDay.querySelector(".icon").classList.add(daily.icon);
        nextDay.querySelector(".temp-high .value").textContent = Math.round(
          daily.temperatureMax
        );
        nextDay.querySelector(".temp-low .value").textContent = Math.round(
          daily.temperatureMin
        );
      }
    }
    if (app.isLoading) {
      app.spinner.setAttribute("hidden", true);
      app.container.removeAttribute("hidden");
      app.isLoading = false;
    }
  };

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Gets a forecast for a specific city and update the card with the data
  app.getForecast = function (key, label) {
    var url = weatherAPIUrlBase + key + ".json";
    // Make the XHR to get the data, then update the card
    let fetchedFromNetwork = false;
    if ("caches" in window) {
      caches.match(url).then((response) => {
        if (response) {
          // if appFetchingFromNetwork
          if (fetchedFromNetwork) return;

          response.json().then((data) => {
            data.key = key;
            data.label = label;
            app.updateForecastCard(data);
          });
        }
      });
    }

    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          fetchedFromNetwork = true;
          var response = JSON.parse(request.response);
          response.key = key;
          response.label = label;
          app.updateForecastCard(response);
        }
      }
    };
    request.open("GET", url);
    request.send();
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function () {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function (key) {
      app.getForecast(key);
    });
  };
  // initialize app on load
  app.initializeApp = function () {
    const cityPreferences = Lockr.smembers(CITY_PREF_KEY);
    if (!cityPreferences || cityPreferences.length === 0) {
      app.updateForecastCard(injectedForecast);
      return;
    }
    app.selectedCities = [...cityPreferences];
    cityPreferences.forEach(({ key, label }) => app.getForecast(key, label));
  };

  //register service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        console.log("Successfully Registered Service worker");
      })
      .catch((err) => {
        console.log("Error Registering Service Worker", err);
      });
  }
  app.initializeApp();
})();
