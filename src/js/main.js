// DOM selectors
const userInput = document.getElementById('user-input');
const passage = document.getElementById('passage');
const startButton = document.getElementById('start-button');
const startButtonContainer = document.getElementById('start-button-container');
const resetButton = document.getElementById('reset-button');
const resetButtonContainer = document.getElementById('reset-button-container');
const restartButton = document.getElementById('restart-button');
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
const successMessage = document.getElementById('success-message');

// Event listeners
// Listen for user input
userInput.addEventListener('input', handleInput);
userInput.addEventListener('keydown', handleKeydown);

// Global variables
const blockedKeys = ['ArrowLeft', 'ArrowRight', 'Delete'];
let timerId = null;
let lastInteraction = 'mouse';

// Passage mode ends after timeout
const timeOut = 300;

// Global game object
const game = {
  accuracy: 100,
  baseline: false,
  currentChar: 0,
  difficulty: 'hard',
  errorCounter: 0,
  errorMemory: [],
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
  highScore: 0,
  isRunning: false,
  passage: '',
  results: [],
  selectedMode: 'timed',
  time: 0,
  typed: '',
  wordsPerMinute: 0,
};

// Success UI variants: test complete, baseline, high score
const SUCCESS_UI_CONFIG = {
  default: {
    icon: 'public/assets/images/icon-completed.svg',
    title: 'Test Complete!',
    message: 'Solid run. Keep pushing to beat your high score.',
    iconClasses: [
      'mx-auto',
      'h-12',
      'w-12',
      'rounded-full',
      'shadow-(--icon-shadow)',
      'md:h-16',
      'md:w-16',
      'md:shadow-(--icon-shadow-lg)',
    ],
    ctaText: 'Restart',
  },

  baseline: {
    icon: 'public/assets/images/icon-completed.svg',
    title: 'Baseline Established!',
    message: 'You’ve set the bar. Now beat it.',
    iconClasses: [
      'mx-auto',
      'h-12',
      'w-12',
      'rounded-full',
      'shadow-(--icon-shadow)',
      'md:h-16',
      'md:w-16',
      'md:shadow-(--icon-shadow-lg)',
    ],
    ctaText: 'Beat This Score',
  },

  highScore: {
    icon: 'public/assets/images/icon-new-pb.svg',
    title: 'High Score Smashed!',
    message: 'You’re getting faster. That was incredible typing.',
    iconClasses: ['mx-auto', 'h-16', 'w-16', 'md:h-20', 'md:w-20'],
    ctaText: 'Beat This Score',
  },
};

document.addEventListener('pointerdown', (e) => {
  lastInteraction = 'mouse';

  toggleButtons.forEach((button) => {
    toggleDropdown(button, e);
  });
});

// Toggle mode dropdowns for mobile design
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
  if (e.target.matches('.toggle-button')) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleButtons.forEach((button) => {
        toggleDropdown(button, e);
      });
    }
  }
});

// Fetch passage async
const loadPassage = async (difficulty) => {
  const response = await fetch('data.json');
  if (!response.ok) throw new Error('Fetch failed');

  const data = await response.json();

  const items = data[difficulty].length;
  const randomIndex = Math.floor(Math.random() * items);
  game.passage = data[difficulty][randomIndex].text;
  game.results = Array(game.passage.length).fill('pending');
  game.errorMemory = Array(game.passage.length).fill(false);
  populateDom(game.passage);
};

// Add passage to the DOM
const populateDom = (text) => {
  passage.innerHTML = '';
  text.split('').forEach((letter) => {
    const span = document.createElement('span');
    span.textContent = String(letter);
    passage.appendChild(span);
  });
};

const startGame = () => {
  if (game.isRunning) return;
  game.isRunning = true;
  userInput.removeAttribute('tabindex');
  userInput.focus();
  clearInterval(timerId);
  game.errorCounter = 0;
  startTimer(game.mode[game.selectedMode].direction, game.mode[game.selectedMode].startTime);
  resetButtonContainer.classList.remove('hidden');
  startButtonContainer.classList.add('hidden');
  game.wordsPerMinute = 0;
  passage.children[game.currentChar].classList.add('bg-white/20', 'rounded-sm');
  passage.classList.remove('blur-[6px]', 'opacity-40');
  time.classList.add('!text-yellow-400');
  accuracy.classList.add('!text-red-500');
};

// Start game
startButton.addEventListener('click', startGame);
passage.addEventListener('click', (e) => {
  if (!game.isRunning) startGame();
  else userInput.focus();
});

const resetGame = () => {
  userInput.value = '';
  userInput.setAttribute('tabindex', '-1');
  clearInterval(timerId);
  game.isRunning = false;
  game.errorCounter = 0;
  time.innerHTML = `0:${String(game.mode[game.selectedMode].startTime).padStart(2, '0')}`;
  game.wordsPerMinute = 0;
  resetButtonContainer.classList.add('hidden');
  startButtonContainer.classList.remove('hidden');
  game.results = Array(game.passage.length).fill('pending');
  game.errorMemory = Array(game.passage.length).fill(false);
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
  game.typed = '';
  game.currentChar = 0;
  settingsContainer.classList.remove('!hidden');
};

// Start timer depending on selected mode
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

