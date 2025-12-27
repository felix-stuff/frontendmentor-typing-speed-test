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
};

// DOM selectors
const userInput = document.getElementById('user-input');
const output = document.getElementById('output');
const passage = document.getElementById('passage');
const startButton = document.getElementById('startButton');
const difficulty = document.getElementById('difficulty');
const mode = document.getElementById('mode');
const time = document.getElementById('time');
const accuracy = document.getElementById('accuracy');

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
    span.innerText = String(letter);
    passage.appendChild(span);
  });
};

const startGame = () => {
  userInput.value = '';
  userInput.focus();
  output.innerText = '';
  clearInterval(timerId);
  game.errorCounter = 0;
  startTimer(game.mode[game.selectedMode].direction, game.mode[game.selectedMode].startTime);
};

let timerId = null;
let timeOut = 120;

const startTimer = (direction, startTime) => {
  game.time = startTime;

  timerId = setInterval(() => {
    game.time += direction;

    // stop timer depending on game mode
    if (direction > 0 && game.time >= timeOut) clearInterval(timerId);
    if (direction < 0 && game.time <= 0) clearInterval(timerId);

    if (game.time > 60) {
      let minutes = Math.floor(game.time / 60);
      let seconds = String(game.time % 60).padStart(2, '0');
      time.innerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    } else {
      time.innerText = `0:${String(game.time).padStart(2, '0')}`;
    }
  }, 1000);
};

// start game
startButton.addEventListener('click', startGame);
passage.addEventListener('click', startGame);

userInput.addEventListener('input', (e) => {
  const results = [];

  // print userInput to page
  output.innerText = e.target.value;

  // detect state of user input
  for (let i = 0; i < passage.children.length; i++) {
    if (userInput.value.length <= i) {
      results.push('pending');
    } else if (e.target.value[i] === passage.children[i].textContent) {
      results.push('correct');
    } else {
      results.push('wrong');
      game.errorCounter++;
    }
  }

  const correct = results.filter((result) => result === 'correct').length;

  console.log('CORRECT CHARS:', correct, '/', results.length);
  game.accuracy = (correct / results.length) * 100;
  accuracy.innerText = `${game.accuracy.toFixed(2)}%`;
  console.log(game.errorCounter);

  // output results to the DOM
  results.forEach((result, index) => {
    passage.children[index].classList.remove('text-green-700', 'text-red-700', 'text-slate-300');

    if (result === 'correct') {
      passage.children[index].classList.add('text-green-700');
    } else if (result === 'pending') {
      passage.children[index].classList.add('text-slate-300');
    } else {
      passage.children[index].classList.add('text-red-700');
    }
  });
});

// select difficulty
difficulty.addEventListener('change', (e) => {
  loadPassage(e.target.value);
});

// select mode
mode.addEventListener('change', (e) => {
  game.selectedMode = e.target.value;
});

// show passage with initially checked difficulty
const initialDifficulty = Array.from(difficulty.querySelectorAll('input')).filter((i) => i.checked);
loadPassage(initialDifficulty[0].value);
