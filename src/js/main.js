// DOM selectors
const userInput = document.getElementById('user-input');
const passage = document.getElementById('passage');
const startButton = document.getElementById('start-button');
const startButtonContainer = document.getElementById('start-button-container');
const resetButton = document.getElementById('reset-button');
const resetButtonContainer = document.getElementById('reset-button-container');
const restartButton = document.getElementById('restart-button');
const difficultyToggle = document.getElementById('difficulty');
const difficulty = document.getElementById('difficulty');
const wpm = document.getElementById('words-per-minute');
const finalWpm = document.getElementById('final-words-per-minute');
const mode = document.getElementById('mode');
const time = document.getElementById('time');
const accuracy = document.getElementById('accuracy');
const finalAccuracy = document.getElementById('final-accuracy');
const highScore = document.getElementById('high-score');
const testComplete = document.getElementById('test-complete');
const finalCorrect = document.getElementById('final-correct');
const finalErrors = document.getElementById('final-errors');
const gameContainer = document.getElementById('game-container');
const toggleButtons = document.querySelectorAll('.toggle-button');
const settingsContainer = document.getElementById('settings-container');

const game = {
  errorCounter: 0,
  errorMemory: [],
  accuracy: 100,
  mode: {
    passage: {
      direction: 1,
      startTime: 0,
    },
    timed: {
      direction: -1,
      startTime: 60,
    },
  },
  selectedMode: 'timed',
  difficulty: 'hard',
  time: 0,
  passage: '',
  wordsPerMinute: 0,
  results: [],
  highScore: 0,
  currentChar: 0,
  lastTypedValue: '',
};

let lastInteraction = 'mouse';

document.addEventListener('pointerdown', (e) => {
  lastInteraction = 'mouse';

  toggleButtons.forEach((button) => {
    toggleDropdown(button, e);
  });
});

const toggleDropdown = (button, e) => {
  const dropdown = button.nextElementSibling;

  if (!button.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
  } else {
    dropdown.classList.remove('hidden');
  }
};

document.addEventListener('keydown', (e) => {
  lastInteraction = 'keyboard';
  if (e.target.matches('button')) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleButtons.forEach((button) => {
        toggleDropdown(button, e);
      });
    }
  }
});

// global variables
const blockedKeys = ['ArrowLeft', 'ArrowRight', 'Delete'];
let timerId = null;
const timeOut = 120;

// fetch passge async
const loadPassage = async (difficulty) => {
  const response = await fetch('/../../data.json');
  if (!response.ok) throw new Error('Fetch failed');

  const data = await response.json();

  const items = data[difficulty].length;
  const randomIndex = Math.floor(Math.random() * items);
  game.passage = data[difficulty][randomIndex].text;
  game.results = Array(game.passage.length).fill('pending');
  game.errorMemory = Array(game.passage.length).fill(false);
  populateDom(game.passage);
};

// add text to the DOM
const populateDom = (text) => {
  passage.innerHTML = '';
  text.split('').forEach((letter) => {
    const span = document.createElement('span');
    span.textContent = String(letter);
    passage.appendChild(span);
  });
};

const startGame = () => {
  userInput.focus();
  clearInterval(timerId);
  game.errorCounter = 0;
  startTimer(game.mode[game.selectedMode].direction, game.mode[game.selectedMode].startTime);
  resetButtonContainer.classList.remove('hidden');
  startButtonContainer.classList.add('hidden');
  userInput.addEventListener('input', handleInput);
  game.wordsPerMinute = 0;
  passage.children[game.currentChar].classList.add('bg-white', 'opacity-20');
  passage.classList.remove('blur-[6px]', 'opacity-40');
  time.classList.add('!text-yellow-400');
  accuracy.classList.add('!text-red-500');
};

const resetGame = () => {
  userInput.value = '';
  clearInterval(timerId);
  game.errorCounter = 0;
  time.innerHTML = `0:${String(game.mode[game.selectedMode].startTime).padStart(2, '0')}`;
  game.wordsPerMinute = 0;
  resetButtonContainer.classList.add('hidden');
  startButtonContainer.classList.remove('hidden');
  game.results = [];
  game.accuracy = 100;
  accuracy.textContent = '100%';
  populateDom(game.passage);
  testComplete.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  passage.classList.add('blur-[6px]', 'opacity-40');
  loadPassage(game.difficulty);
  time.classList.remove('!text-yellow-400');
  accuracy.classList.remove('!text-red-500');
  settingsContainer.classList.remove('hidden');
};

const startTimer = (direction, startTime) => {
  game.time = startTime;

  timerId = setInterval(() => {
    game.time += direction;

    // stop timer depending on game mode
    if (direction > 0 && game.time >= timeOut) {
      clearInterval(timerId);
      endGame();
    }
    if (direction < 0 && game.time <= 0) {
      clearInterval(timerId);
      endGame();
    }

    if (game.time > 60) {
      let minutes = Math.floor(game.time / 60);
      let seconds = String(game.time % 60).padStart(2, '0');
      time.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    } else {
      time.textContent = `0:${String(game.time).padStart(2, '0')}`;
    }
  }, 1000);
};

// start game
startButton.addEventListener('click', startGame);
passage.addEventListener('click', startGame);

userInput.addEventListener('keydown', handleKeydown);

function handleInput(e) {
  const typed = e.target.value;
  game.lastTypedValue = typed;

  console.log(game.errorCounter);

  updateResults(typed);
  updateHighlighting();
  updateAccuracy();
  calculateWordsPerMinute();

  // end game if number of typed chars matches passage
  if (game.lastTypedValue.length === game.passage.length) {
    endGame();
  }
}

