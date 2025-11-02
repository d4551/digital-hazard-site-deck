/**
 * Game Loader
 * Centralized game module loading with proper error handling
 * Loads game modules dynamically and initializes game instances
 */

(function() {
    'use strict';
    
    const assetPrefix = (typeof window !== 'undefined' && window.DH_ASSET_PREFIX) || '';
    const withPrefix = (path) => /^(?:https?:)?\/\//.test(path) ? path : assetPrefix + path;
    
    if (!window.DHGameLoader) {
        window.DHGameLoader = {};
    }
    
    const GameLoader = window.DHGameLoader;
    
    let loadingState = {
        config: false,
        modules: false,
        engine: false,
        renderer: false,
        particles: false,
        ready: false
    };
    
    /**
     * Show loading state in modal
     */
    GameLoader.showLoading = function(overlayId = 'gameLoadingOverlay') {
        const overlay = document.getElementById(overlayId);
        if (overlay && window.DHUI && window.DHUI.createLoading) {
            // Use shared utilities for consistent loading display
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        } else if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        }
        
        // Show spinner in header
        const spinner = document.getElementById('gameLoadingSpinner');
        if (spinner) {
            spinner.classList.remove('opacity-0');
        }
        
        // Hide click hint
        const clickHint = document.getElementById('gameClickHint');
        if (clickHint) {
            clickHint.style.opacity = '0';
            clickHint.style.pointerEvents = 'none';
        }
    };
    
    /**
     * Hide loading state
     */
    GameLoader.hideLoading = function(overlayId = 'gameLoadingOverlay') {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }
        
        const spinner = document.getElementById('gameLoadingSpinner');
        if (spinner) {
            spinner.classList.add('opacity-0');
        }
    };
    
    /**
     * Show error state
     */
    GameLoader.showError = function(message, overlayId = 'gameErrorOverlay') {
        GameLoader.hideLoading();
        
        const overlay = document.getElementById(overlayId);
        if (overlay && window.DHUI && window.DHUI.createAlert) {
            // Use shared alert utility
            window.DHUI.createAlert({
                message: message || 'Unable to initialize game engine. Please refresh the page.',
                variant: 'error',
                title: 'Game Failed to Load',
                dismissible: true
            });
            
            // Update or create error message
            let errorMsg = document.getElementById('gameErrorMsg');
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.id = 'gameErrorMsg';
                errorMsg.className = 'text-xs';
            }
            errorMsg.textContent = message || 'Unable to initialize game engine. Please refresh the page.';
            
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        } else if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            const errorMsg = document.getElementById('gameErrorMsg');
            if (errorMsg) {
                errorMsg.textContent = message || 'Unable to initialize game engine. Please refresh the page.';
            }
        }
    };
    
    /**
     * Update loading progress
     */
    GameLoader.updateProgress = function(percent, message = '') {
        const progress = document.getElementById('gameInitProgress');
        if (progress) {
            progress.value = percent;
        }
        
        const loadingMessage = document.querySelector('#gameLoadingOverlay p');
        if (loadingMessage && message) {
            loadingMessage.textContent = message;
        }
    };
    
    /**
     * Initialize game with proper loading sequence
     */
    GameLoader.initGame = async function(canvasId = 'demo-canvas') {
        try {
            GameLoader.showLoading();
            GameLoader.updateProgress(10, 'Checking dependencies...');
            
            // Step 1: Check CONFIG
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    if (!loadingState.config) {
                        reject(new Error('CONFIG not loaded'));
                    }
                }, 2000);
                const checkConfig = () => {
                    if (window.CONFIG_READY || window.CONFIG) {
                        loadingState.config = true;
                        clearTimeout(timeoutId);
                        GameLoader.updateProgress(20, 'Configuration loaded');
                        resolve();
                    } else {
                        setTimeout(checkConfig, 100);
                    }
                };
                checkConfig();
            });
            
            // Step 2: Load game modules if not already loaded
            GameLoader.updateProgress(30, 'Loading game modules...');
            
            // Expected class mappings
            const classMap = {
                [withPrefix('js/game-engine.js')]: 'GameEngine',
                [withPrefix('js/particle-system.js')]: 'ParticleSystem',
                [withPrefix('js/game-renderer.js')]: 'GameRenderer',
                [withPrefix('js/game.js')]: 'SurvivalGame'
            };
            
            // Check which classes are missing
            const checkClasses = () => {
                return {
                    GameEngine: typeof GameEngine !== 'undefined' || typeof window.GameEngine !== 'undefined',
                    GameRenderer: typeof GameRenderer !== 'undefined' || typeof window.GameRenderer !== 'undefined',
                    ParticleSystem: typeof ParticleSystem !== 'undefined' || typeof window.ParticleSystem !== 'undefined',
                    SurvivalGame: typeof SurvivalGame !== 'undefined' || typeof window.SurvivalGame !== 'undefined'
                };
            };
            
            const classStatus = checkClasses();
            const missingClasses = Object.keys(classStatus).filter(cls => !classStatus[cls]);
            
            if (missingClasses.length > 0) {
                console.log(`[GameLoader] Missing classes: ${missingClasses.join(', ')}. Loading modules...`);
                
                // Prevent duplicate loading - check if init-shared.js already loaded modules
                if (window.DHInit && window.DHInit.gameModulesLoaded) {
                    console.log('[GameLoader] Game modules already loaded by init-shared.js, skipping');
                    GameLoader.updateProgress(50, 'Game modules already loaded');
                } else {
                    // Load game modules dynamically
                    const modules = [
                        withPrefix('js/audio-engine.js'),
                        withPrefix('js/game-engine.js'),
                        withPrefix('js/particle-system.js'),
                        withPrefix('js/game-renderer.js'),
                        withPrefix('js/game.js')
                    ];
                    
                    const loadResults = await Promise.all(modules.map(src => {
                        return new Promise((resolve, reject) => {
                            // Check if script already loaded
                            const existing = document.querySelector(`script[src="${src}"]`);
                            if (existing) {
                                // Script already loaded, check if the class it provides exists
                                const expectedClass = classMap[src];
                                if (expectedClass && (typeof window[expectedClass] !== 'undefined')) {
                                    console.log(`[GameLoader] ✓ ${expectedClass} already loaded from ${src}`);
                                    resolve({ src, success: true, class: expectedClass });
                                    return;
                                }
                                // Script tag exists but class not ready yet, wait a bit
                                setTimeout(() => {
                                    const isDefined = expectedClass ? typeof window[expectedClass] !== 'undefined' : true;
                                    resolve({ src, success: isDefined, class: expectedClass, warning: !isDefined });
                                }, 100);
                                return;
                            }
                            
                            const script = document.createElement('script');
                            script.src = src;
                            script.onload = () => {
                                // Give script time to execute and define classes
                                setTimeout(() => {
                                    const expectedClass = classMap[src];
                                    const isDefined = expectedClass ? typeof window[expectedClass] !== 'undefined' : true;
                                    if (expectedClass && isDefined) {
                                        console.log(`[GameLoader] ✓ Loaded ${expectedClass} from ${src}`);
                                    } else if (expectedClass && !isDefined) {
                                        console.warn(`[GameLoader] ⚠ Script ${src} loaded but class ${expectedClass} not found`);
                                    }
                                    resolve({ src, success: true, class: expectedClass, defined: isDefined });
                                }, 100);
                            };
                            script.onerror = () => {
                                console.error(`[GameLoader] ✗ Failed to load ${src}`);
                                reject(new Error(`Failed to load ${src}. Check browser console for syntax errors.`));
                            };
                            document.body.appendChild(script);
                        });
                    })).catch(error => {
                        console.error('[GameLoader] Error loading game modules:', error);
                        throw error;
                    });
                    
                    // Verify all classes are now available
                    const finalStatus = checkClasses();
                    const stillMissing = Object.keys(finalStatus).filter(cls => !finalStatus[cls]);
                    
                    if (stillMissing.length > 0) {
                        const errorMsg = `[GameLoader] Failed to load required classes: ${stillMissing.join(', ')}`;
                        console.error(errorMsg);
                        console.error('[GameLoader] Load results:', loadResults);
                        console.error('[GameLoader] Available game-related globals:', 
                            Object.keys(window).filter(k => k.includes('Game') || k.includes('Particle')).join(', '));
                        throw new Error(errorMsg);
                    }
                    
                    GameLoader.updateProgress(50, 'Game modules loaded');
                }
            } else {
                GameLoader.updateProgress(50, 'Game modules already loaded');
            }
            
            // Step 3: Wait for SurvivalGame class (after modules load)
            GameLoader.updateProgress(60, 'Initializing game engine...');
            
            // Verify all required classes one more time
            const finalCheck = checkClasses();
            const missing = Object.keys(finalCheck).filter(cls => !finalCheck[cls]);
            
            if (missing.length > 0) {
                throw new Error(`Required game classes missing: ${missing.join(', ')}`);
            }
            
            // Check both global and window scope
            const SurvivalGameClass = typeof SurvivalGame !== 'undefined' ? SurvivalGame : window.SurvivalGame;
            
            if (typeof SurvivalGameClass === 'undefined') {
                console.error('[GameLoader] SurvivalGame class not found after loading.');
                console.error('[GameLoader] Available globals:', Object.keys(window).filter(k => k.includes('Game')));
                throw new Error('SurvivalGame class not available - game.js may not have loaded or exported correctly');
            }
            
            console.log('[GameLoader] ✓ All game classes verified: GameEngine, GameRenderer, ParticleSystem, SurvivalGame');
            
            // Make sure it's accessible globally
            if (typeof SurvivalGame === 'undefined' && typeof window.SurvivalGame !== 'undefined') {
                window.SurvivalGame = SurvivalGameClass;
            }
            
            loadingState.engine = true;
            GameLoader.updateProgress(70, 'Game engine ready');
            
            // Step 4: Get canvas and initialize game
            GameLoader.updateProgress(80, 'Setting up canvas...');
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas "${canvasId}" not found`);
            }
            
            // Wait for modal to be visible (if in modal)
            if (canvas.closest('.modal')) {
                const modal = canvas.closest('.modal');
                if (!modal.open) {
                    // Wait for modal to open
                    await new Promise((resolve) => {
                        const checkModal = () => {
                            if (modal.open) {
                                resolve();
                            } else {
                                setTimeout(checkModal, 100);
                            }
                        };
                        checkModal();
                    });
                    
                    // Small delay for modal animation
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            // Step 5: Initialize game instance
            if (!window.survivalGame) {
                GameLoader.updateProgress(90, 'Creating game instance...');
                const SurvivalGameClass = typeof SurvivalGame !== 'undefined' ? SurvivalGame : window.SurvivalGame;
                if (!SurvivalGameClass) {
                    throw new Error('SurvivalGame class not available for instantiation');
                }
                window.survivalGame = new SurvivalGameClass(canvasId);
                
                // Wait for game to be ready
                await new Promise((resolve) => {
                    const checkReady = () => {
                        if (window.survivalGame && window.survivalGame.engine) {
                            loadingState.ready = true;
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    
                    setTimeout(checkReady, 0);
                });
            }
            
            // Step 6: Setup canvas properly
            if (window.survivalGame && window.survivalGame.setupCanvas) {
                GameLoader.updateProgress(95, 'Finalizing setup...');
                window.survivalGame.setupCanvas();
                
                // Ensure canvas is focused
                setTimeout(() => {
                    canvas.focus();
                }, 100);
            }
            
            // Complete
            GameLoader.updateProgress(100, 'Ready!');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            GameLoader.hideLoading();
            
            // Show click hint if game is in menu state
            const clickHint = document.getElementById('gameClickHint');
            if (clickHint && window.survivalGame && 
                (!window.survivalGame.engine || window.survivalGame.engine.state === 'menu')) {
                clickHint.style.opacity = '1';
                clickHint.style.pointerEvents = 'auto';
            }
            
            // Dispatch ready event
            window.dispatchEvent(new Event('gameReady'));
            
            return window.survivalGame;
            
        } catch (error) {
            console.error('GameLoader: Initialization failed:', error);
            GameLoader.showError(error.message || 'Failed to initialize game');
            throw error;
        }
    };
    
    /**
     * Check if game is ready
     */
    GameLoader.isReady = function() {
        return loadingState.ready && window.survivalGame && window.survivalGame.engine;
    };
    
    /**
     * Reset loading state
     */
    GameLoader.reset = function() {
        loadingState = {
            config: false,
            modules: false,
            engine: false,
            renderer: false,
            particles: false,
            ready: false
        };
        GameLoader.hideLoading();
    };
    
    window.DHGameLoader = GameLoader;
})();
