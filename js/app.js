/**
 * app.js - Main Application Controller
 * Handles Routing, State Management, Question Builder, Game Engine, Leaderboards, and Interactivity
 */

// Curated Question Inspiration Bank for the Idea Helper
const FRIENDSHIP_IDEAS = [
  {
    question: "What is my go-to comfort midnight snack?",
    options: ["Spicy Noodles 🍜", "Sweet Ice Cream 🍦", "Potato Chips 🥔", "Cheesy Pizza 🍕"],
    correctAnswer: 0
  },
  {
    question: "What is my biggest pet peeve in public?",
    options: ["People walking too slow 🚶", "Chewing loudly 👄", "Leaving messages on read 📱", "Being late ⏰"],
    correctAnswer: 2
  },
  {
    question: "What superpower would I choose?",
    options: ["Invisibility 🫥", "Teleportation ⚡", "Mind Reading 🧠", "Time Travel ⏳"],
    correctAnswer: 1
  },
  {
    question: "How do I handle stressful days?",
    options: ["Binge watch shows in bed 📺", "Rant to my besties 🗣️", "Go shopping / retail therapy 🛍️", "Listen to sad music on repeat 🎧"],
    correctAnswer: 0
  },
  {
    question: "What is my dream vacation spot?",
    options: ["Maldives Beach Resort 🏖️", "Tokyo Food & Anime Tour 🗼", "Swiss Mountain Cabin 🏔️", "Parisian Cafe Hop 🥐"],
    correctAnswer: 1
  },
  {
    question: "What genre of movies is my absolute favorite?",
    options: ["Psychological Thrillers 🔪", "Cheesy Rom-Coms 🍿", "Sci-Fi & Fantasy 🚀", "Standup Comedy 😂"],
    correctAnswer: 1
  },
  {
    question: "Am I an early bird or a night owl?",
    options: ["Morning lark (6 AM) 🌅", "Creature of the midnight hours 🦉", "I sleep 12 hours anytime 😴", "Powered strictly by iced coffee ☕"],
    correctAnswer: 1
  },
  {
    question: "What's my biggest guilty pleasure song or artist?",
    options: ["2010s Pop Throwbacks 🎶", "Heartbreak Ballads 💔", "K-Pop Anthems ✨", "Heavy Rock / Metal 🎸"],
    correctAnswer: 0
  }
];

