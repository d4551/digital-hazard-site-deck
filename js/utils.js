// Utility Functions - Common operations centralized
// Separation of concerns: Reusable helper functions
// Converted to non-module script for static compatibility

(function() {
    'use strict';
    
    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - Function to debounce
     * @param {number} wait - Delay in milliseconds
     * @returns {Function} Debounced function
     */
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

    /**
     * Throttle function to limit function execution frequency
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    function throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Safe localStorage operations with error handling
     */
    const Storage = {
        /**
         * Get item from localStorage with fallback
         * @param {string} key - Storage key
         * @param {*} defaultValue - Default value if key doesn't exist
         * @returns {*} Stored value or default
         */
        get(key, defaultValue = null) {
            if (!window.CONFIG?.FEATURES?.LOCAL_STORAGE_SUPPORT) {
                return defaultValue;
            }
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn(`Storage.get failed for key "${key}":`, error);
                return defaultValue;
            }
        },
        
        /**
         * Set item in localStorage with error handling
         * @param {string} key - Storage key
         * @param {*} value - Value to store
         * @returns {boolean} Success status
         */
        set(key, value) {
            if (!window.CONFIG?.FEATURES?.LOCAL_STORAGE_SUPPORT) {
                return false;
            }
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn(`Storage.set failed for key "${key}":`, error);
                return false;
            }
        },
        
        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        remove(key) {
            if (!window.CONFIG?.FEATURES?.LOCAL_STORAGE_SUPPORT) return;
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Storage.remove failed for key "${key}":`, error);
            }
        },
        
        /**
         * Clear all localStorage
         */
        clear() {
            if (!window.CONFIG?.FEATURES?.LOCAL_STORAGE_SUPPORT) return;
            try {
                localStorage.clear();
            } catch (error) {
                console.warn('Storage.clear failed:', error);
            }
        }
    };

    /**
     * Get DOM element with null checking
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (default: document)
     * @returns {Element|null} Found element or null
     */
    function $(selector, context) {
        context = context || document;
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.warn(`Query selector failed: "${selector}"`, error);
            return null;
        }
    }

    /**
     * Get all DOM elements matching selector
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (default: document)
     * @returns {NodeList|Array} Found elements
     */
    function $$(selector, context) {
        context = context || document;
        try {
            return context.querySelectorAll(selector);
        } catch (error) {
            console.warn(`Query selector all failed: "${selector}"`, error);
            return [];
        }
    }

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted string
     */
    function formatNumber(num) {
        return typeof num === 'number' ? num.toLocaleString() : String(num);
    }

    /**
     * Clamp value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance
     */
    function distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @param {number} threshold - Intersection threshold (0-1)
     * @returns {boolean} True if in viewport
     */
    function isInViewport(element, threshold) {
        threshold = threshold || 0.5;
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
        const visibleArea = visibleHeight * visibleWidth;
        const totalArea = rect.height * rect.width;
        
        return (visibleArea / totalArea) >= threshold;
    }

    /**
     * Create element with attributes and children
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Attributes object
     * @param {Array|string} children - Child elements or text
     * @returns {Element} Created element
     */
    function createElement(tag, attrs, children) {
        attrs = attrs || {};
        children = children || [];
        
        const element = document.createElement(tag);
        
        Object.keys(attrs).forEach(function(key) {
            const value = attrs[key];
            if (key === 'class' || key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.indexOf('data-') === 0 || key.indexOf('aria-') === 0) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(function(child) {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    /**
     * Smooth scroll to element
     * @param {Element|string} target - Target element or selector
     * @param {number} offset - Scroll offset in pixels
     */
    function smoothScrollTo(target, offset) {
        offset = offset || 80;
        const element = typeof target === 'string' ? $(target) : target;
        if (!element) return;
        
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Check if user prefers reduced motion
     * @returns {boolean} True if reduced motion preferred
     */
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Error handler wrapper for async functions
     * @param {Function} fn - Async function to wrap
     * @param {Function} onError - Error callback
     * @returns {Function} Wrapped function
     */
    function asyncHandler(fn, onError) {
        return function(...args) {
            try {
                const result = fn.apply(this, args);
                if (result && typeof result.then === 'function') {
                    return result.catch(function(error) {
                        console.error('Async handler error:', error);
                        if (onError) {
                            onError(error);
                        }
                        return null;
                    });
                }
                return result;
            } catch (error) {
                console.error('Async handler error:', error);
                if (onError) {
                    onError(error);
                }
                return null;
            }
        };
    }

    const Utils = {
        Storage,
        throttle,
        debounce,
        $,
        $$,
        formatNumber,
        clamp,
        lerp,
        distance,
        isInViewport,
        createElement,
        smoothScrollTo,
        prefersReducedMotion,
        asyncHandler
    };

    // Export to window for global access
    window.Storage = Storage;
    window.throttle = throttle;
    window.debounce = debounce;
    window.$ = $;
    window.$$ = $$;
    window.formatNumber = formatNumber;
    window.clamp = clamp;
    window.lerp = lerp;
    window.distance = distance;
    window.isInViewport = isInViewport;
    window.createElement = createElement;
    window.smoothScrollTo = smoothScrollTo;
    window.prefersReducedMotion = prefersReducedMotion;
    window.asyncHandler = asyncHandler;
    window.Utils = Utils;
})();
