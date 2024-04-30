// CONSTANTS

const API_URL = "https://words.dev-apis.com";

const STATUSES = {
  loading: "Loading...",
  validating: "Checking your word...",
  ready: "Enter a word",
  error: "Not a known word. Enter again",
  win: "You win!",
  loss: "You lose!",
};

// VALUES

let wordOfTheDay = ""; // string
let currentMode = "daily"; // daily | random

// ELEMENTS

const modeSelectorFormEl = document.querySelector(".mode-selector-form");
const wordGuessFormEl = document.querySelector(".word-guess-form");
const wordInputEls = wordGuessFormEl.querySelectorAll(".word-guess-input");
const statusEl = document.querySelector(".status");

// HELPERS

function renderStatus(status) {
  statusEl.textContent = STATUSES[status];
}

function getInputCharsEls(index) {
  return document
    .querySelector(`.word-${index + 1}-label`)
    .querySelectorAll(".word-display-character");
}

// API REQUESTS

async function getWordOfTheDay(mode) {
  const isRandom = mode === "random";
  const url = `${API_URL}/word-of-the-day?random=${isRandom}`;

  try {
    renderStatus("loading");
    const res = await fetch(url);
    const data = await res.json();
    wordOfTheDay = data.word;
    renderStatus("ready");
  } catch (e) {
    console.error(e);
  }
}

async function validateWord(word) {
  const url = `${API_URL}/validate-word`;

  try {
    renderStatus("validating");
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ word }),
    });
    const data = await res.json();
    renderStatus("ready");
    return data.validWord;
  } catch (e) {
    console.error(e);
  }
}

// HANDLE MODE

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

modeSelectorFormEl.mode.forEach((radio) =>
  radio.addEventListener("blur", function () {
    modeSelectorFormEl.mode.forEach((r) => {
      r.parentNode.classList.remove("focused");
    });
  })
);

// HANDLE FOCUS

wordInputEls.forEach((input, index) =>
  input.addEventListener("focus", function () {
    const chars = getInputCharsEls(index);

    chars.forEach((char, index) => {
      if (index === 0) {
        char.classList.add("focused");
      }
    });
  })
);

wordInputEls.forEach((input, index) =>
  input.addEventListener("blur", function () {
    const chars = getInputCharsEls(index);

    chars.forEach((char) => {
      char.classList.remove("focused");
    });
  })
);

// HANDLE INPUT

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
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
    const chars = getInputCharsEls(index);

    chars.forEach((char, index) => {
      if (value[index]) {
        char.textContent = value[index];
      } else {
        char.textContent = " ";
      }

      if (index === e.target.value.length) {
        char.classList.add("focused");
      } else {
        char.classList.remove("focused");
      }
    });
  })
);

// HANDLE SUBMIT

async function handleWordSubmit(value, index) {
  const result = await validateWord(value);

  if (result === true) {
    // handle prev input
    wordInputEls[index].setAttribute("disabled", "");
    const prevWordChars = getInputCharsEls(index);
    prevWordChars.forEach((char, charIndex) => {
      if (char.textContent === wordOfTheDay[charIndex]) {
        char.classList.add("correct");
      } else if (wordOfTheDay.includes(char.textContent)) {
        char.classList.add("valid");
      }
      char.classList.add("disabled");
    });

    // handle win
    if (value === wordOfTheDay) {
      return renderStatus("win");
    }

    // handle next input
    if (index < 5) {
      wordInputEls[index + 1].removeAttribute("disabled");
      wordInputEls[index + 1].focus();

      const nextWordChars = getInputCharsEls(index + 1);
      nextWordChars.forEach((char, index) => {
        char.classList.remove("disabled");
        if (index === 0) {
          char.classList.add("focused");
        }
      });
    }

    // handle lose
    if (index === 5 && value !== wordOfTheDay) {
      renderStatus("loss");
    }
  } else {
    renderStatus("error");

    wordInputEls[index].value = "";
    const charsToClear = getInputCharsEls(index);
    charsToClear.forEach((char) => (char.textContent = ""));
  }
}

// INIT AND RESET

function resetFields() {
  const chars = document.querySelectorAll(`.word-display-character`);
  chars.forEach((char) => {
    char.textContent = "";
    char.classList.remove("valid", "correct");
    char.classList.add("disabled");
  });

  wordInputEls.forEach((input, index) => {
    input.value = "";

    if (index === 0) {
      input.removeAttribute("disabled");
      input.setAttribute("autofocus", "");
    } else {
      input.setAttribute("disabled", "");
    }
  });
}

function enableInput() {
  const firstWordChars = getInputCharsEls(0);
  firstWordChars.forEach((char) => char.classList.remove("disabled"));

  const firstInput = wordInputEls[0];

  firstInput.value = "";

  firstInput.removeAttribute("disabled");
  firstInput.setAttribute("autofocus", "");
}

async function init(mode) {
  resetFields();
  await getWordOfTheDay(mode);
  enableInput();
}

init(currentMode);
