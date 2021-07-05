const API_URL = 'https://opentdb.com/api.php?amount=12&type=multiple';
const TIMER_DURATION = 15;
const SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * 52;

const FALLBACK_QUESTIONS = [
  { category: 'Science', question: 'What is the chemical symbol for gold?', options: ['Ag', 'Au', 'Go', 'Gd'], correct: 1, explanation: 'Au comes from the Latin word "aurum," meaning gold.' },
  { category: 'History', question: 'In what year did the Berlin Wall fall?', options: ['1987', '1989', '1991', '1985'], correct: 1, explanation: 'The Berlin Wall fell on November 9, 1989.' },
  { category: 'Technology', question: 'Who invented the World Wide Web?', options: ['Bill Gates', 'Steve Jobs', 'Tim Berners-Lee', 'Vint Cerf'], correct: 2, explanation: 'Tim Berners-Lee invented the WWW in 1989 at CERN.' },
  { category: 'Geography', question: 'What is the smallest country by area?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correct: 1, explanation: 'Vatican City is ~0.44 km².' },
  { category: 'Science', question: 'What planet is the "Red Planet"?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correct: 2, explanation: 'Mars appears red due to iron oxide on its surface.' },
  { category: 'History', question: 'Which civilization built Machu Picchu?', options: ['Aztec', 'Maya', 'Inca', 'Olmec'], correct: 2, explanation: 'Built by the Inca Empire in the 15th century.' },
  { category: 'Technology', question: 'What does "HTTP" stand for?', options: ['HyperText Transfer Protocol', 'High Tech Transfer Process', 'HyperText Transmission Platform', 'Hybrid Transfer Text Protocol'], correct: 0, explanation: 'HTTP is the foundation of data communication on the Web.' },
  { category: 'Geography', question: 'Which river is the longest in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correct: 1, explanation: 'The Nile stretches ~6,650 km through northeastern Africa.' },
  { category: 'Science', question: 'What is the hardest natural substance?', options: ['Quartz', 'Topaz', 'Diamond', 'Corundum'], correct: 2, explanation: 'Diamond scores 10 on the Mohs hardness scale.' },
  { category: 'Technology', question: 'When was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correct: 2, explanation: 'Apple released the first iPhone on June 29, 2007.' },
  { category: 'History', question: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'], correct: 2, explanation: 'Leonardo da Vinci painted it between ~1503 and 1519.' },
  { category: 'Geography', question: 'What is the largest desert in the world?', options: ['Sahara', 'Arabian', 'Antarctic', 'Gobi'], correct: 2, explanation: 'Antarctica is technically the largest desert at 14.2M km².' }
];

let questions = [];

const state = {
  currentQuestion: 0,
  score: 0,
  answers: [],
  timerInterval: null,
  timeLeft: TIMER_DURATION,
  highScore: 0
};

const el = {
  startScreen: document.getElementById('start-screen'),
  quizScreen: document.getElementById('quiz-screen'),
  resultsScreen: document.getElementById('results-screen'),
  startBtn: document.getElementById('start-btn'),
  questionCounter: document.getElementById('question-counter'),
  scoreDisplay: document.getElementById('score-display'),
  progressFill: document.getElementById('progress-fill'),
  timerFill: document.getElementById('timer-fill'),
  timerText: document.getElementById('timer-text'),
  categoryBadge: document.getElementById('category-badge'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  nextBtn: document.getElementById('next-btn'),
  resultsEmoji: document.getElementById('results-emoji'),
  resultsTitle: document.getElementById('results-title'),
  resultsScoreText: document.getElementById('results-score-text'),
  resultsPercent: document.getElementById('results-percent'),
  scoreRingFill: document.getElementById('score-ring-fill'),
  newHighScore: document.getElementById('new-high-score'),
  reviewBtn: document.getElementById('review-btn'),
  retryBtn: document.getElementById('retry-btn'),
  reviewSection: document.getElementById('review-section'),
  reviewList: document.getElementById('review-list'),
  highScoreDisplay: document.getElementById('high-score-display')
};

function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function fetchQuestions() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.response_code !== 0 || !data.results || data.results.length === 0) {
      throw new Error('Bad API response');
    }
    return data.results.map(q => {
      const allOptions = shuffleArray([...q.incorrect_answers, q.correct_answer].map(decodeHTML));
      const correctIdx = allOptions.indexOf(decodeHTML(q.correct_answer));
      return {
        category: decodeHTML(q.category),
        question: decodeHTML(q.question),
        options: allOptions,
        correct: correctIdx,
        explanation: `The correct answer is: ${decodeHTML(q.correct_answer)}`
      };
    });
  } catch {
    return shuffleArray(FALLBACK_QUESTIONS).slice(0, 12);
  }
}

function loadHighScore() {
  const saved = parseInt(localStorage.getItem('quizHighScore'), 10);
  if (!isNaN(saved)) state.highScore = saved;
  el.highScoreDisplay.textContent = state.highScore;
}

function saveHighScore() {
  localStorage.setItem('quizHighScore', String(state.highScore));
}

function showScreen(screen) {
  [el.startScreen, el.quizScreen, el.resultsScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

async function startQuiz() {
  el.startBtn.textContent = 'Loading...';
  el.startBtn.disabled = true;
  questions = await fetchQuestions();
  el.startBtn.textContent = 'Start Quiz';
  el.startBtn.disabled = false;

  state.currentQuestion = 0;
  state.score = 0;
  state.answers = [];
  showScreen(el.quizScreen);
  loadQuestion();
}

function loadQuestion() {
  const q = questions[state.currentQuestion];
  const total = questions.length;

  el.questionCounter.textContent = `Question ${state.currentQuestion + 1} / ${total}`;
  el.scoreDisplay.textContent = `Score: ${state.score}`;
  el.progressFill.style.width = `${((state.currentQuestion) / total) * 100}%`;

  el.categoryBadge.textContent = q.category;
  el.questionText.textContent = q.question;

  el.optionsContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${letters[idx]}</span><span>${option}</span>`;
    btn.addEventListener('click', () => selectAnswer(idx));
    el.optionsContainer.appendChild(btn);
  });

  el.nextBtn.style.display = 'none';
  startTimer();
}

function startTimer() {
  state.timeLeft = TIMER_DURATION;
  el.timerText.textContent = state.timeLeft;
  el.timerFill.style.width = '100%';
  el.timerFill.classList.remove('warning', 'danger');
  el.timerFill.style.transition = 'none';

  requestAnimationFrame(() => {
    el.timerFill.style.transition = 'width 1s linear, background-color 0.3s';
  });

  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    el.timerText.textContent = Math.max(0, state.timeLeft);

    const pct = (state.timeLeft / TIMER_DURATION) * 100;
    el.timerFill.style.width = pct + '%';

    if (state.timeLeft <= 5) {
      el.timerFill.classList.add('danger');
      el.timerFill.classList.remove('warning');
    } else if (state.timeLeft <= 10) {
      el.timerFill.classList.add('warning');
    }

    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      timeUp();
    }
  }, 1000);
}

function timeUp() {
  const q = questions[state.currentQuestion];
  const buttons = el.optionsContainer.querySelectorAll('.option-btn');

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) {
      btn.classList.add('correct');
    } else {
      btn.classList.add('dimmed');
    }
  });

  state.answers.push({ questionIdx: state.currentQuestion, selected: -1, correct: false });
  el.nextBtn.style.display = 'block';
}

function selectAnswer(selectedIdx) {
  clearInterval(state.timerInterval);

  const q = questions[state.currentQuestion];
  const isCorrect = selectedIdx === q.correct;
  const buttons = el.optionsContainer.querySelectorAll('.option-btn');

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) {
      btn.classList.add('correct');
    } else if (idx === selectedIdx && !isCorrect) {
      btn.classList.add('incorrect');
    } else {
      btn.classList.add('dimmed');
    }
  });

  if (isCorrect) state.score++;
  el.scoreDisplay.textContent = `Score: ${state.score}`;

  state.answers.push({ questionIdx: state.currentQuestion, selected: selectedIdx, correct: isCorrect });
  el.nextBtn.style.display = 'block';
}

function nextQuestion() {
  state.currentQuestion++;
  if (state.currentQuestion >= questions.length) {
    showResults();
  } else {
    loadQuestion();
  }
}

function showResults() {
  clearInterval(state.timerInterval);
  showScreen(el.resultsScreen);

  const total = questions.length;
  const pct = Math.round((state.score / total) * 100);

  el.resultsScoreText.textContent = `${state.score} / ${total}`;
  el.resultsPercent.textContent = `${pct}%`;

  if (pct >= 80) {
    el.resultsEmoji.textContent = '\u{1F3C6}';
    el.resultsTitle.textContent = 'Excellent!';
  } else if (pct >= 60) {
    el.resultsEmoji.textContent = '\u{1F389}';
    el.resultsTitle.textContent = 'Great Job!';
  } else if (pct >= 40) {
    el.resultsEmoji.textContent = '\u{1F44D}';
    el.resultsTitle.textContent = 'Not Bad!';
  } else {
    el.resultsEmoji.textContent = '\u{1F4DA}';
    el.resultsTitle.textContent = 'Keep Learning!';
  }

  const offset = SCORE_RING_CIRCUMFERENCE * (1 - pct / 100);
  el.scoreRingFill.style.strokeDasharray = SCORE_RING_CIRCUMFERENCE;
  el.scoreRingFill.style.strokeDashoffset = SCORE_RING_CIRCUMFERENCE;

  if (pct >= 70) {
    el.scoreRingFill.style.stroke = 'var(--correct)';
  } else if (pct >= 40) {
    el.scoreRingFill.style.stroke = 'var(--warning)';
  } else {
    el.scoreRingFill.style.stroke = 'var(--incorrect)';
  }

  requestAnimationFrame(() => {
    el.scoreRingFill.style.strokeDashoffset = offset;
  });

  const isNewHigh = state.score > state.highScore;
  if (isNewHigh) {
    state.highScore = state.score;
    saveHighScore();
    el.newHighScore.style.display = 'inline-block';
  } else {
    el.newHighScore.style.display = 'none';
  }

  el.highScoreDisplay.textContent = state.highScore;
  el.reviewSection.style.display = 'none';
  el.progressFill.style.width = '100%';
}

function showReview() {
  el.reviewSection.style.display = el.reviewSection.style.display === 'none' ? 'block' : 'none';

  if (el.reviewSection.style.display === 'block') {
    el.reviewList.innerHTML = '';
    state.answers.forEach((answer, i) => {
      const q = questions[answer.questionIdx];
      const item = document.createElement('div');
      item.className = `review-item ${answer.correct ? 'correct-item' : 'incorrect-item'}`;

      const selectedText = answer.selected === -1 ? 'No answer (time up)' : q.options[answer.selected];
      const selectedClass = answer.correct ? 'correct-text' : 'incorrect-text';

      item.innerHTML = `
        <div class="review-question">${i + 1}. ${q.question}</div>
        <div class="review-answer">Your answer: <span class="${selectedClass}">${selectedText}</span></div>
        ${!answer.correct ? `<div class="review-answer">Correct answer: <span class="correct-text">${q.options[q.correct]}</span></div>` : ''}
        <div class="review-explanation">${q.explanation}</div>
      `;
      el.reviewList.appendChild(item);
    });

    el.reviewSection.scrollIntoView({ behavior: 'smooth' });
  }
}

el.startBtn.addEventListener('click', startQuiz);
el.nextBtn.addEventListener('click', nextQuestion);
el.retryBtn.addEventListener('click', () => {
  el.reviewSection.style.display = 'none';
  startQuiz();
});
el.reviewBtn.addEventListener('click', showReview);

loadHighScore();
