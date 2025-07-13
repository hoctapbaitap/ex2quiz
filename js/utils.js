/**
 * Utility functions for LaTeX Quiz Converter
 */
class Utils {
    /**
     * Format time in seconds to readable format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * Format time for display (MM:SS or HH:MM:SS)
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    static formatTimeDisplay(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Format date to Vietnamese format
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     */
    static formatRelativeTime(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) {
            return 'Vừa xong';
        } else if (diffMins < 60) {
            return `${diffMins} phút trước`;
        } else if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        } else if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        } else {
            return this.formatDate(date);
        }
    }

    /**
     * Get grade based on percentage
     * @param {number} percentage - Score percentage
     * @returns {Object} Grade object with letter, color, and description
     */
    static getGrade(percentage) {
        if (percentage >= 90) {
            return { letter: 'A+', color: '#4CAF50', description: 'Xuất sắc' };
        } else if (percentage >= 85) {
            return { letter: 'A', color: '#8BC34A', description: 'Rất tốt' };
        } else if (percentage >= 80) {
            return { letter: 'B+', color: '#CDDC39', description: 'Tốt' };
        } else if (percentage >= 75) {
            return { letter: 'B', color: '#FFEB3B', description: 'Khá' };
        } else if (percentage >= 70) {
            return { letter: 'C+', color: '#FFC107', description: 'Trung bình khá' };
        } else if (percentage >= 65) {
            return { letter: 'C', color: '#FF9800', description: 'Trung bình' };
        } else if (percentage >= 60) {
            return { letter: 'D+', color: '#FF5722', description: 'Yếu' };
        } else if (percentage >= 50) {
            return { letter: 'D', color: '#F44336', description: 'Kém' };
        } else {
            return { letter: 'F', color: '#9E9E9E', description: 'Rất kém' };
        }
    }

    /**
     * Generate random ID
     * @param {number} length - Length of ID
     * @returns {string} Random ID
     */
    static generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    static sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Escape HTML entities
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    /**
     * Download file
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} contentType - MIME type
     */
    static downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Convert object to CSV
     * @param {Array} data - Array of objects
     * @returns {string} CSV string
     */
    static objectToCSV(data) {
        if (!data || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma or quote
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        });

        return [csvHeaders, ...csvRows].join('\n');
    }

    /**
     * Parse CSV to objects
     * @param {string} csv - CSV string
     * @returns {Array} Array of objects
     */
    static csvToObject(csv) {
        const lines = csv.split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                data.push(obj);
            }
        }

        return data;
    }

    /**
     * Calculate statistics from array of numbers
     * @param {Array} numbers - Array of numbers
     * @returns {Object} Statistics object
     */
    static calculateStats(numbers) {
        if (!numbers || numbers.length === 0) {
            return { min: 0, max: 0, mean: 0, median: 0, mode: 0, count: 0 };
        }

        const sorted = [...numbers].sort((a, b) => a - b);
        const count = numbers.length;
        const sum = numbers.reduce((acc, num) => acc + num, 0);
        const mean = sum / count;

        // Median
        const median = count % 2 === 0
            ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
            : sorted[Math.floor(count / 2)];

        // Mode
        const frequency = {};
        numbers.forEach(num => {
            frequency[num] = (frequency[num] || 0) + 1;
        });
        const mode = Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        );

        return {
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            mean: Math.round(mean * 100) / 100,
            median: median,
            mode: parseFloat(mode),
            count: count,
            sum: sum
        };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate color palette
     * @param {number} count - Number of colors
     * @returns {Array} Array of hex colors
     */
    static generateColorPalette(count) {
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = i * hueStep;
            const color = this.hslToHex(hue, 70, 50);
            colors.push(color);
        }
        
        return colors;
    }

    /**
     * Convert HSL to Hex
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {string} Hex color
     */
    static hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    /**
     * Check if device is mobile
     * @returns {boolean} Is mobile device
     */
    static isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Get browser info
     * @returns {Object} Browser information
     */
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';

        if (ua.includes('Chrome')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Safari')) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Edge')) {
            browser = 'Edge';
            version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
        }

        return { browser, version, userAgent: ua };
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get storage usage
     * @returns {Object} Storage usage information
     */
    static getStorageUsage() {
        let totalSize = 0;
        let itemCount = 0;

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
                itemCount++;
            }
        }

        return {
            totalSize: totalSize,
            formattedSize: this.formatFileSize(totalSize),
            itemCount: itemCount,
            available: 5 * 1024 * 1024 - totalSize, // Assuming 5MB limit
            percentUsed: Math.round((totalSize / (5 * 1024 * 1024)) * 100)
        };
    }
}

// Export for use in other files
window.Utils = Utils;