function updateResults(typed) {
  for (let i = 0; i < game.passage.length; i++) {
    const prevStateAtIndex = game.results[i];
    let newStateAtIndex;

    if (typed[i] === undefined) {
      newStateAtIndex = 'pending';
    } else if (typed[i] === game.passage[i]) {
      newStateAtIndex = 'correct';
    } else {
      newStateAtIndex = 'wrong';
    }

    // count errors - only once per character
    if (newStateAtIndex === 'wrong' && prevStateAtIndex !== 'wrong') {
      if (game.errorMemory[i] === false) {
        game.errorCounter++;
        game.errorMemory[i] = true;
      }
    }

    game.results[i] = newStateAtIndex;
  }
}

/*function updateResults2(typed) {
  let prev, curr;
  let typedIndex = 0;

  prev = game.lastTypedValue;
  curr = typed;

  console.log('prev', prev);
  console.log('curr', curr);

  // detect insert character
  if (prev.length < curr.length) {
    typedIndex = curr.length - 1;
  }

  // detect delete character
  if (prev.length > curr.length) {
    typedIndex = curr.length;
    game.results[typedIndex] = 'pending';
  }

  // detect replace character
  if (prev.length === curr.length) {
    if (prev === curr) {
      typedIndex = -1;
    } else {
      let i = 0;
      while (prev[i] === curr[i]) i++;
      typedIndex = i;
    }
  }

  if (typedIndex === -1) {
    game.lastTypedValue = curr;
    return;
  }

  game.lastTypedValue = curr;

  const prevStateAtIndex = game.results[typedIndex];
  let newStateAtIndex;

  if (typed[typedIndex] === undefined) {
    newStateAtIndex = 'pending';
  } else if (typed[typedIndex] === game.passage[typedIndex]) {
    newStateAtIndex = 'correct';
  } else {
    newStateAtIndex = 'wrong';
  }

  // count errors - only once per character
  if (newStateAtIndex === 'wrong' && prevStateAtIndex !== 'wrong') {
    if (game.errorMemory[typedIndex] === false) {
      game.errorCounter++;
      game.errorMemory[typedIndex] = true;
    }
  }
  game.results[typedIndex] = newStateAtIndex;
}*/

function updateAccuracy() {
  const totalChars = game.passage.length;
  const correct = totalChars - game.errorCounter;

  // prevent division by zero
  game.accuracy = totalChars === 0 ? 100 : (correct / totalChars) * 100;
  accuracy.textContent = `${game.accuracy.toFixed(2)}%`;
}

// output results to the DOM
function updateHighlighting() {
  game.currentChar = game.results.indexOf('pending');

  game.results.forEach((result, index) => {
    passage.children[index].classList.remove(
      'text-green-500',
      'text-red-500',
      'underline',
      'decoration-3',
      'text-neutral-400',
      'bg-white',
      'opacity-20',
      'underline-offset-3',
    );

    if (game.currentChar !== -1) {
      passage.children[game.currentChar].classList.add('bg-white', 'opacity-20');
    }

    if (result === 'correct') {
      passage.children[index].classList.add('text-green-500');
    } else if (result === 'pending') {
      passage.children[index].classList.add('text-neutral-400');
    } else {
      passage.children[index].classList.add('text-red-500', 'underline', 'decoration-3', 'underline-offset-6');
    }
  });
}

function calculateWordsPerMinute() {
  const elapsedSeconds = game.selectedMode === 'passage' ? game.time : 60 - game.time;
  const correctChars = game.results.filter((r) => r === 'correct').length;
  const minutes = elapsedSeconds / 60;

  game.wordsPerMinute = Math.round(correctChars / 5 / minutes);
  wpm.textContent = game.wordsPerMinute;
}

function handleKeydown(e) {
  if (blockedKeys.includes(e.key)) {
    e.preventDefault();
  }
}

function endGame() {
  clearInterval(timerId);
  testComplete.classList.remove('hidden');
  finalWpm.textContent = game.wordsPerMinute;
  finalAccuracy.textContent = `${game.accuracy.toFixed(2)}%`;

  const correctChars = game.lastTypedValue.length - game.errorCounter;
  const wrongChars = game.errorCounter;
  finalCorrect.textContent = correctChars;
  finalErrors.textContent = wrongChars;
  userInput.removeEventListener('input', handleInput);

  gameContainer.classList.add('hidden');

  time.classList.remove('!text-yellow-400');
  accuracy.classList.remove('!text-red-500');
  setHighScore();

  settingsContainer.classList.add('hidden');
}

// select difficulty
difficulty.addEventListener('change', (e) => {
  game.difficulty = e.target.value;
  difficulty.previousElementSibling.querySelector('span').textContent = e.target.nextElementSibling.innerText;
  resetGame();
});

// select mode
mode.addEventListener('change', (e) => {
  game.selectedMode = e.target.value;
  mode.previousElementSibling.querySelector('span').textContent = e.target.nextElementSibling.innerText;
  resetGame();
});

resetButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);

// show passage with initially checked difficulty
const initialDifficulty = Array.from(difficulty.querySelectorAll('input')).filter((i) => i.checked);
loadPassage(initialDifficulty[0].value);

// set highscore, triggerd by endGame()
const setHighScore = () => {
  if (game.highScore < game.wordsPerMinute) {
    game.highScore = game.wordsPerMinute;
    localStorage.setItem('high score', game.highScore);
    updateHighScoreUI(game.highScore);
  }
};

if (localStorage.getItem('high score')) {
  game.highScore = localStorage.getItem('high score');
  updateHighScoreUI(localStorage.getItem('high score'));
}

function updateHighScoreUI(highScoreValue) {
  highScore.textContent = `${highScoreValue} WPM`;
}