// Main function for user typed input
function handleInput(e) {
  if (!game.isRunning) return;

  game.typed = e.target.value;

  updateResults(game.typed);
  updateHighlighting();
  updateAccuracy();
  calculateWordsPerMinute();

  // End game if number of typed chars matches passage
  if (game.typed.length === game.passage.length) {
    endGame();
  }
}

// Handle state of each character while user types
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

    // Count errors - only once per character
    if (newStateAtIndex === 'wrong' && prevStateAtIndex !== 'wrong') {
      if (game.errorMemory[i] === false) {
        game.errorCounter++;
        game.errorMemory[i] = true;
      }
    }

    game.results[i] = newStateAtIndex;
  }
}

function updateAccuracy() {
  const totalChars = game.passage.length;
  const correctChars = totalChars - game.errorCounter;

  // Prevent division by zero
  game.accuracy = totalChars === 0 ? 100 : (correctChars / totalChars) * 100;
  accuracy.textContent = `${game.accuracy.toFixed(2)}%`;
}

// Output character state to the DOM
function updateHighlighting() {
  game.currentChar = game.results.indexOf('pending');

  game.results.forEach((result, index) => {
    passage.children[index].classList.remove(
      'text-green-500',
      'text-red-500',
      'underline',
      'decoration-3',
      'text-neutral-400',
      'bg-white/20',
      'rounded-sm',
      'underline-offset-3',
    );

    const pendingIndex = game.currentChar;

    if (pendingIndex !== -1) {
      passage.children[pendingIndex].classList.add('bg-white/20', 'rounded-sm');

      const el = passage.children[pendingIndex];

      el.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'smooth',
      });
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
  const correctChars = getCorrectCharCount();
  const minutes = elapsedSeconds / 60;

  game.wordsPerMinute = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0;
  wpm.textContent = game.wordsPerMinute;
}

// Prevent blocked keys
function handleKeydown(e) {
  if (blockedKeys.includes(e.key)) {
    e.preventDefault();
  }
}

function endGame() {
  if (!game.isRunning) return;
  game.isRunning = false;

  clearInterval(timerId);
  testComplete.classList.remove('hidden');
  finalWpm.textContent = game.wordsPerMinute;
  finalAccuracy.textContent = `${game.accuracy.toFixed(2)}%`;
  finalAccuracy.classList.remove('text-green-500', 'text-red-500');
  if (game.accuracy === 100) {
    finalAccuracy.classList.add('text-green-500');
  } else {
    finalAccuracy.classList.add('text-red-500');
  }

  const correctChars = getCorrectCharCount();
  const wrongChars = game.errorCounter;
  finalCorrect.textContent = correctChars;
  finalErrors.textContent = wrongChars;

  gameContainer.classList.add('hidden');

  time.classList.remove('!text-yellow-400');
  accuracy.classList.remove('!text-red-500');

  renderSuccessUI('default');
  setHighScore();

  settingsContainer.classList.add('!hidden');
}

// Select difficulty
difficulty.addEventListener('change', (e) => {
  game.difficulty = e.target.value;
  difficulty.previousElementSibling.querySelector('span').textContent = e.target.nextElementSibling.innerText;
  resetGame();
});

// Select mode
mode.addEventListener('change', (e) => {
  game.selectedMode = e.target.value;
  mode.previousElementSibling.querySelector('span').textContent = e.target.nextElementSibling.innerText;
  resetGame();
});

// Reset game
resetButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);

// Load passage with initially checked difficulty
const initialDifficulty = Array.from(difficulty.querySelectorAll('input')).filter((i) => i.checked);
loadPassage(initialDifficulty[0].value);

// Set highscore, triggerd by end game function
const setHighScore = () => {
  // set Highscore
  if (game.highScore < game.wordsPerMinute) {
    game.highScore = game.wordsPerMinute;
    localStorage.setItem('high score', game.highScore);
    updateHighScoreUI(game.highScore);

    // Set baseline
    if (!game.baseline) {
      return setBaseline();
    }

    let positionList = [
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.75 },
      { x: window.innerWidth * 0.25, y: window.innerHeight * 0.75 },
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.75 },
    ];
    for (let i = 0; i < positionList.length; i++) {
      setTimeout(() => confetti({ position: positionList[i] }), i * 250);
    }

    renderSuccessUI('highScore');
  }
};

function setBaseline() {
  game.baseline = true;
  renderSuccessUI('baseline');
}

// Check for initial high score
if (localStorage.getItem('high score')) {
  game.baseline = true;
  game.highScore = localStorage.getItem('high score');
  updateHighScoreUI(localStorage.getItem('high score'));
}

function updateHighScoreUI(highScoreValue) {
  highScore.textContent = `${highScoreValue} WPM`;
}

// Correct characters = characters currently typed correctly (not total passage length)
function getCorrectCharCount() {
  return game.results.filter((r) => r === 'correct').length;
}

function renderSuccessUI(state) {
  const config = SUCCESS_UI_CONFIG[state];

  if (!config) return;

  const icon = document.getElementById('success-icon');
  const title = successMessage.querySelector('h1');
  const message = successMessage.querySelector('p');
  const buttonText = restartButton.querySelector('span');

  // Reset classes
  icon.className = '';

  icon.src = config.icon;
  title.textContent = config.title;
  message.textContent = config.message;
  buttonText.textContent = config.ctaText;

  icon.classList.add(...config.iconClasses);
}
