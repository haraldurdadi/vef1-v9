import { el, empty } from "./lib/elements.js";
import { weatherSearch } from "./lib/weather.js";

/**
 * @typedef {Object} SearchLocation
 * @property {string} title
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
const locations = [
  {
    title: "Mín staðsetning (þarf leyfi)",
  },
  {
    title: "Reykjavík",
    lat: 64.1355,
    lng: -21.8954,
  },
  {
    title: "Akureyri",
    lat: 65.6835,
    lng: -18.0878,
  },
  {
    title: "New York",
    lat: 40.7128,
    lng: -74.006,
  },
  {
    title: "Tokyo",
    lat: 35.6764,
    lng: 139.65,
  },
  {
    title: "Sydney",
    lat: 33.8688,
    lng: 151.2093,
  },
];

/**
 * Hreinsar fyrri niðurstöður, passar að niðurstöður séu birtar og birtir element.
 * @param {Element} element
 */
function renderIntoResultsContent(element) {
  const outputElement = document.querySelector(".output");

  if (!outputElement) {
    console.warn("fann ekki .output");
    return;
  }

  empty(outputElement);

  outputElement.appendChild(element);
}

/**
 * Birtir niðurstöður í viðmóti.
 * @param {SearchLocation} location
 * @param {Array<import('./lib/weather.js').Forecast>} results
 */

function renderResults(location, results) {
  // Búa til hausinn fyrir töfluna með einingum í fyrstu röð
  const header = el(
    "tr",
    {},
    el("th", {}, "Klukkutími"),
    el("th", {}, "Hiti (°C)"),
    el("th", {}, "Úrkoma (mm)")
  );

  // Búa til <tbody> fyrir gögnin
  const tbody = el("tbody");

  // Fara yfir hvert stak í results og bæta við röð í töfluna
  for (const result of results) {
    // Sækja aðeins tímann (klukkutímann) úr dagsetningunni
    const time = result.time.split("T")[1]; // fær 'HH:MM'

    // Búa til röð með gögnum
    const row = el(
      "tr",
      {},
      el("td", {}, time),
      el("td", {}, result.temperature),
      el("td", {}, result.precipitation)
    );

    // Bæta röðinni við tbody
    tbody.appendChild(row);
  }

  // Búa til töfluna með thead og tbody
  const resultsTable = el(
    "table",
    { class: "forecast" },
    el("thead", {}, header),
    tbody
  );

  // Birta niðurstöður með staðsetningu og töflu
  renderIntoResultsContent(
    el(
      "section",
      {},
      el("h2", {}, `Niðurstöður`),
      el("h3", {}, `${location.title}`),
      el(
        "p",
        {},
        `Spá fyrir daginn á breiddargráðu: ${location.lat} og lengdargráðu: ${location.lng}.`
      ),
      resultsTable
    )
  );
}

/**
 * Birta villu í viðmóti.
 * @param {Error} error
 */
function renderError(error) {
  console.log(error);
  const message = error.message;
  renderIntoResultsContent(el("p", {}, `Villa: ${message}`));
}

/**
 * Birta biðstöðu í viðmóti.
 */
function renderLoading() {
  renderIntoResultsContent(el("p", {}, "Leita..."));
}

/**
 * Framkvæmir leit að veðri fyrir gefna staðsetningu.
 * Birtir biðstöðu, villu eða niðurstöður í viðmóti.
 * @param {SearchLocation} location Staðsetning sem á að leita eftir.
 */
async function onSearch(location) {
  renderLoading();

  let results;
  try {
    results = await weatherSearch(location.lat, location.lng);
  } catch (error) {
    renderError(error);
    return;
  }

  renderResults(location, results ?? []);

  // TODO útfæra
  // Hér ætti að birta og taka tillit til mismunandi staða meðan leitað er.
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
  if (navigator.geolocation) {
    renderLoading();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const location = {
          title: "Mín Staðsetning",
          lat: lat,
          lng: lng,
        };

        onSearch(location);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          renderError(
            new Error("Þú hafnaðir beiðninni um að deila staðsetningu.")
          );
        } else {
          renderError(
            new Error("Gat ekki fengið aðgang að staðsetningu þinni.")
          );
        }
      }
    );
  } else {
    renderError(new Error("Vafrinn þinn styður ekki staðsetningu."));
  }
}

/**
 * Býr til takka fyrir staðsetningu.
 * @param {string} locationTitle
 * @param {() => void} onSearch
 * @returns {HTMLElement}
 */
function renderLocationButton(locationTitle, onSearch) {
  // Notum `el` fallið til að búa til element og spara okkur nokkur skref.
  const locationElement = el(
    "li",
    { class: "locations__location" },
    el("button", { class: "locations__button", click: onSearch }, locationTitle)
  );

  return locationElement;
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  // Búum til <main> og setjum `weather` class
  const parentElement = document.createElement("main");
  parentElement.classList.add("weather");

  // Búum til <header> með beinum DOM aðgerðum
  const headerElement = document.createElement("header");
  const heading = document.createElement("h1");
  heading.appendChild(document.createTextNode("Virðulegi veður vafrinn"));
  headerElement.appendChild(heading);
  parentElement.appendChild(headerElement);

  const introElement = document.createElement("body");
  const intro = document.createElement("p");
  intro.appendChild(
    document.createTextNode("Veldu stað til að sjá hita- og úrkomuspá.")
  );
  const info = document.createElement("h2");
  info.appendChild(document.createTextNode("Staðsetningar"));

  introElement.appendChild(intro);
  introElement.appendChild(info);
  parentElement.appendChild(introElement);

  // Búa til <div class="loctions">
  const locationsElement = document.createElement("div");
  locationsElement.classList.add("locations");

  // Búa til <ul class="locations__list">
  const locationsListElement = document.createElement("ul");
  locationsListElement.classList.add("locations__list");

  // <div class="loctions"><ul class="locations__list"></ul></div>
  locationsElement.appendChild(locationsListElement);

  // <div class="loctions"><ul class="locations__list"><li><li><li></ul></div>
  for (const location of locations) {
    const liButtonElement = renderLocationButton(location.title, () => {
      if (location.title === "Mín staðsetning (þarf leyfi)") {
        onSearchMyLocation();
      } else {
        console.log("Halló!!", location);
        onSearch(location);
      }
    });
    locationsListElement.appendChild(liButtonElement);
  }

  parentElement.appendChild(locationsElement);

  const outputElement = document.createElement("div");
  outputElement.classList.add("output");
  parentElement.appendChild(outputElement);

  container.appendChild(parentElement);
}

// Þetta fall býr til grunnviðmót og setur það í `document.body`
render(document.body, locations, onSearch, onSearchMyLocation);