class BestieQuizApp {
  constructor() {
    this.currentScreen = 'home';
    this.activeQuiz = null;
    this.gameState = {
      playerName: '',
      quizId: '',
      currentQuestionIndex: 0,
      userAnswers: [],
      score: 0
    };

    this.builderQuestions = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateSoundToggleUI();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  showToast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    window.sfx.playPop();

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // =========================================================================
  // ROUTING SYSTEM
  // =========================================================================
  navigate(route) {
    window.location.hash = route;
  }

  handleRoute() {
    // Also check query parameters like ?play=QZ7K29
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('play')) {
      const qId = urlParams.get('play');
      window.history.replaceState({}, document.title, window.location.pathname + '#play/' + qId);
    } else if (urlParams.has('quiz')) {
      const qId = urlParams.get('quiz');
      window.history.replaceState({}, document.title, window.location.pathname + '#play/' + qId);
    }

    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const mainRoute = parts[0];
    const param1 = parts[1];
    const param2 = parts[2];

    switch (mainRoute) {
      case 'home':
        this.showScreen('screen-home');
        break;

      case 'create':
        this.showScreen('screen-create');
        this.setupCreateScreen();
        break;

      case 'created':
        if (param1) {
          this.setupCreatedScreen(param1);
        } else {
          this.navigate('home');
        }
        break;

      case 'play':
        if (param1) {
          this.setupPlayScreen(param1);
        } else {
          this.navigate('home');
        }
        break;

      case 'result':
        if (param1 && param2) {
          this.setupResultScreen(param1, param2);
        } else {
          this.navigate('home');
        }
        break;

      case 'leaderboard':
        if (param1) {
          this.setupLeaderboardScreen(param1);
        } else {
          this.navigate('home');
        }
        break;

      default:
        this.showScreen('screen-home');
        break;
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  showNotFound(quizId) {
    document.getElementById('not-found-id').textContent = quizId || 'UNKNOWN';
    this.showScreen('screen-not-found');
  }

  // =========================================================================
  // GLOBAL EVENT BINDINGS
  // =========================================================================
  bindEvents() {
    // Sound toggle
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
      const current = window.db.isSoundEnabled();
      window.db.setSoundEnabled(!current);
      this.updateSoundToggleUI();
      if (!current) window.sfx.playSelect();
    });

    // My Quizzes Modal
    document.getElementById('btn-open-my-quizzes').addEventListener('click', () => {
      this.renderMyQuizzesModal();
      document.getElementById('modal-my-quizzes').classList.add('open');
      window.sfx.playPop();
    });

    document.getElementById('btn-close-my-quizzes-modal').addEventListener('click', () => {
      document.getElementById('modal-my-quizzes').classList.remove('open');
    });

    // Play Modal
    document.getElementById('btn-home-play-modal').addEventListener('click', () => {
      document.getElementById('modal-play-code').classList.add('open');
      document.getElementById('modal-input-code').focus();
      window.sfx.playPop();
    });

    document.getElementById('btn-close-play-modal').addEventListener('click', () => {
      document.getElementById('modal-play-code').classList.remove('open');
    });

    // Modal forms
    document.getElementById('form-modal-play-code').addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('modal-input-code').value.trim().toUpperCase();
      if (code) {
        document.getElementById('modal-play-code').classList.remove('open');
        this.navigate(`play/${code}`);
      }
    });

    document.getElementById('form-quick-join').addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('input-quick-code').value.trim().toUpperCase();
      if (code) {
        this.navigate(`play/${code}`);
      }
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });

    // Create Screen Events
    document.getElementById('btn-add-question').addEventListener('click', () => {
      this.addQuestionToBuilder();
      window.sfx.playPop();
    });

    document.getElementById('btn-add-sample-question').addEventListener('click', () => {
      this.addSampleQuestionToBuilder();
      window.sfx.playPop();
    });

    document.getElementById('form-create-quiz').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateQuizSubmit();
    });

    // Play Screen Form
    document.getElementById('form-start-quiz').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleStartQuiz();
    });

    // Copy Button on Created Page
    document.getElementById('btn-copy-quiz-link').addEventListener('click', () => {
      this.copyShareLink();
    });

    // Result Screen Buttons
    document.getElementById('btn-result-try-again').addEventListener('click', () => {
      if (this.gameState.quizId) {
        this.navigate(`play/${this.gameState.quizId}`);
      }
    });

    document.getElementById('btn-result-view-leaderboard').addEventListener('click', () => {
      if (this.gameState.quizId) {
        this.navigate(`leaderboard/${this.gameState.quizId}`);
      }
    });

    // Leaderboard Screen Buttons
    document.getElementById('btn-lb-share-quiz').addEventListener('click', () => {
      if (this.activeQuiz) {
        const shareUrl = this.getShareUrl(this.activeQuiz.id);
        this.copyToClipboard(shareUrl, 'Quiz share link copied! ✨');
      }
    });

    document.getElementById('btn-lb-play-quiz').addEventListener('click', () => {
      if (this.activeQuiz) {
        this.navigate(`play/${this.activeQuiz.id}`);
      }
    });
  }

  updateSoundToggleUI() {
    const enabled = window.db.isSoundEnabled();
    const soundIcon = document.getElementById('sound-icon');
    if (soundIcon) {
      soundIcon.textContent = enabled ? '🔊' : '🔇';
    }
  }

  getShareUrl(quizId) {
    const base = window.location.origin + window.location.pathname;
    return `${base}#play/${quizId}`;
  }

  copyToClipboard(text, successMsg = 'Copied to clipboard! 📋') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(successMsg, '🎉');
      }).catch(() => {
        this._fallbackCopy(text, successMsg);
      });
    } else {
      this._fallbackCopy(text, successMsg);
    }
  }

  _fallbackCopy(text, successMsg) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      this.showToast(successMsg, '🎉');
    } catch (err) {
      this.showToast('Please copy the link manually', '⚠️');
    }
    document.body.removeChild(tempInput);
  }

  // =========================================================================
  // 2. CREATE QUIZ BUILDER LOGIC
  // =========================================================================
  setupCreateScreen() {
    const list = document.getElementById('question-cards-list');
    // If builder questions array is empty or list has no cards, initialize default 2 questions
    if (this.builderQuestions.length === 0 || !list || list.children.length === 0) {
      if (this.builderQuestions.length === 0) {
        this.builderQuestions = [
          {
            id: 'b_q_' + Date.now() + '_1',
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0
          },
          {
            id: 'b_q_' + Date.now() + '_2',
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0
          }
        ];
      }
      this.renderFullQuestionBuilder();
    }
  }

  renderFullQuestionBuilder() {
    const container = document.getElementById('question-cards-list');
    if (!container) return;

    container.innerHTML = '';
    this.builderQuestions.forEach((q, idx) => {
      const card = this.createQuestionCardElement(q, idx);
      container.appendChild(card);
    });

    this.updateBuilderUI();
  }

  createQuestionCardElement(q, index) {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `card_${q.id}`;
    card.dataset.id = q.id;

    const letters = ['A', 'B', 'C', 'D'];

    card.innerHTML = `
      <div class="question-card-header">
        <div class="question-number-pill">
          <span>✨</span> <span class="q-num-label">Question #${index + 1}</span>
        </div>
        <button type="button" class="btn-remove-q" title="Remove this question">✕ Remove</button>
      </div>

      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label class="form-label" style="font-size: 0.9rem;">
          Question Text <span class="req">*</span>
        </label>
        <input 
          type="text" 
          class="input-field input-question-text" 
          placeholder="e.g. What is my favorite comfort food?" 
          value="${this.escapeHtml(q.question)}" 
          maxlength="140"
          autocomplete="off"
        />
      </div>

      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-top: 1rem;">
        Answer Options (Fill all 4) <span class="req">*</span>
      </div>

      <div class="options-builder-grid">
        ${letters.map((letter, optIdx) => {
          const isCorrect = q.correctAnswer === optIdx;
          return `
            <div class="option-builder-item ${isCorrect ? 'is-correct' : ''}" data-opt-idx="${optIdx}">
              <div class="option-letter">${letter}</div>
              <input 
                type="text" 
                class="option-input" 
                placeholder="Option ${letter}..." 
                value="${this.escapeHtml(q.options[optIdx] || '')}" 
                maxlength="80"
                autocomplete="off"
              />
            </div>
          `;
        }).join('')}
      </div>

      <div class="correct-selector-bar">
        <span class="correct-selector-label">Select Correct Answer:</span>
        <div class="correct-pills">
          ${letters.map((letter, optIdx) => `
            <label class="correct-pill">
              <input 
                type="radio" 
                name="correct_radio_${q.id}" 
                value="${optIdx}" 
                ${q.correctAnswer === optIdx ? 'checked' : ''}
              />
              <span>${letter}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Live Event Listeners to keep object in sync at all times
    const qInput = card.querySelector('.input-question-text');
    qInput.addEventListener('input', (e) => {
      q.question = e.target.value;
    });
    qInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    });

    const optInputs = card.querySelectorAll('.option-input');
    optInputs.forEach((optInput, optIdx) => {
      optInput.addEventListener('input', (e) => {
        q.options[optIdx] = e.target.value;
      });
      optInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.preventDefault();
      });
    });

    const radios = card.querySelectorAll(`input[name="correct_radio_${q.id}"]`);
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        q.correctAnswer = val;
        const items = card.querySelectorAll('.option-builder-item');
        items.forEach((item, itemIdx) => {
          item.classList.toggle('is-correct', itemIdx === val);
        });
        window.sfx.playSelect();
      });
    });

    const removeBtn = card.querySelector('.btn-remove-q');
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeQuestionFromBuilder(q.id);
    });

    return card;
  }

  addQuestionToBuilder(data = null) {
    if (this.builderQuestions.length >= 30) {
      this.showToast('Maximum 30 questions allowed!', '⚠️');
      return;
    }

    const newQuestion = data || {
      id: 'b_q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };

    this.builderQuestions.push(newQuestion);

    const container = document.getElementById('question-cards-list');
    if (container) {
      const card = this.createQuestionCardElement(newQuestion, this.builderQuestions.length - 1);
      container.appendChild(card);

      this.updateBuilderUI();

      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = card.querySelector('.input-question-text');
        if (input) input.focus();
      }, 60);
    }
  }

  addSampleQuestionToBuilder() {
    if (this.builderQuestions.length >= 30) {
      this.showToast('Maximum 30 questions allowed!', '⚠️');
      return;
    }
    const randomSample = FRIENDSHIP_IDEAS[Math.floor(Math.random() * FRIENDSHIP_IDEAS.length)];
    const sampleClone = {
      id: 'b_q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      question: randomSample.question,
      options: [...randomSample.options],
      correctAnswer: randomSample.correctAnswer
    };
    this.addQuestionToBuilder(sampleClone);
    this.showToast('Added inspiration question! 💡', '✨');
  }

  removeQuestionFromBuilder(questionId) {
    if (this.builderQuestions.length <= 2) {
      this.showToast('A quiz must have at least 2 questions!', '⚠️');
      return;
    }

    const index = this.builderQuestions.findIndex(q => q.id === questionId);
    if (index !== -1) {
      this.builderQuestions.splice(index, 1);
    }

    const card = document.getElementById(`card_${questionId}`);
    if (card) {
      card.style.transition = 'all 0.25s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      setTimeout(() => {
        card.remove();
        this.updateBuilderUI();
      }, 250);
    } else {
      this.updateBuilderUI();
    }

    window.sfx.playWhoosh();
  }

  updateBuilderUI() {
    const counter = document.getElementById('question-count-text');
    if (counter) {
      counter.textContent = `Questions: ${this.builderQuestions.length} / 30 (Min: 2, Max: 30)`;
    }

    // Update Question # labels and remove buttons
    const container = document.getElementById('question-cards-list');
    if (container) {
      const cards = container.querySelectorAll('.question-card');
      const isMoreThanTwo = this.builderQuestions.length > 2;
      cards.forEach((card, idx) => {
        const label = card.querySelector('.q-num-label');
        if (label) label.textContent = `Question #${idx + 1}`;

        const removeBtn = card.querySelector('.btn-remove-q');
        if (removeBtn) {
          removeBtn.style.display = isMoreThanTwo ? 'inline-flex' : 'none';
        }
      });
    }
  }

  handleCreateQuizSubmit() {
    const creatorNameInput = document.getElementById('input-creator-name');
    const quizTitleInput = document.getElementById('input-quiz-title');
    const quizDescInput = document.getElementById('input-quiz-desc');

    const creatorName = creatorNameInput ? creatorNameInput.value.trim() : '';
    const quizTitle = quizTitleInput ? quizTitleInput.value.trim() : '';
    const quizDesc = quizDescInput ? quizDescInput.value.trim() : '';

    // Validations
    if (!creatorName) {
      this.showToast('Please enter your name!', '⚠️');
      if (creatorNameInput) creatorNameInput.focus();
      return;
    }

    if (!quizTitle) {
      this.showToast('Please enter a quiz title!', '⚠️');
      if (quizTitleInput) quizTitleInput.focus();
      return;
    }

    if (this.builderQuestions.length < 2) {
      this.showToast('Please add at least 2 questions!', '⚠️');
      return;
    }

    if (this.builderQuestions.length > 30) {
      this.showToast('Maximum 30 questions allowed!', '⚠️');
      return;
    }

    for (let i = 0; i < this.builderQuestions.length; i++) {
      const q = this.builderQuestions[i];
      if (!q.question.trim()) {
        this.showToast(`Question #${i + 1} text cannot be empty!`, '⚠️');
        return;
      }

      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          const letter = ['A', 'B', 'C', 'D'][j];
          this.showToast(`Question #${i + 1}: Option ${letter} cannot be empty!`, '⚠️');
          return;
        }
      }

      if (q.correctAnswer < 0 || q.correctAnswer > 3) {
        this.showToast(`Question #${i + 1}: Please select a correct answer (A, B, C, or D)!`, '⚠️');
        return;
      }
    }

    // Save quiz to localStorage
    const newQuiz = window.db.saveQuiz({
      creatorName: creatorName,
      title: quizTitle,
      description: quizDesc,
      questions: this.builderQuestions.map((q, i) => ({
        id: 'q_' + (i + 1),
        question: q.question.trim(),
        options: q.options.map(o => o.trim()),
        correctAnswer: q.correctAnswer
      }))
    });

    // Reset builder state for future creates
    this.builderQuestions = [];
    if (creatorNameInput) creatorNameInput.value = '';
    if (quizTitleInput) quizTitleInput.value = '';
    if (quizDescInput) quizDescInput.value = '';
    const container = document.getElementById('question-cards-list');
    if (container) container.innerHTML = '';

    window.sfx.playFanfare();
    window.confetti.launch({ count: 140, useEmojis: true });

    this.showToast('Quiz created successfully! 🎉', '🚀');
    this.navigate(`created/${newQuiz.id}`);
  }

  // =========================================================================
  // 3. QUIZ CREATED SCREEN
  // =========================================================================
  setupCreatedScreen(quizId) {
    const quiz = window.db.getQuiz(quizId);
    if (!quiz) {
      this.showNotFound(quizId);
      return;
    }

    this.activeQuiz = quiz;
    this.showScreen('screen-created');

    document.getElementById('created-quiz-id').textContent = quiz.id;
    const shareUrl = this.getShareUrl(quiz.id);
    document.getElementById('created-share-url-input').value = shareUrl;

    const playSelfBtn = document.getElementById('btn-created-play-self');
    playSelfBtn.href = `#play/${quiz.id}`;

    const viewLbBtn = document.getElementById('btn-created-view-leaderboard');
    viewLbBtn.href = `#leaderboard/${quiz.id}`;

    // Social share links
    const shareText = encodeURIComponent(`Take my friendship quiz "${quiz.title}" and see how well you really know me! 💖\n${shareUrl}`);
    
    document.getElementById('btn-share-whatsapp').onclick = () => {
      window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
    };

    document.getElementById('btn-share-telegram').onclick = () => {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(quiz.title)}`, '_blank');
    };

    document.getElementById('btn-share-twitter').onclick = () => {
      window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank');
    };

    document.getElementById('btn-native-share').onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: quiz.title,
          text: `How well do you know ${quiz.creatorName}? Take the quiz!`,
          url: shareUrl
        }).catch(() => {});
      } else {
        this.copyShareLink();
      }
    };
  }

  copyShareLink(explicitQuizId = null) {
    const qId = explicitQuizId || (this.activeQuiz ? this.activeQuiz.id : null);
    const input = document.getElementById('created-share-url-input');
    const copyBtnText = document.getElementById('copy-btn-text');
    const shareUrl = qId ? this.getShareUrl(qId) : (input ? input.value : window.location.href);

    this.copyToClipboard(shareUrl, 'Quiz link copied! Send it to your friends 🎉');
    if (copyBtnText) {
      copyBtnText.textContent = 'Copied! ✨';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
      }, 2500);
    }
  }

  // =========================================================================
  // 4. PLAY QUIZ SCREEN & LIVE GAME ENGINE
  // =========================================================================
  setupPlayScreen(quizId) {
    const quiz = window.db.getQuiz(quizId);
    if (!quiz) {
      this.showNotFound(quizId);
      return;
    }

    this.activeQuiz = quiz;
    this.gameState = {
      playerName: '',
      quizId: quiz.id,
      currentQuestionIndex: 0,
      userAnswers: [],
      score: 0
    };

    this.showScreen('screen-play');

    // Show welcome card, hide game card
    document.getElementById('play-welcome-view').style.display = 'block';
    document.getElementById('play-game-view').style.display = 'none';

    document.getElementById('play-creator-name').textContent = quiz.creatorName;
    document.getElementById('play-quiz-title').textContent = quiz.title;
    document.getElementById('play-quiz-desc').textContent = quiz.description || 'Answer truthfully to see how well you know them!';
    document.getElementById('play-total-questions-count').textContent = quiz.questions.length;

    const nameInput = document.getElementById('input-player-name');
    nameInput.value = '';
    nameInput.focus();
  }

  handleStartQuiz() {
    const nameInput = document.getElementById('input-player-name');
    const playerName = nameInput.value.trim();

    if (!playerName) {
      this.showToast('Please enter your name!', '⚠️');
      nameInput.focus();
      return;
    }

    this.gameState.playerName = playerName;
    this.gameState.currentQuestionIndex = 0;
    this.gameState.userAnswers = [];
    this.gameState.score = 0;

    window.sfx.playSelect();

    // Transition from welcome card to active game view
    document.getElementById('play-welcome-view').style.display = 'none';
    document.getElementById('play-game-view').style.display = 'block';

    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    const quiz = this.activeQuiz;
    const qIndex = this.gameState.currentQuestionIndex;
    const totalQ = quiz.questions.length;

    if (qIndex >= totalQ) {
      this.finishQuiz();
      return;
    }

    const currentQ = quiz.questions[qIndex];

    // Update Progress
    const pct = Math.round(((qIndex + 1) / totalQ) * 100);
    document.getElementById('game-q-counter').textContent = `Question ${qIndex + 1} of ${totalQ}`;
    document.getElementById('game-q-percent').textContent = `${pct}%`;
    document.getElementById('game-progress-bar').style.width = `${pct}%`;

    // Question Text
    document.getElementById('game-question-text').textContent = currentQ.question;
    document.getElementById('game-feedback-text').textContent = '';

    // Render Options
    const optionsContainer = document.getElementById('game-options-container');
    optionsContainer.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];

    currentQ.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'game-option-btn';
      btn.innerHTML = `
        <div class="option-tag">${letters[optIdx]}</div>
        <span style="flex: 1;">${this.escapeHtml(optText)}</span>
      `;

      btn.addEventListener('click', () => {
        this.handleAnswerSelection(optIdx, btn);
      });

      optionsContainer.appendChild(btn);
    });
  }

  handleAnswerSelection(selectedIndex, clickedBtn) {
    const quiz = this.activeQuiz;
    const qIndex = this.gameState.currentQuestionIndex;
    const currentQ = quiz.questions[qIndex];

    // Highlight selected option
    const allOptionBtns = document.querySelectorAll('.game-option-btn');
    allOptionBtns.forEach(btn => {
      btn.disabled = true;
    });
    clickedBtn.classList.add('selected');

    // Record answer
    this.gameState.userAnswers.push(selectedIndex);

    // Score calculation (do NOT reveal correct answer to player)
    if (selectedIndex === currentQ.correctAnswer) {
      this.gameState.score++;
    }

    window.sfx.playSelect();

    const feedbackText = document.getElementById('game-feedback-text');
    feedbackText.textContent = '✨ Moving to next question...';

    // Delay 650ms then proceed to next question
    setTimeout(() => {
      this.gameState.currentQuestionIndex++;
      this.renderCurrentQuestion();
    }, 650);
  }

  finishQuiz() {
    const quiz = this.activeQuiz;
    const score = this.gameState.score;
    const total = quiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    // Save result to storage
    const savedResult = window.db.saveResult(quiz.id, {
      playerName: this.gameState.playerName,
      score: score,
      total: total,
      answers: this.gameState.userAnswers
    });

    this.navigate(`result/${quiz.id}/${savedResult.id}`);
  }

  // =========================================================================
  // 5. RESULT SCREEN
  // =========================================================================
  setupResultScreen(quizId, resultId) {
    const quiz = window.db.getQuiz(quizId);
    if (!quiz) {
      this.showNotFound(quizId);
      return;
    }

    this.activeQuiz = quiz;
    this.gameState.quizId = quiz.id;

    // Find the result
    const result = (quiz.results || []).find(r => r.id === resultId) || {
      playerName: this.gameState.playerName || 'Player',
      score: this.gameState.score || 0,
      total: quiz.questions.length,
      percentage: Math.round(((this.gameState.score || 0) / (quiz.questions.length || 1)) * 100)
    };

    this.showScreen('screen-result');

    const score = result.score;
    const total = result.total;
    const pct = result.percentage;
    const incorrect = Math.max(0, total - score);

    document.getElementById('result-player-name').textContent = `${result.playerName}'s Score`;
    document.getElementById('result-score-num').textContent = score;
    document.getElementById('result-score-total').textContent = total;
    document.getElementById('result-score-pct').textContent = `${pct}%`;

    document.getElementById('result-correct-count').textContent = score;
    document.getElementById('result-incorrect-count').textContent = incorrect;
    document.getElementById('result-total-count').textContent = total;

    // Personalized Quotes based on requirements
    let quote = '';
    let emoji = '💖';

    if (pct <= 30) {
      quote = 'Do you guys even know each other? 😂';
      emoji = '💀';
    } else if (pct <= 60) {
      quote = 'Not bad... but you need to pay more attention 👀';
      emoji = '🧐';
    } else if (pct <= 80) {
      quote = 'Okay, you actually know them! 😎';
      emoji = '✨';
    } else if (pct <= 99) {
      quote = 'Bestie level unlocked! 🫶';
      emoji = '💖';
    } else {
      // 100%
      quote = 'BEST FRIEND CERTIFIED! 🏆❤️';
      emoji = '🏆';
    }

    document.getElementById('result-message-quote').textContent = `"${quote}"`;
    document.getElementById('result-badge-emoji').textContent = emoji;

    // Celebration sounds and confetti
    if (pct === 100) {
      window.sfx.playFanfare();
      window.confetti.launch({ count: 200, useEmojis: true });
      setTimeout(() => {
        window.confetti.launch({ count: 100 });
      }, 700);
    } else if (pct >= 60) {
      window.sfx.playSuccess();
      window.confetti.launch({ count: 80 });
    } else {
      window.sfx.playPop();
    }
  }

  // =========================================================================
  // 6. CREATOR RESULTS / LEADERBOARD
  // =========================================================================
  setupLeaderboardScreen(quizId) {
    const quiz = window.db.getQuiz(quizId);
    if (!quiz) {
      this.showNotFound(quizId);
      return;
    }

    this.activeQuiz = quiz;
    this.showScreen('screen-leaderboard');

    document.getElementById('lb-quiz-title').textContent = quiz.title;
    document.getElementById('lb-quiz-creator-sub').textContent = `Created by ${quiz.creatorName}`;

    const results = (quiz.results || []).slice();
    // Sort highest score first, then newest
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const totalParticipants = results.length;
    let avgPct = 0;
    let highPct = 0;

    if (totalParticipants > 0) {
      const sumPct = results.reduce((acc, r) => acc + (r.percentage || 0), 0);
      avgPct = Math.round(sumPct / totalParticipants);
      highPct = Math.max(...results.map(r => r.percentage || 0));
    }

    document.getElementById('lb-total-participants').textContent = totalParticipants;
    document.getElementById('lb-avg-score').textContent = `${avgPct}%`;
    document.getElementById('lb-high-score').textContent = `${highPct}%`;

    const listContainer = document.getElementById('lb-list');
    listContainer.innerHTML = '';

    if (results.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-leaderboard">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">💌</div>
          <h3 style="font-weight: 800; margin-bottom: 0.4rem;">No players yet!</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
            Share your quiz link with friends to start ranking on the leaderboard.
          </p>
          <button type="button" class="btn btn-primary btn-sm" onclick="app.copyShareLink()">
            📋 Copy Quiz Link
          </button>
        </div>
      `;
      return;
    }

    results.forEach((r, idx) => {
      const rank = idx + 1;
      let rankIcon = `#${rank}`;
      let rankClass = '';

      if (rank === 1) {
        rankIcon = '🥇';
        rankClass = 'rank-1';
      } else if (rank === 2) {
        rankIcon = '🥈';
        rankClass = 'rank-2';
      } else if (rank === 3) {
        rankIcon = '🥉';
        rankClass = 'rank-3';
      }

      const timeAgo = this.formatTimeAgo(r.createdAt || Date.now());

      const row = document.createElement('div');
      row.className = `leaderboard-row ${rankClass}`;
      row.innerHTML = `
        <div class="player-info-left">
          <div class="rank-badge">${rankIcon}</div>
          <div>
            <div class="player-name">${this.escapeHtml(r.playerName)}</div>
            <div class="player-time">${timeAgo}</div>
          </div>
        </div>
        <div class="player-score-right">
          <div class="player-score-tag">${r.score} / ${r.total || quiz.questions.length}</div>
          <div class="player-pct-tag">${r.percentage}% accuracy</div>
        </div>
      `;
      listContainer.appendChild(row);
    });
  }

  // =========================================================================
  // MY QUIZZES MODAL
  // =========================================================================
  renderMyQuizzesModal() {
    const container = document.getElementById('my-quizzes-container');
    if (!container) return;

    const myQuizzes = window.db.getMyQuizzes();

    if (myQuizzes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✍️</div>
          <p style="font-weight: 700;">You haven't created any quizzes yet!</p>
          <a href="#create" class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="document.getElementById('modal-my-quizzes').classList.remove('open')">
            Create One Now ✨
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="my-quizzes-list">
        ${myQuizzes.map(q => {
          const resCount = (q.results || []).length;
          return `
            <div class="my-quiz-item">
              <div class="my-quiz-details">
                <h4>${this.escapeHtml(q.title)}</h4>
                <div class="my-quiz-meta">
                  Code: <b>${q.id}</b> • ${q.questions.length} Questions • ${resCount} ${resCount === 1 ? 'Response' : 'Responses'}
                </div>
              </div>
              <div class="my-quiz-actions">
                <a href="#leaderboard/${q.id}" class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-my-quizzes').classList.remove('open')">
                  🏆
                </a>
                <a href="#play/${q.id}" class="btn btn-primary btn-sm" onclick="document.getElementById('modal-my-quizzes').classList.remove('open')">
                  🎮
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // =========================================================================
  // HELPERS
  // =========================================================================
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Recently';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BestieQuizApp();
});
