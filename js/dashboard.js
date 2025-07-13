/**
 * Dashboard functionality for LaTeX to Quiz converter
 */
class Dashboard {
    constructor() {
        this.parser = new LaTeXParser();
        this.quizManager = new QuizManager();
        this.currentQuestions = [];
        this.isConverting = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadQuizList();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            latexInput: document.getElementById('latexInput'),
            previewContent: document.getElementById('previewContent'),
            convertBtn: document.getElementById('convertBtn'),
            saveQuizBtn: document.getElementById('saveQuizBtn'),
            clearBtn: document.getElementById('clearBtn'),
            loadSampleBtn: document.getElementById('loadSampleBtn'),
            charCount: document.getElementById('charCount'),
            questionCount: document.getElementById('questionCount'),
            quizList: document.getElementById('quizList'),
            refreshQuizListBtn: document.getElementById('refreshQuizListBtn'),
            exportDataBtn: document.getElementById('exportDataBtn'),
            importDataBtn: document.getElementById('importDataBtn'),
            importFileInput: document.getElementById('importFileInput'),
            saveQuizModal: document.getElementById('saveQuizModal'),
            saveQuizForm: document.getElementById('saveQuizForm'),
            quizTitle: document.getElementById('quizTitle'),
            quizDescription: document.getElementById('quizDescription'),
            quizDuration: document.getElementById('quizDuration')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Input events
        this.elements.latexInput.addEventListener('input', () => {
            this.updateInputStats();
            this.debounceValidation();
        });

        // Button events
        this.elements.convertBtn.addEventListener('click', () => this.convertLatex());
        this.elements.saveQuizBtn.addEventListener('click', () => this.showSaveModal());
        this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        this.elements.loadSampleBtn.addEventListener('click', () => this.loadSample());
        this.elements.refreshQuizListBtn.addEventListener('click', () => this.loadQuizList());
        this.elements.exportDataBtn.addEventListener('click', () => this.exportData());
        this.elements.importDataBtn.addEventListener('click', () => this.elements.importFileInput.click());
        this.elements.importFileInput.addEventListener('change', (e) => this.importData(e));

        // Form events
        this.elements.saveQuizForm.addEventListener('submit', (e) => this.saveQuiz(e));

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.convertLatex();
                        break;
                    case 's':
                        e.preventDefault();
                        if (this.currentQuestions.length > 0) {
                            this.showSaveModal();
                        }
                        break;
                }
            }
        });
    }

    /**
     * Update input statistics
     */
    updateInputStats() {
        const text = this.elements.latexInput.value;
        const charCount = text.length;
        const questionCount = (text.match(/\\begin\{ex\}/g) || []).length;

        this.elements.charCount.textContent = `${charCount.toLocaleString()} ký tự`;
        this.elements.questionCount.textContent = `${questionCount} câu hỏi`;
    }

    /**
     * Debounced validation
     */
    debounceValidation() {
        clearTimeout(this.validationTimeout);
        this.validationTimeout = setTimeout(() => {
            this.validateInput();
        }, 500);
    }

    /**
     * Validate LaTeX input
     */
    validateInput() {
        const text = this.elements.latexInput.value.trim();
        if (!text) return;

        try {
            const validation = this.parser.validateLatex(text);
            
            // Update convert button state
            this.elements.convertBtn.disabled = !validation.isValid;
            
            if (validation.errors.length > 0) {
                this.showToast(validation.errors.join(', '), 'error');
            }
        } catch (error) {
            console.error('Validation error:', error);
        }
    }

    /**
     * Convert LaTeX to quiz format
     */
    async convertLatex() {
        if (this.isConverting) return;

        const latexText = this.elements.latexInput.value.trim();
        if (!latexText) {
            this.showToast('Vui lòng nhập LaTeX code', 'warning');
            return;
        }

        this.isConverting = true;
        this.showLoading(true);
        this.elements.convertBtn.disabled = true;

        try {
            // Validate input first
            const validation = this.parser.validateLatex(latexText);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Parse LaTeX
            this.currentQuestions = this.parser.parseLatex(latexText);
            
            if (this.currentQuestions.length === 0) {
                throw new Error('Không tìm thấy câu hỏi hợp lệ');
            }

            // Render preview
            await this.renderPreview();
            
            // Enable save button
            this.elements.saveQuizBtn.disabled = false;
            
            this.showToast(`Đã convert thành công ${this.currentQuestions.length} câu hỏi`, 'success');
            
        } catch (error) {
            console.error('Conversion error:', error);
            this.showToast(`Lỗi convert: ${error.message}`, 'error');
            this.showErrorPreview(error.message);
        } finally {
            this.isConverting = false;
            this.showLoading(false);
            this.elements.convertBtn.disabled = false;
        }
    }

    /**
     * Render preview of converted questions
     */
    async renderPreview() {
        const container = this.elements.previewContent;
        container.innerHTML = '';

        if (this.currentQuestions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3>Chưa có nội dung</h3>
                    <p>Nhập LaTeX code và nhấn Convert để xem preview</p>
                </div>
            `;
            return;
        }

        // Create preview header
        const header = document.createElement('div');
        header.className = 'preview-header';
        header.innerHTML = `
            <h3>
                <i class="fas fa-eye"></i>
                Preview Quiz (${this.currentQuestions.length} câu hỏi)
            </h3>
        `;
        container.appendChild(header);

        // Render each question
        for (const question of this.currentQuestions) {
            const questionElement = await this.renderQuestionPreview(question);
            container.appendChild(questionElement);
        }

        // Render math if MathJax is available
        if (window.MathJax && window.MathJax.typesetPromise) {
            try {
                await window.MathJax.typesetPromise([container]);
            } catch (error) {
                console.warn('MathJax rendering failed:', error);
            }
        }
    }

    /**
     * Render a single question preview
     */
    async renderQuestionPreview(question) {
        const questionDiv = document.createElement('div');
        questionDiv.className = `question-preview ${question.type || 'multiple-choice'}`;

        const questionTypeLabel = question.type === 'short-answer' ? 'Trả lời ngắn' :
                                 (question.type === 'true-false' ? 'Đúng - Sai' : 'Trắc nghiệm');
        const choiceLabels = question.type === 'true-false' ?
            ['a)', 'b)', 'c)', 'd)'] :
            ['A.', 'B.', 'C.', 'D.', 'E.', 'F.'];

        let choicesHtml = '';
        if (question.type === 'short-answer') {
            choicesHtml = `
                <div class="short-answer-preview">
                    <div class="answer-input-preview">
                        <strong>Đáp án:</strong> <span class="correct-answer-display">${question.correctAnswers}</span>
                    </div>
                </div>
            `;
        } else if (question.choices && question.choices.length > 0) {
            choicesHtml = `
                <div class="question-choices">
                    ${question.choices.map((choice, index) => `
                        <div class="choice ${choice.isCorrect ? 'correct' : ''}">
                            <span class="choice-label">${choiceLabels[index] || (index + 1) + '.'}</span>
                            <span class="choice-text">${choice.text}</span>
                            ${choice.isCorrect ? '<i class="fas fa-check correct-icon"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Fallback for questions without choices
            choicesHtml = '<div class="no-choices">Không có đáp án để hiển thị</div>';
        }

        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Câu ${question.number}</span>
                <span class="question-type">${questionTypeLabel}</span>
                <span class="question-id">${question.id}</span>
            </div>
            <div class="question-text">${question.question}</div>
            ${choicesHtml}
            ${question.explanation ? `
                <div class="question-explanation">
                    <strong>Lời giải:</strong> ${question.explanation}
                </div>
            ` : ''}
        `;
        return questionDiv;
    }

    /**
     * Show error in preview
     */
    showErrorPreview(errorMessage) {
        this.elements.previewContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Lỗi chuyển đổi</h3>
                <p>${errorMessage}</p>
                <div class="error-help">
                    <h4>Gợi ý:</h4>
                    <ul>
                        <li>Kiểm tra cú pháp \\begin{ex} và \\end{ex}</li>
                        <li>Đảm bảo có \\choice với các đáp án</li>
                        <li>Đánh dấu đáp án đúng bằng \\True</li>
                        <li>Thêm \\loigiai{} cho lời giải</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Clear input
     */
    clearInput() {
        if (confirm('Bạn có chắc muốn xóa toàn bộ nội dung?')) {
            this.elements.latexInput.value = '';
            this.currentQuestions = [];
            this.elements.saveQuizBtn.disabled = true;
            this.updateInputStats();
            this.renderPreview();
        }
    }

    /**
     * Load sample LaTeX
     */
    loadSample() {
        const sample = `\\begin{ex} % Câu 1
Cho khối chóp $O.ABC$ có $OA$ vuông góc với mặt phẳng $\\left( {ABC} \\right)$, tam giác $ABC$ vuông tại $A$ và $OA = 2$, $AB = 3$, $AC = 6$. Thể tích của khối chóp $O.ABC$ bằng.
\\choice
    {$36$}
    {\\True $6$}
    {$12$}
    {$18$}
\\loigiai{$V = \\dfrac{1}{3}OA.{S_{ABC}}$ $= \\dfrac{1}{3}OA.\\dfrac{1}{2}.AB.AC$ $= \\dfrac{1}{6}.2.3.6 = 6$}
\\end{ex}

\\begin{ex} % Câu 2
Tính đạo hàm của hàm số $f(x) = x^3 + 2x^2 - 5x + 1$.
\\choice
    {$f'(x) = 3x^2 + 4x - 5$}
    {\\True $f'(x) = 3x^2 + 4x - 5$}
    {$f'(x) = 3x^2 + 2x - 5$}
    {$f'(x) = x^2 + 4x - 5$}
\\loigiai{Áp dụng quy tắc đạo hàm: $f'(x) = 3x^2 + 4x - 5$}
\\end{ex}`;

        this.elements.latexInput.value = sample;
        this.updateInputStats();
        this.showToast('Đã tải mẫu LaTeX', 'info');
    }

    /**
     * Show save quiz modal
     */
    showSaveModal() {
        if (this.currentQuestions.length === 0) {
            this.showToast('Vui lòng convert LaTeX trước khi lưu', 'warning');
            return;
        }

        // Generate default title
        const now = new Date();
        const defaultTitle = `Quiz ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}`;
        
        this.elements.quizTitle.value = defaultTitle;
        this.elements.quizDescription.value = `Quiz có ${this.currentQuestions.length} câu hỏi`;
        this.elements.saveQuizModal.style.display = 'flex';
        this.elements.quizTitle.focus();
    }

    /**
     * Close modal
     */
    closeModal() {
        this.elements.saveQuizModal.style.display = 'none';
    }

    /**
     * Save quiz
     */
    async saveQuiz(event) {
        event.preventDefault();
        
        if (this.currentQuestions.length === 0) {
            this.showToast('Không có câu hỏi để lưu', 'error');
            return;
        }

        const quizData = {
            title: this.elements.quizTitle.value.trim(),
            description: this.elements.quizDescription.value.trim(),
            duration: parseInt(this.elements.quizDuration.value),
            questions: this.currentQuestions,
            createdAt: new Date().toISOString(),
            totalQuestions: this.currentQuestions.length
        };

        try {
            const quizId = this.quizManager.saveQuiz(quizData);
            this.showToast(`Đã lưu quiz "${quizData.title}" thành công`, 'success');
            this.closeModal();
            this.loadQuizList();
            
            // Reset form
            this.elements.saveQuizForm.reset();
            
        } catch (error) {
            console.error('Save quiz error:', error);
            this.showToast(`Lỗi lưu quiz: ${error.message}`, 'error');
        }
    }

    /**
     * Load and display quiz list
     */
    loadQuizList() {
        const quizzes = this.quizManager.getAllQuizzes();
        const container = this.elements.quizList;
        
        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-quiz-list">
                    <i class="fas fa-folder-open"></i>
                    <p>Chưa có quiz nào được lưu</p>
                </div>
            `;
            return;
        }

        container.innerHTML = quizzes.map(quiz => `
            <div class="quiz-item" data-quiz-id="${quiz.id}">
                <div class="quiz-info">
                    <h4>${quiz.title}</h4>
                    <p>${quiz.description || 'Không có mô tả'}</p>
                    <div class="quiz-meta">
                        <span><i class="fas fa-question-circle"></i> ${quiz.totalQuestions} câu</span>
                        <span><i class="fas fa-clock"></i> ${quiz.duration} phút</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-sm btn-primary" onclick="dashboard.startQuiz('${quiz.id}')">
                        <i class="fas fa-play"></i> Thi
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="dashboard.editQuiz('${quiz.id}')">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteQuiz('${quiz.id}')">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Start quiz
     */
    startQuiz(quizId) {
        window.location.href = `quiz.html?id=${quizId}`;
    }

    /**
     * Edit quiz
     */
    editQuiz(quizId) {
        const quiz = this.quizManager.getQuiz(quizId);
        if (!quiz) {
            this.showToast('Không tìm thấy quiz', 'error');
            return;
        }

        // Load quiz data into editor
        this.currentQuestions = quiz.questions;
        this.elements.saveQuizBtn.disabled = false;
        
        // Generate LaTeX from questions (reverse conversion)
        const latexText = this.generateLatexFromQuestions(quiz.questions);
        this.elements.latexInput.value = latexText;
        this.updateInputStats();
        this.renderPreview();
        
        this.showToast(`Đã tải quiz "${quiz.title}" vào editor`, 'info');
    }

    /**
     * Delete quiz
     */
    deleteQuiz(quizId) {
        const quiz = this.quizManager.getQuiz(quizId);
        if (!quiz) {
            this.showToast('Không tìm thấy quiz', 'error');
            return;
        }

        if (confirm(`Bạn có chắc muốn xóa quiz "${quiz.title}"?`)) {
            this.quizManager.deleteQuiz(quizId);
            this.loadQuizList();
            this.showToast('Đã xóa quiz', 'success');
        }
    }

    /**
     * Generate LaTeX from questions (reverse conversion)
     */
    generateLatexFromQuestions(questions) {
        return questions.map((question, index) => {
            const choices = question.choices.map(choice => {
                const prefix = choice.isCorrect ? '\\True ' : '';
                return `    {${prefix}${choice.text}}`;
            }).join('\n');

            return `\\begin{ex} % Câu ${index + 1}
${question.question}
\\choice
${choices}
\\loigiai{${question.explanation || ''}}
\\end{ex}`;
        }).join('\n\n');
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

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        // Manual close
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

    /**
     * Export data to JSON
     */
    exportData() {
        try {
            this.quizManager.exportToJSON();
            this.showToast('Đã export dữ liệu thành công', 'success');
        } catch (error) {
            this.showToast(`Lỗi export: ${error.message}`, 'error');
        }
    }

    /**
     * Import data from JSON file
     */
    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const result = await this.quizManager.importFromJSON(file);
            this.showToast(`Import thành công: ${result.quizzesImported} quiz, ${result.resultsImported} kết quả`, 'success');
            this.loadQuizList();
        } catch (error) {
            this.showToast(`Lỗi import: ${error.message}`, 'error');
        }

        // Reset file input
        event.target.value = '';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
