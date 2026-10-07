/**
 * storage.js - Database Access Object (DAO) for LocalStorage
 * Designed for frictionless future migration to Firebase Firestore or MongoDB.
 */

const STORAGE_KEYS = {
  QUIZZES: 'bestie_quiz_quizzes_v1',
  MY_CREATED_IDS: 'bestie_quiz_my_created_ids_v1',
  SOUND_ENABLED: 'bestie_quiz_sound_enabled_v1'
};

class StorageDB {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
      // Seed initial sample quiz so users can play and explore immediately
      const sampleQuiz = {
        id: "QZ7K29",
        creatorName: "Pooja",
        title: "How Well Do You Know Pooja? 💖",
        description: "Let's see who my true bestie is! No cheating allowed 👀",
        createdAt: Date.now() - 3600000 * 24,
        questions: [
          {
            id: "q_1",
            question: "What is my absolute favorite comfort food?",
            options: ["Cheesy Pizza 🍕", "Spicy Ramen 🍜", "Hyderabadi Biryani 🍛", "Chocolate Cake 🍰"],
            correctAnswer: 2 // Biryani
          },
          {
            id: "q_2",
            question: "Am I a morning person or a night owl?",
            options: ["Morning lark up at 6 AM 🌅", "Creature of the midnight hours 🦉", "I sleep 14 hours anytime 😴", "Depends on coffee ☕"],
            correctAnswer: 1 // Night owl
          },
          {
            id: "q_3",
            question: "What is my dream travel vacation?",
            options: ["Backpacking Europe 🎒", "Chilling in Switzerland 🏔️", "Beach resort in Maldives 🏖️", "Tokyo anime & street food tour 🗼"],
            correctAnswer: 3 // Tokyo
          },
          {
            id: "q_4",
            question: "What is my biggest pet peeve?",
            options: ["Slow walkers in crowds 🚶", "Chewing loudly 👄", "Leaving messages on read 📱", "Being late without texting ⏰"],
            correctAnswer: 2 // Left on read
          },
          {
            id: "q_5",
            question: "If I won a million dollars tomorrow, what would I buy first?",
            options: ["A luxury sports car 🏎️", "Adopt 10 puppies 🐶", "A cute cozy dream house 🏡", "Travel the world non-stop ✈️"],
            correctAnswer: 2 // Dream house
          }
        ],
        results: [
          {
            id: "res_sample_1",
            playerName: "Ananya",
            score: 5,
            total: 5,
            percentage: 100,
            answers: [2, 1, 3, 2, 2],
            createdAt: Date.now() - 3600000 * 18
          },
          {
            id: "res_sample_2",
            playerName: "Riya",
            score: 4,
            total: 5,
            percentage: 80,
            answers: [2, 1, 3, 0, 2],
            createdAt: Date.now() - 3600000 * 12
          },
          {
            id: "res_sample_3",
            playerName: "Rahul",
            score: 3,
            total: 5,
            percentage: 60,
            answers: [0, 1, 3, 2, 0],
            createdAt: Date.now() - 3600000 * 6
          },
          {
            id: "res_sample_4",
            playerName: "Dev",
            score: 2,
            total: 5,
            percentage: 40,
            answers: [1, 0, 2, 3, 2],
            createdAt: Date.now() - 3600000 * 2
          }
        ]
      };

      const initialMap = { [sampleQuiz.id]: sampleQuiz };
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(initialMap));
      localStorage.setItem(STORAGE_KEYS.MY_CREATED_IDS, JSON.stringify(["QZ7K29"]));
    }
  }

  /**
   * Helper to generate a 6-character clean unique ID
   */
  generateQuizId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I, 1, O, 0
    let id = 'QZ';
    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // ensure unique
    if (this.getQuiz(id)) {
      return this.generateQuizId();
    }
    return id;
  }

  generateResultId() {
    return 'res_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  /**
   * Retrieve all quizzes as an object map { [quizId]: quiz }
   */
  getAllQuizzes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading quizzes from localStorage:', e);
      return {};
    }
  }

  /**
   * Get a single quiz by ID (case-insensitive search)
   */
  getQuiz(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toUpperCase();
    const quizzes = this.getAllQuizzes();
    return quizzes[cleanId] || null;
  }

  /**
   * Save a newly created quiz
   */
  saveQuiz(quizData) {
    try {
      const quizzes = this.getAllQuizzes();
      const id = quizData.id ? quizData.id.toUpperCase() : this.generateQuizId();
      
      const newQuiz = {
        id: id,
        creatorName: quizData.creatorName.trim(),
        title: quizData.title.trim(),
        description: quizData.description ? quizData.description.trim() : '',
        createdAt: quizData.createdAt || Date.now(),
        questions: quizData.questions || [],
        results: quizData.results || []
      };

      quizzes[id] = newQuiz;
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));

      // Add to my created IDs list
      this.markAsMyQuiz(id);

      return newQuiz;
    } catch (e) {
      console.error('Error saving quiz:', e);
      throw new Error('Failed to save quiz to localStorage');
    }
  }

  /**
   * Save player's quiz attempt result
   */
  saveResult(quizId, resultData) {
    try {
      const quiz = this.getQuiz(quizId);
      if (!quiz) throw new Error(`Quiz with ID ${quizId} not found`);

      const result = {
        id: resultData.id || this.generateResultId(),
        playerName: resultData.playerName.trim(),
        score: Number(resultData.score) || 0,
        total: Number(resultData.total) || quiz.questions.length,
        percentage: Math.round(((Number(resultData.score) || 0) / (quiz.questions.length || 1)) * 100),
        answers: resultData.answers || [],
        createdAt: Date.now()
      };

      quiz.results = quiz.results || [];
      quiz.results.push(result);

      const quizzes = this.getAllQuizzes();
      quizzes[quiz.id] = quiz;
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));

      return result;
    } catch (e) {
      console.error('Error saving result:', e);
      throw e;
    }
  }

  /**
   * Track quizzes created on this browser
   */
  markAsMyQuiz(quizId) {
    try {
      const list = this.getMyCreatedQuizIds();
      if (!list.includes(quizId)) {
        list.unshift(quizId);
        localStorage.setItem(STORAGE_KEYS.MY_CREATED_IDS, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error tracking created quiz:', e);
    }
  }

  getMyCreatedQuizIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MY_CREATED_IDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getMyQuizzes() {
    const ids = this.getMyCreatedQuizIds();
    const all = this.getAllQuizzes();
    return ids.map(id => all[id]).filter(Boolean);
  }

  /**
   * Delete a quiz (useful for creator management)
   */
  deleteQuiz(quizId) {
    try {
      const cleanId = String(quizId).trim().toUpperCase();
      const quizzes = this.getAllQuizzes();
      if (quizzes[cleanId]) {
        delete quizzes[cleanId];
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
      }
      let myIds = this.getMyCreatedQuizIds();
      myIds = myIds.filter(id => id !== cleanId);
      localStorage.setItem(STORAGE_KEYS.MY_CREATED_IDS, JSON.stringify(myIds));
      return true;
    } catch (e) {
      console.error('Error deleting quiz:', e);
      return false;
    }
  }

  /**
   * Sound preferences
   */
  isSoundEnabled() {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val === null ? true : val === 'true';
  }

  setSoundEnabled(enabled) {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  }
}

// Global singleton instance
window.db = new StorageDB();
