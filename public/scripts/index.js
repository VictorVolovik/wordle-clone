const API_URL = "https://words.dev-apis.com";

let wordOfTheDay = "";
let currentMode = "daily"; // daily | random
let isLoading = true;

const modeSelectorFormEl = document.querySelector(".mode-selector-form");
const currentWordEl = document.querySelector(".current-word");

function render() {
  isLoading
    ? (currentWordEl.textContent = "Loading...")
    : (currentWordEl.textContent = wordOfTheDay);
}

async function getWordOfTheDay(mode) {
  const isRandom = mode === "random";
  const url = `${API_URL}/word-of-the-day?random=${isRandom}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    wordOfTheDay = data.word;
    isLoading = false;
  } catch (e) {
    console.error(e);
  }

  render();
}

async function validateWord(word) {
  const url = `${API_URL}/validate-word`;

  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ word }),
    });
    const data = await res.json();
    return data.validWord;
  } catch (e) {
    console.error(e);
  }

  render();
}

function init(mode) {
  isLoading = true;
  render();
  getWordOfTheDay(mode);
}

document.body.classList.remove;

modeSelectorFormEl.mode.forEach((radio) =>
  radio.addEventListener("change", function (e) {
    const newMode = e.target.value;
    if (newMode !== currentMode) {
      modeSelectorFormEl.mode.forEach((r) => {
        r.parentNode.classList.remove("selected");
      });
      e.target.parentNode.classList.add("selected");
      currentMode = e.target.value;
      init(newMode);
    }
  }),
);

modeSelectorFormEl.mode.forEach((radio) =>
  radio.addEventListener("focus", function (e) {
    modeSelectorFormEl.mode.forEach((r) => {
      r.parentNode.classList.remove("focused");
    });
    e.target.parentNode.classList.add("focused");
  }),
);

init(currentMode);

// check word validation
validateWord("crane").then((result) => console.log(result)); // true
validateWord("abcde").then((result) => console.log(result)); // false
