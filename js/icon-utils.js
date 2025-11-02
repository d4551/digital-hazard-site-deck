// Icon Utility System
// Standardizes icon usage and provides consistent icon rendering

(function() {
    'use strict';
    
    if (!window.IconUtils) {
        window.IconUtils = {};
    }
    
    const IconUtils = window.IconUtils;
    
    // Icon mapping for consistency
    const iconMap = {
        // Game related
        gamepad: 'fas fa-gamepad',
        star: 'fas fa-star',
        trophy: 'fas fa-trophy',
        skull: 'fas fa-skull',
        target: 'fas fa-crosshairs',
        explosion: 'fas fa-explosion',
        
        // Navigation
        home: 'fas fa-home',
        about: 'fas fa-info-circle',
        engine: 'fas fa-cog',
        cobalt: 'fas fa-gamepad',
        stats: 'fas fa-chart-bar',
        industry: 'fas fa-industry',
        contact: 'fas fa-envelope',
        
        // Actions
        play: 'fas fa-play',
        pause: 'fas fa-pause',
        settings: 'fas fa-gear',
        close: 'fas fa-times',
        menu: 'fas fa-bars',
        
        // Social
        linkedin: 'fab fa-linkedin-in',
        instagram: 'fab fa-instagram',
        discord: 'fab fa-discord',
        facebook: 'fab fa-facebook-f',
        
        // Status
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        loading: 'fas fa-spinner fa-spin'
    };
    
    /**
     * Get standardized icon class
     * @param {string} name - Icon name
     * @param {Object} options - Additional options
     * @returns {string} CSS class string
     */
    IconUtils.getIconClass = function(name, options = {}) {
        const baseClass = iconMap[name] || `fas fa-${name}`;
        const classes = [baseClass];
        
        if (options.size) {
            classes.push(`fa-${options.size}`);
        }
        
        if (options.spin) {
            classes.push('fa-spin');
        }
        
        if (options.pulse) {
            classes.push('fa-pulse');
        }
        
        if (options.color) {
            // Color is handled via CSS, not class
        }
        
        return classes.join(' ');
    };
    
    /**
     * Create icon element
     * @param {string} name - Icon name
     * @param {Object} options - Icon options
     * @returns {HTMLElement} Icon element
     */
    IconUtils.createIcon = function(name, options = {}) {
        const icon = document.createElement('i');
        icon.className = this.getIconClass(name, options);
        
        if (options.color) {
            icon.style.color = options.color;
        }
        
        if (options.title) {
            icon.setAttribute('title', options.title);
        }
        
        if (options.ariaLabel) {
            icon.setAttribute('aria-label', options.ariaLabel);
        } else {
            icon.setAttribute('aria-hidden', 'true');
        }
        
        return icon;
    };
    
    /**
     * Replace icon in element
     * @param {HTMLElement} element - Element to update
     * @param {string} name - New icon name
     * @param {Object} options - Icon options
     */
    IconUtils.replaceIcon = function(element, name, options = {}) {
        if (!element) return;
        
        const icon = element.querySelector('i') || element;
        if (icon) {
            icon.className = this.getIconClass(name, options);
            
            if (options.color) {
                icon.style.color = options.color;
            }
        }
    };
    
    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IconUtils;
    }
    
})();
