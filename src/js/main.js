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

const game = {
  errorCounter: 0,
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
  words: 0,
  wordsPerMinute: 0,
  results: [],
  highScore: 0,
  typed: 0,
  currentChar: 0,
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

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleButtons.forEach((button) => {
      toggleDropdown(button, e);
    });
  }
});

document.addEventListener('click', function (e) {});

// global variables
const blockedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete'];
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
  userInput.value = '';
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
  game.wordsPerMinute = 0;
  passage.classList.add('blur-[6px]', 'opacity-40');
  loadPassage(game.difficulty);
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

  updateResults(typed);
  updateAccuracy();
  updateHighlighting();

  if (typed.split(' ')) {
    game.words = typed.split(' ').length - 1;
  }

  calculateWordsPerMinute();

  // end game if all chars are correct
  const correctChars = game.results.filter((result) => result === 'correct').length;
  if (correctChars === game.passage.length) {
    endGame();
  }
}

function updateResults(typed) {
  for (let i = 0; i < game.passage.length; i++) {
    const oldState = game.results[i];
    let newState;

    if (typed[i] === undefined) {
      newState = 'pending';
    } else if (typed[i] === game.passage[i]) {
      newState = 'correct';
    } else {
      newState = 'wrong';
    }

    if (newState === 'wrong' || oldState !== 'wrong') {
      game.errorCounter++;
    }

    game.results[i] = newState;
  }
}

function updateAccuracy() {
  const correct = game.results.filter((r) => r === 'correct').length;
  const wrong = game.results.filter((r) => r === 'wrong').length;
  const total = correct + wrong;

  // prevent division by zero
  game.accuracy = total === 0 ? 100 : (correct / total) * 100;
  accuracy.textContent = `${game.accuracy.toFixed(2)}%`;
}

// output results to the DOM
function updateHighlighting() {
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

    game.currentChar = game.results.indexOf('pending');

    passage.children[game.currentChar].classList.add('bg-white', 'opacity-20');

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
  if (game.mode === 'passage') {
    game.wordsPerMinute = Math.round(game.words / 60);
  } else {
    game.wordsPerMinute = game.words;
  }

  wpm.textContent = game.wordsPerMinute;
}

function handleKeydown(e) {
  if (blockedKeys.includes(e.key)) {
    e.preventDefault();
  }

  // count all regular typed chars
  if (e.key.length === 1) {
    game.typed++;
  }
}

function endGame() {
  clearInterval(timerId);
  testComplete.classList.remove('hidden');
  finalWpm.textContent = game.wordsPerMinute;
  finalAccuracy.textContent = `${game.accuracy.toFixed(2)}%`;

  const correctChars = game.results.filter((result) => result === 'correct').length;
  const wrongChars = game.results.filter((result) => result === 'wrong').length;
  finalCorrect.textContent = correctChars;
  finalErrors.textContent = wrongChars;
  userInput.removeEventListener('input', handleInput);

  gameContainer.classList.add('hidden');
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
