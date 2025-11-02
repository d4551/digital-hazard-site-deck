// Polyfills and Browser Compatibility
// Separation of concerns: Browser compatibility layer

// Check for required features and provide fallbacks
(function() {
    'use strict';
    
    // ResizeObserver polyfill check
    if (typeof ResizeObserver === 'undefined') {
        console.warn('ResizeObserver not supported, using fallback');
        window.ResizeObserver = class {
            constructor(callback) {
                this.callback = callback;
                this.observing = new WeakMap();
            }
            observe(element) {
                const handler = () => this.callback([{ target: element }]);
                window.addEventListener('resize', handler);
                this.observing.set(element, handler);
            }
            unobserve(element) {
                const handler = this.observing.get(element);
                if (handler) {
                    window.removeEventListener('resize', handler);
                    this.observing.delete(element);
                }
            }
            disconnect() {
                this.observing.clear();
            }
        };
    }
    
    // Object.values polyfill for older browsers
    if (!Object.values) {
        Object.values = function(obj) {
            return Object.keys(obj).map(key => obj[key]);
        };
    }
    
    // Array.from polyfill check
    if (!Array.from) {
        Array.from = function(arrayLike) {
            return Array.prototype.slice.call(arrayLike);
        };
    }
    
    // Performance.now polyfill
    if (!window.performance || !window.performance.now) {
        window.performance = window.performance || {};
        const start = Date.now();
        window.performance.now = function() {
            return Date.now() - start;
        };
    }
    
    // requestAnimationFrame polyfill
    if (!window.requestAnimationFrame) {
        let lastTime = 0;
        window.requestAnimationFrame = function(callback) {
            const currTime = Date.now();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(() => callback(currTime + timeToCall), timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
    
    // Feature detection and graceful degradation
    const features = {
        webgl: (function() {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && 
                         (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch {
                return false;
            }
        })(),
        localStorage: (function() {
            try {
                const test = '__localStorage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch {
                return false;
            }
        })(),
        canvas: !!document.createElement('canvas').getContext,
        fetch: typeof fetch !== 'undefined',
        es6Modules: 'noModule' in document.createElement('script')
    };
    
    // Report unsupported features
    if (!features.canvas) {
        console.error('Canvas API not supported');
        document.body.insertAdjacentHTML('beforeend', 
            '<div class="alert alert-error fixed top-0 left-0 w-full z-[99999]">' +
            'Your browser does not support canvas. Some features may not work.' +
            '</div>');
    }
    
    if (!features.localStorage) {
        console.warn('localStorage not available - progress will not be saved');
    }
    
    // Make features available globally
    window.BROWSER_FEATURES = features;
    
    // Log browser info for debugging
    if (window.CONFIG?.FEATURES) {
        console.log('Browser Features:', features);
        console.log('WebGL Support:', features.webgl);
        console.log('localStorage Support:', features.localStorage);
    }
})();

