/**
 * Quiz Taking Application
 */
class QuizApp {
    constructor() {
        this.quizManager = new QuizManager();
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.timeRemaining = 0;
        this.timer = null;
        this.isPaused = false;
        this.startTime = null;
        this.viewMode = 'single'; // 'single' or 'all'
        this.mathJaxLoaded = false;

        this.initializeElements();
        this.bindEvents();
        this.loadMathJax();
        this.checkQuizFromURL();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Screens
            quizSelectionScreen: document.getElementById('quizSelectionScreen'),
            quizTakingScreen: document.getElementById('quizTakingScreen'),
            quizResultScreen: document.getElementById('quizResultScreen'),
            
            // Quiz selection
            quizSelectionGrid: document.getElementById('quizSelectionGrid'),
            
            // Quiz taking
            quizTitle: document.getElementById('quizTitle'),
            questionProgress: document.getElementById('questionProgress'),
            timeRemaining: document.getElementById('timeRemaining'),
            currentQuestionNumber: document.getElementById('currentQuestionNumber'),
            questionText: document.getElementById('questionText'),
            questionChoices: document.getElementById('questionChoices'),
            questionGrid: document.getElementById('questionGrid'),
            answeredCount: document.getElementById('answeredCount'),
            remainingCount: document.getElementById('remainingCount'),
            
            // Navigation
            prevQuestionBtn: document.getElementById('prevQuestionBtn'),
            nextQuestionBtn: document.getElementById('nextQuestionBtn'),
            viewModeBtn: document.getElementById('viewModeBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            submitQuizBtn: document.getElementById('submitQuizBtn'),
            
            // View modes
            singleQuestionContainer: document.getElementById('singleQuestionContainer'),
            allQuestionsContainer: document.getElementById('allQuestionsContainer'),
            allQuestionsContent: document.getElementById('allQuestionsContent'),
            
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
            submitRemainingCount: document.getElementById('submitRemainingCount'),
            
            // Results
            resultIcon: document.getElementById('resultIcon'),
            resultTitle: document.getElementById('resultTitle'),
            resultSubtitle: document.getElementById('resultSubtitle'),
            finalScore: document.getElementById('finalScore'),
            finalPercentage: document.getElementById('finalPercentage'),
            finalCorrect: document.getElementById('finalCorrect'),
            finalTime: document.getElementById('finalTime'),
            resultDetails: document.getElementById('resultDetails'),
            reviewAnswersBtn: document.getElementById('reviewAnswersBtn'),
            retakeQuizBtn: document.getElementById('retakeQuizBtn'),
            backToSelectionBtn: document.getElementById('backToSelectionBtn')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation
        this.elements.prevQuestionBtn.addEventListener('click', () => this.previousQuestion());
        this.elements.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.viewModeBtn.addEventListener('click', () => this.toggleViewMode());
        
        // Quiz controls
        this.elements.pauseBtn.addEventListener('click', () => this.pauseQuiz());
        this.elements.submitQuizBtn.addEventListener('click', () => this.showSubmitModal());
        
        // Modal controls
        this.elements.resumeQuizBtn.addEventListener('click', () => this.resumeQuiz());
        this.elements.quitQuizBtn.addEventListener('click', () => this.quitQuiz());
        this.elements.cancelSubmitBtn.addEventListener('click', () => this.closeModal());
        this.elements.confirmSubmitBtn.addEventListener('click', () => this.submitQuiz());
        
        // Result actions
        this.elements.reviewAnswersBtn.addEventListener('click', () => this.reviewAnswers());
        this.elements.retakeQuizBtn.addEventListener('click', () => this.retakeQuiz());
        this.elements.backToSelectionBtn.addEventListener('click', () => this.backToSelection());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    /**
     * Load MathJax for math rendering
     */
    async loadMathJax() {
        return new Promise((resolve, reject) => {
            if (window.MathJax) {
                this.mathJaxLoaded = true;
                resolve();
                return;
            }

            // Configure MathJax
            window.MathJax = {
                // Shuffle questions by type to maintain variety
                // this.questions = this.shuffleQuestionsByType([...quiz.questions]);
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
                        console.log('MathJax is loaded and ready in Quiz');
                        this.mathJaxLoaded = true;
                        window.MathJax.startup.defaultReady();
                        resolve();
                    }
                }
            };

            // Load MathJax script if not already loaded
            if (!document.querySelector('script[src*="mathjax"]')) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
                script.async = true;
                script.onload = () => {
                    console.log('MathJax script loaded in Quiz');
                };
                script.onerror = (error) => {
                    console.error('Failed to load MathJax in Quiz:', error);
                    reject(error);
                };
                document.head.appendChild(script);
            } else {
                this.mathJaxLoaded = true;
                resolve();
            }
        });
    }

    /**
     * Render math expressions using MathJax
     */
    async renderMath(container = null) {
        // Ensure MathJax is loaded
        if (!this.mathJaxLoaded) {
            await this.loadMathJax();
        }

        if (window.MathJax && window.MathJax.typesetPromise) {
            try {
                // Clear previous math processing
                if (window.MathJax.startup && window.MathJax.startup.document) {
                    window.MathJax.startup.document.clear();
                }

                // Process math in the specified container or entire document
                if (container) {
                    await window.MathJax.typesetPromise([container]);
                } else {
                    await window.MathJax.typesetPromise();
                }

                console.log('MathJax rendering completed');
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
     * Check if quiz ID is provided in URL
     */
    checkQuizFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        
        if (quizId) {
            this.startQuizById(quizId);
        } else {
            this.showQuizSelection();
        }
    }

    /**
     * Show quiz selection screen
     */
    showQuizSelection() {
        this.showScreen('selection');
        this.loadQuizList();
    }

    /**
     * Load and display quiz list
     */
    loadQuizList() {
        const quizzes = this.quizManager.getAllQuizzes();
        const container = this.elements.quizSelectionGrid;
        
        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>Chưa có quiz nào</h3>
                    <p>Hãy tạo quiz từ Dashboard trước</p>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Tạo quiz mới
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = quizzes.map(quiz => {
            const difficulty = this.getDifficultyInfo(quiz.totalQuestions);
            
            return `
                <div class="quiz-card" onclick="quizApp.startQuizById('${quiz.id}')">
                    <div class="quiz-card-header">
                        <h3>${quiz.title}</h3>
                        <div class="quiz-difficulty">
                            <i class="fas fa-${difficulty.icon}"></i>
                            ${difficulty.label}
                        </div>
                    </div>
                    <div class="quiz-card-body">
                        <p>${quiz.description || 'Không có mô tả'}</p>
                        <div class="quiz-card-stats">
                            <div class="stat">
                                <i class="fas fa-question-circle"></i>
                                ${quiz.totalQuestions} câu
                            </div>
                            <div class="stat">
                                <i class="fas fa-clock"></i>
                                ${quiz.duration} phút
                            </div>
                            <div class="stat">
                                <i class="fas fa-calendar"></i>
                                ${Utils.formatRelativeTime(quiz.createdAt)}
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
            `;
        }).join('');
    }

    /**
     * Get difficulty info based on question count
     */
    getDifficultyInfo(questionCount) {
        if (questionCount <= 5) {
            return { label: 'Dễ', icon: 'star', color: '#10b981' };
        } else if (questionCount <= 15) {
            return { label: 'Trung bình', icon: 'star-half-alt', color: '#f59e0b' };
        } else {
            return { label: 'Khó', icon: 'fire', color: '#ef4444' };
        }
    }

    /**
     * Start quiz by ID
     */
    startQuizById(quizId) {
        const quiz = this.quizManager.getQuiz(quizId);
        if (!quiz) {
            this.showToast('Không tìm thấy quiz', 'error');
            return;
        }

        this.currentQuiz = quiz;
        this.initializeQuiz();
        this.showScreen('taking');
    }

    /**
     * Initialize quiz data
     */
    initializeQuiz() {
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(this.currentQuiz.questions.length).fill(null);
        this.timeRemaining = this.currentQuiz.duration * 60; // Convert to seconds
        this.startTime = Date.now();
        this.isPaused = false;
        this.viewMode = 'single';

        // Initialize UI
        this.elements.quizTitle.textContent = this.currentQuiz.title;
        this.updateQuestionProgress();
        this.updateStats();
        this.renderQuestionGrid();
        this.showQuestion(0);
        this.startTimer();
    }

    /**
     * Show specific screen
     */
    showScreen(screen) {
        this.elements.quizSelectionScreen.style.display = screen === 'selection' ? 'block' : 'none';
        this.elements.quizTakingScreen.style.display = screen === 'taking' ? 'block' : 'none';
        this.elements.quizResultScreen.style.display = screen === 'result' ? 'block' : 'none';
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
                    this.submitQuiz();
                }
            }
        }, 1000);
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const timeElement = this.elements.timeRemaining;
        const timeString = Utils.formatTimeDisplay(this.timeRemaining);
        timeElement.textContent = timeString;
        
        // Add warning classes
        if (this.timeRemaining <= 300) { // 5 minutes
            timeElement.classList.add('time-warning');
        }
        if (this.timeRemaining <= 60) { // 1 minute
            timeElement.classList.add('time-critical');
        }
    }

    /**
     * Show question by index
     */
    async showQuestion(index) {
        if (index < 0 || index >= this.currentQuiz.questions.length) return;
        
        this.currentQuestionIndex = index;
        const question = this.currentQuiz.questions[index];
        
        // Update question number and navigation
        this.elements.currentQuestionNumber.textContent = `Câu ${index + 1}`;
        this.elements.prevQuestionBtn.disabled = index === 0;
        this.elements.nextQuestionBtn.disabled = index === this.currentQuiz.questions.length - 1;
        
        // Update question text
        this.elements.questionText.innerHTML = question.question;
        
        // Render choices based on question type
        this.renderQuestionChoices(question, index);
        
        // Update progress and stats
        this.updateQuestionProgress();
        this.updateStats();
        this.updateQuestionGrid();
        
        // Render math
        await this.renderMath(this.elements.singleQuestionContainer);
    }

    /**
     * Render question choices based on type
     */
    renderQuestionChoices(question, questionIndex) {
        const container = this.elements.questionChoices;
        
        if (question.type === 'short-answer') {
            this.renderShortAnswerQuestion(container, question, questionIndex);
        } else if (question.type === 'true-false') {
            this.renderTrueFalseQuestion(container, question, questionIndex);
        } else {
            this.renderMultipleChoiceQuestion(container, question, questionIndex);
        }
    }

    /**
     * Render short answer question
     */
    renderShortAnswerQuestion(container, question, questionIndex) {
        const userAnswer = this.userAnswers[questionIndex] || '';
        
        container.innerHTML = `
            <div class="short-answer-container">
                <div class="answer-input-group">
                    <label class="answer-label">Đáp án:</label>
                    <input 
                        type="text" 
                        class="short-answer-input" 
                        placeholder="Nhập đáp án của bạn..."
                        value="${userAnswer}"
                        data-question-index="${questionIndex}"
                    />
                </div>
            </div>
        `;
        
        // Add event listener for input
        const input = container.querySelector('.short-answer-input');
        input.addEventListener('input', (e) => {
            this.userAnswers[questionIndex] = e.target.value.trim();
            this.updateStats();
            this.updateQuestionGrid();
        });
        
        // Focus on input
        setTimeout(() => input.focus(), 100);
    }

    /**
     * Render true-false question
     */
    renderTrueFalseQuestion(container, question, questionIndex) {
        const userAnswer = this.userAnswers[questionIndex];
        
        container.innerHTML = question.choices.map((choice, choiceIndex) => `
            <div class="choice-item true-false" data-choice-index="${choiceIndex}">
                <div class="true-false-content">
                    <span class="true-false-label">${String.fromCharCode(97 + choiceIndex)})</span>
                    <span class="true-false-text">${choice.text}</span>
                </div>
                <div class="true-false-buttons">
                    <button class="tf-button true-btn ${userAnswer && userAnswer[choiceIndex] === true ? 'selected' : ''}" 
                            data-question-index="${questionIndex}" 
                            data-choice-index="${choiceIndex}" 
                            data-value="true">
                        Đ
                    </button>
                    <button class="tf-button false-btn ${userAnswer && userAnswer[choiceIndex] === false ? 'selected' : ''}" 
                            data-question-index="${questionIndex}" 
                            data-choice-index="${choiceIndex}" 
                            data-value="false">
                        S
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for true-false buttons
        container.querySelectorAll('.tf-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const questionIdx = parseInt(e.target.dataset.questionIndex);
                const choiceIdx = parseInt(e.target.dataset.choiceIndex);
                const value = e.target.dataset.value === 'true';
                
                // Initialize answer array if not exists
                if (!this.userAnswers[questionIdx]) {
                    this.userAnswers[questionIdx] = new Array(question.choices.length).fill(null);
                }
                
                // Set the answer for this choice
                this.userAnswers[questionIdx][choiceIdx] = value;
                
                // Update button states for this choice
                const choiceContainer = e.target.closest('.choice-item');
                const buttons = choiceContainer.querySelectorAll('.tf-button');
                buttons.forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                
                this.updateStats();
                this.updateQuestionGrid();
            });
        });
    }

    /**
     * Render multiple choice question
     */
    renderMultipleChoiceQuestion(container, question, questionIndex) {
        const userAnswer = this.userAnswers[questionIndex];
        const choiceLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        container.innerHTML = question.choices.map((choice, choiceIndex) => `
            <div class="choice-item ${userAnswer === choiceIndex ? 'selected' : ''}" 
                 data-choice-index="${choiceIndex}">
                <div class="choice-radio">
                    <input type="radio" 
                           name="question_${questionIndex}" 
                           value="${choiceIndex}"
                           ${userAnswer === choiceIndex ? 'checked' : ''}
                           data-question-index="${questionIndex}">
                    <span class="choice-label">${choiceLabels[choiceIndex]}.</span>
                </div>
                <span class="choice-text">${choice.text}</span>
            </div>
        `).join('');
        
        // Add event listeners for radio buttons
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionIdx = parseInt(e.target.dataset.questionIndex);
                const choiceIdx = parseInt(e.target.value);
                
                this.userAnswers[questionIdx] = choiceIdx;
                
                // Update choice item states
                const choiceItems = container.querySelectorAll('.choice-item');
                choiceItems.forEach((item, idx) => {
                    item.classList.toggle('selected', idx === choiceIdx);
                });
                
                this.updateStats();
                this.updateQuestionGrid();
            });
        });
        
        // Add click handlers for choice items
        container.querySelectorAll('.choice-item').forEach((item, choiceIndex) => {
            item.addEventListener('click', () => {
                const radio = item.querySelector('input[type="radio"]');
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            });
        });
    }

    /**
     * Toggle between single and all questions view
     */
    async toggleViewMode() {
        if (this.viewMode === 'single') {
            this.viewMode = 'all';
            this.elements.viewModeBtn.innerHTML = '<i class="fas fa-eye"></i> Xem từng câu';
            this.elements.singleQuestionContainer.style.display = 'none';
            this.elements.allQuestionsContainer.style.display = 'block';
            await this.renderAllQuestions();
        } else {
            this.viewMode = 'single';
            this.elements.viewModeBtn.innerHTML = '<i class="fas fa-list"></i> Xem tất cả';
            this.elements.singleQuestionContainer.style.display = 'block';
            this.elements.allQuestionsContainer.style.display = 'none';
            await this.showQuestion(this.currentQuestionIndex);
        }
    }

    /**
     * Render all questions in one view
     */
    async renderAllQuestions() {
        const container = this.elements.allQuestionsContent;
        
        // Group questions by type
        const questionsByType = {
            'multiple-choice': [],
            'true-false': [],
            'short-answer': []
        };
        
        this.currentQuiz.questions.forEach((question, index) => {
            const type = question.type || 'multiple-choice';
            questionsByType[type].push({ question, index });
        });
        
        let html = '';
        
        // Render multiple choice questions
        if (questionsByType['multiple-choice'].length > 0) {
            html += '<div class="question-section-header">I. TRẮC NGHIỆM</div>';
            questionsByType['multiple-choice'].forEach(({ question, index }) => {
                html += this.renderAllQuestionItem(question, index, 'multiple-choice');
            });
        }
        
        // Render true-false questions
        if (questionsByType['true-false'].length > 0) {
            html += '<div class="question-section-header">II. ĐÚNG - SAI</div>';
            questionsByType['true-false'].forEach(({ question, index }) => {
                html += this.renderAllQuestionItem(question, index, 'true-false');
            });
        }
        
        // Render short answer questions
        if (questionsByType['short-answer'].length > 0) {
            html += '<div class="question-section-header">III. TRẢ LỜI NGẮN</div>';
            questionsByType['short-answer'].forEach(({ question, index }) => {
                html += this.renderAllQuestionItem(question, index, 'short-answer');
            });
        }
        
        container.innerHTML = html;
        
        // Add event listeners
        this.bindAllQuestionsEvents();
        
        // Render math
        await this.renderMath(container);
    }

    /**
     * Render a single question item in all questions view
     */
    renderAllQuestionItem(question, questionIndex, type) {
        const userAnswer = this.userAnswers[questionIndex];
        const isAnswered = this.isQuestionAnswered(questionIndex);
        
        let choicesHtml = '';
        
        if (type === 'short-answer') {
            choicesHtml = `
                <div class="all-short-answer-container">
                    <div class="all-answer-input-group">
                        <label class="all-answer-label">Đáp án:</label>
                        <input 
                            type="text" 
                            class="all-short-answer-input" 
                            placeholder="Nhập đáp án..."
                            value="${userAnswer || ''}"
                            data-question-index="${questionIndex}"
                        />
                    </div>
                </div>
            `;
        } else if (type === 'true-false') {
            choicesHtml = question.choices.map((choice, choiceIndex) => `
                <div class="all-choice-item true-false">
                    <div class="all-true-false-content">
                        <span class="all-true-false-label">${String.fromCharCode(97 + choiceIndex)})</span>
                        <span class="all-true-false-text">${choice.text}</span>
                    </div>
                    <div class="all-true-false-buttons">
                        <button class="all-tf-button true-btn ${userAnswer && userAnswer[choiceIndex] === true ? 'selected' : ''}" 
                                data-question-index="${questionIndex}" 
                                data-choice-index="${choiceIndex}" 
                                data-value="true">
                            Đ
                        </button>
                        <button class="all-tf-button false-btn ${userAnswer && userAnswer[choiceIndex] === false ? 'selected' : ''}" 
                                data-question-index="${questionIndex}" 
                                data-choice-index="${choiceIndex}" 
                                data-value="false">
                            S
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            const choiceLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
            choicesHtml = question.choices.map((choice, choiceIndex) => `
                <div class="all-choice-item ${userAnswer === choiceIndex ? 'selected' : ''}" 
                     data-choice-index="${choiceIndex}">
                    <div class="all-choice-radio">
                        <input type="radio" 
                               name="all_question_${questionIndex}" 
                               value="${choiceIndex}"
                               ${userAnswer === choiceIndex ? 'checked' : ''}
                               data-question-index="${questionIndex}">
                        <span class="all-choice-label">${choiceLabels[choiceIndex]}.</span>
                    </div>
                    <span class="all-choice-text">${choice.text}</span>
                </div>
            `).join('');
        }
        
        const typeLabels = {
            'multiple-choice': 'Trắc nghiệm',
            'true-false': 'Đúng - Sai',
            'short-answer': 'Trả lời ngắn'
        };
        
        return `
            <div class="all-question-item ${type}" data-question-index="${questionIndex}">
                <div class="all-question-header">
                    <span class="all-question-number">Câu ${questionIndex + 1}</span>
                    <div class="all-question-status ${isAnswered ? 'answered' : 'unanswered'}">
                        <i class="fas fa-${isAnswered ? 'check-circle' : 'circle'}"></i>
                        ${isAnswered ? 'Đã làm' : 'Chưa làm'}
                    </div>
                </div>
                <div class="all-question-content">
                    <div class="all-question-text">${question.question}</div>
                    <div class="all-question-choices">
                        ${choicesHtml}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind events for all questions view
     */
    bindAllQuestionsEvents() {
        const container = this.elements.allQuestionsContent;
        
        // Multiple choice radio buttons
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionIdx = parseInt(e.target.dataset.questionIndex);
                const choiceIdx = parseInt(e.target.value);
                
                this.userAnswers[questionIdx] = choiceIdx;
                
                // Update choice item states
                const questionItem = e.target.closest('.all-question-item');
                const choiceItems = questionItem.querySelectorAll('.all-choice-item');
                choiceItems.forEach((item, idx) => {
                    item.classList.toggle('selected', idx === choiceIdx);
                });
                
                this.updateStats();
                this.updateQuestionGrid();
                this.updateAllQuestionStatus(questionIdx);
            });
        });
        
        // Multiple choice item clicks
        container.querySelectorAll('.all-choice-item:not(.true-false)').forEach((item, choiceIndex) => {
            item.addEventListener('click', () => {
                const radio = item.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            });
        });
        
        // True-false buttons
        container.querySelectorAll('.all-tf-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const questionIdx = parseInt(e.target.dataset.questionIndex);
                const choiceIdx = parseInt(e.target.dataset.choiceIndex);
                const value = e.target.dataset.value === 'true';
                
                // Initialize answer array if not exists
                if (!this.userAnswers[questionIdx]) {
                    this.userAnswers[questionIdx] = new Array(this.currentQuiz.questions[questionIdx].choices.length).fill(null);
                }
                
                // Set the answer for this choice
                this.userAnswers[questionIdx][choiceIdx] = value;
                
                // Update button states for this choice
                const choiceContainer = e.target.closest('.all-choice-item');
                const buttons = choiceContainer.querySelectorAll('.all-tf-button');
                buttons.forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                
                this.updateStats();
                this.updateQuestionGrid();
                this.updateAllQuestionStatus(questionIdx);
            });
        });
        
        // Short answer inputs
        container.querySelectorAll('.all-short-answer-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const questionIdx = parseInt(e.target.dataset.questionIndex);
                this.userAnswers[questionIdx] = e.target.value.trim();
                
                this.updateStats();
                this.updateQuestionGrid();
                this.updateAllQuestionStatus(questionIdx);
            });
        });
    }

    /**
     * Update question status in all questions view
     */
    updateAllQuestionStatus(questionIndex) {
        const questionItem = document.querySelector(`[data-question-index="${questionIndex}"]`);
        if (!questionItem) return;
        
        const statusElement = questionItem.querySelector('.all-question-status');
        const isAnswered = this.isQuestionAnswered(questionIndex);
        
        statusElement.className = `all-question-status ${isAnswered ? 'answered' : 'unanswered'}`;
        statusElement.innerHTML = `
            <i class="fas fa-${isAnswered ? 'check-circle' : 'circle'}"></i>
            ${isAnswered ? 'Đã làm' : 'Chưa làm'}
        `;
    }

    /**
     * Check if question is answered
     */
    isQuestionAnswered(questionIndex) {
        const answer = this.userAnswers[questionIndex];
        const question = this.currentQuiz.questions[questionIndex];
        
        if (question.type === 'short-answer') {
            return answer && answer.trim().length > 0;
        } else if (question.type === 'true-false') {
            return answer && answer.some(val => val !== null);
        } else {
            return answer !== null && answer !== undefined;
        }
    }

    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.showQuestion(this.currentQuestionIndex - 1);
        }
    }

    /**
     * Navigate to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.showQuestion(this.currentQuestionIndex + 1);
        }
    }

    /**
     * Update question progress
     */
    updateQuestionProgress() {
        this.elements.questionProgress.textContent = 
            `Câu ${this.currentQuestionIndex + 1}/${this.currentQuiz.questions.length}`;
    }

    /**
     * Update statistics
     */
    updateStats() {
        const answeredCount = this.userAnswers.filter((answer, index) => 
            this.isQuestionAnswered(index)
        ).length;
        const remainingCount = this.currentQuiz.questions.length - answeredCount;
        
        this.elements.answeredCount.textContent = answeredCount;
        this.elements.remainingCount.textContent = remainingCount;
    }

    /**
     * Render question grid
     */
    renderQuestionGrid() {
        const container = this.elements.questionGrid;
        
        container.innerHTML = this.currentQuiz.questions.map((_, index) => `
            <div class="question-grid-item ${this.getQuestionGridClass(index)}" 
                 onclick="quizApp.goToQuestion(${index})">
                ${index + 1}
            </div>
        `).join('');
    }

    /**
     * Update question grid
     */
    updateQuestionGrid() {
        const items = this.elements.questionGrid.querySelectorAll('.question-grid-item');
        items.forEach((item, index) => {
            item.className = `question-grid-item ${this.getQuestionGridClass(index)}`;
        });
    }

    /**
     * Get CSS class for question grid item
     */
    getQuestionGridClass(index) {
        const classes = [];
        
        if (index === this.currentQuestionIndex) {
            classes.push('current');
        }
        
        if (this.isQuestionAnswered(index)) {
            classes.push('answered');
        }
        
        return classes.join(' ');
    }

    /**
     * Go to specific question
     */
    goToQuestion(index) {
        if (this.viewMode === 'single') {
            this.showQuestion(index);
        } else {
            // Scroll to question in all questions view
            const questionElement = document.querySelector(`[data-question-index="${index}"]`);
            if (questionElement) {
                questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        if (this.elements.quizTakingScreen.style.display === 'none') return;
        
        // Don't handle shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousQuestion();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextQuestion();
                break;
            case 'Escape':
                e.preventDefault();
                this.pauseQuiz();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
                if (this.viewMode === 'single') {
                    e.preventDefault();
                    const choiceIndex = parseInt(e.key) - 1;
                    this.selectChoice(choiceIndex);
                }
                break;
        }
    }

    /**
     * Select choice by index (for keyboard shortcuts)
     */
    selectChoice(choiceIndex) {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        if (question.type === 'multiple-choice' && choiceIndex < question.choices.length) {
            const radio = document.querySelector(`input[name="question_${this.currentQuestionIndex}"][value="${choiceIndex}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        }
    }

    /**
     * Pause quiz
     */
    pauseQuiz() {
        this.isPaused = true;
        this.elements.pauseAnsweredCount.textContent = this.userAnswers.filter((answer, index) => 
            this.isQuestionAnswered(index)
        ).length;
        this.elements.pauseTimeRemaining.textContent = Utils.formatTimeDisplay(this.timeRemaining);
        this.elements.pauseModal.style.display = 'flex';
    }

    /**
     * Resume quiz
     */
    resumeQuiz() {
        this.isPaused = false;
        this.closeModal();
    }

    /**
     * Quit quiz
     */
    quitQuiz() {
        if (confirm('Bạn có chắc muốn thoát quiz? Tiến độ sẽ không được lưu.')) {
            this.cleanup();
            this.showQuizSelection();
        }
    }

    /**
     * Show submit confirmation modal
     */
    showSubmitModal() {
        const answeredCount = this.userAnswers.filter((answer, index) => 
            this.isQuestionAnswered(index)
        ).length;
        const remainingCount = this.currentQuiz.questions.length - answeredCount;
        
        this.elements.submitAnsweredCount.textContent = answeredCount;
        this.elements.submitRemainingCount.textContent = remainingCount;
        this.elements.submitModal.style.display = 'flex';
    }

    /**
     * Submit quiz
     */
    submitQuiz() {
        this.cleanup();
        this.calculateResults();
        this.showScreen('result');
    }

    /**
     * Calculate and display results
     */
    calculateResults() {
        const results = this.calculateScore();
        
        // Save result to storage
        const resultData = {
            score: results.score,
            totalQuestions: this.currentQuiz.questions.length,
            correctAnswers: results.correctCount,
            timeSpent: (this.currentQuiz.duration * 60) - this.timeRemaining,
            answers: results.detailedAnswers
        };
        
        this.quizManager.saveResult(this.currentQuiz.id, resultData);
        
        // Display results
        this.displayResults(results);
    }

    /**
     * Calculate quiz score
     */
    calculateScore() {
        let correctCount = 0;
        const detailedAnswers = [];
        
        this.currentQuiz.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            let isCorrect = false;
            
            if (question.type === 'short-answer') {
                // For short answer, check if user answer matches correct answer
                const correctAnswer = question.correctAnswers.toString().toLowerCase().trim();
                const userAnswerStr = (userAnswer || '').toString().toLowerCase().trim();
                isCorrect = userAnswerStr === correctAnswer;
            } else if (question.type === 'true-false') {
                // For true-false, check if all answers match
                const correctAnswers = question.correctAnswers;
                if (userAnswer && Array.isArray(correctAnswers)) {
                    isCorrect = correctAnswers.every((correct, choiceIndex) => {
                        if (correct !== null) {
                            return userAnswer[choiceIndex] === correct;
                        }
                        return true; // Skip null values
                    });
                }
            } else {
                // For multiple choice
                isCorrect = userAnswer === question.correctAnswers;
            }
            
            if (isCorrect) correctCount++;
            
            detailedAnswers.push({
                questionId: question.id,
                questionNumber: index + 1,
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswers,
                isCorrect: isCorrect
            });
        });
        
        const percentage = Math.round((correctCount / this.currentQuiz.questions.length) * 100);
        
        return {
            correctCount,
            totalQuestions: this.currentQuiz.questions.length,
            percentage,
            score: percentage,
            detailedAnswers
        };
    }

    /**
     * Display quiz results
     */
    displayResults(results) {
        const grade = Utils.getGrade(results.percentage);
        const timeSpent = (this.currentQuiz.duration * 60) - this.timeRemaining;
        
        // Update result header
        this.elements.resultIcon.className = `fas fa-${grade.letter === 'A+' || grade.letter === 'A' ? 'trophy' : 
                                                      grade.letter.startsWith('B') ? 'medal' : 
                                                      grade.letter.startsWith('C') ? 'award' : 'certificate'}`;
        this.elements.resultIcon.style.color = grade.color;
        
        this.elements.resultTitle.textContent = `${grade.description}!`;
        this.elements.resultSubtitle.textContent = `Bạn đã hoàn thành "${this.currentQuiz.title}"`;
        
        // Update stats
        this.elements.finalScore.textContent = results.score;
        this.elements.finalScore.style.color = grade.color;
        this.elements.finalPercentage.textContent = `${results.percentage}%`;
        this.elements.finalCorrect.textContent = `${results.correctCount}/${results.totalQuestions}`;
        this.elements.finalTime.textContent = Utils.formatTimeDisplay(timeSpent);
        
        // Store results for review
        this.lastResults = results;
    }

    /**
     * Review answers
     */
    async reviewAnswers() {
        const container = this.elements.resultDetails;
        
        const html = this.currentQuiz.questions.map((question, index) => {
            const result = this.lastResults.detailedAnswers[index];
            const userAnswer = result.userAnswer;
            
            let answerDisplay = '';
            let correctDisplay = '';
            
            if (question.type === 'short-answer') {
                answerDisplay = userAnswer ? `"${userAnswer}"` : 'Không trả lời';
                correctDisplay = `"${question.correctAnswers}"`;
            } else if (question.type === 'true-false') {
                answerDisplay = question.choices.map((choice, choiceIndex) => {
                    const userChoice = userAnswer && userAnswer[choiceIndex];
                    const correctChoice = question.correctAnswers[choiceIndex];
                    const isCorrect = userChoice === correctChoice;
                    
                    return `
                        <div class="tf-result-item ${isCorrect ? 'correct' : 'incorrect'}">
                            ${String.fromCharCode(97 + choiceIndex)}) ${userChoice === true ? 'Đ' : userChoice === false ? 'S' : '-'}
                        </div>
                    `;
                }).join('');
                
                correctDisplay = question.choices.map((choice, choiceIndex) => {
                    const correctChoice = question.correctAnswers[choiceIndex];
                    return `
                        <div class="tf-result-item correct">
                            ${String.fromCharCode(97 + choiceIndex)}) ${correctChoice === true ? 'Đ' : 'S'}
                        </div>
                    `;
                }).join('');
            } else {
                // Multiple choice
                const choiceLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
                
                // Create choices display
                const choicesHtml = question.choices.map((choice, choiceIndex) => {
                    const isUserChoice = userAnswer === choiceIndex;
                    const isCorrectChoice = question.correctAnswers === choiceIndex;
                    
                    let choiceClass = 'result-choice-neutral';
                    let icon = '';
                    
                    if (isCorrectChoice) {
                        choiceClass = 'result-choice-correct';
                        icon = '<i class="fas fa-check result-choice-icon"></i>';
                    } else if (isUserChoice) {
                        choiceClass = 'result-choice-incorrect';
                        icon = '<i class="fas fa-times result-choice-icon"></i>';
                    }
                    
                    return `
                        <div class="result-choice ${choiceClass}">
                            <span class="result-choice-label">${choiceLabels[choiceIndex]}.</span>
                            <span class="result-choice-text">${choice.text}</span>
                            ${icon}
                        </div>
                    `;
                }).join('');
                
                answerDisplay = choicesHtml;
                correctDisplay = ''; // Already shown in choices
            }
            
            return `
                <div class="result-question ${result.isCorrect ? 'correct' : 'incorrect'} ${question.type}">
                    <div class="result-question-header">
                        <span class="question-number">Câu ${index + 1}</span>
                        <span class="result-status ${result.isCorrect ? 'correct' : 'incorrect'}">
                            <i class="fas fa-${result.isCorrect ? 'check' : 'times'}"></i>
                            ${result.isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                        <span class="question-type-badge">${question.type === 'short-answer' ? 'Trả lời ngắn' : 
                                                           question.type === 'true-false' ? 'Đúng - Sai' : 'Trắc nghiệm'}</span>
                    </div>
                    <div class="result-question-content">
                        <div class="question-text">${question.question}</div>
                        
                        ${question.type === 'multiple-choice' ? `
                            <div class="result-choices">
                                ${answerDisplay}
                            </div>
                        ` : `
                            ${userAnswer !== null && userAnswer !== undefined ? `
                                <div class="user-answer ${!result.isCorrect ? 'incorrect' : ''}">
                                    <strong>Bạn trả lời:</strong> ${answerDisplay}
                                </div>
                            ` : `
                                <div class="user-answer no-answer">
                                    <strong>Bạn chưa trả lời</strong>
                                </div>
                            `}
                            
                            ${question.type !== 'multiple-choice' && correctDisplay ? `
                                <div class="correct-answer">
                                    <strong>Đáp án đúng:</strong> ${correctDisplay}
                                </div>
                            ` : ''}
                        `}
                        
                        ${question.explanation ? `
                            <div class="explanation">
                                <strong>Lời giải:</strong> ${question.explanation}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        // Render math
        await this.renderMath(container);
    }

    /**
     * Retake quiz
     */
    retakeQuiz() {
        this.initializeQuiz();
        this.showScreen('taking');
    }

    /**
     * Back to quiz selection
     */
    backToSelection() {
        this.showQuizSelection();
    }

    /**
     * Close modal
     */
    closeModal() {
        this.elements.pauseModal.style.display = 'none';
        this.elements.submitModal.style.display = 'none';
    }

    /**
     * Cleanup quiz resources
     */
    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isPaused = false;
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