/**
 * Quiz Taking Application
 */
class QuizApp {
    /**
     * Safe initialization with error handling
     */
    constructor() {
        try {
            console.log('Initializing QuizApp...');
            
            this.quizManager = new QuizManager();
            console.log('QuizManager created');
            
            // Debug storage
            this.quizManager.debugStorage();
            
            this.currentQuiz = null;
            this.currentQuestionIndex = 0;
            this.userAnswers = [];
            this.timeRemaining = 0;
            this.timer = null;
            this.isPaused = false;
            this.startTime = null;
            this.viewMode = 'single';
            this.mathJaxLoaded = false;

            console.log('Initializing elements...');
            this.initializeElements();
            
            console.log('Binding events...');
            this.bindEvents();
            
            console.log('Loading MathJax...');
            this.loadMathJax();
            
            // Check if we have URL params, otherwise show quiz selection
            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('id');
            const quizSlug = urlParams.get('slug');
            
            console.log('URL params:', { quizId, quizSlug });
            
            if (quizId || quizSlug) {
                this.loadQuizFromUrl();
            } else {
                this.showQuizSelection();
            }
            
            console.log('QuizApp initialized successfully');
        } catch (error) {
            console.error('Quiz app initialization failed:', error);
            this.showError('Lỗi khởi tạo ứng dụng: ' + error.message);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Showing error:', message);
        
        // Try to find error container
        let errorContainer = document.getElementById('error-message');
        
        if (!errorContainer) {
            // Create error container if not exists
            errorContainer = document.createElement('div');
            errorContainer.id = 'error-message';
            errorContainer.className = 'error-message';
            errorContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fee;
                border: 2px solid #f00;
                padding: 20px;
                border-radius: 8px;
                z-index: 9999;
                max-width: 400px;
                text-align: center;
            `;
            document.body.appendChild(errorContainer);
        }
        
        errorContainer.innerHTML = `
            <h3 style="color: #d00; margin-top: 0;">Lỗi</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.style.display='none'" 
                    style="background: #d00; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                Đóng
            </button>
        `;
        
        errorContainer.style.display = 'block';
    }

    /**
     * Initialize DOM elements with comprehensive null checks
     */
    initializeElements() {
        try {
            console.log('Initializing elements...');
            
            this.elements = {
                // Screens - sửa ID cho đúng với HTML
                quizSelectionScreen: document.getElementById('quizSelectionScreen'),
                quizTakingScreen: document.getElementById('quizTakingScreen'), 
                quizResultScreen: document.getElementById('quizResultScreen'),
                
                // Quiz selection
                quizSelectionGrid: document.getElementById('quizSelectionGrid'),
                
                // Quiz taking - sửa ID cho đúng với HTML
                quizTitle: document.getElementById('quizTitle'),
                questionProgress: document.getElementById('questionProgress'),
                timeRemaining: document.getElementById('timeRemaining'),
                currentQuestionNumber: document.getElementById('currentQuestionNumber'),
                questionText: document.getElementById('questionText'),
                questionChoices: document.getElementById('questionChoices'),
                
                // Student info
                studentNameInput: document.getElementById('studentNameInput'),
                studentClassInput: document.getElementById('studentClassInput'),
                
                // Navigation buttons
                prevQuestionBtn: document.getElementById('prevQuestionBtn'),
                nextQuestionBtn: document.getElementById('nextQuestionBtn'),
                submitQuizBtn: document.getElementById('submitQuizBtn'),
                viewModeBtn: document.getElementById('viewModeBtn'),
                pauseBtn: document.getElementById('pauseBtn'),
                
                // Question containers
                allQuestionsContainer: document.getElementById('allQuestionsContainer'),
                allQuestionsContent: document.getElementById('allQuestionsContent'),
                // Modals
                submitModal: document.getElementById('submitModal'),
                
                submitAnsweredCount: document.getElementById('submitAnsweredCount'),
                submitRemainingCount: document.getElementById('submitRemainingCount'),
                cancelSubmitBtn: document.getElementById('cancelSubmitBtn'),
                confirmSubmitBtn: document.getElementById('confirmSubmitBtn'),
                
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
                backToSelectionBtn: document.getElementById('backToSelectionBtn'),
                
                // Loading
                loadingOverlay: document.getElementById('loadingOverlay')
            };
            
            // Check if required elements exist - sửa tên cho đúng
            const requiredElements = ['quizSelectionScreen', 'quizTakingScreen', 'quizResultScreen'];
            for (const elementName of requiredElements) {
                if (!this.elements[elementName]) {
                    console.error(`Element not found: ${elementName}, ID should be: ${elementName}`);
                    throw new Error(`Required element not found: ${elementName}`);
                }
            }
            
            console.log('Elements initialized successfully');
            console.log('Found elements:', Object.keys(this.elements).filter(key => this.elements[key]));
        } catch (error) {
            console.error('Error initializing elements:', error);
            throw error;
        }
    }

    /**
     * Bind events with null checks
     */
    bindEvents() {
        console.log('Binding events...');
        
        // Navigation buttons
        if (this.elements.prevQuestionBtn) {
            this.elements.prevQuestionBtn.addEventListener('click', () => this.prevQuestion());
        }
        if (this.elements.nextQuestionBtn) {
            this.elements.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        }
        if (this.elements.submitQuizBtn) {
            this.elements.submitQuizBtn.addEventListener('click', () => this.showSubmitModal());
        }
        if (this.elements.viewModeBtn) {
            this.elements.viewModeBtn.addEventListener('click', () => this.toggleViewMode());
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.pauseQuiz());
        }

        // Modal buttons
        if (this.elements.resumeQuizBtn) {
            this.elements.resumeQuizBtn.addEventListener('click', () => this.resumeQuiz());
        }
        if (this.elements.quitQuizBtn) {
            this.elements.quitQuizBtn.addEventListener('click', () => this.quitQuiz());
        }
        if (this.elements.cancelSubmitBtn) {
            this.elements.cancelSubmitBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.elements.confirmSubmitBtn) {
            this.elements.confirmSubmitBtn.addEventListener('click', () => this.submitQuiz());
        }

        // Result buttons
        if (this.elements.reviewAnswersBtn) {
            this.elements.reviewAnswersBtn.addEventListener('click', () => this.reviewAnswers());
        }
        if (this.elements.retakeQuizBtn) {
            this.elements.retakeQuizBtn.addEventListener('click', () => this.retakeQuiz());
        }
        if (this.elements.backToSelectionBtn) {
            this.elements.backToSelectionBtn.addEventListener('click', () => this.backToSelection());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Close modals
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-close') || event.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
        
        console.log('Events bound successfully');
    }

    /**
     * Load MathJax for math rendering
     */
    async loadMathJax() {
        return new Promise((resolve, reject) => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                this.mathJaxLoaded = true;
                resolve();
                return;
            }

            // Only configure MathJax if not already configured
            if (!window.MathJax) {
                window.MathJax = {
                    tex: {
                        inlineMath: [['$', '$'], ['\\(', '\\)']],
                        displayMath: [['$$', '$$'], ['\\[', '\\]']],
                        processEscapes: true,
                        processEnvironments: true
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
            }

            // Load MathJax script if not already loaded
            if (!document.querySelector('script[src*="mathjax"]')) {
                // Configure MathJax before loading
                window.MathJax = {
                    loader: {
                        load: ['input/tex', 'output/svg']
                    },
                    tex: {
                        inlineMath: [['$', '$'], ['\\(', '\\)']],
                        displayMath: [['$$', '$$'], ['\\[', '\\]']],
                        processEscapes: true,
                        processEnvironments: true
                    },
                    svg: {
                        fontCache: 'global'
                    },
                    startup: {
                        typeset: true,
                        ready: () => {
                            console.log('MathJax is ready');
                            MathJax.startup.defaultReady();
                        }
                    }
                };

                // Then load MathJax
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
                script.async = true;
                script.onload = () => {
                    console.log('MathJax script loaded in Quiz');
                    this.mathJaxLoaded = true;
                    resolve();
                };
                script.onerror = (error) => {
                    console.error('Failed to load MathJax in Quiz:', error);
                    this.mathJaxLoaded = false;
                    resolve(); // Don't reject, continue without MathJax
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
        try {
            if (!this.mathJaxLoaded) {
                await this.loadMathJax();
            }

            if (window.MathJax && window.MathJax.typesetPromise) {
                if (container) {
                    await window.MathJax.typesetPromise([container]);
                } else {
                    await window.MathJax.typesetPromise();
                }
                console.log('MathJax rendering completed');
            }
        } catch (error) {
            console.warn('MathJax rendering failed:', error);
            // Continue without math rendering
        }
    }

    /**
     * Load quiz from URL parameters (support both ID and slug)
     */
    async loadQuizFromUrl() {
        try {
            console.log('Loading quiz from URL...');
            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('id');
            const quizSlug = urlParams.get('slug');
            
            let quiz = null;
            
            if (quizSlug) {
                console.log('Loading by slug:', quizSlug);
                quiz = await this.quizManager.getQuizBySlug(quizSlug);
            } else if (quizId) {
                console.log('Loading by ID:', quizId);
                quiz = await this.quizManager.getQuiz(quizId);
            }
            
            if (quiz) {
                console.log('Quiz loaded:', quiz.title);
                this.startQuizById(quiz.id);
                
                // Update URL with slug for SEO
                if (!quizSlug && quiz.slug) {
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('slug', quiz.slug);
                    newUrl.searchParams.delete('id');
                    window.history.replaceState({}, '', newUrl);
                }
            } else {
                console.error('Quiz not found');
                this.showToast('Không tìm thấy quiz', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Error loading quiz from URL:', error);
            this.showError('Lỗi tải quiz: ' + error.message);
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
    async loadQuizList() {
        try {
            console.log('Loading quiz list...');
            
            const quizzes = await this.quizManager.getAllQuizzes();
            console.log('Found quizzes:', quizzes.length, quizzes);
            
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
                
                // Truyền slug vào URL nếu có
                const quizUrl = quiz.slug ? `quiz.html?slug=${quiz.slug}` : `quiz.html?id=${quiz.id}`;
                return `
                    <div class="quiz-card" onclick="window.location.href='${quizUrl}'">
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
                                    ${new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
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
        } catch (error) {
            console.error('Error loading quiz list:', error);
            this.showError('Lỗi tải danh sách quiz: ' + error.message);
        }
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
     * Start quiz with quiz object
     */
    startQuiz(quiz) {
        if (!quiz) {
            this.showToast('Quiz không hợp lệ', 'error');
            return;
        }

        this.currentQuiz = quiz;
        this.initializeQuiz();
        this.showScreen('taking');
    }

    /**
     * Start quiz by ID with better validation
     */
    async startQuizById(quizId) {
        try {
            console.log('Starting quiz by ID:', quizId);
            
            if (!quizId) {
                throw new Error('Quiz ID không hợp lệ');
            }
            
            this.showLoading(true);
            
            const quiz = await this.quizManager.getQuiz(quizId);
            console.log('Quiz data loaded:', quiz);
            
            if (!quiz) {
                throw new Error('Không tìm thấy quiz');
            }
            
            // Validate quiz data
            if (!this.validateQuizData(quiz)) {
                throw new Error('Dữ liệu quiz không hợp lệ');
            }
            
            this.currentQuiz = quiz;
            this.initializeQuiz();
            this.showScreen('taking');
            
        } catch (error) {
            console.error('Error starting quiz:', error);
            this.showError('Lỗi tải quiz: ' + error.message);
            
            // Redirect to quiz selection after 3 seconds
            setTimeout(() => {
                this.showQuizSelection();
            }, 3000);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Validate quiz data
     */
    validateQuizData(quiz) {
        if (!quiz) {
            console.error('Quiz is null or undefined');
            return false;
        }
        
        if (!quiz.questions || !Array.isArray(quiz.questions)) {
            console.error('Quiz questions is not an array:', quiz.questions);
            return false;
        }
        
        if (quiz.questions.length === 0) {
            console.error('Quiz has no questions');
            return false;
        }
        
        // Validate each question
        for (let i = 0; i < quiz.questions.length; i++) {
            const question = quiz.questions[i];
            
            if (!question.question || typeof question.question !== 'string') {
                console.error(`Question ${i + 1} has invalid question text:`, question.question);
                return false;
            }
            
            if (!question.type || !['multiple-choice', 'true-false', 'essay', 'short-answer'].includes(question.type)) {
                console.error(`Question ${i + 1} has invalid type:`, question.type);
                return false;
            }
            
            if (question.type === 'multiple-choice' && (!question.choices || !Array.isArray(question.choices))) {
                console.error(`Question ${i + 1} (multiple-choice) has invalid choices:`, question.choices);
                return false;
            }
        }
        
        console.log('Quiz validation passed');
        return true;
    }

    /**
     * Start quiz directly without user info modal
     */
    startQuizDirectly() {
        console.log('Starting quiz:', this.currentQuiz.title);
        
        // Khởi tạo userInfo mặc định
        this.userInfo = {
            name: 'Ẩn danh',
            class: 'Không xác định',
            timestamp: new Date().toISOString()
        };
        
        this.initializeQuiz();
        this.showScreen('taking');
        
        // Auto-save student info when they type
        if (this.elements.studentNameInput) {
            this.elements.studentNameInput.addEventListener('input', () => this.updateUserInfo());
        }
        if (this.elements.studentClassInput) {
            this.elements.studentClassInput.addEventListener('input', () => this.updateUserInfo());
        }
    }

    /**
     * Update user info from input fields
     */
    updateUserInfo() {
        this.userInfo = {
            name: this.elements.studentNameInput.value.trim() || 'Ẩn danh',
            class: this.elements.studentClassInput.value.trim() || 'Không xác định',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Initialize quiz data
     */
    initializeQuiz() {
        if (!this.currentQuiz || !this.currentQuiz.questions) {
            this.showToast('Dữ liệu quiz không hợp lệ', 'error');
            return;
        }

        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(this.currentQuiz.questions.length).fill(null);
        this.timeRemaining = this.currentQuiz.duration * 60; // Convert to seconds
        this.startTime = Date.now();
        this.isPaused = false;
        this.viewMode = 'single';

        // Initialize UI
        if (this.elements.quizTitle) {
            this.elements.quizTitle.textContent = this.currentQuiz.title;
        }
        
        this.updateQuestionProgress();
        this.updateStats();
        this.renderQuestionGrid();
        this.showQuestion(0);
        this.startTimer();
    }

    /**
     * Show specific screen with null checks
     */
    showScreen(screen) {
        // Hide all screens first
        if (this.elements.quizSelectionScreen) {
            this.elements.quizSelectionScreen.style.display = screen === 'selection' ? 'block' : 'none';
        }
        if (this.elements.quizTakingScreen) {
            this.elements.quizTakingScreen.style.display = screen === 'taking' ? 'block' : 'none';
        }
        if (this.elements.quizResultScreen) {
            this.elements.quizResultScreen.style.display = screen === 'result' ? 'block' : 'none';
        }
        
        console.log(`Switched to screen: ${screen}`);
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
     * Update time display with null checks
     */
    updateTimeDisplay() {
        if (!this.elements.timeRemaining) {
            console.warn('timeRemaining element not found');
            return;
        }
        
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.elements.timeRemaining.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning class when time is low
        if (this.timeRemaining <= 300) { // 5 minutes
            this.elements.timeRemaining.classList.add('time-warning');
        }
        if (this.timeRemaining <= 60) { // 1 minute
            this.elements.timeRemaining.classList.add('time-critical');
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
        if (this.elements.currentQuestionNumber) {
            this.elements.currentQuestionNumber.textContent = `Câu ${index + 1}`;
        }
        if (this.elements.prevQuestionBtn) {
            this.elements.prevQuestionBtn.disabled = index === 0;
        }
        if (this.elements.nextQuestionBtn) {
            this.elements.nextQuestionBtn.disabled = index === this.currentQuiz.questions.length - 1;
        }
        
        // Update question text
        if (this.elements.questionText) {
            this.elements.questionText.innerHTML = question.question;
        }
        
        // Render choices based on question type
        this.renderQuestionChoices(question, index);
        
        // Update progress and stats
        this.updateQuestionProgress();
        this.updateStats();
        this.updateQuestionGrid();
        
        // Render math
        await this.renderMath();
    }

    /**
     * Render question choices
     */
    renderQuestionChoices(question, questionIndex) {
        if (!this.elements.questionChoices) return;
        
        let html = '';
        
        if (question.type === 'multiple-choice') {
            html = question.choices.map((choice, choiceIndex) => `
                <div class="choice-item">
                    <input type="radio" 
                           id="q${questionIndex}_c${choiceIndex}" 
                           name="question_${questionIndex}" 
                           value="${choiceIndex}"
                           ${this.userAnswers[questionIndex] === choiceIndex ? 'checked' : ''}
                           onchange="quizApp.selectAnswer(${questionIndex}, ${choiceIndex})">
                    <label for="q${questionIndex}_c${choiceIndex}" class="choice-label">
                        <span class="choice-letter">${String.fromCharCode(65 + choiceIndex)}</span>
                        <span class="choice-text">${choice}</span>
                    </label>
                </div>
            `).join('');
        } else if (question.type === 'true-false') {
            html = `
                <div class="choice-item">
                    <input type="radio" 
                           id="q${questionIndex}_true" 
                           name="question_${questionIndex}" 
                           value="true"
                           ${this.userAnswers[questionIndex] === 'true' ? 'checked' : ''}
                           onchange="quizApp.selectAnswer(${questionIndex}, 'true')">
                    <label for="q${questionIndex}_true" class="choice-label">
                        <span class="choice-letter">A</span>
                        <span class="choice-text">Đúng</span>
                    </label>
                </div>
                <div class="choice-item">
                    <input type="radio" 
                           id="q${questionIndex}_false" 
                           name="question_${questionIndex}" 
                           value="false"
                           ${this.userAnswers[questionIndex] === 'false' ? 'checked' : ''}
                           onchange="quizApp.selectAnswer(${questionIndex}, 'false')">
                    <label for="q${questionIndex}_false" class="choice-label">
                        <span class="choice-letter">B</span>
                        <span class="choice-text">Sai</span>
                    </label>
                </div>
            `;
        } else if (question.type === 'essay') {
            html = `
                <div class="essay-container">
                    <textarea id="essay_${questionIndex}" 
                              class="essay-input" 
                              placeholder="Nhập câu trả lời của bạn..."
                              onchange="quizApp.selectAnswer(${questionIndex}, this.value)">${this.userAnswers[questionIndex] || ''}</textarea>
                </div>
            `;
        }
        
        this.elements.questionChoices.innerHTML = html;
    }

    /**
     * Select answer
     */
    selectAnswer(questionIndex, answer) {
        this.userAnswers[questionIndex] = answer;
        this.updateStats();
        this.updateQuestionGrid();
        console.log(`Question ${questionIndex + 1} answered:`, answer);
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
            });
        });
        
        // Short answer inputs
        container.querySelectorAll('.all-short-answer-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const questionIdx = parseInt(e.target.dataset.questionIndex);
                this.userAnswers[questionIdx] = e.target.value.trim();
                this.updateStats();
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
     * Check if question is answered with fallback
     */
    isQuestionAnswered(index) {
        if (!this.userAnswers || index >= this.userAnswers.length) {
            return false;
        }
        
        const answer = this.userAnswers[index];
        if (answer === null || answer === undefined) {
            return false;
        }
        
        // For arrays (true-false questions)
        if (Array.isArray(answer)) {
            return answer.some(a => a !== null && a !== undefined);
        }
        
        // For strings (short answer)
        if (typeof answer === 'string') {
            return answer.trim() !== '';
        }
        
        // For numbers (multiple choice)
        return true;
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
     * Update question progress with null checks
     */
    updateQuestionProgress() {
        if (!this.currentQuiz) return;
        
        if (this.elements.questionProgress) {
            this.elements.questionProgress.textContent = 
                `Câu ${this.currentQuestionIndex + 1}/${this.currentQuiz.questions.length}`;
        }
        
        if (this.elements.currentQuestionNumber) {
            this.elements.currentQuestionNumber.textContent = `Câu ${this.currentQuestionIndex + 1}`;
        }
    }

    /**
     * Update quiz statistics with null checks
     */
    updateStats() {
        if (!this.currentQuiz) return;
        
        const answeredCount = this.userAnswers.filter((answer, index) => 
            this.isQuestionAnswered(index)
        ).length;
        
        // Update any stats display elements if they exist
        const statsElement = document.getElementById('quizStats');
        if (statsElement) {
            statsElement.textContent = `Đã trả lời: ${answeredCount}/${this.currentQuiz.questions.length}`;
        }
    }

    /**
     * Render question grid
     */
    renderQuestionGrid() {
        if (!this.elements.questionGrid) return;
        this.elements.questionGrid.innerHTML = '';
    }

    /**
     * Get question grid class
     */
    getQuestionGridClass(index) {
        let classes = [];
        
        if (index === this.currentQuestionIndex) {
            classes.push('current');
        }
        
        if (this.isQuestionAnswered(index)) {
            classes.push('answered');
        }
        
        return classes.join(' ');
    }

    /**
     * Check if question is answered
     */
    isQuestionAnswered(index) {
        const answer = this.userAnswers[index];
        return answer !== null && answer !== undefined && answer !== '';
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
     * Update question grid
     */
    updateQuestionGrid() {
        if (!this.elements.questionGrid || !this.currentQuiz) return;
        
        const items = this.elements.questionGrid.querySelectorAll('.question-grid-item');
        items.forEach((item, index) => {
            item.className = `question-grid-item ${this.getQuestionGridClass(index)}`;
        });
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
        if (this.elements.pauseAnsweredCount) {
            this.elements.pauseAnsweredCount.textContent = this.userAnswers.filter((answer, index) => 
                this.isQuestionAnswered(index)
            ).length;
        }
        if (this.elements.pauseTimeRemaining) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            this.elements.pauseTimeRemaining.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        if (this.elements.pauseModal) {
            this.elements.pauseModal.style.display = 'flex';
        }
    }

    /**
     * Resume quiz
     */
    resumeQuiz() {
        // Bỏ chức năng tạm dừng
        return;
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
        console.log('Submitting quiz...');
        
        // Close submit modal
        if (this.elements.submitModal) {
            this.elements.submitModal.style.display = 'none';
        }
        
        this.cleanup();
        this.calculateResults();
        this.showScreen('result');
    }

    /**
     * Calculate and display results
     */
    calculateResults() {
        console.log('Calculating results...');
        
        // Update user info
        this.updateUserInfo();
        
        const results = this.calculateScore();
        
        // Save result to storage
        const resultData = {
            score: results.score,
            totalQuestions: this.currentQuiz.questions.length,
            correctAnswers: results.correctCount,
            timeSpent: (this.currentQuiz.duration * 60) - this.timeRemaining,
            answers: results.detailedAnswers
        };
        
        try {
            const resultId = this.quizManager.saveResult(this.currentQuiz.id, resultData, this.userInfo);
            this.currentResultId = resultId;
            console.log('Result saved with ID:', resultId);
        } catch (error) {
            console.error('Error saving result:', error);
        }
        
        // Display results
        this.displayResults(results);
    }

    /**
     * Calculate quiz score with corrected scoring
     */
    calculateScore() {
        if (!this.currentQuiz || !this.currentQuiz.questions) {
            console.error('Cannot calculate score: no quiz data');
            return { correctCount: 0, totalQuestions: 0, percentage: 0, score: 0, maxScore: 0, detailedAnswers: [] };
        }
        
        let totalScore = 0;
        let maxScore = 0;
        const detailedAnswers = [];
        
        this.currentQuiz.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            let isCorrect = false;
            let score = 0;
            let maxQuestionScore = 1; // Default 1 point per question
            
            if (question.type === 'multiple-choice') {
                if (userAnswer !== null && userAnswer !== undefined) {
                    // Check if the selected choice is correct
                    const selectedChoice = question.choices[userAnswer];
                    if (selectedChoice) {
                        if (typeof selectedChoice === 'object' && selectedChoice.isCorrect) {
                            isCorrect = true;
                            score = 1;
                        } else if (question.correctAnswer !== undefined && userAnswer === question.correctAnswer) {
                            isCorrect = true;
                            score = 1;
                        }
                    }
                }
            } else if (question.type === 'true-false') {
                if (userAnswer !== null && userAnswer !== undefined) {
                    const selectedChoice = question.choices[userAnswer];
                    if (selectedChoice) {
                        if (typeof selectedChoice === 'object' && selectedChoice.isCorrect) {
                            isCorrect = true;
                            score = 1;
                        } else if (question.correctAnswer !== undefined && userAnswer === question.correctAnswer) {
                            isCorrect = true;
                            score = 1;
                        }
                    }
                }
            } else if (question.type === 'short-answer') {
                maxQuestionScore = 0.5;
                if (userAnswer && userAnswer.trim()) {
                    const correctAnswer = question.correctAnswer || question.answer;
                    if (correctAnswer && userAnswer.trim().toLowerCase() === correctAnswer.toString().toLowerCase().trim()) {
                        isCorrect = true;
                        score = 0.5;
                    }
                }
            } else if (question.type === 'essay') {
                maxQuestionScore = 2;
                if (userAnswer && userAnswer.trim()) {
                    score = 1; // Partial credit for attempting
                }
            }
            
            totalScore += score;
            maxScore += maxQuestionScore;
            
            detailedAnswers.push({
                questionId: question.id || `q_${index}`,
                questionNumber: index + 1,
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect: isCorrect,
                score: score,
                maxScore: maxQuestionScore,
                type: question.type
            });
        });
        
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        
        console.log('Score calculation:', {
            totalScore,
            maxScore,
            percentage,
            correctCount: detailedAnswers.filter(a => a.isCorrect).length
        });
        
        return {
            correctCount: detailedAnswers.filter(a => a.isCorrect).length,
            totalQuestions: this.currentQuiz.questions.length,
            percentage,
            score: totalScore,
            maxScore: maxScore,
            detailedAnswers
        };
    }

    /**
     * Display quiz results
     */
    displayResults(results) {
        const grade = Utils.getGrade(results.percentage);
        const timeSpent = (this.currentQuiz.duration * 60) - this.timeRemaining;
        
        // Update result header với tên và lớp
        this.elements.resultIcon.className = `fas fa-${grade.letter === 'A+' || grade.letter === 'A' ? 'trophy' : 
                                                      grade.letter.startsWith('B') ? 'medal' : 
                                                      grade.letter.startsWith('C') ? 'award' : 'certificate'}`;
        this.elements.resultIcon.style.color = grade.color;
        
        this.elements.resultTitle.textContent = `${grade.description}!`;
        
        // Hiển thị tên và lớp thay vì "Bạn"
        const studentInfo = this.userInfo.name !== 'Ẩn danh' ? 
            `${this.userInfo.name} (${this.userInfo.class})` : 'Bạn';
        this.elements.resultSubtitle.textContent = `${studentInfo} đã hoàn thành "${this.currentQuiz.title}"`;
        
        // Update stats
        this.elements.finalScore.textContent = `${results.score.toFixed(2)}/${results.maxScore.toFixed(2)}`;
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
                const choiceLabels = ['a', 'b', 'c', 'd', 'e', 'f'];
                // Create choices display with bold a) b) c) d) and show both user and correct answers
                const choicesHtml = question.choices.map((choice, choiceIndex) => {
                    const userChoice = userAnswer && userAnswer[choiceIndex];
                    const correctChoice = question.correctAnswers[choiceIndex];
                    
                    let choiceClass = 'result-choice-neutral';
                    let icon = '';
                    
                    // Kiểm tra xem user đã trả lời đúng chưa
                    if (userChoice === correctChoice) {
                        choiceClass = 'result-choice-correct';
                        icon = '<i class="fas fa-check result-choice-icon"></i>';
                    } else if (userChoice !== undefined && userChoice !== null) {
                        choiceClass = 'result-choice-incorrect';
                        icon = '<i class="fas fa-times result-choice-icon"></i>';
                    }
                    
                    // Format user and correct answer text
                    let userText = (userChoice === true) ? 'Đúng' : 
                                  (userChoice === false) ? 'Sai' : 'Chưa chọn';
                    let correctText = (correctChoice === true) ? 'Đúng' : 
                                   (correctChoice === false) ? 'Sai' : 'Không xác định';
                    
                    return `
                        <div class="result-choice ${choiceClass}">
                            <span class="result-choice-label"><strong>${choiceLabels[choiceIndex]})</strong></span>
                            <span class="result-choice-text">${choice.text}</span>
                            <span class="result-choice-user"> - <strong>Bạn:</strong> ${userText}</span>
                            <span class="result-choice-correct"> - <strong>Đáp án:</strong> ${correctText}</span>
                            ${icon}
                        </div>
                    `;
                }).join('');
                answerDisplay = choicesHtml;
                correctDisplay = ''; // Already shown in choices
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
                        <span class="question-score">${result.score.toFixed(2)}/${result.maxScore.toFixed(2)} điểm</span>
                    </div>
                    <div class="result-question-content">
                        <div class="question-text">${question.question}</div>
                        
                        ${question.type === 'multiple-choice' || question.type === 'true-false' ? `
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
                            
                            ${correctDisplay ? `
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
        if (this.elements.pauseModal) {
            this.elements.pauseModal.style.display = 'none';
        }
        if (this.elements.submitModal) {
            this.elements.submitModal.style.display = 'none';
        }
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
     * Show loading state
     */
    showLoading(show) {
        let loader = document.getElementById('loading-overlay');
        
        if (!loader && show) {
            loader = document.createElement('div');
            loader.id = 'loading-overlay';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9998;
            `;
            loader.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 10px;"></div>
                    <p>Đang tải...</p>
                </div>
            `;
            
            // Add CSS animation
            if (!document.getElementById('loading-styles')) {
                const style = document.createElement('style');
                style.id = 'loading-styles';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(loader);
        }
        
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        console.log(`Toast (${type}):`, message);
        
        // Create toast if not exists
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
            `;
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'error' ? '#f56565' : type === 'success' ? '#48bb78' : '#4299e1'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 8px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
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

    /**
     * Shuffle questions by type to maintain variety
     */
    shuffleQuestionsByType(questions) {
        const questionsByType = {
            'multiple-choice': [],
            'true-false': [],
            'short-answer': []
        };
        
        // Group questions by type
        questions.forEach(question => {
            const type = question.type || 'multiple-choice';
            questionsByType[type].push(question);
        });
        
        // Shuffle multiple choice questions and their choices
        if (questionsByType['multiple-choice'].length > 0) {
            questionsByType['multiple-choice'] = this.shuffleArray(questionsByType['multiple-choice']);
            questionsByType['multiple-choice'].forEach(question => {
                if (question.choices && question.choices.length > 0) {
                    const correctIndex = question.correctAnswers;
                    const shuffledChoices = this.shuffleArray([...question.choices]);
                    
                    // Update correct answer index after shuffling
                    question.correctAnswers = shuffledChoices.findIndex(choice => 
                        choice === question.choices[correctIndex]
                    );
                    question.choices = shuffledChoices;
                }
            });
        }
        
        // Keep true-false and short-answer in original order but shuffle choices for true-false
        if (questionsByType['true-false'].length > 0) {
            questionsByType['true-false'].forEach(question => {
                if (question.choices && question.choices.length > 0) {
                    const originalCorrectAnswers = [...question.correctAnswers];
                    const choicesWithIndex = question.choices.map((choice, index) => ({
                        choice,
                        originalIndex: index
                    }));
   
                 
                    const shuffledChoicesWithIndex = this.shuffleArray(choicesWithIndex);
                    
                    // Update choices and correct answers
                    question.choices = shuffledChoicesWithIndex.map(item => item.choice);
                    question.correctAnswers = shuffledChoicesWithIndex.map(item => 
                        originalCorrectAnswers[item.originalIndex]
                    );
                }
            });
        }
        
        // Combine: shuffled multiple choice first, then true-false, then short-answer
        return [
            ...questionsByType['multiple-choice'],
            ...questionsByType['true-false'],
            ...questionsByType['short-answer']
        ];
    }

    /**
     * Shuffle array utility
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize quiz app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});



