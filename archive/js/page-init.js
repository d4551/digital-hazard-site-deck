// Page-specific initialization for index.html
// Handles gamification hooks, theme controller, powerups, and game modules

(function() {
    'use strict';

    const loaderReady = window.DHInitLoaderReady instanceof Promise
        ? window.DHInitLoaderReady
        : Promise.resolve();

    loaderReady.then(() => waitForDHInit());

    function waitForDHInit(attempt = 0) {
        if (window.DHInit && typeof window.DHInit.initPage === 'function') {
            Promise.resolve(
                window.DHInit.initPage({
                    loadThreeJS: true,
                    loadGamification: true,
                    initTheme: false, // Theme controller initialized after state restoration
                    initPowerups: false,
                    markStylesLoaded: true
                })
            ).then(handleSharedInit);
            return;
        }

        if (attempt < 50) {
            setTimeout(() => waitForDHInit(attempt + 1), 100);
        } else {
            console.warn('[DHInit] initPage not available on index.html');
        }
    }

    function handleSharedInit() {
        setupGamificationHooks();
        initializeThemeController();
        wirePowerupButtons();
        scheduleGameModules();
    }

    function setupGamificationHooks() {
        if (window.game && typeof window.game.addPoints === 'function') {
            console.log('[DHInit] Gamification system ready');
            return;
        }

        window.addEventListener('gamificationReady', () => {
            console.log('[DHInit] Gamification system initialized');
        }, { once: true });
    }

    function initializeThemeController() {
        if (window.DHInit && typeof window.DHInit.initThemeController === 'function') {
            window.DHInit.initThemeController();
        }

        if (window.DHInit && typeof window.DHInit.waitForConfig === 'function') {
            window.DHInit.waitForConfig(() => {
                if (!window.Storage) {
                    return;
                }

                const savedTheme =
                    window.Storage.get('dhTheme', 'hazard') ||
                    (typeof localStorage !== 'undefined' ? localStorage.getItem('dhTheme') : null) ||
                    'hazard';

                if (!savedTheme) {
                    return;
                }

                document
                    .querySelectorAll(`input[name="theme-dropdown"][value="${savedTheme}"]`)
                    .forEach(input => {
                        input.checked = true;
                    });
            });
        }
    }

    function scheduleGameModules() {
        if (!(window.DHInit && typeof window.DHInit.waitForConfig === 'function')) {
            return;
        }

        window.DHInit.waitForConfig(() => {
            if (typeof window.DHInit.loadGameModules !== 'function') {
                return;
            }

            window.DHInit.loadGameModules()
                .then(() => {
                    if (typeof window.DHInit.initGameInModal === 'function') {
                        window.DHInit.initGameInModal({
                            modalId: 'gameModal',
                            canvasId: 'demo-canvas'
                        });
                    }
                })
                .catch(err => {
                    console.error('[Game Load] Failed to load game modules:', err);
                });
        });
    }

    function wirePowerupButtons() {
        const buttons = document.querySelectorAll('[data-type]');
        if (!buttons.length) {
            return;
        }

        buttons.forEach(btn => {
            if (btn.id && btn.id.startsWith('powerup')) {
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
    }

    // Game Canvas Overlay Handler
    function initGameOverlay() {
        // Hide game overlay when game starts or canvas is clicked
        function hideGameOverlay() {
            const overlay = document.getElementById('gameClickHint');
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }
        }
        
        // Hide overlay on canvas click
        const canvas = document.getElementById('demo-canvas');
        const overlay = document.getElementById('gameClickHint');
        
        if (canvas && overlay) {
            // Hide on canvas click
            canvas.addEventListener('click', hideGameOverlay, { once: true });
            canvas.addEventListener('touchstart', hideGameOverlay, { once: true });
            
            // Hide on overlay click
            overlay.addEventListener('click', hideGameOverlay, { once: true });
            
            // Hide when game starts (check for game state changes)
            const checkGameStart = setInterval(() => {
                if (window.survivalGame && window.survivalGame.engine && window.survivalGame.engine.state === 'playing') {
                    hideGameOverlay();
                    clearInterval(checkGameStart);
                }
            }, 500);
            
            // Clean up after 30 seconds
            setTimeout(() => {
                clearInterval(checkGameStart);
            }, 30000);
        }
        
        // Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const animatedElements = document.querySelectorAll('.animate-bounce, .animate-pulse, .game-throw-in, .animate-bounce-horizontal, .animate-bounce-vertical');
            animatedElements.forEach(el => {
                el.style.animation = 'none';
            });
        }
    }

    // Initialize overlay handler when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGameOverlay);
    } else {
        initGameOverlay();
    }

    // Game Initialization Diagnostic Script
    function initGameDiagnostics() {
        /**
         * Diagnostic function to check game initialization status
         * Call window.checkGameStatus() in browser console for debugging
         */
        window.checkGameStatus = function() {
            const status = {
                timestamp: new Date().toISOString(),
                config: {
                    ready: typeof window.CONFIG !== 'undefined' && window.CONFIG_READY === true,
                    available: typeof window.CONFIG !== 'undefined'
                },
                classes: {
                    GameEngine: typeof window.GameEngine !== 'undefined',
                    GameRenderer: typeof window.GameRenderer !== 'undefined',
                    ParticleSystem: typeof window.ParticleSystem !== 'undefined',
                    SurvivalGame: typeof window.SurvivalGame !== 'undefined'
                },
                gameInstance: {
                    exists: typeof window.survivalGame !== 'undefined',
                    state: window.survivalGame?.engine?.state || 'N/A',
                    canvas: window.survivalGame?.canvas ? 'Found' : 'Missing'
                },
                modules: {
                    loaded: window.DHInit?.gameModulesLoaded || false,
                    initReady: typeof window.DHInit !== 'undefined'
                },
                canvas: {
                    element: document.getElementById('demo-canvas') ? 'Found' : 'Missing',
                    width: document.getElementById('demo-canvas')?.width || 0,
                    height: document.getElementById('demo-canvas')?.height || 0
                },
                modal: {
                    element: document.getElementById('gameModal') ? 'Found' : 'Missing',
                    open: document.getElementById('gameModal')?.open || false
                }
            };
            
            console.log('=== Game Initialization Status ===');
            console.table(status);
            
            // Check for issues
            const issues = [];
            if (!status.config.ready) issues.push('CONFIG not ready');
            if (!status.classes.GameEngine) issues.push('GameEngine class missing');
            if (!status.classes.SurvivalGame) issues.push('SurvivalGame class missing');
            if (!status.modules.loaded) issues.push('Game modules not loaded');
            if (status.canvas.element === 'Missing') issues.push('Canvas element missing');
            if (status.modal.element === 'Missing') issues.push('Modal element missing');
            
            if (issues.length > 0) {
                console.warn('⚠️  Issues detected:', issues);
            } else {
                console.log('✅ All checks passed');
            }
            
            return status;
        };
        
        // Monitor game modal for initialization
        const gameModal = document.getElementById('gameModal');
        if (gameModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
                        if (gameModal.open) {
                            // Modal opened - check game status after a short delay
                            setTimeout(() => {
                                window.checkGameStatus();
                            }, 500);
                        }
                    }
                });
            });
            
            observer.observe(gameModal, { attributes: true, attributeFilter: ['open'] });
        }
        
        // Also expose diagnostic on window for manual checks
        console.log('💡 Game diagnostic available: Call window.checkGameStatus() to check game initialization status');
    }

    // Initialize diagnostics when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGameDiagnostics);
    } else {
        initGameDiagnostics();
    }
})();


