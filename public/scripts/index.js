const API_URL = "https://words.dev-apis.com";

let wordOfTheDay = "";
let currentMode = "daily"; // daily | random
let isLoading = true;

const modeSelectorFormEl = document.querySelector(".mode-selector-form");
const wordGuessFormEl = document.querySelector(".word-guess-form");
const wordInputEls = wordGuessFormEl.querySelectorAll(".word-guess-input");
const currentWordEl = document.querySelector(".loading-word");

function renderLoading() {
  wordOfTheDay && console.log(`wordOfTheDay:`, wordOfTheDay);

  isLoading
    ? (currentWordEl.textContent = "Loading...")
    : (currentWordEl.textContent = " ");
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

  renderLoading();
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

  renderLoading();
}

function init(mode) {
  isLoading = true;
  renderLoading();
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
  })
);

modeSelectorFormEl.mode.forEach((radio) =>
  radio.addEventListener("focus", function (e) {
    modeSelectorFormEl.mode.forEach((r) => {
      r.parentNode.classList.remove("focused");
    });
    e.target.parentNode.classList.add("focused");
  })
);

init(currentMode);

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

async function handleWordSubmit(value, index) {
  const result = await validateWord(value);

  if (result === true) {
    wordInputEls[index].setAttribute("disabled", "");

    if (index < 5) {
      wordInputEls[index + 1].removeAttribute("disabled");
    }
  } else {
    alert("Not a known word");
  }
}

wordInputEls.forEach((input, index) =>
  input.addEventListener("keydown", function (e) {
    const value = e.target.value;

    if (value.length === 5 && e.key === "Enter") {
      handleWordSubmit(value, index);
    }

    if (e.key !== "Backspace" && !isLetter(e.key)) {
      e.preventDefault();
    }
  })
);

wordInputEls.forEach((input, index) =>
  input.addEventListener("keyup", function (e) {
    if (e.key === "Backspace") {
      e.preventDefault();
    }

    const value = e.target.value;
    const chars = document.querySelector(`.word-${index + 1}-label`);

    chars.querySelectorAll(".word-display-character").forEach((char, index) => {
      if (value[index]) {
        char.textContent = value[index];
      } else {
        char.textContent = " ";
      }
    });
  })
);
