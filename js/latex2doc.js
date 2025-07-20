/**
 * LaTeX to Document Converter Application
 */
class LaTeX2DocApp {
    constructor() {
        this.parser = new LaTeXParser();
        this.currentText = '';

        this.initializeElements();
        this.bindEvents();
        this.updateStats();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            latexInput: document.getElementById('latexDocInput'),
            previewContent: document.getElementById('docPreviewContent'),
            convertBtn: document.getElementById('convertDocBtn'),
            clearBtn: document.getElementById('clearDocBtn'),
            loadSampleBtn: document.getElementById('loadDocSampleBtn'),
            copyBtn: document.getElementById('copyDocBtn'),
            downloadBtn: document.getElementById('downloadDocBtn'),
            charCount: document.getElementById('docCharCount')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        this.elements.latexInput.addEventListener('input', () => this.updateStats());
        this.elements.convertBtn.addEventListener('click', () => this.convertToDocument());
        this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        this.elements.loadSampleBtn.addEventListener('click', () => this.loadSample());
        this.elements.copyBtn.addEventListener('click', () => this.copyText());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadText());
    }

    /**
     * Update input statistics
     */
    updateStats() {
        const text = this.elements.latexInput.value;
        this.elements.charCount.textContent = `${text.length} ký tự`;
    }

    /**
     * Convert LaTeX to plain text document
     */
    convertToDocument() {
        const latexText = this.elements.latexInput.value.trim();
        
        if (!latexText) {
            this.showToast('Vui lòng nhập LaTeX code', 'warning');
            return;
        }

        try {
            // Parse LaTeX and convert to text
            const questions = this.parser.parseLatex(latexText);
            this.currentText = this.convertQuestionsToText(questions);
            this.renderTextPreview();
            this.showToast('Chuyển đổi thành công!', 'success');
        } catch (error) {
            console.error('Conversion error:', error);
            this.showToast('Lỗi chuyển đổi: ' + error.message, 'error');
        }
    }

    /**
     * Convert questions to plain text - giữ nguyên LaTeX math
     */
    convertQuestionsToText(questions) {
        return questions.map((question, index) => {
            let text = `Câu ${index + 1}: ${question.question}\n`;
            
            if (question.choices && question.choices.length > 0) {
                if (question.type === 'true-false') {
                    // Câu đúng sai với a) b) c) d)
                    question.choices.forEach((choice, choiceIndex) => {
                        const letter = String.fromCharCode(97 + choiceIndex); // a, b, c, d
                        const marker = choice.isCorrect ? '*' : '';
                        text += `${marker}${letter}) ${choice.text}\n`;
                    });
                } else {
                    // Câu trắc nghiệm thường với A. B. C. D.
                    question.choices.forEach((choice, choiceIndex) => {
                        const letter = String.fromCharCode(65 + choiceIndex); // A, B, C, D
                        const marker = choice.isCorrect ? '*' : '';
                        text += `${marker}${letter}. ${choice.text}\n`;
                    });
                }
            }
            
            // Thêm đáp án cho câu trả lời ngắn - TRÊN lời giải
            if (question.type === 'short-answer' && question.correctAnswers) {
                text += `Đáp án: ${question.correctAnswers}\n`;
            }
            
            if (question.explanation) {
                text += `Lời giải:\n${question.explanation}\n`;
            }
            
            text += '\n' + '─'.repeat(50) + '\n\n';
            return text;
        }).join('');
    }

    /**
     * Render text preview
     */
    renderTextPreview() {
        this.elements.previewContent.innerHTML = `
            <div class="text-preview">
                <pre>${this.currentText}</pre>
            </div>
        `;
    }

    /**
     * Copy text to clipboard
     */
    async copyText() {
        if (!this.currentText) {
            this.showToast('Chưa có văn bản để copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentText);
            this.showToast('Đã copy văn bản vào clipboard', 'success');
        } catch (error) {
            this.showToast('Lỗi copy văn bản', 'error');
        }
    }

    /**
     * Download text as file
     */
    downloadText() {
        if (!this.currentText) {
            this.showToast('Chưa có văn bản để tải xuống', 'warning');
            return;
        }

        const blob = new Blob([this.currentText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `latex-document-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Đã tải xuống văn bản', 'success');
    }

    /**
     * Clear input
     */
    clearInput() {
        this.elements.latexInput.value = '';
        this.currentText = '';
        this.elements.previewContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-text"></i>
                <h3>Chưa có nội dung</h3>
                <p>Nhập LaTeX code và nhấn Convert để xem văn bản</p>
            </div>
        `;
        this.updateStats();
    }

    /**
     * Load sample LaTeX
     */
    loadSample() {
        const sample = `\\begin{ex}
Cho hàm số $f(x) = x^2 + 2x - 3$. Tìm giá trị nhỏ nhất của hàm số.
\\choice
    {$-4$}
    {\\True $-4$}
    {$-3$}
    {$0$}
\\loigiai{Ta có $f'(x) = 2x + 2 = 0 \\Rightarrow x = -1$. Vậy $f_{min} = f(-1) = 1 - 2 - 3 = -4$.}
\\end{ex}

\\begin{ex}
Xét tính đúng sai của các mệnh đề sau:
\\choiceTF
    {\\True Hàm số $y = x^2$ đồng biến trên $(0; +\\infty)$}
    {Hàm số $y = x^3$ nghịch biến trên $\\mathbb{R}$}
    {\\True Đạo hàm của $y = \\sin x$ là $y' = \\cos x$}
    {Tích phân $\\int_0^1 x dx = 1$}
\\loigiai{
a) Đúng vì $y' = 2x > 0$ với $x > 0$
b) Sai vì $y' = 3x^2 \\geq 0$ với mọi $x$
c) Đúng theo công thức đạo hàm cơ bản
d) Sai vì $\\int_0^1 x dx = \\frac{1}{2}$
}
\\end{ex}

\\begin{ex}
Tính tích phân $\\int_0^1 x^2 dx$.
\\shortanswer{\\frac{1}{3}}
\\loigiai{$\\int_0^1 x^2 dx = \\left[\\frac{x^3}{3}\\right]_0^1 = \\frac{1}{3}$.}
\\end{ex}`;

        this.elements.latexInput.value = sample;
        this.updateStats();
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        Utils.showToast(message, type);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.latex2docApp = new LaTeX2DocApp();
});








