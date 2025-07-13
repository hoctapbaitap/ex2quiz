/**
 * Quiz Taking Application
 */
class QuizApp {
    constructor() {
        this.quizManager = new QuizManager();
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.timeRemaining = 0;
        this.timer = null;
        this.isPaused = false;
        this.startTime = null;
        this.viewMode = 'single'; // 'single' or 'all'

        this.initializeElements();
        this.bindEvents();
        this.loadMathJax(); // Load MathJax early
        this.initializeApp();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.screens = {
            selection: document.getElementById('quizSelectionScreen'),
            taking: document.getElementById('quizTakingScreen'),
            result: document.getElementById('quizResultScreen')
        };

        this.elements = {
            // Selection screen
            quizSelectionGrid: document.getElementById('quizSelectionGrid'),
            
            // Taking screen
            quizTitle: document.getElementById('quizTitle'),
            questionProgress: document.getElementById('questionProgress'),
            timeRemaining: document.getElementById('timeRemaining'),
            currentQuestionNumber: document.getElementById('currentQuestionNumber'),
            questionText: document.getElementById('questionText'),
            questionChoices: document.getElementById('questionChoices'),
            questionGrid: document.getElementById('questionGrid'),
            answeredCount: document.getElementById('answeredCount'),
            remainingCount: document.getElementById('remainingCount'),

            // View containers
            singleQuestionContainer: document.getElementById('singleQuestionContainer'),
            allQuestionsContainer: document.getElementById('allQuestionsContainer'),
            allQuestionsContent: document.getElementById('allQuestionsContent'),
            
            // Navigation
            prevQuestionBtn: document.getElementById('prevQuestionBtn'),
            nextQuestionBtn: document.getElementById('nextQuestionBtn'),
            viewModeBtn: document.getElementById('viewModeBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            submitQuizBtn: document.getElementById('submitQuizBtn'),
            
            // Result screen
            resultIcon: document.getElementById('resultIcon'),
            resultTitle: document.getElementById('resultTitle'),
            resultSubtitle: document.getElementById('resultSubtitle'),
            finalScore: document.getElementById('finalScore'),
            finalPercentage: document.getElementById('finalPercentage'),
            finalCorrect: document.getElementById('finalCorrect'),
            finalTime: document.getElementById('finalTime'),
            resultDetails: document.getElementById('resultDetails'),
            
            // Result actions
            reviewAnswersBtn: document.getElementById('reviewAnswersBtn'),
            retakeQuizBtn: document.getElementById('retakeQuizBtn'),
            backToSelectionBtn: document.getElementById('backToSelectionBtn'),
            
            // Modals
            pauseModal: document.getElementById('pauseModal'),
            submitModal: document.getElementById('submitModal'),
            resumeQuizBtn: document.getElementById('resumeQuizBtn'),
            quitQuizBtn: document.getElementById('quitQuizBtn'),
            cancelSubmitBtn: document.getElementById('cancelSubmitBtn'),
            confirmSubmitBtn: document.getElementById('confirmSubmitBtn'),
            
            // Modal stats
            pauseAnsweredCount: document.getElementById('pauseAnsweredCount'),
            pauseTimeRemaining: document.getElementById('pauseTimeRemaining'),
            submitAnsweredCount: document.getElementById('submitAnsweredCount'),
            submitRemainingCount: document.getElementById('submitRemainingCount')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation
        this.elements.prevQuestionBtn.addEventListener('click', () => this.previousQuestion());
        this.elements.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());

        // Quiz controls
        this.elements.viewModeBtn.addEventListener('click', () => this.toggleViewMode());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseQuiz());
        this.elements.submitQuizBtn.addEventListener('click', () => this.showSubmitModal());
        
        // Modal controls
        this.elements.resumeQuizBtn.addEventListener('click', () => this.resumeQuiz());
        this.elements.quitQuizBtn.addEventListener('click', () => this.quitQuiz());
        this.elements.cancelSubmitBtn.addEventListener('click', () => this.hideSubmitModal());
        this.elements.confirmSubmitBtn.addEventListener('click', () => this.submitQuiz());
        
        // Result actions
        this.elements.reviewAnswersBtn.addEventListener('click', () => this.reviewAnswers());
        this.elements.retakeQuizBtn.addEventListener('click', () => this.retakeQuiz());
        this.elements.backToSelectionBtn.addEventListener('click', () => this.showSelectionScreen());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentQuiz && this.screens.taking.style.display !== 'none') {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousQuestion();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextQuestion();
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                        e.preventDefault();
                        this.selectChoice(parseInt(e.key) - 1);
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.pauseQuiz();
                        break;
                }
            }
        });

        // Prevent page refresh during quiz
        window.addEventListener('beforeunload', (e) => {
            if (this.currentQuiz && !this.isPaused) {
                e.preventDefault();
                e.returnValue = 'Bạn có chắc muốn rời khỏi trang? Tiến trình quiz sẽ bị mất.';
            }
        });
    }

    /**
     * Initialize application
     */
    initializeApp() {
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        
        if (quizId) {
            this.loadQuiz(quizId);
        } else {
            this.showSelectionScreen();
        }
    }

    /**
     * Show quiz selection screen
     */
    showSelectionScreen() {
        this.hideAllScreens();
        this.screens.selection.style.display = 'block';
        this.loadQuizList();
        
        // Update URL
        window.history.pushState({}, '', 'quiz.html');
    }

    /**
     * Load and display quiz list
     */
    loadQuizList() {
        const quizzes = this.quizManager.getAllQuizzes();
        const container = this.elements.quizSelectionGrid;
        
        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-quiz-list">
                    <i class="fas fa-folder-open"></i>
                    <h3>Chưa có quiz nào</h3>
                    <p>Vui lòng tạo quiz từ trang Dashboard trước</p>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Tạo Quiz
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = quizzes.map(quiz => `
            <div class="quiz-card" onclick="quizApp.loadQuiz('${quiz.id}')">
                <div class="quiz-card-header">
                    <h3>${quiz.title}</h3>
                    <div class="quiz-difficulty">
                        <i class="fas fa-star"></i>
                        ${this.getQuizDifficulty(quiz)}
                    </div>
                </div>
                <div class="quiz-card-body">
                    <p>${quiz.description || 'Không có mô tả'}</p>
                    <div class="quiz-card-stats">
                        <div class="stat">
                            <i class="fas fa-question-circle"></i>
                            <span>${quiz.totalQuestions} câu hỏi</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            <span>${quiz.duration} phút</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>
                <div class="quiz-card-footer">
                    <button class="btn btn-primary btn-block">
                        <i class="fas fa-play"></i>
                        Bắt đầu thi
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Get quiz difficulty based on question count and duration
     */
    getQuizDifficulty(quiz) {
        const timePerQuestion = quiz.duration / quiz.totalQuestions;
        if (timePerQuestion < 1) return 'Khó';
        if (timePerQuestion < 2) return 'Trung bình';
        return 'Dễ';
    }

    /**
     * Load and start a quiz
     */
    loadQuiz(quizId) {
        this.showLoading(true);
        
        try {
            const quiz = this.quizManager.getQuiz(quizId);
            if (!quiz) {
                throw new Error('Không tìm thấy quiz');
            }

            this.currentQuiz = quiz;
            this.currentQuestionIndex = 0;
            this.userAnswers = {};
            this.timeRemaining = quiz.duration * 60; // Convert to seconds
            this.startTime = new Date();
            
            this.showTakingScreen();
            this.startTimer();
            this.loadQuestion();
            this.updateQuestionGrid();
            this.updateStats();
            
            // Update URL
            window.history.pushState({}, '', `quiz.html?id=${quizId}`);
            
            this.showToast(`Bắt đầu quiz: ${quiz.title}`, 'info');
            
        } catch (error) {
            console.error('Error loading quiz:', error);
            this.showToast(`Lỗi tải quiz: ${error.message}`, 'error');
            this.showSelectionScreen();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Show quiz taking screen
     */
    showTakingScreen() {
        this.hideAllScreens();
        this.screens.taking.style.display = 'block';

        // Đảm bảo MathJax đã được load trước khi render quiz
        if (!window.MathJax) {
            this.loadMathJax().then(() => {
                this.renderMath();
            });
        }

        // Set quiz info
        this.elements.quizTitle.textContent = this.currentQuiz.title;

        // Reset to single question view
        this.viewMode = 'single';
        this.elements.viewModeBtn.innerHTML = '<i class="fas fa-list"></i> Xem tất cả';
        this.showSingleQuestion();
    }

    /**
     * Toggle between single question and all questions view
     */
    toggleViewMode() {
        if (this.viewMode === 'single') {
            this.viewMode = 'all';
            this.showAllQuestions();
            this.elements.viewModeBtn.innerHTML = '<i class="fas fa-eye"></i> Xem từng câu';
        } else {
            this.viewMode = 'single';
            this.showSingleQuestion();
            this.elements.viewModeBtn.innerHTML = '<i class="fas fa-list"></i> Xem tất cả';
        }
    }

    /**
     * Show single question view
     */
    showSingleQuestion() {
        this.elements.singleQuestionContainer.style.display = 'block';
        this.elements.allQuestionsContainer.style.display = 'none';
        this.loadQuestion();
    }

    /**
     * Show all questions view
     */
    showAllQuestions() {
        this.elements.singleQuestionContainer.style.display = 'none';
        this.elements.allQuestionsContainer.style.display = 'block';
        this.loadAllQuestions();
    }

    /**
     * Load current question
     */
    loadQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        if (!question) return;

        // Update question info
        this.elements.currentQuestionNumber.textContent = `Câu ${this.currentQuestionIndex + 1}`;
        this.elements.questionProgress.textContent =
            `Câu ${this.currentQuestionIndex + 1}/${this.currentQuiz.totalQuestions}`;

        // Load question text
        this.elements.questionText.innerHTML = question.question;

        // Determine question type and choice labels
        const isTrueFalse = question.type === 'true-false';
        const isShortAnswer = question.type === 'short-answer';
        const choiceLabels = isTrueFalse ? ['a)', 'b)', 'c)', 'd)'] : ['A', 'B', 'C', 'D', 'E', 'F'];

        // Load choices based on question type
        if (isShortAnswer) {
            // For short answer questions, show input field
            const userAnswer = this.userAnswers[question.id] || '';
            this.elements.questionChoices.innerHTML = `
                <div class="short-answer-container">
                    <div class="answer-input-group">
                        <label for="short-answer-${question.id}" class="answer-label">Đáp án:</label>
                        <input type="text"
                               id="short-answer-${question.id}"
                               class="short-answer-input"
                               value="${userAnswer}"
                               placeholder="Nhập đáp án của bạn..."
                               autocomplete="off"
                               onchange="quizApp.selectShortAnswer(this.value)"
                               oninput="quizApp.selectShortAnswer(this.value)">
                    </div>
                </div>
            `;
        } else if (isTrueFalse) {
            // For true-false questions, each choice has Đ/S buttons
            this.elements.questionChoices.innerHTML = question.choices.map((choice, index) => {
                const userAnswer = this.userAnswers[question.id] || {};
                const selectedValue = userAnswer[index]; // true, false, or undefined

                return `
                    <div class="choice-item true-false">
                        <div class="true-false-content">
                            <span class="true-false-label">${choiceLabels[index] || (index + 1) + ')'}</span>
                            <div class="true-false-text">${choice.text}</div>
                        </div>
                        <div class="true-false-buttons">
                            <button type="button" class="tf-button true-btn ${selectedValue === true ? 'selected' : ''}"
                                    onclick="quizApp.selectTrueFalseAnswer(${index}, true)">
                                Đ
                            </button>
                            <button type="button" class="tf-button false-btn ${selectedValue === false ? 'selected' : ''}"
                                    onclick="quizApp.selectTrueFalseAnswer(${index}, false)">
                                S
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // For multiple choice questions, single selection
            this.elements.questionChoices.innerHTML = question.choices.map((choice, index) => `
                <div class="choice-item ${this.userAnswers[question.id] === index ? 'selected' : ''}"
                     onclick="quizApp.selectChoice(${index})">
                    <div class="choice-radio">
                        <input type="radio" name="question_${question.id}" value="${index}"
                               ${this.userAnswers[question.id] === index ? 'checked' : ''}>
                        <span class="choice-label">${choiceLabels[index] || String.fromCharCode(65 + index)}</span>
                    </div>
                    <div class="choice-text">${choice.text}</div>
                </div>
            `).join('');
        }

        // Update navigation buttons
        this.elements.prevQuestionBtn.disabled = this.currentQuestionIndex === 0;
        this.elements.nextQuestionBtn.disabled =
            this.currentQuestionIndex === this.currentQuiz.questions.length - 1;

        // Render math if available with delay to ensure DOM is ready
        setTimeout(() => {
            this.renderMath();
        }, 200);
    }

    /**
     * Load all questions in one view
     */
    loadAllQuestions() {
        if (!this.currentQuiz || !this.currentQuiz.questions) return;

        const container = this.elements.allQuestionsContent;

        // Group questions by type for section headers
        const questionsByType = this.groupQuestionsByType();

        let html = '';

        // Add section headers and questions
        Object.keys(questionsByType).forEach(type => {
            const sectionTitle = type === 'multiple-choice' ?
                'Phần I: Trắc nghiệm một lựa chọn' :
                (type === 'true-false' ? 'Phần II: Trắc nghiệm đúng - sai' :
                'Phần III: Trả lời ngắn');

            html += `<div class="question-section-header">${sectionTitle}</div>`;

            questionsByType[type].forEach(question => {
                const questionIndex = question.number - 1;
                const isTrueFalse = question.type === 'true-false';
                const isShortAnswer = question.type === 'short-answer';
                const choiceLabels = isTrueFalse ? ['a)', 'b)', 'c)', 'd)'] : ['A', 'B', 'C', 'D', 'E', 'F'];

                const hasAnswer = this.userAnswers[question.id] !== undefined;
                const isAnswered = isTrueFalse ?
                    (hasAnswer && Object.keys(this.userAnswers[question.id]).length > 0) :
                    (isShortAnswer ? (hasAnswer && this.userAnswers[question.id].trim() !== '') : hasAnswer);

                html += `
                    <div class="all-question-item ${question.type}" data-question-index="${questionIndex}">
                        <div class="all-question-header">
                            <span class="all-question-number">Câu ${question.number}</span>
                            <span class="all-question-type">${isShortAnswer ? 'Trả lời ngắn' : (isTrueFalse ? 'Đúng - Sai' : 'Trắc nghiệm')}</span>
                            <span class="all-question-status ${isAnswered ? 'answered' : 'unanswered'}">
                                <i class="fas fa-${isAnswered ? 'check-circle' : 'circle'}"></i>
                                ${isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}
                            </span>
                        </div>
                        <div class="all-question-content">
                            <div class="all-question-text">${question.question}</div>
                            <div class="all-question-choices">
                                ${isShortAnswer ? `
                                    <div class="all-short-answer-container">
                                        <div class="all-answer-input-group">
                                            <label class="all-answer-label">Đáp án:</label>
                                            <input type="text"
                                                   class="all-short-answer-input"
                                                   value="${this.userAnswers[question.id] || ''}"
                                                   placeholder="Nhập đáp án của bạn..."
                                                   autocomplete="off"
                                                   onchange="quizApp.selectShortAnswerInAllView('${question.id}', this.value)"
                                                   oninput="quizApp.selectShortAnswerInAllView('${question.id}', this.value)">
                                        </div>
                                    </div>
                                ` : (question.choices && question.choices.length > 0 ? question.choices.map((choice, choiceIndex) => {
                                    if (isTrueFalse) {
                                        const userAnswer = this.userAnswers[question.id] || {};
                                        const selectedValue = userAnswer[choiceIndex]; // true, false, or undefined

                                        return `
                                            <div class="all-choice-item true-false">
                                                <div class="all-true-false-content">
                                                    <span class="all-true-false-label">${choiceLabels[choiceIndex] || (choiceIndex + 1) + ')'}</span>
                                                    <div class="all-true-false-text">${choice.text}</div>
                                                </div>
                                                <div class="all-true-false-buttons">
                                                    <button type="button" class="all-tf-button true-btn ${selectedValue === true ? 'selected' : ''}"
                                                            onclick="quizApp.selectTrueFalseAnswerInAllView('${question.id}', ${choiceIndex}, true)">
                                                        Đ
                                                    </button>
                                                    <button type="button" class="all-tf-button false-btn ${selectedValue === false ? 'selected' : ''}"
                                                            onclick="quizApp.selectTrueFalseAnswerInAllView('${question.id}', ${choiceIndex}, false)">
                                                        S
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    } else {
                                        const isSelected = this.userAnswers[question.id] === choiceIndex;
                                        return `
                                            <div class="all-choice-item ${isSelected ? 'selected' : ''}"
                                                 onclick="quizApp.selectChoiceInAllView('${question.id}', ${choiceIndex})">
                                                <div class="all-choice-radio">
                                                    <input type="radio" name="all_question_${question.id}" value="${choiceIndex}"
                                                           ${isSelected ? 'checked' : ''}>
                                                    <span class="all-choice-label">${choiceLabels[choiceIndex] || String.fromCharCode(65 + choiceIndex)}</span>
                                                </div>
                                                <div class="all-choice-text">${choice.text}</div>
                                            </div>
                                        `;
                                    }
                                }).join('') : '<div class="no-choices">Không có đáp án để hiển thị</div>')}
                            </div>
                        </div>
                    </div>
                `;
            });
        });

        container.innerHTML = html;

        // Render math for all questions with delay to ensure DOM is ready
        setTimeout(() => {
            this.renderMath();
        }, 300);
    }

    /**
     * Group questions by type for section display
     */
    groupQuestionsByType() {
        const groups = {
            'multiple-choice': [],
            'true-false': [],
            'short-answer': []
        };

        this.currentQuiz.questions.forEach(question => {
            const type = question.type || 'multiple-choice';
            groups[type].push(question);
        });

        return groups;
    }

    /**
     * Select a choice for current question (multiple choice)
     */
    selectChoice(choiceIndex) {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        this.userAnswers[question.id] = choiceIndex;

        // Update UI
        if (this.viewMode === 'single') {
            this.loadQuestion();
            // Auto advance to next question after a short delay
            setTimeout(() => {
                if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
                    this.nextQuestion();
                }
            }, 500);
        }

        this.updateQuestionGrid();
        this.updateStats();
    }

    /**
     * Allow input for short answer (numbers, letters, common math symbols)
     */
    allowShortAnswerInput(event) {
        // Allow all input for short answer - no restrictions
        // This ensures numbers like 12,3 can be entered without issues
        return true;
    }

    /**
     * Handle paste for short answer
     */
    handleShortAnswerPaste(event) {
        // Allow paste but clean up the content
        setTimeout(() => {
            const input = event.target;
            const value = input.value;
            // Remove any potentially harmful characters but keep math symbols
            const cleanValue = value.replace(/[^\w\s\.,\-\+\*\/\(\)\[\]\{\}\=\<\>\^\$\\]/g, '');
            if (value !== cleanValue) {
                input.value = cleanValue;
                this.selectShortAnswer(cleanValue);
            }
        }, 0);
        return true;
    }

    /**
     * Select short answer
     */
    selectShortAnswer(answer) {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        this.userAnswers[question.id] = answer.trim();

        this.updateQuestionGrid();
        this.updateStats();
    }

    /**
     * Select true/false answer for a specific choice in true-false question
     */
    selectTrueFalseAnswer(choiceIndex, isTrue) {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];

        // Initialize object if not exists
        if (!this.userAnswers[question.id]) {
            this.userAnswers[question.id] = {};
        }

        // Set the answer for this specific choice
        this.userAnswers[question.id][choiceIndex] = isTrue;

        // Update UI
        if (this.viewMode === 'single') {
            this.loadQuestion();
        }

        this.updateQuestionGrid();
        this.updateStats();
    }

    /**
     * Select a choice in all questions view (multiple choice)
     */
    selectChoiceInAllView(questionId, choiceIndex) {
        this.userAnswers[questionId] = choiceIndex;

        // Update UI
        this.loadAllQuestions();
        this.updateQuestionGrid();
        this.updateStats();

        // Update current question index if needed
        const questionIndex = this.currentQuiz.questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            this.currentQuestionIndex = questionIndex;
        }
    }

    /**
     * Select short answer in all questions view
     */
    selectShortAnswerInAllView(questionId, answer) {
        this.userAnswers[questionId] = answer.trim();

        this.updateQuestionGrid();
        this.updateStats();

        // Update current question index if needed
        const questionIndex = this.currentQuiz.questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            this.currentQuestionIndex = questionIndex;
        }
    }

    /**
     * Select true/false answer in all questions view
     */
    selectTrueFalseAnswerInAllView(questionId, choiceIndex, isTrue) {
        // Initialize object if not exists
        if (!this.userAnswers[questionId]) {
            this.userAnswers[questionId] = {};
        }

        // Set the answer for this specific choice
        this.userAnswers[questionId][choiceIndex] = isTrue;

        // Update UI
        this.loadAllQuestions();
        this.updateQuestionGrid();
        this.updateStats();

        // Update current question index if needed
        const questionIndex = this.currentQuiz.questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            this.currentQuestionIndex = questionIndex;
        }
    }

    /**
     * Go to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion();
            this.updateQuestionGrid();
            // Force MathJax re-render after navigation
            setTimeout(() => this.renderMath(), 150);
        }
    }

    /**
     * Go to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            this.loadQuestion();
            this.updateQuestionGrid();
            // Force MathJax re-render after navigation
            setTimeout(() => this.renderMath(), 150);
        }
    }

    /**
     * Jump to specific question
     */
    jumpToQuestion(questionIndex) {
        if (questionIndex >= 0 && questionIndex < this.currentQuiz.questions.length) {
            this.currentQuestionIndex = questionIndex;
            this.loadQuestion();
            this.updateQuestionGrid();
        }
    }

    /**
     * Update question grid
     */
    updateQuestionGrid() {
        this.elements.questionGrid.innerHTML = this.currentQuiz.questions.map((question, index) => {
            const isAnswered = this.userAnswers.hasOwnProperty(question.id);
            const isCurrent = index === this.currentQuestionIndex;
            
            return `
                <div class="question-grid-item ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}"
                     onclick="quizApp.jumpToQuestion(${index})">
                    ${index + 1}
                </div>
            `;
        }).join('');
    }

    /**
     * Update statistics
     */
    updateStats() {
        const answeredCount = Object.keys(this.userAnswers).length;
        const remainingCount = this.currentQuiz.totalQuestions - answeredCount;
        
        this.elements.answeredCount.textContent = answeredCount;
        this.elements.remainingCount.textContent = remainingCount;
    }

    /**
     * Start quiz timer
     */
    startTimer() {
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.timeRemaining--;
                this.updateTimeDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.timeUp();
                }
            }
        }, 1000);
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.timeRemaining.textContent = timeString;
        
        // Change color when time is running low
        if (this.timeRemaining <= 300) { // 5 minutes
            this.elements.timeRemaining.classList.add('time-warning');
        }
        if (this.timeRemaining <= 60) { // 1 minute
            this.elements.timeRemaining.classList.add('time-critical');
        }
    }

    /**
     * Handle time up
     */
    timeUp() {
        this.showToast('Hết thời gian! Tự động nộp bài.', 'warning');
        this.submitQuiz();
    }

    /**
     * Pause quiz
     */
    pauseQuiz() {
        this.isPaused = true;
        this.updatePauseModal();
        this.elements.pauseModal.style.display = 'flex';
    }

    /**
     * Resume quiz
     */
    resumeQuiz() {
        this.isPaused = false;
        this.elements.pauseModal.style.display = 'none';
    }

    /**
     * Update pause modal stats
     */
    updatePauseModal() {
        const answeredCount = Object.keys(this.userAnswers).length;
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.pauseAnsweredCount.textContent = answeredCount;
        this.elements.pauseTimeRemaining.textContent = timeString;
    }

    /**
     * Quit quiz
     */
    quitQuiz() {
        if (confirm('Bạn có chắc muốn thoát quiz? Tiến trình sẽ bị mất.')) {
            this.stopTimer();
            this.showSelectionScreen();
        }
    }

    /**
     * Show submit confirmation modal
     */
    showSubmitModal() {
        const answeredCount = Object.keys(this.userAnswers).length;
        const remainingCount = this.currentQuiz.totalQuestions - answeredCount;
        
        this.elements.submitAnsweredCount.textContent = answeredCount;
        this.elements.submitRemainingCount.textContent = remainingCount;
        
        this.elements.submitModal.style.display = 'flex';
    }

    /**
     * Hide submit confirmation modal
     */
    hideSubmitModal() {
        this.elements.submitModal.style.display = 'none';
    }

    /**
     * Submit quiz
     */
    submitQuiz() {
        this.hideSubmitModal();
        this.stopTimer();

        const result = this.calculateResult();
        const resultId = this.quizManager.saveResult(this.currentQuiz.id, result);

        // Kiểm tra nếu đã trả lời hết tất cả câu hỏi
        const answeredCount = Object.keys(this.userAnswers).length;
        const totalQuestions = this.currentQuiz.totalQuestions;
        if (answeredCount === totalQuestions) {
            // Hiển thị lại công thức LaTeX của từng câu
            let latexList = this.currentQuiz.questions.map((q, idx) => {
                // Tìm các biểu thức LaTeX trong câu hỏi
                let latexMatches = q.question.match(/\$[^$]+\$/g);
                let latexStr = latexMatches ? latexMatches.join('<br>') : '';
                // Nếu có lời giải, lấy luôn LaTeX trong lời giải
                if (q.explanation) {
                    let expLatex = q.explanation.match(/\$[^$]+\$/g);
                    if (expLatex) latexStr += '<br>' + expLatex.join('<br>');
                }
                return `<div class="latex-formula"><strong>Câu ${idx+1}:</strong><br>${latexStr}</div>`;
            }).join('');
            // Hiển thị trong kết quả
            if (this.elements.resultDetails) {
                this.elements.resultDetails.innerHTML = `<div class="latex-summary"><h3>Công thức LaTeX của các câu:</h3>${latexList}</div>` + this.elements.resultDetails.innerHTML;
                this.renderMath();
            }
        }

        this.showResultScreen(result);
        this.showToast('Đã nộp bài thành công!', 'success');
    }

    /**
     * Calculate quiz result with weighted scoring
     */
    calculateResult() {
        let totalScore = 0;
        let maxPossibleScore = 0;
        const answers = [];

        this.currentQuiz.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[question.id];
            let isCorrect = false;
            let questionScore = 0;
            let maxQuestionScore = 0;

            if (question.type === 'true-false') {
                // Phần II: mỗi đáp án đúng 0.25 điểm
                const userAnswerObj = userAnswer || {};
                let correctSubAnswers = 0;

                if (question.choices && question.choices.length > 0) {
                    question.choices.forEach((choice, choiceIndex) => {
                        const userChoiceAnswer = userAnswerObj[choiceIndex];
                        const correctAnswer = choice.isCorrect;

                        if (userChoiceAnswer === correctAnswer) {
                            correctSubAnswers++;
                        }
                    });

                    questionScore = correctSubAnswers * 0.25;
                    maxQuestionScore = question.choices.length * 0.25;
                    isCorrect = correctSubAnswers === question.choices.length;
                }
            } else if (question.type === 'short-answer') {
                // Phần III: đúng câu được 0.5 điểm
                const correctAnswer = question.correctAnswers;
                const userAnswerText = (userAnswer || '').toString().trim();
                const correctAnswerText = correctAnswer.toString().trim();

                isCorrect = userAnswerText.toLowerCase() === correctAnswerText.toLowerCase();
                questionScore = isCorrect ? 0.5 : 0;
                maxQuestionScore = 0.5;
            } else {
                // Phần I: mỗi câu đúng 0.25 điểm
                const correctAnswer = question.correctAnswers || question.correctAnswer;
                isCorrect = userAnswer !== undefined && userAnswer === correctAnswer;
                questionScore = isCorrect ? 0.25 : 0;
                maxQuestionScore = 0.25;
            }

            totalScore += questionScore;
            maxPossibleScore += maxQuestionScore;

            answers.push({
                questionId: question.id,
                questionNumber: index + 1,
                questionType: question.type || 'multiple-choice',
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswers || question.correctAnswer,
                isCorrect: isCorrect,
                score: questionScore,
                maxScore: maxQuestionScore
            });
        });

        const totalQuestions = this.currentQuiz.questions.length;
        const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
        const timeSpent = this.currentQuiz.duration * 60 - this.timeRemaining;

        return {
            score: totalScore,
            maxScore: maxPossibleScore,
            totalQuestions: totalQuestions,
            correctAnswers: answers.filter(a => a.isCorrect).length,
            percentage: percentage,
            timeSpent: timeSpent,
            answers: answers
        };
    }

    /**
     * Show result screen
     */
    showResultScreen(result) {
        this.hideAllScreens();
        this.screens.result.style.display = 'block';
        
        // Update result display
        this.elements.finalScore.textContent = `${result.score.toFixed(2)}/${result.maxScore.toFixed(2)}`;
        this.elements.finalPercentage.textContent = `${result.percentage}%`;
        this.elements.finalCorrect.textContent = `${result.correctAnswers}/${result.totalQuestions}`;
        
        const timeSpentMinutes = Math.floor(result.timeSpent / 60);
        const timeSpentSeconds = result.timeSpent % 60;
        this.elements.finalTime.textContent = 
            `${timeSpentMinutes.toString().padStart(2, '0')}:${timeSpentSeconds.toString().padStart(2, '0')}`;
        
        // Update result icon and message based on performance
        if (result.percentage >= 80) {
            this.elements.resultIcon.className = 'fas fa-trophy';
            this.elements.resultTitle.textContent = 'Xuất sắc!';
            this.elements.resultSubtitle.textContent = 'Bạn đã làm bài rất tốt';
        } else if (result.percentage >= 60) {
            this.elements.resultIcon.className = 'fas fa-medal';
            this.elements.resultTitle.textContent = 'Tốt!';
            this.elements.resultSubtitle.textContent = 'Bạn đã hoàn thành tốt bài thi';
        } else {
            this.elements.resultIcon.className = 'fas fa-certificate';
            this.elements.resultTitle.textContent = 'Hoàn thành!';
            this.elements.resultSubtitle.textContent = 'Hãy cố gắng hơn lần sau';
        }
        
        // Show detailed results
        this.showDetailedResults(result);
    }

    /**
     * Show detailed results
     */
    showDetailedResults(result) {
        const detailsHtml = result.answers.map(answer => {
            const question = this.currentQuiz.questions.find(q => q.id === answer.questionId);
            if (!question) return '';

            const isTrueFalse = question.type === 'true-false';
            const isShortAnswer = question.type === 'short-answer';
            const choiceLabels = isTrueFalse ? ['a)', 'b)', 'c)', 'd)'] : ['A', 'B', 'C', 'D', 'E', 'F'];

            let userAnswerDisplay = '';
            let correctAnswerDisplay = '';

            if (isShortAnswer) {
                // Short answer question display
                const userAnswerText = answer.userAnswer || '';
                const correctAnswerText = answer.correctAnswer || '';

                userAnswerDisplay = userAnswerText ?
                    `<div class="user-answer"><strong>Bạn trả lời:</strong> ${userAnswerText}</div>` :
                    `<div class="user-answer no-answer"><strong>Bạn chưa trả lời</strong></div>`;

                correctAnswerDisplay = `<div class="correct-answer"><strong>Đáp án đúng:</strong> ${correctAnswerText}</div>`;

            } else if (isTrueFalse) {
                // True-false question display
                const userAnswerObj = answer.userAnswer || {};

                let userChoicesHtml = '<div class="user-answer"><strong>Bạn trả lời:</strong><br>';
                let correctChoicesHtml = '<div class="correct-answer"><strong>Đáp án đúng:</strong><br>';

                if (question.choices && question.choices.length > 0) {
                    question.choices.forEach((choice, index) => {
                        const userChoice = userAnswerObj[index];
                        const correctChoice = choice.isCorrect;
                        const userText = userChoice === true ? 'Đ' : userChoice === false ? 'S' : '?';
                        const correctText = correctChoice ? 'Đ' : 'S';
                        const isUserCorrect = userChoice === correctChoice;

                        userChoicesHtml += `
                            <span class="tf-result-item ${isUserCorrect ? 'correct' : 'incorrect'}">
                                ${choiceLabels[index]} ${userText}
                            </span>
                        `;

                        correctChoicesHtml += `
                            <span class="tf-result-item correct">
                                ${choiceLabels[index]} ${correctText}
                            </span>
                        `;
                    });
                } else {
                    userChoicesHtml += '<span class="no-choices">Không có đáp án để hiển thị</span>';
                    correctChoicesHtml += '<span class="no-choices">Không có đáp án để hiển thị</span>';
                }

                userChoicesHtml += '</div>';
                correctChoicesHtml += '</div>';

                userAnswerDisplay = userChoicesHtml;
                correctAnswerDisplay = correctChoicesHtml;

            } else {
                // Multiple choice question display
                if (question.choices && question.choices.length > 0) {
                    const userChoice = answer.userAnswer !== undefined ?
                        question.choices[answer.userAnswer] : null;
                    const correctChoice = question.choices[answer.correctAnswer];

                    if (userChoice) {
                        userAnswerDisplay = `<div class="user-answer"><strong>Bạn chọn:</strong> ${choiceLabels[answer.userAnswer]} ${userChoice.text}</div>`;
                    } else {
                        userAnswerDisplay = `<div class="user-answer no-answer"><strong>Bạn chưa chọn đáp án</strong></div>`;
                    }

                    if (correctChoice) {
                        correctAnswerDisplay = `<div class="correct-answer"><strong>Đáp án đúng:</strong> ${choiceLabels[answer.correctAnswer]} ${correctChoice.text}</div>`;
                    } else {
                        correctAnswerDisplay = `<div class="correct-answer"><strong>Đáp án đúng:</strong> Không xác định</div>`;
                    }
                } else {
                    userAnswerDisplay = `<div class="user-answer no-answer"><strong>Không có đáp án để hiển thị</strong></div>`;
                    correctAnswerDisplay = `<div class="correct-answer"><strong>Không có đáp án để hiển thị</strong></div>`;
                }
            }

            return `
                <div class="result-question ${answer.isCorrect ? 'correct' : 'incorrect'} ${question.type || 'multiple-choice'}">
                    <div class="result-question-header">
                        <span class="question-number">Câu ${answer.questionNumber}</span>
                        <span class="question-type-badge">${isShortAnswer ? 'Trả lời ngắn' : (isTrueFalse ? 'Đúng - Sai' : 'Trắc nghiệm')}</span>
                        <span class="result-status">
                            <i class="fas fa-${answer.isCorrect ? 'check' : 'times'}"></i>
                            ${answer.isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                    </div>
                    <div class="result-question-content">
                        <div class="question-text">${question.question}</div>

                        ${!isShortAnswer && question.choices && question.choices.length > 0 ? `
                            <div class="result-choices">
                                ${question.choices.map((choice, choiceIndex) => {
                                    let choiceClass = '';
                                    let choiceIcon = '';

                                    if (isTrueFalse) {
                                        const userAnswerObj = answer.userAnswer || {};
                                        const userChoice = userAnswerObj[choiceIndex];
                                        const isCorrectChoice = choice.isCorrect;

                                        if (userChoice === isCorrectChoice) {
                                            choiceClass = 'result-choice-correct';
                                            choiceIcon = '<i class="fas fa-check"></i>';
                                        } else {
                                            choiceClass = 'result-choice-incorrect';
                                            choiceIcon = '<i class="fas fa-times"></i>';
                                        }
                                    } else {
                                        // Multiple choice
                                        const isUserChoice = answer.userAnswer === choiceIndex;
                                        const isCorrectChoice = choice.isCorrect;

                                        if (isCorrectChoice) {
                                            choiceClass = 'result-choice-correct';
                                            choiceIcon = '<i class="fas fa-check"></i>';
                                        } else if (isUserChoice) {
                                            choiceClass = 'result-choice-incorrect';
                                            choiceIcon = '<i class="fas fa-times"></i>';
                                        } else {
                                            choiceClass = 'result-choice-neutral';
                                        }
                                    }

                                    return `
                                        <div class="result-choice ${choiceClass}">
                                            <span class="result-choice-label">${choiceLabels[choiceIndex]}</span>
                                            <span class="result-choice-text">${choice.text}</span>
                                            ${choiceIcon ? `<span class="result-choice-icon">${choiceIcon}</span>` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}

                        ${userAnswerDisplay}
                        ${correctAnswerDisplay}
                        ${question.explanation ? `
                            <div class="explanation">
                                <strong>Lời giải:</strong> ${question.explanation}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.elements.resultDetails.innerHTML = detailsHtml;

        // Render math in results
        this.renderMath();
    }

    /**
     * Review answers (same as detailed results but scrollable)
     */
    reviewAnswers() {
        // Scroll to detailed results
        this.elements.resultDetails.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Retake quiz
     */
    retakeQuiz() {
        if (confirm('Bạn có muốn làm lại quiz này?')) {
            this.loadQuiz(this.currentQuiz.id);
        }
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Hide all screens
     */
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            screen.style.display = 'none';
        });
    }

    /**
     * Render math expressions
     */
    async renderMath() {
        // Ensure MathJax is loaded
        if (!window.MathJax) {
            await this.loadMathJax();
        }

        if (window.MathJax && window.MathJax.typesetPromise) {
            try {
                // Process math in the current view or results
                let container;
                if (this.elements.resultDetails && this.elements.resultDetails.innerHTML.trim() !== '') {
                    // If we're showing results
                    container = this.elements.resultDetails;
                } else {
                    // Normal quiz view
                    container = this.viewMode === 'single'
                        ? this.elements.singleQuestionContainer
                        : this.elements.allQuestionsContainer;
                }

                // Force re-render by clearing and re-processing
                if (container) {
                    await window.MathJax.typesetClear([container]);
                    await window.MathJax.typesetPromise([container]);
                } else {
                    // Fallback: render entire document
                    await window.MathJax.typesetPromise();
                }

                console.log('MathJax rendering completed for', this.viewMode, 'view');
            } catch (error) {
                console.warn('MathJax rendering failed:', error);
                // Fallback: try to render without container specification
                try {
                    await window.MathJax.typesetPromise();
                } catch (fallbackError) {
                    console.warn('MathJax fallback rendering also failed:', fallbackError);
                }
            }
        } else {
            console.warn('MathJax not available for rendering');
        }
    }

    /**
     * Load MathJax if not already loaded
     */
    async loadMathJax() {
        return new Promise((resolve, reject) => {
            if (window.MathJax) {
                resolve();
                return;
            }

            // Configure MathJax
            window.MathJax = {
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true,
                    processEnvironments: true,
                    packages: {'[+]': ['ams', 'newcommand', 'configmacros']}
                },
                svg: {
                    fontCache: 'global'
                },
                options: {
                    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
                    ignoreHtmlClass: 'tex2jax_ignore',
                    processHtmlClass: 'tex2jax_process'
                },
                startup: {
                    ready: () => {
                        console.log('MathJax is loaded and ready');
                        window.MathJax.startup.defaultReady();
                        resolve();
                    }
                }
            };

            // Load MathJax script
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
            script.async = true;
            script.onload = () => {
                console.log('MathJax script loaded');
            };
            script.onerror = (error) => {
                console.error('Failed to load MathJax:', error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Show loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize quiz app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});
