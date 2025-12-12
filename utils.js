// Utility Functions for SAPRA Application

// Input Sanitization
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function sanitizeCSV(str) {
    if (!str) return '';
    return String(str).replace(/[<>\"']/g, '');
}

// Debounce Function
function debounce(func, wait) {
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

// Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Number Formatting
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// Date Formatting
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fa-IR');
    } catch {
        return dateStr;
    }
}

// Percentage Calculation
function calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
}

// Data Validation
function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function isValidString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

// Error Handler
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    if (typeof showToast === 'function') {
        showToast(`خطا: ${error.message}`, 'error');
    }
    
    return {
        success: false,
        error: error.message,
        context
    };
}

// Local Storage Helper
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
};

// Export functions for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        sanitizeCSV,
        debounce,
        throttle,
        formatNumber,
        formatDate,
        calculatePercentage,
        isValidNumber,
        isValidString,
        handleError,
        storage
    };
}