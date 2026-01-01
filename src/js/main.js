// initial values
// timer, mode, wpm, accuracy, difficulty
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
  difficulty: 'medium',
  time: 0,
  passage: '',
  words: 0,
  wordsPerMinute: 0,
  results: [],
  highScore: 0,
  typed: 0,
};

// DOM selectors
const userInput = document.getElementById('user-input');
const output = document.getElementById('output');
const passage = document.getElementById('passage');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const restartButton = document.getElementById('restartButton');
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
  console.log(game.passage.split(' ').length);
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
  output.textContent = '';
  clearInterval(timerId);
  game.errorCounter = 0;
  startTimer(game.mode[game.selectedMode].direction, game.mode[game.selectedMode].startTime);
  resetButton.classList.remove('hidden');
  startButton.classList.add('hidden');
  userInput.addEventListener('input', handleInput);
  game.wordsPerMinute = 0;
};

const resetGame = () => {
  userInput.value = '';
  output.textContent = '';
  clearInterval(timerId);
  game.errorCounter = 0;
  time.innerHTML = `0:${String(game.mode[game.selectedMode].startTime).padStart(2, '0')}`;
  game.wordsPerMinute = 0;
  resetButton.classList.add('hidden');
  startButton.classList.remove('hidden');
  game.results = [];
  game.accuracy = 100;
  accuracy.textContent = '100%';
  populateDom(game.passage);
  testComplete.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  game.wordsPerMinute = 0;
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

  output.textContent = typed;

  updateResults(typed);
  updateAccuracy();
  updateHighlighting();

  if (e.target.value.split(' ')) {
    game.words = e.target.value.split(' ').length - 1;
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
    passage.children[index].classList.remove('text-green-700', 'text-red-700', 'text-slate-300', 'bg-slate-700');

    let currentChar = game.results.indexOf('pending');

    passage.children[currentChar].classList.add('bg-slate-700');

    if (result === 'correct') {
      passage.children[index].classList.add('text-green-700');
    } else if (result === 'pending') {
      passage.children[index].classList.add('text-slate-300');
    } else {
      passage.children[index].classList.add('text-red-700');
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
  loadPassage(e.target.value);
  resetGame();
});

// select mode
mode.addEventListener('change', (e) => {
  game.selectedMode = e.target.value;
  resetGame();
});

resetButton.addEventListener('click', (e) => {
  resetGame();
});

restartButton.addEventListener('click', (e) => {
  resetGame();
});

// show passage with initially checked difficulty
const initialDifficulty = Array.from(difficulty.querySelectorAll('input')).filter((i) => i.checked);
loadPassage(initialDifficulty[0].value);
