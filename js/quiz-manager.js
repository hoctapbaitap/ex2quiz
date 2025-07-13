/**
 * Quiz Manager - Handles quiz data storage and management
 */
class QuizManager {
    constructor() {
        this.storageKey = 'latex-quiz-converter';
        this.resultsKey = 'quiz-results';
        this.enableFileStorage = true; // Enable JSON file storage
        this.initializeStorage();
    }

    /**
     * Initialize localStorage structure
     */
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                quizzes: {},
                settings: {
                    version: '1.0.0',
                    created: new Date().toISOString()
                }
            }));
        }

        if (!localStorage.getItem(this.resultsKey)) {
            localStorage.setItem(this.resultsKey, JSON.stringify({}));
        }
    }

    /**
     * Get all data from storage
     */
    getData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || { quizzes: {}, settings: {} };
        } catch (error) {
            console.error('Error reading storage:', error);
            this.initializeStorage();
            return { quizzes: {}, settings: {} };
        }
    }

    /**
     * Save data to storage
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            throw new Error('Không thể lưu dữ liệu. Có thể bộ nhớ đã đầy.');
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save a quiz
     * @param {Object} quizData - Quiz data object
     * @returns {string} Quiz ID
     */
    saveQuiz(quizData) {
        const data = this.getData();
        const quizId = this.generateId();
        
        const quiz = {
            id: quizId,
            title: quizData.title,
            description: quizData.description || '',
            duration: quizData.duration || 30,
            questions: quizData.questions || [],
            totalQuestions: quizData.questions ? quizData.questions.length : 0,
            createdAt: quizData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Validate quiz data
        this.validateQuiz(quiz);

        data.quizzes[quizId] = quiz;
        this.saveData(data);
        
        return quizId;
    }

    /**
     * Update an existing quiz
     * @param {string} quizId - Quiz ID
     * @param {Object} quizData - Updated quiz data
     * @returns {boolean} Success status
     */
    updateQuiz(quizId, quizData) {
        const data = this.getData();
        
        if (!data.quizzes[quizId]) {
            throw new Error('Quiz không tồn tại');
        }

        const existingQuiz = data.quizzes[quizId];
        const updatedQuiz = {
            ...existingQuiz,
            ...quizData,
            id: quizId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        // Validate updated quiz
        this.validateQuiz(updatedQuiz);

        data.quizzes[quizId] = updatedQuiz;
        this.saveData(data);
        
        return true;
    }

    /**
     * Get a quiz by ID
     * @param {string} quizId - Quiz ID
     * @returns {Object|null} Quiz object or null if not found
     */
    getQuiz(quizId) {
        const data = this.getData();
        return data.quizzes[quizId] || null;
    }

    /**
     * Get all quizzes
     * @returns {Array} Array of quiz objects
     */
    getAllQuizzes() {
        const data = this.getData();
        return Object.values(data.quizzes).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    /**
     * Delete a quiz
     * @param {string} quizId - Quiz ID
     * @returns {boolean} Success status
     */
    deleteQuiz(quizId) {
        const data = this.getData();
        
        if (!data.quizzes[quizId]) {
            throw new Error('Quiz không tồn tại');
        }

        delete data.quizzes[quizId];
        this.saveData(data);
        
        // Also delete related results
        this.deleteQuizResults(quizId);
        
        return true;
    }

    /**
     * Validate quiz data
     * @param {Object} quiz - Quiz object to validate
     */
    validateQuiz(quiz) {
        const errors = [];

        if (!quiz.title || quiz.title.trim().length === 0) {
            errors.push('Tên quiz không được để trống');
        }

        if (!quiz.questions || !Array.isArray(quiz.questions)) {
            errors.push('Quiz phải có danh sách câu hỏi');
        } else if (quiz.questions.length === 0) {
            errors.push('Quiz phải có ít nhất 1 câu hỏi');
        }

        if (quiz.duration && (quiz.duration < 1 || quiz.duration > 300)) {
            errors.push('Thời gian thi phải từ 1 đến 300 phút');
        }

        // Validate each question
        if (quiz.questions && Array.isArray(quiz.questions)) {
            quiz.questions.forEach((question, index) => {
                const questionErrors = this.validateQuestion(question, index + 1);
                errors.push(...questionErrors);
            });
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
    }

    /**
     * Validate a single question
     * @param {Object} question - Question object
     * @param {number} questionNumber - Question number for error reporting
     * @returns {Array} Array of error messages
     */
    validateQuestion(question, questionNumber) {
        const errors = [];
        const prefix = `Câu ${questionNumber}:`;

        if (!question.question || question.question.trim().length === 0) {
            errors.push(`${prefix} Nội dung câu hỏi không được để trống`);
        }

        // Check question type
        const isShortAnswer = question.type === 'short-answer';

        if (isShortAnswer) {
            // Validation for short answer questions
            if (!question.correctAnswers || question.correctAnswers.toString().trim().length === 0) {
                errors.push(`${prefix} Câu hỏi trả lời ngắn phải có đáp án đúng`);
            }
        } else {
            // Validation for multiple choice and true-false questions
            if (!question.choices || !Array.isArray(question.choices)) {
                errors.push(`${prefix} Phải có danh sách đáp án`);
            } else {
                if (question.choices.length < 2) {
                    errors.push(`${prefix} Phải có ít nhất 2 đáp án`);
                }

                const correctAnswers = question.choices.filter(choice => choice.isCorrect);
                if (correctAnswers.length === 0) {
                    errors.push(`${prefix} Phải có ít nhất 1 đáp án đúng`);
                }

                question.choices.forEach((choice, index) => {
                    if (!choice.text || choice.text.trim().length === 0) {
                        const choiceLabel = question.type === 'true-false' ?
                            String.fromCharCode(97 + index) + ')' :
                            String.fromCharCode(65 + index);
                        errors.push(`${prefix} Đáp án ${choiceLabel} không được để trống`);
                    }
                });
            }
        }

        return errors;
    }

    /**
     * Save quiz result
     * @param {string} quizId - Quiz ID
     * @param {Object} resultData - Result data
     * @returns {string} Result ID
     */
    saveResult(quizId, resultData) {
        try {
            const results = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
            const resultId = 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const result = {
                id: resultId,
                quizId: quizId,
                score: resultData.score || 0,
                totalQuestions: resultData.totalQuestions || 0,
                correctAnswers: resultData.correctAnswers || 0,
                timeSpent: resultData.timeSpent || 0,
                answers: resultData.answers || [],
                completedAt: new Date().toISOString(),
                percentage: resultData.totalQuestions > 0 ? 
                    Math.round((resultData.correctAnswers / resultData.totalQuestions) * 100) : 0
            };

            if (!results[quizId]) {
                results[quizId] = [];
            }
            
            results[quizId].push(result);
            localStorage.setItem(this.resultsKey, JSON.stringify(results));
            
            return resultId;
        } catch (error) {
            console.error('Error saving result:', error);
            throw new Error('Không thể lưu kết quả thi');
        }
    }

    /**
     * Get results for a quiz
     * @param {string} quizId - Quiz ID
     * @returns {Array} Array of result objects
     */
    getQuizResults(quizId) {
        try {
            const results = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
            return results[quizId] || [];
        } catch (error) {
            console.error('Error reading results:', error);
            return [];
        }
    }

    /**
     * Get all results
     * @returns {Array} Array of all result objects
     */
    getAllResults() {
        try {
            const results = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
            const allResults = [];
            
            Object.keys(results).forEach(quizId => {
                results[quizId].forEach(result => {
                    const quiz = this.getQuiz(quizId);
                    allResults.push({
                        ...result,
                        quizTitle: quiz ? quiz.title : 'Quiz đã xóa'
                    });
                });
            });
            
            return allResults.sort((a, b) => 
                new Date(b.completedAt) - new Date(a.completedAt)
            );
        } catch (error) {
            console.error('Error reading all results:', error);
            return [];
        }
    }

    /**
     * Delete results for a quiz
     * @param {string} quizId - Quiz ID
     */
    deleteQuizResults(quizId) {
        try {
            const results = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
            delete results[quizId];
            localStorage.setItem(this.resultsKey, JSON.stringify(results));
        } catch (error) {
            console.error('Error deleting results:', error);
        }
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        const data = this.getData();
        const results = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
        
        const totalQuizzes = Object.keys(data.quizzes).length;
        const totalQuestions = Object.values(data.quizzes)
            .reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
        const totalResults = Object.values(results)
            .reduce((sum, quizResults) => sum + quizResults.length, 0);
        
        const storageUsed = new Blob([
            localStorage.getItem(this.storageKey) || '',
            localStorage.getItem(this.resultsKey) || ''
        ]).size;

        return {
            totalQuizzes,
            totalQuestions,
            totalResults,
            storageUsed: this.formatBytes(storageUsed),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Export all data
     * @returns {Object} All data for export
     */
    exportData() {
        const quizData = this.getData();
        const resultsData = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
        
        return {
            quizzes: quizData,
            results: resultsData,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import data
     * @param {Object} importData - Data to import
     * @returns {boolean} Success status
     */
    importData(importData) {
        try {
            if (importData.quizzes) {
                this.saveData(importData.quizzes);
            }
            
            if (importData.results) {
                localStorage.setItem(this.resultsKey, JSON.stringify(importData.results));
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw new Error('Không thể import dữ liệu');
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.resultsKey);
        this.initializeStorage();
    }

    /**
     * Export all data to JSON file
     */
    exportToJSON() {
        const data = {
            quizzes: this.getAllQuizzes(),
            results: this.getAllResults(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import data from JSON file
     * @param {File} file - JSON file to import
     * @returns {Promise} Import result
     */
    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (data.quizzes && Array.isArray(data.quizzes)) {
                        // Import quizzes
                        data.quizzes.forEach(quiz => {
                            this.saveQuiz(quiz);
                        });
                    }

                    if (data.results && Array.isArray(data.results)) {
                        // Import results
                        const existingResults = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
                        data.results.forEach(result => {
                            existingResults[result.id] = result;
                        });
                        localStorage.setItem(this.resultsKey, JSON.stringify(existingResults));
                    }

                    resolve({
                        success: true,
                        quizzesImported: data.quizzes ? data.quizzes.length : 0,
                        resultsImported: data.results ? data.results.length : 0
                    });
                } catch (error) {
                    reject(new Error('Invalid JSON file format'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

// Export for use in other files
window.QuizManager = QuizManager;
