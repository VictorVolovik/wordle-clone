// CONSTANTS

const DEBUG = false;

const API_URL = "https://words.dev-apis.com";

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

const modeSelectorFormEl = document.querySelector(".mode-selector-form");
const wordGuessFormEl = document.querySelector(".word-guess-form");
const wordInputEls = wordGuessFormEl.querySelectorAll(".word-guess-input");
const statusEl = document.querySelector(".status");
const appHelpDialogEl = document.querySelector("#app-help");
const appHelpDialogTriggerBtnEl = document.querySelector(".app-help-trigger");

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

  statusEl.textContent = STATUSES[status];
}

function getInputCharsEls(index) {
  return document
    .querySelector(`.word-${index + 1}-label`)
    .querySelectorAll(".word-display .character");
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
    const value = e.target.value.toLowerCase();

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

    const value = e.target.value.toLowerCase();
    const chars = getInputCharsEls(index);

    chars.forEach((char, idx) => {
      if (value[idx]) {
        char.textContent = value[idx];
      } else {
        char.textContent = " ";
      }

      if (idx === value.length) {
        char.classList.add("focused");
      } else {
        char.classList.remove("focused");
      }
    });
  })
);

// HANDLE SUBMIT

function renderPreInput(index) {
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
    renderPreInput(index);

    if (value === wordOfTheDay) {
      return renderStatus("win");
    }

    if (index < 5) {
      renderNextInput(index);
    }

    if (index === 5 && value !== wordOfTheDay) {
      renderStatus("loss");
    }
  } else {
    renderStatus("error");
    resetInputOnError(index);
  }
}

// HANDLE HELP DIALOG

function showAppHelp() {
  appHelpDialogEl.showModal();
}

appHelpDialogEl.addEventListener("close", function () {
  if (appHelpOpenedOnStart) {
    appHelpOpenedOnStart = false;
    wordInputEls[0].focus();
  }
});

appHelpDialogTriggerBtnEl.addEventListener("click", showAppHelp);

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

init(currentMode);
showAppHelp();
