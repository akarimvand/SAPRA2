// Theme Manager for SAPRA Application

const ThemeManager = {
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    
    STORAGE_KEY: 'sapra-theme',
    
    init() {
        const savedTheme = this.getSavedTheme();
        this.applyTheme(savedTheme);
        this.setupToggleButton();
    },
    
    getSavedTheme() {
        return localStorage.getItem(this.STORAGE_KEY) || this.THEMES.LIGHT;
    },
    
    saveTheme(theme) {
        localStorage.setItem(this.STORAGE_KEY, theme);
    },
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateToggleButton(theme);
        this.saveTheme(theme);
    },
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
        this.applyTheme(newTheme);
        
        if (typeof showToast === 'function') {
            showToast(`تم ${newTheme === this.THEMES.DARK ? 'تیره' : 'روشن'} فعال شد`, 'success', 2000);
        }
    },
    
    updateToggleButton(theme) {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = theme === this.THEMES.DARK ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
        
        btn.setAttribute('aria-label', theme === this.THEMES.DARK ? 'Switch to light mode' : 'Switch to dark mode');
    },
    
    setupToggleButton() {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.addEventListener('click', () => this.toggleTheme());
        }
    }
};

// Global function for easy access
window.toggleDarkMode = function() {
    ThemeManager.toggleTheme();
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}
