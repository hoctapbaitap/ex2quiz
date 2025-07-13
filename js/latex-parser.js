/**
 * LaTeX Parser for ex-test format
 * Converts LaTeX quiz format to JSON structure
 */
class LaTeXParser {
    constructor() {
        this.mathJaxLoaded = false;
        this.loadMathJax();
    }

    /**
     * Load MathJax for LaTeX rendering
     */
    loadMathJax() {
        if (window.MathJax) {
            this.mathJaxLoaded = true;
            return;
        }

        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true,
                processEnvironments: true
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            }
        };

        const script = document.createElement('script');
        script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6';
        document.head.appendChild(script);

        const mathJaxScript = document.createElement('script');
        mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        mathJaxScript.onload = () => {
            this.mathJaxLoaded = true;
        };
        document.head.appendChild(mathJaxScript);
    }

    /**
     * Parse LaTeX text and extract questions
     * @param {string} latexText - Raw LaTeX text
     * @returns {Array} Array of question objects
     */
    parseLatex(latexText) {
        try {
            const questions = [];
            
            // Remove comments and clean up text
            const cleanText = this.cleanLatexText(latexText);
            
            // Extract all \begin{ex}...\end{ex} blocks
            const exBlocks = this.extractExBlocks(cleanText);
            
            exBlocks.forEach((block, index) => {
                const question = this.parseExBlock(block, index + 1);
                if (question) {
                    questions.push(question);
                }
            });

            return questions;
        } catch (error) {
            console.error('Error parsing LaTeX:', error);
            throw new Error(`Lỗi phân tích LaTeX: ${error.message}`);
        }
    }

    /**
     * Clean LaTeX text by removing comments and normalizing whitespace
     * @param {string} text - Raw LaTeX text
     * @returns {string} Cleaned text
     */
    cleanLatexText(text) {
        return text
            // Remove LaTeX comments
            .replace(/(?<!\\)%.*$/gm, '')
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Remove extra newlines
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    /**
     * Extract all \begin{ex}...\end{ex} blocks
     * @param {string} text - Cleaned LaTeX text
     * @returns {Array} Array of ex blocks
     */
    extractExBlocks(text) {
        const exBlocks = [];
        const regex = /\\begin\{ex\}(.*?)\\end\{ex\}/gs;
        let match;

        while ((match = regex.exec(text)) !== null) {
            exBlocks.push(match[1].trim());
        }

        return exBlocks;
    }

    /**
     * Parse a single ex block into a question object
     * @param {string} block - Ex block content
     * @param {number} questionNumber - Question number
     * @returns {Object} Question object
     */
    parseExBlock(block, questionNumber) {
        try {
            // Extract question text (everything before \choice, \choiceTF, or \shortans)
            const choiceIndex = Math.min(
                block.indexOf('\\choice') !== -1 ? block.indexOf('\\choice') : Infinity,
                block.indexOf('\\choiceTF') !== -1 ? block.indexOf('\\choiceTF') : Infinity,
                block.indexOf('\\shortans') !== -1 ? block.indexOf('\\shortans') : Infinity
            );

            if (choiceIndex === Infinity) {
                throw new Error('Không tìm thấy \\choice, \\choiceTF hoặc \\shortans trong câu hỏi');
            }

            const questionText = block.substring(0, choiceIndex).trim();
            const remainingText = block.substring(choiceIndex);

            // Determine question type
            const isTrueFalse = remainingText.startsWith('\\choiceTF');
            const isShortAnswer = remainingText.startsWith('\\shortans');
            const questionType = isShortAnswer ? 'short-answer' :
                               (isTrueFalse ? 'true-false' : 'multiple-choice');

            // Extract choices or short answer
            let choices = [];
            let correctAnswer = null;

            if (isShortAnswer) {
                correctAnswer = this.extractShortAnswer(remainingText);
            } else {
                choices = isTrueFalse ?
                    this.extractTrueFalseChoices(remainingText) :
                    this.extractChoices(remainingText);
            }

            // Extract explanation
            const explanation = this.extractExplanation(remainingText);

            // Find correct answer(s)
            const correctAnswers = isShortAnswer ? correctAnswer :
                                 this.findCorrectAnswers(choices, questionType);

            const result = {
                id: `q${questionNumber}`,
                number: questionNumber,
                type: questionType,
                question: this.processLatexMath(questionText),
                correctAnswers: correctAnswers,
                explanation: this.processLatexMath(explanation),
                rawLatex: block
            };

            // Add choices only for non-short-answer questions
            if (!isShortAnswer) {
                result.choices = choices.map(choice => ({
                    text: this.processLatexMath(choice.text),
                    isCorrect: choice.isCorrect
                }));
            } else {
                // For short answer questions, add empty choices array for compatibility
                result.choices = [];
            }

            return result;
        } catch (error) {
            console.error(`Error parsing question ${questionNumber}:`, error);
            return null;
        }
    }

    /**
     * Extract choices from the choice block
     * @param {string} text - Text containing choices
     * @returns {Array} Array of choice objects
     */
    extractChoices(text) {
        const choices = [];
        
        // Find the \choice block
        const choiceMatch = text.match(/\\choice\s*(.*?)(?=\\loigiai|$)/s);
        if (!choiceMatch) {
            throw new Error('Không thể phân tích choices');
        }

        const choiceBlock = choiceMatch[1];
        
        // Extract individual choices using regex for {content}
        const choiceRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
        let match;

        while ((match = choiceRegex.exec(choiceBlock)) !== null) {
            const choiceText = match[1].trim();
            const isCorrect = choiceText.includes('\\True');
            const cleanText = choiceText.replace(/\\True\s*/, '').trim();
            
            choices.push({
                text: cleanText,
                isCorrect: isCorrect
            });
        }

        if (choices.length === 0) {
            throw new Error('Không tìm thấy choices hợp lệ');
        }

        return choices;
    }

    /**
     * Extract explanation from loigiai block
     * @param {string} text - Text containing explanation
     * @returns {string} Explanation text
     */
    extractExplanation(text) {
        // Handle both simple and complex loigiai blocks
        const loigiaiMatch = text.match(/\\loigiai\{(.*)\}$/s);
        if (!loigiaiMatch) {
            return '';
        }

        let explanation = loigiaiMatch[1].trim();

        // For true-false questions, just return the entire explanation
        // The complex itemchoice processing is not needed for display
        return explanation;
    }

    /**
     * Extract short answer from shortans block
     * @param {string} text - Text containing short answer
     * @returns {string} Correct answer
     */
    extractShortAnswer(text) {
        // Match \shortans[optional]{answer} or \shortans{answer}
        const shortansMatch = text.match(/\\shortans(?:\[[^\]]*\])?\{([^}]+)\}/);
        if (!shortansMatch) {
            throw new Error('Không thể phân tích shortans');
        }

        return shortansMatch[1].trim();
    }

    /**
     * Extract choices from the choiceTF block (True/False questions)
     * @param {string} text - Text containing choices
     * @returns {Array} Array of choice objects
     */
    extractTrueFalseChoices(text) {
        const choices = [];

        // Find the \choiceTF block
        const choiceMatch = text.match(/\\choiceTF\s*(.*?)(?=\\loigiai|$)/s);
        if (!choiceMatch) {
            throw new Error('Không thể phân tích choiceTF');
        }

        const choiceBlock = choiceMatch[1];

        // Extract individual choices using regex for {content}
        const choiceRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
        let match;

        while ((match = choiceRegex.exec(choiceBlock)) !== null) {
            const choiceText = match[1].trim();
            const isCorrect = choiceText.includes('\\True');
            const cleanText = choiceText.replace(/\\True\s*/, '').trim();

            choices.push({
                text: cleanText,
                isCorrect: isCorrect
            });
        }

        if (choices.length === 0) {
            throw new Error('Không tìm thấy choices hợp lệ trong choiceTF');
        }

        return choices;
    }

    /**
     * Find the correct answer(s) based on question type
     * @param {Array} choices - Array of choice objects
     * @param {string} questionType - Type of question ('multiple-choice' or 'true-false')
     * @returns {Array|number} Array of correct indices for true-false, single index for multiple-choice
     */
    findCorrectAnswers(choices, questionType) {
        if (questionType === 'true-false') {
            // For true-false questions, return array of all correct indices
            const correctIndices = [];
            for (let i = 0; i < choices.length; i++) {
                if (choices[i].isCorrect) {
                    correctIndices.push(i);
                }
            }
            return correctIndices;
        } else {
            // For multiple-choice questions, return single correct index
            for (let i = 0; i < choices.length; i++) {
                if (choices[i].isCorrect) {
                    return i;
                }
            }
            return -1; // No correct answer found
        }
    }

    /**
     * Find the index of the correct answer (legacy method for backward compatibility)
     * @param {Array} choices - Array of choice objects
     * @returns {number} Index of correct answer
     */
    findCorrectAnswer(choices) {
        for (let i = 0; i < choices.length; i++) {
            if (choices[i].isCorrect) {
                return i;
            }
        }
        return -1; // No correct answer found
    }

    /**
     * Process LaTeX math expressions for display
     * @param {string} text - Text with LaTeX math
     * @returns {string} Processed text
     */
    processLatexMath(text) {
        if (!text) return '';

        // Process images first
        let processed = this.processImages(text);

        // Convert common LaTeX commands to more readable format
        return processed
            // Fractions
            .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}')
            // Common symbols
            .replace(/\\left\(/g, '(')
            .replace(/\\right\)/g, ')')
            .replace(/\\left\[/g, '[')
            .replace(/\\right\]/g, ']')
            .replace(/\\left\{/g, '{')
            .replace(/\\right\}/g, '}')
            // Clean up extra spaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Process image tags in text
     * @param {string} text - Text containing image tags
     * @returns {string} Processed text with proper image tags
     */
    processImages(text) {
        // Handle <img> tags - make sure they have proper attributes
        return text.replace(/<img\s+([^>]*?)>/gi, (match, attributes) => {
            // Extract src attribute
            const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
            if (!srcMatch) return match; // Return original if no src found

            const src = srcMatch[1];

            // Build proper img tag with default attributes
            let imgTag = `<img src="${src}"`;

            // Add alt attribute if not present
            if (!attributes.match(/alt\s*=/i)) {
                imgTag += ` alt="Quiz Image"`;
            } else {
                const altMatch = attributes.match(/alt\s*=\s*["']([^"']*)["']/i);
                if (altMatch) {
                    imgTag += ` alt="${altMatch[1]}"`;
                }
            }

            // Add default styling for responsive images
            if (!attributes.match(/style\s*=/i) && !attributes.match(/class\s*=/i)) {
                imgTag += ` style="max-width: 100%; height: auto; margin: 0.5rem 0; border-radius: 0.375rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"`;
            } else {
                // Preserve existing style/class
                const styleMatch = attributes.match(/style\s*=\s*["']([^"']*)["']/i);
                const classMatch = attributes.match(/class\s*=\s*["']([^"']*)["']/i);
                if (styleMatch) imgTag += ` style="${styleMatch[1]}"`;
                if (classMatch) imgTag += ` class="${classMatch[1]}"`;
            }

            imgTag += ` />`;
            return imgTag;
        });
    }

    /**
     * Render math expressions using MathJax
     * @param {string} text - Text with LaTeX math
     * @returns {Promise<string>} Rendered HTML
     */
    async renderMath(text) {
        if (!this.mathJaxLoaded || !window.MathJax) {
            return text;
        }

        try {
            const container = document.createElement('div');
            container.innerHTML = text;
            
            await window.MathJax.typesetPromise([container]);
            return container.innerHTML;
        } catch (error) {
            console.warn('MathJax rendering failed:', error);
            return text;
        }
    }

    /**
     * Validate LaTeX input
     * @param {string} latexText - LaTeX text to validate
     * @returns {Object} Validation result
     */
    validateLatex(latexText) {
        const errors = [];
        const warnings = [];

        if (!latexText || latexText.trim().length === 0) {
            errors.push('LaTeX input is empty');
            return { isValid: false, errors, warnings };
        }

        // Check for basic structure
        const exBlocks = latexText.match(/\\begin\{ex\}/g);
        const endBlocks = latexText.match(/\\end\{ex\}/g);

        if (!exBlocks) {
            errors.push('Không tìm thấy \\begin{ex}');
        } else if (!endBlocks) {
            errors.push('Không tìm thấy \\end{ex}');
        } else if (exBlocks.length !== endBlocks.length) {
            errors.push('Số lượng \\begin{ex} và \\end{ex} không khớp');
        }

        // Check for choices in each block
        const choiceBlocks = latexText.match(/\\choice/g);
        if (exBlocks && (!choiceBlocks || choiceBlocks.length < exBlocks.length)) {
            warnings.push('Một số câu hỏi có thể thiếu \\choice');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            questionCount: exBlocks ? exBlocks.length : 0
        };
    }
}

// Export for use in other files
window.LaTeXParser = LaTeXParser;
