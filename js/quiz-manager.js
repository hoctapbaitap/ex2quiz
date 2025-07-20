/**
 * Quiz Manager - Handles quiz data storage and management
 */
class QuizManager {
    constructor() {
        this.apiUrl = './api/quiz.php'; // Sửa đường dẫn
        this.useServerStorage = true;
        this.storageKey = 'latex-quiz-converter';
        this.resultsKey = 'quiz-results';
        
        console.log('QuizManager initialized with API:', this.apiUrl);
        this.initializeStorage();
        this.testConnection();
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            console.log('Testing API connection...');
            const response = await fetch(this.apiUrl + '?action=list');
            console.log('API Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('API Connection successful:', data);
            } else {
                console.error('API Response not OK:', response.status, response.statusText);
                this.useServerStorage = false;
            }
        } catch (error) {
            console.error('API Connection failed:', error);
            this.useServerStorage = false;
        }
    }

    /**
     * Debug storage
     */
    debugStorage() {
        console.log('=== STORAGE DEBUG ===');
        console.log('Use Server Storage:', this.useServerStorage);
        console.log('API URL:', this.apiUrl);
        
        // Debug localStorage
        const localData = localStorage.getItem(this.storageKey);
        console.log('LocalStorage data:', localData ? JSON.parse(localData) : 'Empty');
        
        // Debug server
        this.getAllQuizzes().then(quizzes => {
            console.log('Server quizzes:', quizzes);
        }).catch(error => {
            console.error('Server debug error:', error);
        });
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
     * Get all data from storage with debug
     */
    getData() {
        try {
            const data = JSON.parse(localStorage.getItem(this.storageKey)) || { quizzes: {}, settings: {} };
            console.log('getData called, found quizzes:', Object.keys(data.quizzes || {}).length);
            return data;
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
     * Generate SEO-friendly slug from title (improved Vietnamese support)
     */
    generateSlug(title) {
        if (!title || typeof title !== 'string') {
            return `quiz-${Date.now()}`;
        }
        
        const vietnameseMap = {
            'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
            'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
            'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
            'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
            'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
            'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
            'đ': 'd',
            'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
            'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
            'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
            'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
            'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
            'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
            'Đ': 'D'
        };
        
        let slug = title.toLowerCase();
        
        // Replace Vietnamese characters
        for (const [vietnamese, latin] of Object.entries(vietnameseMap)) {
            slug = slug.replace(new RegExp(vietnamese, 'g'), latin);
        }
        
        return slug
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Remove multiple hyphens
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .substring(0, 50) || `quiz-${Date.now()}`; // Fallback if empty
    }

    /**
     * Generate shareable URL for quiz
     */
    generateQuizUrl(quiz) {
        const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
        return `${baseUrl}quiz.html?slug=${quiz.slug}`;
    }

    /**
     * Save quiz to server
     */
    async saveQuiz(quizData) {
        console.log('Saving quiz:', quizData.title);
        
        try {
            const quizId = this.generateId();
            const slug = this.generateSlug(quizData.title);
            
            const quiz = {
                id: quizId,
                slug: slug,
                title: quizData.title,
                description: quizData.description || '',
                duration: quizData.duration || 30,
                questions: quizData.questions || [],
                totalQuestions: quizData.questions ? quizData.questions.length : 0,
                createdAt: quizData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0'
            };

            if (this.useServerStorage) {
                console.log('Attempting server save...');
                const response = await fetch(this.apiUrl + '?action=save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ quiz: quiz })
                });

                console.log('Server response status:', response.status);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Server save successful:', result);
                    return result.quizId;
                } else {
                    const errorText = await response.text();
                    console.error('Server save failed:', response.status, errorText);
                    throw new Error(`Server error: ${response.status}`);
                }
            }
        } catch (error) {
            console.error('Server save failed, using localStorage:', error);
            this.useServerStorage = false;
        }
        
        // Fallback to localStorage
        console.log('Using localStorage fallback');
        return this.saveQuizLocal(quiz);
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
     * Get quiz from server
     */
    async getQuiz(quizId) {
        console.log('Getting quiz:', quizId);
        
        try {
            if (this.useServerStorage) {
                const response = await fetch(this.apiUrl + `?action=get&id=${quizId}`);
                console.log('Get quiz response status:', response.status);
                
                if (response.ok) {
                    const quiz = await response.json();
                    console.log('Quiz loaded from server:', quiz.title);
                    return quiz;
                } else {
                    console.error('Server get failed:', response.status);
                    throw new Error(`Server error: ${response.status}`);
                }
            }
        } catch (error) {
            console.error('Server get failed, using localStorage:', error);
        }
        
        // Fallback to localStorage
        return this.getQuizLocal(quizId);
    }

    /**
     * Get quiz by slug
     */
    async getQuizBySlug(slug) {
        console.log('Getting quiz by slug:', slug);
        
        try {
            if (this.useServerStorage) {
                // Get all quizzes and find by slug
                const quizzes = await this.getAllQuizzes();
                const quiz = quizzes.find(q => q.slug === slug);
                
                if (quiz) {
                    // Get full quiz data by ID
                    return await this.getQuiz(quiz.id);
                }
            }
        } catch (error) {
            console.error('Server getQuizBySlug failed:', error);
        }
        
        // Fallback to localStorage
        return this.getQuizBySlugLocal(slug);
    }

    /**
     * Get quiz by slug from localStorage
     */
    getQuizBySlugLocal(slug) {
        const data = this.getData();
        if (data.quizzes) {
            return Object.values(data.quizzes).find(quiz => quiz.slug === slug);
        }
        return null;
    }

    /**
     * Get all quizzes from server
     */
    async getAllQuizzes() {
        console.log('Getting all quizzes...');
        
        try {
            if (this.useServerStorage) {
                console.log('Fetching from server...');
                const response = await fetch(this.apiUrl + '?action=list');
                console.log('List response status:', response.status);
                
                if (response.ok) {
                    const quizzes = await response.json();
                    console.log('Server quizzes loaded:', quizzes.length);
                    return quizzes;
                } else {
                    const errorText = await response.text();
                    console.error('Server list failed:', response.status, errorText);
                    throw new Error(`Server error: ${response.status}`);
                }
            }
        } catch (error) {
            console.error('Server list failed, using localStorage:', error);
            this.useServerStorage = false;
        }
        
        // Fallback to localStorage
        console.log('Using localStorage fallback');
        return this.getAllQuizzesLocal();
    }

    /**
     * Delete a quiz
     * @param {string} quizId - Quiz ID
     * @returns {boolean} Success status
     */
    async deleteQuiz(quizId) {
        if (this.useServerStorage) {
            try {
                const response = await fetch(this.apiUrl + '?action=delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quizId })
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const data = await response.json();
                if (!data.success) {
                    throw new Error('Delete failed on server');
                }
                
                return true;
            } catch (error) {
                console.error('Delete on server failed, fallback local:', error);
                this.useServerStorage = false;
                return this.deleteQuizLocal(quizId);
            }
        } else {
            return this.deleteQuizLocal(quizId);
        }
    }

    // Xóa quiz local
    deleteQuizLocal(quizId) {
        const data = this.getData();
        if (!data.quizzes[quizId]) {
            throw new Error('Quiz không tồn tại');
        }
        delete data.quizzes[quizId];
        this.saveData(data);
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

        // Validation for true-false questions
        if (question.type === 'true-false') {
            if (!Array.isArray(question.correctAnswers)) {
                errors.push(`${prefix} Câu hỏi đúng-sai phải có correctAnswers là array`);
            } else if (question.correctAnswers.length !== question.choices.length) {
                errors.push(`${prefix} Số lượng correctAnswers phải bằng số lượng choices`);
            } else {
                // Kiểm tra từng correctAnswer phải là boolean
                question.correctAnswers.forEach((answer, idx) => {
                    if (typeof answer !== 'boolean') {
                        errors.push(`${prefix} correctAnswers[${idx}] phải là true hoặc false`);
                    }
                });
            }
        }

        return errors;
    }

    /**
     * Save result to server
     */
    async saveResult(quizId, resultData, userInfo = null) {
        try {
            const result = {
                quizId: quizId,
                score: resultData.score || 0,
                totalQuestions: resultData.totalQuestions || 0,
                correctAnswers: resultData.correctAnswers || 0,
                timeSpent: resultData.timeSpent || 0,
                answers: resultData.answers || [],
                completedAt: new Date().toISOString(),
                percentage: resultData.totalQuestions > 0 ? 
                    Math.round((resultData.correctAnswers / resultData.totalQuestions) * 100) : 0,
                userInfo: userInfo || {
                    name: 'Ẩn danh',
                    class: 'Không xác định'
                }
            };

            if (this.useServerStorage) {
                const response = await fetch(this.apiUrl + '?action=save-result', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ result: result })
                });

                if (response.ok) {
                    const serverResult = await response.json();
                    return serverResult.resultId;
                }
            }
        } catch (error) {
            console.error('Server result save failed, using localStorage:', error);
        }
        
        // Fallback to localStorage
        return this.saveResultLocal(quizId, resultData, userInfo);
    }

    /**
     * Get quiz results from server
     */
    async getQuizResults(quizId) {
        try {
            if (this.useServerStorage) {
                const response = await fetch(this.apiUrl + `?action=get-results&quizId=${quizId}`);
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.error('Server results get failed, using localStorage:', error);
        }
        
        // Fallback to localStorage
        return this.getQuizResultsLocal(quizId);
    }

    /**
     * Get all results
     * @returns {Array} Array of all result objects
     */
    getAllResults() {
        if (this.useServerStorage) {
            // Lấy tất cả quiz, sau đó lấy kết quả từng quiz từ server
            return this.getAllQuizzes().then(async quizzes => {
                let allResults = [];
                for (const quiz of quizzes) {
                    try {
                        const results = await this.getQuizResults(quiz.id);
                        if (Array.isArray(results)) {
                            results.forEach(result => {
                                allResults.push({
                                    ...result,
                                    quizTitle: quiz.title
                                });
                            });
                        }
                    } catch (e) {
                        // Bỏ qua lỗi từng quiz
                    }
                }
                return allResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
            });
        } else {
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
                return allResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
            } catch (error) {
                console.error('Error reading all results:', error);
                return [];
            }
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

    /**
     * Auto save quiz to JSON file
     * @param {Object} quiz - Quiz object to save
     */
    autoSaveToFile(quiz) {
        if (!this.enableFileStorage) return;
        
        try {
            const filename = `quiz-${quiz.slug}-${new Date().toISOString().split('T')[0]}.json`;
            const quizData = {
                quiz: quiz,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(quizData, null, 2)], { 
                type: 'application/json' 
            });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            // Auto download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`Quiz auto-saved to file: ${filename}`);
        } catch (error) {
            console.error('Auto save to file failed:', error);
        }
    }

    /**
     * Auto save all data periodically
     */
    enableAutoBackup() {
        setInterval(() => {
            try {
                const allData = this.exportData();
                const filename = `backup-all-quizzes-${new Date().toISOString().split('T')[0]}.json`;
                
                localStorage.setItem('lastBackupDate', new Date().toISOString());
                console.log('Auto backup completed');
            } catch (error) {
                console.error('Auto backup failed:', error);
            }
        }, 24 * 60 * 60 * 1000); // Daily backup
    }

    // Các method localStorage cũ đổi tên thành *Local
    saveQuizLocal(quiz) {
        console.log('Saving to localStorage:', quiz.title);
        const data = this.getData();
        if (!data.quizzes) data.quizzes = {};
        data.quizzes[quiz.id] = quiz;
        this.saveData(data);
        return quiz.id;
    }

    getQuizLocal(quizId) {
        const data = this.getData();
        return data.quizzes ? data.quizzes[quizId] : null;
    }

    getAllQuizzesLocal() {
        const data = this.getData();
        return data.quizzes ? Object.values(data.quizzes) : [];
    }

    saveResultLocal(quizId, resultData, userInfo) {
        // Implementation giống như cũ
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
                Math.round((resultData.correctAnswers / resultData.totalQuestions) * 100) : 0,
            userInfo: userInfo || {
                name: 'Ẩn danh',
                class: 'Không xác định'
            }
        };

        if (!results[quizId]) {
            results[quizId] = [];
        }
        
        results[quizId].push(result);
        localStorage.setItem(this.resultsKey, JSON.stringify(results));
        
        return resultId;
    }

    getQuizResultsLocal(quizId) {
        const results = JSON.parse(localStorage.getItem(this.resultsKey)) || {};
        return results[quizId] || [];
    }
}

// Export for use in other files
window.QuizManager = QuizManager;















