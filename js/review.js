/**
 * Review Application for viewing completed quiz results
 */
class ReviewApp {
    constructor() {
        this.reviewData = null;
        this.loadReviewData();
        this.renderReview();
        this.loadMathJax();
    }

    /**
     * Load review data from sessionStorage
     */
    loadReviewData() {
        const data = sessionStorage.getItem('reviewData');
        if (data) {
            this.reviewData = JSON.parse(data);
        } else {
            this.showError('Không tìm thấy dữ liệu bài làm');
        }
    }

    /**
     * Render the complete review
     */
    renderReview() {
        if (!this.reviewData) return;

        const { quiz, result, userInfo } = this.reviewData;
        const container = document.getElementById('reviewContent');

        const headerHtml = `
            <div class="review-header">
                <h1><i class="fas fa-search"></i> Xem lại bài làm</h1>
                <div class="review-info">
                    <div class="info-card">
                        <h3>${quiz.title}</h3>
                        <p>${quiz.description || 'Không có mô tả'}</p>
                    </div>
                    <div class="info-stats">
                        <div class="stat-item">
                            <span class="stat-label">Thí sinh:</span>
                            <span class="stat-value">${userInfo.name}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Lớp:</span>
                            <span class="stat-value">${userInfo.class}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Điểm số:</span>
                            <span class="stat-value">${result.percentage}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Thời gian:</span>
                            <span class="stat-value">${Utils.formatTimeDisplay(result.timeSpent)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Ngày thi:</span>
                            <span class="stat-value">${Utils.formatDate(result.completedAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const questionsHtml = quiz.questions.map((question, index) => {
            const userAnswer = result.answers[index];
            return this.renderQuestionReview(question, userAnswer, index + 1);
        }).join('');

        container.innerHTML = headerHtml + questionsHtml;
    }

    /**
     * Render individual question review
     */
    renderQuestionReview(question, userAnswer, questionNumber) {
        let answerDisplay = '';
        let resultClass = userAnswer && userAnswer.isCorrect ? 'correct' : 'incorrect';

        if (question.type === 'multiple-choice') {
            // Multiple choice display
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
        } else if (question.type === 'true-false') {
            // True-false display
            const choiceLabels = ['a', 'b', 'c', 'd', 'e', 'f'];
            const choicesHtml = question.choices.map((choice, choiceIndex) => {
                const userChoice = userAnswer && userAnswer.userAnswer && userAnswer.userAnswer[choiceIndex];
                const correctChoice = question.correctAnswers[choiceIndex];
                
                let choiceClass = 'result-choice-neutral';
                let icon = '';
                
                if (userChoice === correctChoice) {
                    choiceClass = 'result-choice-correct';
                    icon = '<i class="fas fa-check result-choice-icon"></i>';
                } else if (userChoice !== undefined && userChoice !== null) {
                    choiceClass = 'result-choice-incorrect';
                    icon = '<i class="fas fa-times result-choice-icon"></i>';
                }
                
                let userText = (userChoice === true) ? 'Đúng' : 
                              (userChoice === false) ? 'Sai' : 'Chưa chọn';
                let correctText = (correctChoice === true) ? 'Đúng' : 'Sai';
                
                return `
                    <div class="result-choice ${choiceClass}">
                        <span class="result-choice-label"><strong>${choiceLabels[choiceIndex]})</strong></span>
                        <span class="result-choice-text">${choice.text}</span>
                        <span class="result-choice-user"> - <strong>Bạn chọn:</strong> ${userText}</span>
                        <span class="result-choice-correct"> - <strong>Đáp án:</strong> ${correctText}</span>
                        ${icon}
                    </div>
                `;
            }).join('');
            answerDisplay = choicesHtml;
        } else if (question.type === 'short-answer') {
            // Short answer display
            const userAnswerText = userAnswer && userAnswer.userAnswer ? userAnswer.userAnswer : 'Chưa trả lời';
            const correctAnswerText = question.correctAnswers;
            
            answerDisplay = `
                <div class="short-answer-review">
                    <div class="answer-item">
                        <strong>Câu trả lời của bạn:</strong> 
                        <span class="user-answer ${resultClass}">${userAnswerText}</span>
                    </div>
                    <div class="answer-item">
                        <strong>Đáp án đúng:</strong> 
                        <span class="correct-answer">${correctAnswerText}</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="question-review ${resultClass}">
                <div class="question-header">
                    <h3>
                        <span class="question-number">Câu ${questionNumber}</span>
                        <span class="question-score">
                            ${userAnswer ? userAnswer.score.toFixed(2) : 0}/${userAnswer ? userAnswer.maxScore.toFixed(2) : 0} điểm
                        </span>
                    </h3>
                </div>
                <div class="question-content">
                    <div class="question-text">${question.question}</div>
                    <div class="question-answers">
                        ${answerDisplay}
                    </div>
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
     * Load MathJax for math rendering
     */
    loadMathJax() {
        if (window.MathJax) {
            window.MathJax.typesetPromise().catch((err) => console.log(err.message));
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        document.getElementById('reviewContent').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Lỗi</h2>
                <p>${message}</p>
                <button onclick="window.close()" class="btn btn-primary">Đóng</button>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReviewApp();
});
