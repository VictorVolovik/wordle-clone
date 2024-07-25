// CONSTANTS

const DEBUG = false;

const API_URL = "https://words.dev-apis.com";

const WORD_MAX_LENGTH = 5;
const LAST_WORD_INDEX = 5;

const STATUSES = {
  loading: "Loading...",
  validating: "Checking your word...",
  ready: "Enter a word",
  error: "Unknown word. Enter again",
  win: "You win!",
  loss: "You lose!",
};

// VALUES

let wordOfTheDay = ""; // string
let wordOfTheDayParsed = {
  // [letter:string]: appearances:number
};
let currentMode = "daily"; // daily | random
let appHelpOpenedOnStart = true; // boolean;

// ELEMENTS
let modeSelectorFormEl;
let wordGuessFormEl;
let wordInputEls;
let appHelpDialogEl;
let appHelpDialogTriggerBtnEl;

// HELPERS

function parseWord(word) {
  return word.split("").reduce((accum, curr) => {
    if (!accum[curr]) {
      accum[curr] = 1;
    } else {
      accum[curr]++;
    }

    return accum;
  }, {});
}

function renderStatus(status) {
  if (DEBUG && status === "ready") {
    console.log(`word is: ${wordOfTheDay}`, wordOfTheDayParsed);
  }
  const statusEl = document.querySelector(".status");

  statusEl.textContent =
    status === "loss"
      ? `${STATUSES[status]} The correct word was ${wordOfTheDay}.`
      : STATUSES[status];
}

function getInputCharsEls(index) {
  return document
    .querySelector(`.word-${index + 1}-label`)
    .querySelectorAll(".word-display .character");
}

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

function showAppHelp() {
  appHelpDialogEl.showModal();
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
    wordOfTheDayParsed = parseWord(data.word);
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

// HANDLE USER ACTIONS

function handleModeChange() {
  modeSelectorFormEl.mode.forEach((radio) =>
    radio.addEventListener("click", function (e) {
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
}

function handleInput() {
  wordInputEls.forEach((input, index) =>
    input.addEventListener("keydown", function (e) {
      const value = e.target.value.toLowerCase();

      if (value.length === WORD_MAX_LENGTH && e.key === "Enter") {
        handleWordSubmit(value, index);
      }

      if (e.key !== "Backspace" && !isLetter(e.key)) {
        e.preventDefault();
      }
    })
  );

  wordInputEls.forEach((input, index) =>
    input.addEventListener("keyup", function (e) {
      const value = e.target.value.toLowerCase();
      const chars = getInputCharsEls(index);

      chars.forEach((char, idx) => {
        const shouldFocus = idx === value.length;
        char.classList.toggle("focused", shouldFocus);
        char.textContent = value[idx] ?? " ";
      });
    })
  );
}

function handleFocus() {
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
}

function handleHelpDialog() {
  appHelpDialogEl.addEventListener("close", function () {
    if (appHelpOpenedOnStart) {
      appHelpOpenedOnStart = false;
      wordInputEls[0].focus();
    }
  });

  appHelpDialogTriggerBtnEl.addEventListener("click", showAppHelp);
}

function attachHandlers() {
  handleModeChange();
  handleInput();
  handleFocus();
  handleHelpDialog();
}

// HANDLE SUBMIT

function renderPrevInput(index) {
  const chechAgainst = { ...wordOfTheDayParsed };

  wordInputEls[index].setAttribute("disabled", "");
  const prevWordChars = getInputCharsEls(index);

  // first we find correctly positioned letters
  wordOfTheDay.split("").forEach((letter, index) => {
    const charAtLetterEl = prevWordChars[index];
    const charAtLetter = charAtLetterEl.textContent;

    if (letter === charAtLetter) {
      chechAgainst[charAtLetter]--;
      charAtLetterEl.classList.add("correct");
    }
  });

  prevWordChars.forEach((charEl) => {
    const char = charEl.textContent;

    // then we check if the rest of correct letters were in different positions
    if (chechAgainst[char]) {
      chechAgainst[char]--;
      charEl.classList.add("valid");
    }

    charEl.classList.add("disabled");
  });
}

function renderNextInput(index) {
  wordInputEls[index + 1].removeAttribute("disabled");
  wordInputEls[index + 1].focus();

  const nextWordChars = getInputCharsEls(index + 1);
  nextWordChars.forEach((charEl, index) => {
    charEl.classList.remove("disabled");
    if (index === 0) {
      charEl.classList.add("focused");
    }
  });
}

function resetInputOnError(index) {
  wordInputEls[index].value = "";
  const charsToClear = getInputCharsEls(index);
  charsToClear.forEach((char) => (char.textContent = ""));
}

async function handleWordSubmit(value, index) {
  const result = await validateWord(value);

  if (result === true) {
    renderPrevInput(index);

    if (value === wordOfTheDay) {
      return renderStatus("win");
    }

    if (index < LAST_WORD_INDEX) {
      renderNextInput(index);
    }

    if (index === LAST_WORD_INDEX && value !== wordOfTheDay) {
      renderStatus("loss");
    }
  } else {
    renderStatus("error");
    resetInputOnError(index);
  }
}

// INIT AND RESET

function resetFields() {
  const chars = document.querySelectorAll(`.word-display .character`);
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
}

async function init(mode) {
  resetFields();
  await getWordOfTheDay(mode);
  enableInput();
}

// APP START

window.addEventListener("DOMContentLoaded", function handleDomContentLoaded() {
  modeSelectorFormEl = document.querySelector(".mode-selector-form");
  wordGuessFormEl = document.querySelector(".word-guess-form");
  wordInputEls = wordGuessFormEl.querySelectorAll(".word-guess-input");
  appHelpDialogEl = document.querySelector("#app-help");
  appHelpDialogTriggerBtnEl = document.querySelector(".app-help-trigger");

  attachHandlers();
  init(currentMode);
  showAppHelp();
});
