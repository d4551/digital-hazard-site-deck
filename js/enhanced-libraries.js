// Enhanced Animation and Interaction Libraries Loader
// Loads Lottie, AOS, Hammer.js, and tippy.js from CDN

(function() {
    'use strict';
    
    if (!window.DHInit) {
        window.DHInit = {};
    }
    
    const DHInit = window.DHInit;
    
    // Check if we should use CDN
    const useCDN = window.location.protocol !== 'file:' && !window.location.href.includes('localhost');
    
    /**
     * Load library from CDN
     * @param {string} url - CDN URL
     * @param {string} globalVar - Global variable name to check
     * @returns {Promise}
     */
    function loadScriptFromCDN(url, globalVar) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (globalVar && window[globalVar]) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                // Wait a bit for global variable to be available
                setTimeout(() => {
                    if (globalVar && !window[globalVar]) {
                        console.warn(`[DHInit] Library loaded but global "${globalVar}" not found`);
                    }
                    resolve();
                }, 100);
            };
            script.onerror = () => {
                console.warn(`[DHInit] Failed to load ${url}`);
                reject(new Error(`Failed to load ${url}`));
            };
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load Lottie animation library
     */
    DHInit.loadLottie = function() {
        if (window.lottie || window.bodymovin) {
            return Promise.resolve();
        }
        
        if (useCDN) {
            return loadScriptFromCDN(
                'https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js',
                'lottie'
            );
        }
        
        return Promise.resolve(); // Skip if not using CDN
    };
    
    /**
     * Load AOS (Animate On Scroll) library
     */
    DHInit.loadAOS = function() {
        if (window.AOS) {
            return Promise.resolve();
        }
        
        if (useCDN) {
            // Load CSS first
            return new Promise((resolve) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css';
                link.crossOrigin = 'anonymous';
                link.onload = () => {
                    // Then load JS
                    loadScriptFromCDN(
                        'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js',
                        'AOS'
                    ).then(() => {
                        if (window.AOS) {
                            window.AOS.init({
                                duration: 800,
                                easing: 'ease-out-cubic',
                                once: true,
                                mirror: false
                            });
                        }
                        resolve();
                    }).catch(() => resolve());
                };
                link.onerror = () => resolve(); // Fail gracefully
                document.head.appendChild(link);
            });
        }
        
        return Promise.resolve();
    };
    
    /**
     * Load Hammer.js for touch gestures
     */
    DHInit.loadHammer = function() {
        if (window.Hammer) {
            return Promise.resolve();
        }
        
        if (useCDN) {
            return loadScriptFromCDN(
                'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js',
                'Hammer'
            );
        }
        
        return Promise.resolve();
    };
    
    /**
     * Load tippy.js for enhanced tooltips
     */
    DHInit.loadTippy = function() {
        if (window.tippy) {
            return Promise.resolve();
        }
        
        if (useCDN) {
            return new Promise((resolve) => {
                // Load CSS first
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy.css';
                cssLink.crossOrigin = 'anonymous';
                
                cssLink.onload = () => {
                    // Then load Popper and Tippy
                    Promise.all([
                        loadScriptFromCDN(
                            'https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js',
                            'Popper'
                        ).catch(() => Promise.resolve()), // Optional dependency
                        loadScriptFromCDN(
                            'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy-bundle.umd.min.js',
                            'tippy'
                        )
                    ]).then(() => {
                        if (window.tippy) {
                            // Initialize tippy with default options
                            window.tippy.setDefaultProps({
                                theme: 'digital-hazard',
                                animation: 'fade',
                                duration: [200, 150],
                                delay: [100, 0]
                            });
                        }
                        resolve();
                    }).catch(() => resolve());
                };
                
                cssLink.onerror = () => resolve(); // Fail gracefully
                document.head.appendChild(cssLink);
            });
        }
        
        return Promise.resolve();
    };
    
    /**
     * Load all enhanced libraries
     */
    DHInit.loadEnhancedLibraries = function() {
        return Promise.all([
            DHInit.loadLottie(),
            DHInit.loadAOS(),
            DHInit.loadHammer(),
            DHInit.loadTippy()
        ]).catch(error => {
            console.warn('[DHInit] Some enhanced libraries failed to load:', error);
        });
    };
    
    // Auto-load on page load (non-blocking)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                DHInit.loadEnhancedLibraries();
            }, 1000); // Delay to not block critical resources
        });
    } else {
        setTimeout(() => {
            DHInit.loadEnhancedLibraries();
        }, 1000);
    }
})();

