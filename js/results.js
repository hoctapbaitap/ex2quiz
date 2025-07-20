/**
 * Results Page Application
 */
class ResultsApp {
    constructor() {
        this.quizManager = new QuizManager();
        this.allResults = [];
        this.filteredResults = [];
        this.currentQuizFilter = '';
        this.currentSort = 'date-desc';

        this.initializeElements();
        this.bindEvents();
        this.loadMathJax(); // Load MathJax early
        this.loadResults();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Statistics
            totalAttempts: document.getElementById('totalAttempts'),
            averageScore: document.getElementById('averageScore'),
            bestScore: document.getElementById('bestScore'),
            totalTime: document.getElementById('totalTime'),
            
            // Controls
            quizFilter: document.getElementById('quizFilter'),
            sortFilter: document.getElementById('sortFilter'),
            exportBtn: document.getElementById('exportBtn'),
            clearResultsBtn: document.getElementById('clearResultsBtn'),
            refreshResultsBtn: document.getElementById('refreshResultsBtn'),
            
            // Results list
            resultsList: document.getElementById('resultsList'),
            
            // Modals
            resultDetailModal: document.getElementById('resultDetailModal'),
            modalTitle: document.getElementById('modalTitle'),
            resultDetailContent: document.getElementById('resultDetailContent'),
            retakeFromResultBtn: document.getElementById('retakeFromResultBtn'),
            
            // Export modal
            exportModal: document.getElementById('exportModal'),
            confirmExportBtn: document.getElementById('confirmExportBtn'),
            
            // Chart
            chartCanvas: document.getElementById('chartCanvas')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Filters
        this.elements.quizFilter.addEventListener('change', () => this.applyFilters());
        this.elements.sortFilter.addEventListener('change', () => this.applyFilters());
        
        // Controls
        this.elements.exportBtn.addEventListener('click', () => this.showExportModal());
        this.elements.clearResultsBtn.addEventListener('click', () => this.clearAllResults());
        this.elements.refreshResultsBtn.addEventListener('click', () => this.loadResults());
        
        // Modal events
        this.elements.retakeFromResultBtn.addEventListener('click', () => this.retakeQuizFromResult());
        this.elements.confirmExportBtn.addEventListener('click', () => this.exportData());
        
        // Close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    /**
     * Load all results and update display
     */
    loadResults() {
        this.showLoading(true);
        const resultPromise = this.quizManager.getAllResults();
        if (resultPromise && typeof resultPromise.then === 'function') {
            // Trường hợp dùng server, trả về Promise
            resultPromise.then(results => {
                this.allResults = results;
                console.log('Loaded results:', this.allResults);
                this.updateStatistics();
                this.updateQuizFilter();
                this.applyFilters();
                this.renderChart();
                this.showLoading(false);
            }).catch(error => {
                console.error('Error loading results:', error);
                this.showToast('Lỗi tải dữ liệu kết quả', 'error');
                this.showLoading(false);
            });
        } else {
            // Trường hợp local
            try {
                this.allResults = resultPromise;
                console.log('Loaded results:', this.allResults);
                this.updateStatistics();
                this.updateQuizFilter();
                this.applyFilters();
                this.renderChart();
            } catch (error) {
                console.error('Error loading results:', error);
                this.showToast('Lỗi tải dữ liệu kết quả', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }

    /**
     * Update statistics overview
     */
    updateStatistics() {
        if (this.allResults.length === 0) {
            this.elements.totalAttempts.textContent = '0';
            this.elements.averageScore.textContent = '0%';
            this.elements.bestScore.textContent = '0%';
            this.elements.totalTime.textContent = '0h 0m';
            return;
        }

        const stats = Utils.calculateStats(this.allResults.map(r => r.percentage));
        const totalTime = this.allResults.reduce((sum, r) => sum + r.timeSpent, 0);
        
        this.elements.totalAttempts.textContent = this.allResults.length.toLocaleString();
        this.elements.averageScore.textContent = `${Math.round(stats.mean)}%`;
        this.elements.bestScore.textContent = `${stats.max}%`;
        this.elements.totalTime.textContent = Utils.formatTime(totalTime);
    }

    /**
     * Update quiz filter dropdown
     */
    updateQuizFilter() {
        if (!this.elements.quizFilter) return;
        
        try {
            // Get unique quiz IDs from results
            const quizIds = [...new Set(this.allResults.map(result => result.quizId))];
            console.log('Quiz IDs from results:', quizIds);
            
            // Get quiz titles
            const quizOptions = quizIds.map(quizId => {
                const quiz = this.quizManager.getQuiz(quizId);
                return {
                    id: quizId,
                    title: quiz ? quiz.title : 'Quiz đã xóa'
                };
            }).filter(quiz => quiz.title !== 'Quiz đã xóa');
            
            console.log('Quiz options:', quizOptions);
            
            // Update dropdown
            this.elements.quizFilter.innerHTML = `
                <option value="">Tất cả quiz</option>
                ${quizOptions.map(quiz => 
                    `<option value="${quiz.id}">${quiz.title}</option>`
                ).join('')}
            `;
        } catch (error) {
            console.error('Error updating quiz filter:', error);
            this.elements.quizFilter.innerHTML = '<option value="">Tất cả quiz</option>';
        }
    }

    /**
     * Apply filters and sorting
     */
    applyFilters() {
        this.currentQuizFilter = this.elements.quizFilter.value;
        this.currentSort = this.elements.sortFilter.value;
        
        // Filter by quiz
        this.filteredResults = this.currentQuizFilter 
            ? this.allResults.filter(result => result.quizId === this.currentQuizFilter)
            : [...this.allResults];
        
        // Sort results
        this.sortResults();
        
        // Render results
        this.renderResults();
    }

    /**
     * Sort results based on current sort option
     */
    sortResults() {
        switch (this.currentSort) {
            case 'date-desc':
                this.filteredResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
                break;
            case 'date-asc':
                this.filteredResults.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
                break;
            case 'score-desc':
                this.filteredResults.sort((a, b) => b.percentage - a.percentage);
                break;
            case 'score-asc':
                this.filteredResults.sort((a, b) => a.percentage - b.percentage);
                break;
        }
    }

    /**
     * Render results list
     */
    renderResults() {
        const container = this.elements.resultsList;
        
        if (this.filteredResults.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Chưa có kết quả nào</h3>
                    <p>Hãy làm một quiz để xem kết quả tại đây</p>
                    <a href="quiz.html" class="btn btn-primary">
                        <i class="fas fa-play"></i>
                        Bắt đầu thi
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredResults.map(result => {
            const grade = Utils.getGrade(result.percentage);
            const studentInfo = result.userInfo && result.userInfo.name !== 'Ẩn danh' ? 
                `${result.userInfo.name} - ${result.userInfo.class}` : 'Ẩn danh';
            
            return `
                <div class="result-item" onclick="resultsApp.showResultDetail('${result.id}')">
                    <div class="result-item-header">
                        <div>
                            <div class="result-item-title">${result.quizTitle}</div>
                            <div class="result-item-student">${studentInfo}</div>
                            <div class="result-item-date">${Utils.formatRelativeTime(result.completedAt)}</div>
                        </div>
                        <div class="result-score">
                            <div class="score-percentage" style="color: ${grade.color}">
                                ${result.percentage}%
                            </div>
                            <div class="score-details">${result.correctAnswers}/${result.totalQuestions} đúng</div>
                        </div>
                    </div>
                    <div class="result-item-stats">
                        <div class="result-stat">
                            <div class="result-stat-value">${grade.letter}</div>
                            <div class="result-stat-label">Xếp loại</div>
                        </div>
                        <div class="result-stat">
                            <div class="result-stat-value">${Utils.formatTimeDisplay(result.timeSpent)}</div>
                            <div class="result-stat-label">Thời gian</div>
                        </div>
                        <div class="result-stat">
                            <div class="result-stat-value">${Utils.formatDate(result.completedAt).split(' ')[0]}</div>
                            <div class="result-stat-label">Ngày thi</div>
                        </div>
                        <div class="result-stat">
                            <div class="result-stat-value">${grade.description}</div>
                            <div class="result-stat-label">Đánh giá</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Show result detail modal
     */
    showResultDetail(resultId) {
        const result = this.allResults.find(r => r.id === resultId);
        if (!result) {
            this.showToast('Không tìm thấy kết quả', 'error');
            return;
        }

        const quiz = this.quizManager.getQuiz(result.quizId);
        if (!quiz) {
            this.showToast('Quiz đã bị xóa', 'error');
            return;
        }

        this.currentResultDetail = result;
        this.elements.modalTitle.textContent = `Chi tiết: ${result.quizTitle}`;
        
        // Render detailed result
        this.renderDetailedResult(result, quiz);
        
        this.elements.resultDetailModal.style.display = 'flex';
    }

    /**
     * Render detailed result content
     */
    renderDetailedResult(result, quiz) {
        const grade = Utils.getGrade(result.percentage);
        const studentInfo = result.userInfo && result.userInfo.name !== 'Ẩn danh' ? 
            `${result.userInfo.name} - ${result.userInfo.class}` : 'Ẩn danh';

        const headerHtml = `
            <div class="result-detail-header">
                <div class="result-summary">
                    <div class="summary-item">
                        <span class="summary-label">Thí sinh:</span>
                        <span class="summary-value">${studentInfo}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Điểm số:</span>
                        <span class="summary-value" style="color: ${grade.color}">
                            ${result.score ? result.score.toFixed(2) : (result.correctAnswers * 10 / result.totalQuestions).toFixed(2)}/10
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Phần trăm:</span>
                        <span class="summary-value" style="color: ${grade.color}">${result.percentage}%</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Số câu đúng:</span>
                        <span class="summary-value">${result.correctAnswers}/${result.totalQuestions}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Xếp loại:</span>
                        <span class="summary-value" style="color: ${grade.color}">${grade.letter} - ${grade.description}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Thời gian:</span>
                        <span class="summary-value">${Utils.formatTimeDisplay(result.timeSpent)}</span>
                    </div>
                </div>
            </div>
        `;

        // Render chi tiết từng câu hỏi như trong review
        const questionsHtml = quiz.questions.map((question, index) => {
            const userAnswer = result.answers[index];
            return this.renderQuestionDetail(question, userAnswer, index + 1);
        }).join('');

        this.elements.resultDetailContent.innerHTML = headerHtml + questionsHtml;
        
        // Render math if available
        this.renderMath();
    }

    /**
     * Render chi tiết từng câu hỏi
     */
    renderQuestionDetail(question, userAnswer, questionNumber) {
        let answerDisplay = '';
        let resultClass = userAnswer && userAnswer.isCorrect ? 'correct' : 'incorrect';

        if (question.type === 'multiple-choice') {
            const choicesHtml = question.choices.map((choice, index) => {
                let choiceClass = '';
                let icon = '';
                
                if (index === question.correctAnswers) {
                    choiceClass = 'result-choice-correct';
                    icon = '<i class="fas fa-check result-choice-icon"></i>';
                }
                
                if (userAnswer && userAnswer.userAnswer === index) {
                    if (index === question.correctAnswers) {
                        choiceClass = 'result-choice-correct';
                    } else {
                        choiceClass = 'result-choice-incorrect';
                        icon = '<i class="fas fa-times result-choice-icon"></i>';
                    }
                }

                return `
                    <div class="result-choice ${choiceClass}">
                        <span class="result-choice-label">${String.fromCharCode(65 + index)}.</span>
                        <span class="result-choice-text">${choice.text}</span>
                        ${icon}
                    </div>
                `;
            }).join('');
            answerDisplay = choicesHtml;
        }

        return `
            <div class="question-detail ${resultClass}">
                <div class="question-header">
                    <h4>
                        <span class="question-number">Câu ${questionNumber}</span>
                        <span class="question-score">
                            ${userAnswer ? userAnswer.score.toFixed(2) : 0}/${userAnswer ? userAnswer.maxScore.toFixed(2) : 0} điểm
                        </span>
                    </h4>
                </div>
                <div class="question-content">
                    <div class="question-text">${question.question}</div>
                    <div class="question-answers">${answerDisplay}</div>
                    ${question.explanation ? `
                        <div class="explanation">
                            <strong><i class="fas fa-lightbulb"></i> Lời giải:</strong> 
                            ${question.explanation}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Retake quiz from result detail
     */
    retakeQuizFromResult() {
        if (this.currentResultDetail) {
            window.location.href = `quiz.html?id=${this.currentResultDetail.quizId}`;
        }
    }

    /**
     * Show export modal
     */
    showExportModal() {
        if (this.allResults.length === 0) {
            this.showToast('Không có dữ liệu để xuất', 'warning');
            return;
        }
        
        this.elements.exportModal.style.display = 'flex';
    }

    /**
     * Export data based on selected format
     */
    exportData() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const includeAnswers = document.getElementById('includeAnswers').checked;
        const includeQuestions = document.getElementById('includeQuestions').checked;
        
        try {
            let content, filename, contentType;
            
            const exportData = this.prepareExportData(includeAnswers, includeQuestions);
            
            switch (format) {
                case 'json':
                    content = JSON.stringify(exportData, null, 2);
                    filename = `quiz-results-${new Date().toISOString().split('T')[0]}.json`;
                    contentType = 'application/json';
                    break;
                    
                case 'csv':
                    content = this.convertToCSV(exportData);
                    filename = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
                    contentType = 'text/csv';
                    break;
                    
                case 'txt':
                    content = this.convertToText(exportData);
                    filename = `quiz-results-${new Date().toISOString().split('T')[0]}.txt`;
                    contentType = 'text/plain';
                    break;
            }
            
            Utils.downloadFile(content, filename, contentType);
            this.closeModal();
            this.showToast('Đã xuất dữ liệu thành công', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Lỗi xuất dữ liệu', 'error');
        }
    }

    /**
     * Prepare data for export
     */
    prepareExportData(includeAnswers, includeQuestions) {
        return this.filteredResults.map(result => {
            const quiz = this.quizManager.getQuiz(result.quizId);
            const exportItem = {
                quizTitle: result.quizTitle,
                completedAt: result.completedAt,
                score: result.score,
                totalQuestions: result.totalQuestions,
                correctAnswers: result.correctAnswers,
                percentage: result.percentage,
                timeSpent: result.timeSpent,
                timeSpentFormatted: Utils.formatTimeDisplay(result.timeSpent),
                grade: Utils.getGrade(result.percentage)
            };
            
            if (includeAnswers && result.answers) {
                exportItem.answers = result.answers.map(answer => ({
                    questionNumber: answer.questionNumber,
                    userAnswer: answer.userAnswer,
                    correctAnswer: answer.correctAnswer,
                    isCorrect: answer.isCorrect
                }));
            }
            
            if (includeQuestions && quiz) {
                exportItem.questions = quiz.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    choices: q.choices.map(c => c.text),
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                }));
            }
            
            return exportItem;
        });
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = [
            'Quiz Title',
            'Completed At',
            'Score',
            'Total Questions',
            'Correct Answers',
            'Percentage',
            'Time Spent',
            'Grade Letter',
            'Grade Description'
        ];
        
        const rows = data.map(item => [
            item.quizTitle,
            item.completedAt,
            item.score,
            item.totalQuestions,
            item.correctAnswers,
            item.percentage,
            item.timeSpentFormatted,
            item.grade.letter,
            item.grade.description
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    /**
     * Convert data to text format
     */
    convertToText(data) {
        return data.map(item => {
            let text = `Quiz: ${item.quizTitle}\n`;
            text += `Ngày thi: ${Utils.formatDate(item.completedAt)}\n`;
            text += `Điểm số: ${item.percentage}% (${item.correctAnswers}/${item.totalQuestions})\n`;
            text += `Thời gian: ${item.timeSpentFormatted}\n`;
            text += `Xếp loại: ${item.grade.letter} - ${item.grade.description}\n`;
            text += '─'.repeat(50) + '\n';
            return text;
        }).join('\n');
    }

    /**
     * Clear all results
     */
    clearAllResults() {
        if (this.allResults.length === 0) {
            this.showToast('Không có dữ liệu để xóa', 'info');
            return;
        }
        
        if (confirm(`Bạn có chắc muốn xóa tất cả ${this.allResults.length} kết quả thi?`)) {
            try {
                // Clear all results from storage
                localStorage.removeItem('quiz-results');
                
                // Reload results
                this.loadResults();
                
                this.showToast('Đã xóa tất cả kết quả', 'success');
            } catch (error) {
                console.error('Error clearing results:', error);
                this.showToast('Lỗi xóa dữ liệu', 'error');
            }
        }
    }

    /**
     * Render performance chart
     */
    renderChart() {
        // Simple chart implementation using Canvas
        const canvas = this.elements.chartCanvas;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.allResults.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Chưa có dữ liệu để hiển thị', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Get last 10 results for chart
        const chartData = this.allResults
            .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
            .slice(-10);
        
        this.drawLineChart(ctx, canvas, chartData);
    }

    /**
     * Draw line chart
     */
    drawLineChart(ctx, canvas, data) {
        const padding = 60;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        if (data.length === 0) return;
        
        // Draw data points and line
        ctx.strokeStyle = '#667eea';
        ctx.fillStyle = '#667eea';
        ctx.lineWidth = 3;
        
        const stepX = chartWidth / (data.length - 1 || 1);
        
        ctx.beginPath();
        data.forEach((result, index) => {
            const x = padding + index * stepX;
            const y = canvas.height - padding - (result.percentage / 100) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw point
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        });
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const y = canvas.height - padding - (i / 5) * chartHeight;
            const value = (i / 5) * 100;
            ctx.textAlign = 'right';
            ctx.fillText(`${value}%`, padding - 10, y + 4);
        }
        
        // X-axis labels (simplified)
        ctx.textAlign = 'center';
        ctx.fillText('Tiến độ theo thời gian', canvas.width / 2, canvas.height - 10);
    }

    /**
     * Close modal
     */
    closeModal() {
        this.elements.resultDetailModal.style.display = 'none';
        this.elements.exportModal.style.display = 'none';
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
                // Clear previous math processing
                if (window.MathJax.startup && window.MathJax.startup.document) {
                    window.MathJax.startup.document.clear();
                }

                // Process math in the result detail content
                const container = this.elements.resultDetailContent;
                await window.MathJax.typesetPromise([container]);

                console.log('MathJax rendering completed for results');
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
                        console.log('MathJax is loaded and ready in Results');
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
                console.log('MathJax script loaded in Results');
            };
            script.onerror = (error) => {
                console.error('Failed to load MathJax in Results:', error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        let loader = document.getElementById('results-loading');
        
        if (!loader && show) {
            loader = document.createElement('div');
            loader.id = 'results-loading';
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
                z-index: 9999;
            `;
            loader.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 10px;"></div>
                    <p>Đang tải kết quả...</p>
                </div>
            `;
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
        toast.style.cssText = `
            background: ${type === 'error' ? '#f56565' : type === 'success' ? '#48bb78' : '#4299e1'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
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
     * Review result - show detailed answers like in quiz review
     */
    reviewResult(resultId) {
        const result = this.findResultById(resultId);
        if (!result) {
            this.showToast('Không tìm thấy kết quả', 'error');
            return;
        }
        
        const quiz = this.quizManager.getQuiz(result.quizId);
        if (!quiz) {
            this.showToast('Không tìm thấy quiz', 'error');
            return;
        }
        
        // Create review page URL with result data
        const reviewData = {
            quiz: quiz,
            result: result,
            userInfo: result.userInfo || { name: 'Ẩn danh', class: 'Không xác định' }
        };
        
        // Store in sessionStorage for review page
        sessionStorage.setItem('reviewData', JSON.stringify(reviewData));
        
        // Open review page
        window.open('review.html', '_blank');
    }

    /**
     * Find result by ID across all quizzes
     */
    findResultById(resultId) {
        const allResults = this.quizManager.getAllResults();
        for (const quizId in allResults) {
            const quizResults = allResults[quizId];
            const result = quizResults.find(r => r.id === resultId);
            if (result) {
                return result;
            }
        }
        return null;
    }

    /**
     * Load and display quiz statistics
     */
    loadQuizStatistics() {
        const allResults = this.quizManager.getAllResults();
        const quizStats = {};
        
        // Tính thống kê cho từng quiz
        for (const quizId in allResults) {
            const quiz = this.quizManager.getQuiz(quizId);
            if (!quiz) continue;
            
            const results = allResults[quizId];
            const scores = results.map(r => r.percentage);
            
            quizStats[quizId] = {
                title: quiz.title,
                totalAttempts: results.length,
                averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
                highestScore: scores.length > 0 ? Math.max(...scores) : 0,
                lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
                passRate: scores.filter(s => s >= 50).length,
                students: results.map(r => ({
                    name: r.userInfo?.name || 'Ẩn danh',
                    class: r.userInfo?.class || 'Không xác định',
                    score: r.percentage,
                    completedAt: r.completedAt
                }))
            };
        }
        
        this.renderQuizStatistics(quizStats);
    }

    /**
     * Render quiz statistics
     */
    renderQuizStatistics(quizStats) {
        const container = document.getElementById('quizStatistics');
        if (!container) return;
        
        const statsHtml = Object.entries(quizStats).map(([quizId, stats]) => `
            <div class="quiz-stat-card">
                <div class="quiz-stat-header">
                    <h3>${stats.title}</h3>
                    <div class="quiz-stat-summary">
                        <span class="stat-badge">${stats.totalAttempts} lượt thi</span>
                        <span class="stat-badge">TB: ${stats.averageScore}%</span>
                        <span class="stat-badge">Đậu: ${stats.passRate}/${stats.totalAttempts}</span>
                    </div>
                </div>
                <div class="quiz-stat-details">
                    <div class="stat-row">
                        <span>Điểm cao nhất:</span>
                        <span class="stat-value high">${stats.highestScore}%</span>
                    </div>
                    <div class="stat-row">
                        <span>Điểm thấp nhất:</span>
                        <span class="stat-value low">${stats.lowestScore}%</span>
                    </div>
                    <div class="stat-row">
                        <span>Tỷ lệ đậu:</span>
                        <span class="stat-value">${((stats.passRate/stats.totalAttempts)*100).toFixed(1)}%</span>
                    </div>
                </div>
                <div class="student-list">
                    <h4>Danh sách học sinh:</h4>
                    ${stats.students.map(student => `
                        <div class="student-item">
                            <span class="student-name">${student.name} (${student.class})</span>
                            <span class="student-score ${student.score >= 50 ? 'pass' : 'fail'}">${student.score}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = statsHtml || '<p>Chưa có dữ liệu thống kê</p>';
    }
}

// Initialize results app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.resultsApp = new ResultsApp();
});






