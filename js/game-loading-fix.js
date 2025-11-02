/**
 * Game Loading Fix
 * DRY principles: Centralized game loading with proper error handling
 * Fixes timing issues and provides better loading feedback
 */

(function() {
    'use strict';
    
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
            const alert = window.DHUI.createAlert({
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
    GameLoader.initGame = async function(canvasId = 'demo-canvas', options = {}) {
        try {
            GameLoader.showLoading();
            GameLoader.updateProgress(10, 'Checking dependencies...');
            
            // Step 1: Check CONFIG
            await new Promise((resolve) => {
                const checkConfig = () => {
                    if (window.CONFIG_READY || window.CONFIG) {
                        loadingState.config = true;
                        GameLoader.updateProgress(20, 'Configuration loaded');
                        resolve();
                    } else {
                        setTimeout(checkConfig, 100);
                    }
                };
                
                // Timeout after 2 seconds
                setTimeout(() => {
                    if (!loadingState.config) {
                        throw new Error('CONFIG not loaded');
                    }
                }, 2000);
                
                checkConfig();
            });
            
            // Step 2: Wait for game modules
            GameLoader.updateProgress(30, 'Loading game modules...');
            await new Promise((resolve, reject) => {
                const checkModules = () => {
                    if (typeof GameEngine !== 'undefined' && 
                        typeof GameRenderer !== 'undefined' && 
                        typeof ParticleSystem !== 'undefined') {
                        loadingState.modules = true;
                        GameLoader.updateProgress(50, 'Game modules loaded');
                        resolve();
                    } else {
                        setTimeout(checkModules, 100);
                    }
                };
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    if (!loadingState.modules) {
                        reject(new Error('Game modules not loaded'));
                    }
                }, 5000);
                
                checkModules();
            });
            
            // Step 3: Wait for SurvivalGame class
            GameLoader.updateProgress(60, 'Initializing game engine...');
            await new Promise((resolve, reject) => {
                const checkSurvivalGame = () => {
                    if (typeof SurvivalGame !== 'undefined') {
                        loadingState.engine = true;
                        GameLoader.updateProgress(70, 'Game engine ready');
                        resolve();
                    } else {
                        setTimeout(checkSurvivalGame, 100);
                    }
                };
                
                setTimeout(() => {
                    if (!loadingState.engine) {
                        reject(new Error('SurvivalGame class not available'));
                    }
                }, 5000);
                
                checkSurvivalGame();
            });
            
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
                window.survivalGame = new SurvivalGame(canvasId);
                
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
