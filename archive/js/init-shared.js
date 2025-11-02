/**
 * Shared Initialization Utilities
 * DRY principles: Consolidates common initialization patterns used across static pages
 * Prevents component conflicts and ensures proper library loading order
 */

(function() {
    'use strict';
    
    const assetPrefix = (typeof window !== 'undefined' && window.DH_ASSET_PREFIX) || '';
    const withPrefix = (path) => {
        if (!path) {
            return path;
        }
        return /^(?:https?:)?\/\//.test(path) ? path : assetPrefix + path;
    };
    
    // Namespace to prevent conflicts
    if (!window.DHInit) {
        window.DHInit = {};
    }
    
    const DHInit = window.DHInit;
    
    // State tracking to prevent duplicate initialization
    const state = {
        threeJSLoaded: false,
        gamificationLoaded: false,
        stylesLoaded: false,
        configReady: false,
        gsapRegistered: false,
        animationsInitialized: false
    };
    
    /**
     * Wait for CONFIG to be ready
     * @param {Function} callback
     * @param {number} timeout
     */
    DHInit.waitForConfig = function(callback, timeout = 10000) {
        if (window.CONFIG_READY && !state.configReady) {
            state.configReady = true;
            callback();
            return;
        }
        
        if (window.CONFIG_READY) {
            callback();
            return;
        }
        
        const startTime = Date.now();
        const checkConfig = function() {
            if (window.CONFIG_READY) {
                state.configReady = true;
                callback();
            } else if (Date.now() - startTime < timeout) {
                window.addEventListener('configReady', callback, { once: true });
            } else {
                console.warn('DHInit: CONFIG_READY timeout');
            }
        };
        
        window.addEventListener('configReady', checkConfig, { once: true });
        
        // Fallback check
        setTimeout(checkConfig, 100);
    };
    
    /**
     * Load Three.js background (prevents duplicate loading)
     * @param {Object} options
     */
    DHInit.loadThreeJS = function(options = {}) {
        // Prevent duplicate loading
        if (state.threeJSLoaded || window.THREE) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            DHInit.waitForConfig(() => {
                // Skip if WebGL not supported
                if (!window.CONFIG?.FEATURES?.WEBGL_SUPPORT) {
                    resolve();
                    return;
                }
                
                // Skip if on file:// protocol (silent - expected behavior)
                if (window.location.protocol === 'file:') {
                    // Three.js requires HTTP/HTTPS - this is expected, not an error
                    resolve();
                    return;
                }
                
                // Wait for shared-threejs.js utilities to be available
                const waitForSharedThree = (attempts = 0) => {
                    if (typeof window.DHThree !== 'undefined' && typeof window.DHThree.initScene === 'function') {
                        // Shared utilities are ready, load background script
                        try {
                            const bgScript = document.createElement('script');
                            bgScript.type = 'module';
                            bgScript.src = options.src || withPrefix('js/threejs-background.js');
                            bgScript.onload = function() {
                                state.threeJSLoaded = true;
                                resolve();
                            };
                            bgScript.onerror = function() {
                                // Silently degrade - background is optional
                                resolve();
                            };
                            document.body.appendChild(bgScript);
                        } catch (error) {
                            resolve(); // Fail gracefully
                        }
                    } else if (attempts < 50) {
                        // Wait up to 5 seconds (50 * 100ms) for shared-threejs.js
                        setTimeout(() => waitForSharedThree(attempts + 1), 100);
                    } else {
                        // Timeout - shared utilities not available, but try loading anyway
                        // threejs-background.js will handle the wait internally
                        console.warn('DHInit: shared-threejs.js utilities not detected, loading background script anyway');
                        try {
                            const bgScript = document.createElement('script');
                            bgScript.type = 'module';
                            bgScript.src = options.src || withPrefix('js/threejs-background.js');
                            bgScript.onload = function() {
                                state.threeJSLoaded = true;
                                resolve();
                            };
                            bgScript.onerror = function() {
                                resolve();
                            };
                            document.body.appendChild(bgScript);
                        } catch (error) {
                            resolve();
                        }
                    }
                };
                
                // Start waiting for shared utilities
                waitForSharedThree();
            });
        });
    };
    
    /**
     * Load gamification system (prevents duplicate loading)
     * @param {Object} options
     */
    DHInit.loadGamification = function(options = {}) {
        // Prevent duplicate loading
        if (state.gamificationLoaded || window.game) {
            return Promise.resolve(window.game);
        }
        
        return new Promise((resolve, reject) => {
            DHInit.waitForConfig(() => {
                const script = document.createElement('script');
                script.src = options.src || withPrefix('js/gamification.js');
                script.onload = function() {
                    state.gamificationLoaded = true;
                    
                    // Wait a moment for initialization
                    setTimeout(() => {
                        if (window.game) {
                            window.dispatchEvent(new Event('gamificationReady'));
                            resolve(window.game);
                        } else if (typeof UnifiedGamificationManager !== 'undefined') {
                            try {
                                window.game = new UnifiedGamificationManager();
                                window.dispatchEvent(new Event('gamificationReady'));
                                resolve(window.game);
                            } catch (e) {
                                console.error('DHInit: Failed to initialize gamification:', e);
                                reject(e);
                            }
                        } else {
                            console.warn('DHInit: Gamification loaded but window.game not found');
                            resolve(null);
                        }
                    }, 100);
                };
                script.onerror = function() {
                    console.error('DHInit: Failed to load gamification.js');
                    reject(new Error('Failed to load gamification.js'));
                };
                document.body.appendChild(script);
            });
        });
    };
    
    /**
     * Initialize theme controller (prevents duplicate initialization)
     * @param {Object} options
     */
    DHInit.initThemeController = function(options = {}) {
        if (window.DHInit.themeControllerInitialized) {
            return;
        }
        
        DHInit.waitForConfig(() => {
            if (!window.Storage) {
                // Wait for Storage utility
                const checkStorage = setInterval(() => {
                    if (window.Storage) {
                        clearInterval(checkStorage);
                        DHInit.initThemeController(options);
                    }
                }, 100);
                setTimeout(() => clearInterval(checkStorage), 5000);
                return;
            }
            
            const savedTheme = window.Storage.get('dhTheme', 'hazard') || 
                             (typeof localStorage !== 'undefined' ? localStorage.getItem('dhTheme') : null) || 
                             'hazard';
            
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
            
            // Set up theme change listeners
            document.querySelectorAll('input[name="theme-dropdown"], .theme-controller').forEach(input => {
                input.addEventListener('change', function() {
                    const theme = this.value;
                    document.documentElement.classList.add('theme-transition');
                    document.documentElement.setAttribute('data-theme', theme);
                    
                    // Save preference
                    if (window.Storage && typeof window.Storage.set === 'function') {
                        window.Storage.set('dhTheme', theme);
                    } else if (typeof localStorage !== 'undefined') {
                        try {
                            localStorage.setItem('dhTheme', theme);
                        } catch (e) {
                            console.warn('Failed to save theme preference:', e);
                        }
                    }
                    
                    // Award points if gamification is loaded
                    if (window.game && typeof window.game.addPoints === 'function') {
                        window.game.addPoints(5, 'Theme changed');
                    }
                    
                    // Remove transition class
                    setTimeout(() => {
                        document.documentElement.classList.remove('theme-transition');
                    }, 300);
                });
            });
            
            window.DHInit.themeControllerInitialized = true;
        });
    };
    
    /**
     * Mark styles as loaded (prevents FOUC)
     */
    DHInit.markStylesLoaded = function() {
        if (!state.stylesLoaded) {
            state.stylesLoaded = true;
            document.documentElement.classList.add('styles-loaded');
        }
    };
    
    /**
     * Load game modules (prevents duplicate loading)
     * @param {Object} options
     * @returns {Promise}
     */
    DHInit.loadGameModules = function(options = {}) {
        // Helper to check if required classes are defined
        const checkRequiredClasses = () => {
            const required = ['GameEngine', 'GameRenderer', 'ParticleSystem', 'SurvivalGame'];
            const missing = required.filter(className => {
                // Check window scope and global scope
                return typeof window[className] === 'undefined';
            });
            return missing;
        };
        
        // Check if all classes already exist globally
        const missingClasses = checkRequiredClasses();
        if (missingClasses.length === 0) {
            window.DHInit.gameModulesLoaded = true;
            console.log('[DHInit] All game modules already loaded (classes exist)');
            return Promise.resolve();
        }
        
        // Prevent duplicate loading if flag is set
        if (window.DHInit.gameModulesLoaded) {
            console.log('[DHInit] Game modules already marked as loaded, skipping');
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            // Wait for gamification to be ready
            const waitForGamification = (callback) => {
                if (window.game && typeof window.game.addPoints === 'function') {
                    callback();
                    return;
                }
                
                // Wait for gamification (max 2 seconds)
                const checkInterval = setInterval(() => {
                    if (window.game && typeof window.game.addPoints === 'function') {
                        clearInterval(checkInterval);
                        callback();
                    }
                }, 100);
                
                window.addEventListener('gamificationReady', () => {
                    clearInterval(checkInterval);
                    callback();
                }, { once: true });
                
                // Timeout fallback
                setTimeout(() => {
                    clearInterval(checkInterval);
                    callback();
                }, 2000);
            };
            
            waitForGamification(() => {
                // Load object pool first (required for game modules)
        const objectPoolScript = document.querySelector(`script[src="${withPrefix('js/object-pool.js')}"]`);
                if (!objectPoolScript && typeof window.ObjectPool === 'undefined') {
                    const poolScript = document.createElement('script');
                    poolScript.src = withPrefix('js/object-pool.js');
                    poolScript.onload = () => {
                        console.log('[DHInit] Object pool loaded');
                        loadGameModules();
                    };
                    poolScript.onerror = () => {
                        console.warn('[DHInit] Failed to load object-pool.js, continuing anyway');
                        loadGameModules();
                    };
                    document.body.appendChild(poolScript);
                    return;
                }
                
                loadGameModules();
            });
            
            function loadGameModules() {
                const modules = [
                    withPrefix('js/audio-engine.js'),
                    withPrefix('js/game-engine.js'),
                    withPrefix('js/particle-system.js'),
                    withPrefix('js/game-renderer.js'),
                    withPrefix('js/game.js')
                ];

                const classMap = {
                    [withPrefix('js/game-engine.js')]: 'GameEngine',
                    [withPrefix('js/particle-system.js')]: 'ParticleSystem',
                    [withPrefix('js/game-renderer.js')]: 'GameRenderer',
                    [withPrefix('js/game.js')]: 'SurvivalGame'
                };

                const loadedScripts = new Set();

                Promise.all(modules.map((src) => loadSingleModule(src)))
                    .then(waitForRequiredClasses)
                    .then(() => {
                        window.DHInit.gameModulesLoaded = true;
                        console.log('[DHInit] All game modules loaded successfully');
                        console.log('[DHInit] Verified classes: GameEngine, GameRenderer, ParticleSystem, SurvivalGame');
                        resolve();
                    })
                    .catch((error) => {
                        console.error('[DHInit] Game module loading failed', error);
                        reject(error);
                    });

                function loadSingleModule(src) {
                    return new Promise((moduleResolve, moduleReject) => {
                        const expectedClass = classMap[src];

                        const finalize = () => {
                            setTimeout(() => {
                                if (expectedClass && typeof window[expectedClass] === 'undefined') {
                                    console.warn(`[DHInit] Expected class "${expectedClass}" not found immediately after loading ${src}`);
                                } else if (expectedClass) {
                                    console.log(`[DHInit] ✓ Class "${expectedClass}" loaded from ${src}`);
                                }
                                moduleResolve();
                            }, 50);
                        };

                        const existingScript = document.querySelector(`script[src="${src}"]`);
                        if (existingScript) {
                            if (expectedClass && typeof window[expectedClass] !== 'undefined') {
                                console.log(`[DHInit] ✓ Script ${src} already loaded, class ${expectedClass} exists`);
                                moduleResolve();
                            } else {
                                finalize();
                            }
                            return;
                        }

                        if (loadedScripts.has(src)) {
                            finalize();
                            return;
                        }

                        loadedScripts.add(src);
                        const script = document.createElement('script');
                        script.src = src;
                        script.onload = finalize;
                        script.onerror = () => moduleReject(new Error(`[DHInit] Failed to load ${src}`));
                        document.body.appendChild(script);
                    });
                }

                function waitForRequiredClasses() {
                    return new Promise((waitResolve, waitReject) => {
                        let attempts = 0;
                        const maxAttempts = 100;

                        const checkLoop = () => {
                            attempts++;
                            const outstanding = checkRequiredClasses();
                            if (outstanding.length === 0) {
                                waitResolve();
                                return;
                            }

                            if (attempts >= maxAttempts) {
                                const errorMsg = `[DHInit] Timeout waiting for game classes. Missing: ${outstanding.join(', ')}`;
                                waitReject(new Error(errorMsg));
                                return;
                            }

                            setTimeout(checkLoop, 100);
                        };

                        checkLoop();
                    });
                }
            }
        });
    };
    
    /**
     * Initialize game in modal (DRY utility)
     * @param {Object} options
     */
    DHInit.initGameInModal = function(options = {}) {
        const modalId = options.modalId || 'gameModal';
        const canvasId = options.canvasId || 'demo-canvas';
        
        const gameModal = document.getElementById(modalId);
        if (!gameModal) {
            console.warn(`[DHInit] Game modal "${modalId}" not found`);
            return;
        }
        
        // Wait for SurvivalGame if not yet available (may still be loading)
        if (typeof SurvivalGame === 'undefined') {
            console.log('[DHInit] SurvivalGame class not yet available, waiting...');
            const waitForSurvivalGame = () => {
                if (typeof SurvivalGame !== 'undefined') {
                    // Retry initialization
                    DHInit.initGameInModal(options);
                } else {
                    setTimeout(waitForSurvivalGame, 100);
                }
            };
            // Only wait up to 5 seconds
            setTimeout(() => {
                if (typeof SurvivalGame === 'undefined') {
                    console.warn('[DHInit] SurvivalGame class still not available after timeout. Game modules may not have loaded correctly.');
                }
            }, 5000);
            waitForSurvivalGame();
            return;
        }
        
        // Initialize game when modal opens - Use improved game loader (DRY)
        const initializeGameOnModalOpen = async () => {
            // Use improved game loader if available
            if (window.DHGameLoader && typeof window.DHGameLoader.initGame === 'function') {
                try {
                    await window.DHGameLoader.initGame(canvasId, {
                        showProgress: true
                    });
                    console.log('[DHInit] Survival game initialized using GameLoader');
                } catch (error) {
                    console.error('[DHInit] Game initialization failed:', error);
                    // Show error in UI
                    if (window.DHGameLoader && typeof window.DHGameLoader.showError === 'function') {
                        window.DHGameLoader.showError(error.message || 'Failed to initialize game. Check console for details.');
                    } else {
                        // Fallback error display
                        const errorOverlay = document.getElementById('gameErrorOverlay');
                        const errorMsg = document.getElementById('gameErrorMsg');
                        if (errorOverlay) {
                            errorOverlay.style.opacity = '1';
                            errorOverlay.style.pointerEvents = 'auto';
                        }
                        if (errorMsg) {
                            errorMsg.textContent = error.message || 'Failed to initialize game. Check console for details.';
                        }
                    }
                }
                return;
            }
            
            // Fallback to original implementation
            setTimeout(() => {
                const canvas = document.getElementById(canvasId);
                if (!canvas) {
                    console.warn(`[DHInit] Canvas "${canvasId}" not found in modal`);
                    const errorOverlay = document.getElementById('gameErrorOverlay');
                    const errorMsg = document.getElementById('gameErrorMsg');
                    if (errorOverlay) {
                        errorOverlay.style.opacity = '1';
                        errorOverlay.style.pointerEvents = 'auto';
                    }
                    if (errorMsg) {
                        errorMsg.textContent = `Canvas "${canvasId}" not found in modal.`;
                    }
                    return;
                }
                
                try {
                    if (!window.survivalGame) {
                        window.survivalGame = new SurvivalGame(canvasId);
                        console.log('[DHInit] Survival game initialized');
                        
                        // Dispatch game ready event for loading system
                        window.dispatchEvent(new Event('gameReady'));
                    }
                    
                    // Ensure canvas is properly sized
                    if (window.survivalGame && window.survivalGame.setupCanvas) {
                        window.survivalGame.setupCanvas();
                    }
                    
                    // Focus canvas after initialization
                    setTimeout(() => {
                        canvas.focus();
                    }, 100);
                } catch (error) {
                    console.error('[DHInit] Error initializing game:', error);
                    const errorOverlay = document.getElementById('gameErrorOverlay');
                    const errorMsg = document.getElementById('gameErrorMsg');
                    if (errorOverlay) {
                        errorOverlay.style.opacity = '1';
                        errorOverlay.style.pointerEvents = 'auto';
                    }
                    if (errorMsg) {
                        errorMsg.textContent = error.message || 'Failed to initialize game. Check console for details.';
                    }
                }
            }, 200);
        };
        
        // HTML5 <dialog> elements don't fire 'open' or 'show' events natively
        // Use MutationObserver to watch for open attribute changes
        let wasOpen = gameModal.open;
        const observer = new MutationObserver(() => {
            const isOpen = gameModal.open;
            if (isOpen && !wasOpen) {
                // Modal just opened
                initializeGameOnModalOpen();
            }
            wasOpen = isOpen;
        });
        
        // Observe open attribute changes
        observer.observe(gameModal, {
            attributes: true,
            attributeFilter: ['open']
        });
        
        // Also listen for 'close' event as backup (fires when dialog closes)
        gameModal.addEventListener('close', () => {
            // Reset state when modal closes
            wasOpen = false;
        });
        
        // Hook into showModal() method to catch programmatic opens
        const originalShowModal = gameModal.showModal.bind(gameModal);
        gameModal.showModal = function() {
            originalShowModal();
            // Small delay to ensure modal is fully rendered
            setTimeout(initializeGameOnModalOpen, 100);
        };
        
        // Also initialize if modal is already open
        if (gameModal.open) {
            initializeGameOnModalOpen();
        }
    };
    
    /**
     * Initialize power-up buttons (prevents duplicate event listeners)
     * @param {Object} options
     */
    DHInit.initPowerups = function(options = {}) {
        if (window.DHInit.powerupsInitialized) {
            return;
        }
        
        document.querySelectorAll('[data-type]').forEach(btn => {
            if (btn.id && btn.id.startsWith('powerup')) {
                // Remove existing listeners if any
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', function() {
                    const type = this.getAttribute('data-type');
                    if (window.game && typeof window.game.activatePowerup === 'function') {
                        window.game.activatePowerup(type);
                    }
                });
            }
        });
        
        window.DHInit.powerupsInitialized = true;
    };
    
    /**
     * Initialize animation libraries (GSAP, Anime.js)
     * Prevents duplicate plugin registration
     */
    DHInit.initAnimations = function() {
        if (state.animationsInitialized) {
            return;
        }
        
        // Register GSAP ScrollTrigger plugin (must be called once)
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !state.gsapRegistered) {
            try {
                gsap.registerPlugin(ScrollTrigger);
                state.gsapRegistered = true;
            } catch (e) {
                console.warn('DHInit: Failed to register ScrollTrigger plugin:', e);
            }
        }
        
        // Check if anime is available (for future use)
        if (typeof anime !== 'undefined') {
            // Anime.js is ready - no initialization needed
        }
        
        state.animationsInitialized = true;
        
        // Dispatch event for components that need animations
        window.dispatchEvent(new Event('animationsReady'));
    };
    
    /**
     * Check if reduced motion is preferred (accessibility)
     * @returns {boolean}
     */
    DHInit.prefersReducedMotion = function() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };
    
    /**
     * Initialize common page components
     * @param {Object} options
     * @returns {Promise} Promise that resolves when initialization is complete
     */
    DHInit.initPage = function(options = {}) {
        options = Object.assign({
            loadThreeJS: true,
            loadGamification: true,
            initTheme: true,
            initPowerups: false,
            initAnimations: true,
            markStylesLoaded: true
        }, options);
        
        // Return a Promise to allow chaining
        return new Promise((resolve, reject) => {
            try {
                // Mark styles as loaded
                if (options.markStylesLoaded) {
                    if (document.readyState === 'complete') {
                        DHInit.markStylesLoaded();
                    } else {
                        window.addEventListener('load', DHInit.markStylesLoaded);
                    }
                }
                
                // Initialize animation libraries first (GSAP, Anime.js)
                // Must wait for libraries to be loaded (they're in <script> tags)
                if (options.initAnimations) {
                    function tryInitAnimations() {
                        // Check if libraries are available
                        if (typeof gsap !== 'undefined' || typeof anime !== 'undefined') {
                            DHInit.initAnimations();
                        } else {
                            // Libraries not loaded yet, retry
                            setTimeout(tryInitAnimations, 50);
                        }
                    }
                    
                    // Start checking after DOM is ready
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                            setTimeout(tryInitAnimations, 100);
                        });
                    } else {
                        setTimeout(tryInitAnimations, 100);
                    }
                }
                
                // Build promise chain for async operations
                const promises = [];
                
                // Load Three.js
                if (options.loadThreeJS) {
                    const threeJSPromise = new Promise((threeResolve) => {
                        const loadThree = () => {
                            DHInit.loadThreeJS().then(threeResolve).catch(threeResolve);
                        };
                        
                        if (document.readyState === 'complete') {
                            loadThree();
                        } else {
                            window.addEventListener('load', () => {
                                setTimeout(loadThree, 500);
                            }, { once: true });
                        }
                    });
                    promises.push(threeJSPromise);
                }
                
                // Load gamification
                if (options.loadGamification) {
                    const gamificationPromise = DHInit.loadGamification().then(() => {
                        // Load gamification effects after gamification is ready
                        return new Promise((effectsResolve) => {
                            if (typeof window.DHGameEffects === 'undefined') {
                                const effectsScript = document.createElement('script');
                                effectsScript.src = withPrefix('js/gamification-effects.js');
                                effectsScript.onload = () => {
                                    const ensurePresentationEffects = () => new Promise((presentationResolve) => {
                                        if (typeof window.PresentationEffects !== 'undefined') {
                                            presentationResolve();
                                            return;
                                        }
                                        
                                        const presentationScript = document.createElement('script');
                                        presentationScript.src = withPrefix('js/presentation-effects.js');
                                        presentationScript.onload = () => presentationResolve();
                                        presentationScript.onerror = () => {
                                            console.warn('DHInit: Failed to load presentation-effects.js');
                                            presentationResolve();
                                        };
                                        document.body.appendChild(presentationScript);
                                    });
                                    
                                    ensurePresentationEffects().then(() => {
                                        // Load screen effects after presentation/gamification effects
                                        setTimeout(() => {
                                            if (typeof window.DHScreenEffects === 'undefined') {
                                                const screenEffectsScript = document.createElement('script');
                                                screenEffectsScript.src = withPrefix('js/screen-effects.js');
                                                screenEffectsScript.onload = () => {
                                                    if (options.initPowerups) {
                                                        DHInit.initPowerups();
                                                    }
                                                    effectsResolve();
                                                };
                                                screenEffectsScript.onerror = () => {
                                                    console.warn('DHInit: Failed to load screen-effects.js');
                                                    effectsResolve();
                                                };
                                                document.body.appendChild(screenEffectsScript);
                                            } else {
                                                if (options.initPowerups) {
                                                    DHInit.initPowerups();
                                                }
                                                effectsResolve();
                                            }
                                        }, 300);
                                    });
                                };
                                effectsScript.onerror = () => {
                                    console.warn('DHInit: Failed to load gamification-effects.js');
                                    effectsResolve();
                                };
                                document.body.appendChild(effectsScript);
                            } else {
                                if (options.initPowerups) {
                                    DHInit.initPowerups();
                                }
                                effectsResolve();
                            }
                        });
                    }).catch(err => {
                        console.warn('DHInit: Gamification failed to load:', err);
                    });
                    promises.push(gamificationPromise);
                }
                
                // Initialize theme controller (synchronous)
                if (options.initTheme) {
                    DHInit.initThemeController();
                }
                
                // Resolve when all async operations complete
                if (promises.length > 0) {
                    Promise.all(promises).then(() => resolve()).catch(err => {
                        console.warn('DHInit: Some initialization failed:', err);
                        resolve(); // Resolve anyway to not block
                    });
                } else {
                    // No async operations, resolve immediately
                    resolve();
                }
            } catch (error) {
                console.error('DHInit: Initialization error:', error);
                reject(error);
            }
        });
    };
    
    // Auto-mark styles as loaded when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', DHInit.markStylesLoaded);
    } else {
        DHInit.markStylesLoaded();
    }
    
})();
