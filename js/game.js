// Main Game Controller - Orchestrates engine, renderer, and particles
// Uses config.js for constants and utils.js for helpers

(function() {
    'use strict';
    
    const POWERUP_ICON_MAP = {
        rapidfire: { icon: 'fas fa-bolt', color: 'rgba(250, 204, 21, 0.95)', label: 'Rapid Fire' },
        spreadshot: { icon: 'fas fa-wand-magic-sparkles', color: 'rgba(251, 191, 36, 0.95)', label: 'Spread Shot' },
        explosive: { icon: 'fas fa-bomb', color: 'rgba(248, 113, 113, 0.95)', label: 'Explosive' },
        multiplier: { icon: 'fas fa-star', color: 'rgba(34, 197, 94, 0.95)', label: 'Multiplier' },
        shield: { icon: 'fas fa-shield-halved', color: 'rgba(14, 165, 233, 0.95)', label: 'Shield' },
        speed: { icon: 'fas fa-forward-fast', color: 'rgba(59, 130, 246, 0.95)', label: 'Speed' },
        health: { icon: 'fas fa-heart-pulse', color: 'rgba(239, 68, 68, 0.95)', label: 'Health' },
        frenzy: { icon: 'fas fa-fire-flame-curved', color: 'rgba(248, 113, 113, 0.95)', label: 'Frenzy' },
        pierce: { icon: 'fas fa-arrow-right', color: 'rgba(139, 92, 246, 0.95)', label: 'Pierce' },
        regen: { icon: 'fas fa-plus-circle', color: 'rgba(16, 185, 129, 0.95)', label: 'Regen' },
        doubleDamage: { icon: 'fas fa-sword', color: 'rgba(245, 158, 11, 0.95)', label: '2x Damage' },
        freeze: { icon: 'fas fa-snowflake', color: 'rgba(6, 182, 212, 0.95)', label: 'Freeze' },
        magnet: { icon: 'fas fa-magnet', color: 'rgba(236, 72, 153, 0.95)', label: 'Magnet' },
        godmode: { icon: 'fas fa-crown', color: 'rgba(255, 215, 0, 0.95)', label: 'God Mode' }
    };
    
    // Cache DOM queries
    const cachedQueries = new Map();
    
    function getCached(selector) {
        if (!cachedQueries.has(selector)) {
            const element = document.querySelector(selector);
            if (element) cachedQueries.set(selector, element);
        }
        return cachedQueries.get(selector);
    }
    
    class SurvivalGame {
        constructor(canvasId) {
            try {
                this.canvas = getCached(`#${canvasId}`) || document.getElementById(canvasId);
                if (!this.canvas) {
                    console.warn(`SurvivalGame: Canvas "${canvasId}" not found`);
                    return;
                }
                
                this.ctx = this.canvas.getContext('2d');
                if (!this.ctx) {
                    console.error('SurvivalGame: Canvas 2D context not available');
                    return;
                }
                
                this.animationFrameId = null;
                this.setupCanvas();
                
                // Initialize subsystems (separation of concerns)
                this.engine = new GameEngine({
                    canvas: { width: this.canvas.width, height: this.canvas.height }
                });
                this.particles = new ParticleSystem();
                this.renderer = new GameRenderer(this.canvas, this.ctx);
                
                // Controls
                this.keys = {};
                this.mouse = { x: 0, y: 0, down: false };
                
                // Timing
                this.lastFrame = 0;
                
                // Performance monitoring
                this.performance = {
                    fps: 60,
                    frameCount: 0,
                    lastFpsUpdate: 0,
                    fpsHistory: [],
                    qualityLevel: 'high', // 'high', 'medium', 'low'
                    targetFPS: 60,
                    minFPS: 45
                };
                
                this.init();
            } catch (error) {
                console.error('SurvivalGame: Initialization error', error);
            }
        }
        
        setupCanvas() {
            const resize = () => {
                // Get actual displayed size, fallback to reasonable defaults
                const container = this.canvas.parentElement;
                let width = 800;
                let height = 400;
                
                // Try to get actual size from container or canvas
                if (this.canvas.offsetWidth > 0) {
                    width = this.canvas.offsetWidth;
                } else if (container && container.offsetWidth > 0) {
                    width = Math.min(container.offsetWidth - 32, 1200); // Account for padding
                }
                
                if (this.canvas.offsetHeight > 0) {
                    height = this.canvas.offsetHeight;
                } else if (container && container.offsetHeight > 0) {
                    height = Math.min(container.offsetHeight - 200, 800); // Account for header/controls
                }
                
                // Set canvas size with proper pixel ratio
                const dpr = window.devicePixelRatio || 1;
                this.canvas.width = width * dpr;
                this.canvas.height = height * dpr;
                
                // Scale context for high DPI displays
                if (this.ctx) {
                    this.ctx.scale(dpr, dpr);
                }
                
                // Set CSS size to maintain aspect
                this.canvas.style.width = width + 'px';
                this.canvas.style.height = height + 'px';
                
                // Make canvas background transparent
                this.canvas.style.background = 'transparent';
                
                // Update engine canvas dimensions if engine exists
                if (this.engine) {
                    this.engine.canvas = { width: width, height: height };
                }
                
                // Force bounding rect update for mouse calculations
                if (this.canvas._boundingRectCache) {
                    delete this.canvas._boundingRectCache;
                }
            };
            
            resize();
            
            // Use ResizeObserver if available for better performance
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    resize();
                });
                this.resizeObserver.observe(this.canvas);
                if (this.canvas.parentElement) {
                    this.resizeObserver.observe(this.canvas.parentElement);
                }
            } else {
                window.addEventListener('resize', resize);
                // Also check when modal opens
                const gameModal = document.getElementById('gameModal');
                if (gameModal) {
                    gameModal.addEventListener('show', () => {
                        setTimeout(resize, 100);
                    });
                }
            }
        }
        
        init() {
            if (!this.canvas || !this.engine) {
                console.error('SurvivalGame: Cannot initialize - missing dependencies');
                return;
            }
            
            try {
                // Event listeners - use event delegation where possible
                // Keyboard navigation with accessibility
                this.canvas.setAttribute('tabindex', '0');
                this.canvas.setAttribute('role', 'application');
                this.canvas.setAttribute('aria-label', 'Survival game - Use WASD or arrow keys to move');
                
                // Store modal reference
                this.gameModal = document.getElementById('gameModal');
                
                // Helper to check if game should receive input
                const shouldHandleInput = () => {
                    const isModalOpen = this.gameModal && this.gameModal.open;
                    const isCanvasFocused = document.activeElement === this.canvas;
                    const isGameActive = this.engine.state !== 'menu' && this.engine.state !== 'gameover';
                    
                    return isModalOpen || isCanvasFocused || isGameActive;
                };
                
                // Keyboard event handler with proper error handling
                const keydownHandler = (e) => {
                    if (!shouldHandleInput()) {
                        return;
                    }
                    
                    this.keys[e.code] = true;
                    
                    // SPACEBAR SHOOTING - Works in modal or when game is active
                    if (e.code === 'Space') {
                        e.preventDefault(); // Prevent page scroll
                        if (this.engine.state === 'menu') {
                            // Open modal if in menu
                            if (this.gameModal && typeof this.gameModal.showModal === 'function') {
                                this.gameModal.showModal();
                                // Start game when modal opens
                                setTimeout(() => {
                                    if (this.engine.state === 'menu') {
                                        this.startGame();
                                    }
                                }, 100);
                            } else {
                                this.startGame();
                            }
                            this.announceToScreenReader('Game started');
                        } else if (this.engine.state === 'playing') {
                            // SHOOT with spacebar - set shooting flag
                            this.spacebarDown = true;
                            // Fire immediately
                            if (this.mouse.x > 0 && this.mouse.y > 0) {
                                if (this.engine.shoot(this.mouse.x, this.mouse.y)) {
                                    if (window.audioEngine) {
                                        window.audioEngine.playSound('shoot');
                                    }
                                }
                            }
                        }
                    } else if (e.code === 'KeyP' && this.engine.state === 'playing') {
                        e.preventDefault();
                        this.engine.state = 'paused';
                        this.announceToScreenReader('Game paused');
                        this.flashStatus('Simulation paused', 'warning');
                    } else if (e.code === 'KeyP' && this.engine.state === 'paused') {
                        e.preventDefault();
                        this.engine.state = 'playing';
                        this.announceToScreenReader('Game resumed');
                        this.flashStatus('Simulation resumed', 'info');
                    } else if (e.code === 'KeyR' && this.engine.state === 'gameover') {
                        e.preventDefault();
                        this.restartGame();
                        this.announceToScreenReader('Game restarted');
                    } else if (e.code === 'Escape') {
                        // Close modals on ESC
                        if (this.engine.state === 'gameover') {
                            const modal = document.getElementById('gameOverModal');
                            if (modal && typeof modal.close === 'function') {
                                modal.close();
                                this.showMenu();
                            }
                        }
                        // Also close game modal if open (only if paused or menu)
                        if ((this.engine.state === 'menu' || this.engine.state === 'paused') && this.gameModal && this.gameModal.open) {
                            this.gameModal.close();
                        }
                    }
                };
                
                document.addEventListener('keydown', keydownHandler, { passive: false });
                
                document.addEventListener('keyup', (e) => {
                    this.keys[e.code] = false;
                    // Stop spacebar shooting
                    if (e.code === 'Space') {
                        this.spacebarDown = false;
                    }
                });
                
                // Cache bounding rect for performance with proper coordinate scaling
                let cachedRect = null;
                const updateRect = () => {
                    cachedRect = this.canvas.getBoundingClientRect();
                    // Cache it on canvas for access from other methods
                    this.canvas._boundingRectCache = cachedRect;
                };
                updateRect();
                
                // Recalculate rect on canvas size changes
                const recalcRect = () => {
                    cachedRect = null;
                    updateRect();
                };
                this.canvas.addEventListener('resize', recalcRect);
                
                // Helper to get mouse coordinates relative to canvas internal size
                const getCanvasCoords = (clientX, clientY) => {
                    if (!cachedRect) updateRect();
                    const dpr = window.devicePixelRatio || 1;
                    const x = ((clientX - cachedRect.left) / cachedRect.width) * (this.canvas.width / dpr);
                    const y = ((clientY - cachedRect.top) / cachedRect.height) * (this.canvas.height / dpr);
                    return { x, y };
                };
                
                this.canvas.addEventListener('mousemove', (e) => {
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    this.mouse.x = coords.x;
                    this.mouse.y = coords.y;
                }, { passive: true });
                
                this.canvas.addEventListener('mousedown', (e) => {
                    this.mouse.down = true;
                    if (this.engine.state === 'menu') {
                        this.startGame();
                    } else if (this.engine.state === 'playing') {
                        // Shoot on click with proper coordinates
                        const coords = getCanvasCoords(e.clientX, e.clientY);
                        if (this.engine.shoot(coords.x, coords.y)) {
                            if (window.audioEngine) {
                                window.audioEngine.playSound('shoot');
                            }
                        }
                    }
                });
                
                this.canvas.addEventListener('mouseup', () => {
                    this.mouse.down = false;
                });
                
                // Touch support for mobile devices with proper coordinate scaling
                let touchStartX = 0, touchStartY = 0;
                let touchActive = false;
                
                this.canvas.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const coords = getCanvasCoords(touch.clientX, touch.clientY);
                    touchStartX = coords.x;
                    touchStartY = coords.y;
                    touchActive = true;
                    
                    if (this.engine.state === 'menu') {
                        this.startGame();
                    } else if (this.engine.state === 'playing') {
                        this.mouse.down = true;
                        this.mouse.x = touchStartX;
                        this.mouse.y = touchStartY;
                        if (this.engine.shoot(touchStartX, touchStartY)) {
                            if (window.audioEngine) {
                                window.audioEngine.playSound('shoot');
                            }
                        }
                    }
                }, { passive: false });
                
                this.canvas.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (touchActive && e.touches.length > 0) {
                        const touch = e.touches[0];
                        const coords = getCanvasCoords(touch.clientX, touch.clientY);
                        this.mouse.x = coords.x;
                        this.mouse.y = coords.y;
                        this.mouse.down = true;
                    }
                }, { passive: false });
                
                this.canvas.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.mouse.down = false;
                    touchActive = false;
                }, { passive: false });
                
                // Gamepad support (optional enhancement)
                this.gamepadConnected = false;
                this.gamepadIndex = null;
                
                const checkGamepad = () => {
                    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                    for (let i = 0; i < gamepads.length; i++) {
                        if (gamepads[i] && gamepads[i].connected) {
                            this.gamepadIndex = i;
                            this.gamepadConnected = true;
                            break;
                        }
                    }
                };
                
                window.addEventListener('gamepadconnected', (e) => {
                    this.gamepadIndex = e.gamepad.index;
                    this.gamepadConnected = true;
                });
                
                window.addEventListener('gamepaddisconnected', () => {
                    this.gamepadConnected = false;
                    this.gamepadIndex = null;
                });
                
                // Check for gamepad periodically
                setInterval(() => {
                    if (this.gamepadConnected && this.engine.state === 'playing') {
                        checkGamepad();
                        const gamepad = navigator.getGamepads()[this.gamepadIndex];
                        if (gamepad) {
                            // Map gamepad to keys (left stick = WASD, A button = shoot)
                            const deadzone = 0.15;
                            const leftX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
                            const leftY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
                            
                            if (leftX < -deadzone) this.keys['KeyA'] = true;
                            else if (leftX > deadzone) this.keys['KeyD'] = true;
                            
                            if (leftY < -deadzone) this.keys['KeyW'] = true;
                            else if (leftY > deadzone) this.keys['KeyS'] = true;
                            
                            // A button (index 0) for shooting
                            if (gamepad.buttons[0].pressed && this.engine.player) {
                                const centerX = this.canvas.width / 2;
                                const centerY = this.canvas.height / 2;
                                // Shoot toward right direction (can be enhanced with right stick)
                                if (!this.lastGamepadShot || Date.now() - this.lastGamepadShot > 100) {
                                    if (this.engine.shoot(centerX + 50, centerY)) {
                                        if (window.audioEngine) {
                                            window.audioEngine.playSound('shoot');
                                        }
                                    }
                                    this.lastGamepadShot = Date.now();
                                }
                            }
                        }
                    }
                }, 16); // Check every frame
                
                // Store shoot interval for cleanup
                this.shootInterval = null;
                this.canvas.addEventListener('mousemove', (e) => {
                    if (!cachedRect) updateRect();
                    this.mouse.x = e.clientX - cachedRect.left;
                    this.mouse.y = e.clientY - cachedRect.top;
                }, { passive: true });
                
                // Update cached rect on resize
                const observer = new ResizeObserver(() => {
                    updateRect();
                });
                observer.observe(this.canvas);
                
                // Store observer for cleanup
                this.resizeObserver = observer;
                
                // Initialize spacebarDown
                this.spacebarDown = false;
                
                this.initHud();
                
                // Scroll prevention during gameplay - only when modal is open AND interacting with canvas
                if (window.CONFIG?.GAME?.SCROLL_PREVENTION_ENABLED) {
                    let isMouseOverCanvas = false;
                    let isTouchActive = false;
                    
                    // Track mouse position relative to canvas
                    const checkMousePosition = (e) => {
                        if (!this.canvas) return false;
                        const rect = this.canvas.getBoundingClientRect();
                        const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
                        const y = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
                        return (
                            x >= rect.left &&
                            x <= rect.right &&
                            y >= rect.top &&
                            y <= rect.bottom
                        );
                    };
                    
                    // Only prevent scroll when modal is open AND mouse is over canvas AND game is playing
                    const preventScroll = (e) => {
                        const gameModal = document.getElementById('gameModal');
                        const isModalOpen = gameModal && gameModal.open;
                        
                        if (isModalOpen && this.engine.state === 'playing') {
                            // Check if the event is actually over the canvas
                            const isOverCanvas = checkMousePosition(e);
                            
                            if (isOverCanvas) {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                            }
                            // Allow scrolling if not over canvas
                        }
                    };
                    
                    // Track mouse enter/leave for better detection
                    this.canvas.addEventListener('mouseenter', () => {
                        isMouseOverCanvas = true;
                        updateScrollLockIndicator();
                    });
                    
                    this.canvas.addEventListener('mouseleave', () => {
                        isMouseOverCanvas = false;
                        updateScrollLockIndicator();
                    });
                    
                    // Prevent scroll on wheel only when over canvas
                    this.canvas.addEventListener('wheel', preventScroll, { passive: false });
                    
                    // Touch scroll prevention - only when touch starts on canvas
                    this.canvas.addEventListener('touchstart', (e) => {
                        if (checkMousePosition(e)) {
                            isTouchActive = true;
                            updateScrollLockIndicator();
                        }
                    }, { passive: false });
                    
                    this.canvas.addEventListener('touchmove', (e) => {
                        if (isTouchActive && this.engine.state === 'playing') {
                            preventScroll(e);
                        }
                    }, { passive: false });
                    
                    this.canvas.addEventListener('touchend', () => {
                        isTouchActive = false;
                        updateScrollLockIndicator();
                    }, { passive: false });
                    
                    // Also prevent scroll on document level when modal is open AND mouse is over canvas (for edge cases)
                    const documentWheelHandler = (e) => {
                        const gameModal = document.getElementById('gameModal');
                        const isModalOpen = gameModal && gameModal.open;
                        
                        if (isModalOpen && this.engine.state === 'playing' && isMouseOverCanvas) {
                            const rect = this.canvas.getBoundingClientRect();
                            const x = e.clientX || 0;
                            const y = e.clientY || 0;
                            
                            // If mouse is still over canvas, prevent scroll
                            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                            }
                        }
                    };
                    
                    document.addEventListener('wheel', documentWheelHandler, { passive: false });
                    
                    // Scroll lock indicator - subtle visual feedback (only when modal is open)
                    const updateScrollLockIndicator = () => {
                        const gameModal = document.getElementById('gameModal');
                        const isModalOpen = gameModal && gameModal.open;
                        const container = this.canvas.closest('.demo-canvas-container') || this.canvas.parentElement;
                        
                        if (isModalOpen && this.engine.state === 'playing' && (isMouseOverCanvas || isTouchActive)) {
                            // Add subtle styling to canvas
                            if (container) {
                                container.classList.add('scroll-locked');
                                
                                // Create or update indicator element
                                let indicator = container.querySelector('.scroll-lock-indicator');
                                if (!indicator) {
                                    indicator = document.createElement('div');
                                    indicator.className = 'scroll-lock-indicator';
                                    indicator.innerHTML = '<i class="fas fa-lock" aria-hidden="true"></i><span>Scroll Locked</span>';
                                    indicator.setAttribute('aria-label', 'Scroll is locked while playing');
                                    container.appendChild(indicator);
                                }
                                // Use requestAnimationFrame for smooth fade in
                                requestAnimationFrame(() => {
                                    indicator.style.opacity = '1';
                                });
                            }
                        } else {
                            // Remove indicator and styling
                            if (container) {
                                container.classList.remove('scroll-locked');
                                const indicator = container.querySelector('.scroll-lock-indicator');
                                if (indicator) {
                                    indicator.style.opacity = '0';
                                    setTimeout(() => {
                                        if (indicator.parentElement && indicator.style.opacity === '0') {
                                            indicator.remove();
                                        }
                                    }, 300);
                                }
                            }
                        }
                    };
                    
                    // Initial state
                    updateScrollLockIndicator();
                    
                    // Monitor game state changes
                    const originalStartGame = this.startGame.bind(this);
                    this.startGame = () => {
                        originalStartGame();
                        updateScrollLockIndicator();
                    };
                    
                    // Update on state changes
                    const originalUpdate = this.update.bind(this);
                    this.update = (deltaTime) => {
                        originalUpdate(deltaTime);
                        // Update indicator periodically based on state
                        if (this.engine.state !== 'playing') {
                            isMouseOverCanvas = false;
                            isTouchActive = false;
                            updateScrollLockIndicator();
                        }
                    };
                    
                    // Store handlers for cleanup
                    this.scrollPreventionHandlers = { 
                        preventScroll, 
                        updateScrollLockIndicator,
                        documentWheelHandler,
                        mouseenter: () => { isMouseOverCanvas = true; updateScrollLockIndicator(); },
                        mouseleave: () => { isMouseOverCanvas = false; updateScrollLockIndicator(); }
                    };
                }
                
                // Cleanup function
                this.dispose = () => {
                    // Remove scroll prevention handlers
                    if (this.scrollPreventionHandlers) {
                        if (this.scrollPreventionHandlers.documentWheelHandler) {
                            document.removeEventListener('wheel', this.scrollPreventionHandlers.documentWheelHandler);
                        }
                        // Remove scroll lock indicator
                        const container = this.canvas?.closest('.demo-canvas-container') || this.canvas?.parentElement;
                        if (container) {
                            const indicator = container.querySelector('.scroll-lock-indicator');
                            if (indicator) indicator.remove();
                        }
                    }
                    
                    if (this.animationFrameId) {
                        cancelAnimationFrame(this.animationFrameId);
                        this.animationFrameId = null;
                    }
                    if (this.resizeObserver) {
                        this.resizeObserver.disconnect();
                        this.resizeObserver = null;
                    }
                    // Clean up shooting interval
                    if (this.shootInterval) {
                        clearInterval(this.shootInterval);
                        this.shootInterval = null;
                    }
                    
                    // Remove event listeners (they'll be garbage collected with the canvas)
                    if (this.engine) {
                        this.engine = null;
                    }
                };
                
                this.showMenu();
            } catch (error) {
                console.error('SurvivalGame: Error in init', error);
            }
        }
        
        startGame() {
            try {
                // Focus canvas to ensure keyboard input works
                if (this.canvas) {
                    this.canvas.focus();
                }
                
                this.engine.startGame();
                this.lastStatusKillStreak = 0;
                this.lastStatusComboTier = 0;
                
                if (this.hud?.container) {
                    this.hud.container.dataset.active = 'true';
                    this.hud.container.setAttribute('aria-hidden', 'false');
                }
                this.flashStatus('Systems online', 'info');
                
                this.particles = new ParticleSystem(); // Reset particles
                this.updateCanvasConfig();
                
                // Ensure canvas is properly sized when game starts
                if (this.setupCanvas) {
                    const resize = () => {
                        const container = this.canvas.parentElement;
                        let width = this.canvas.offsetWidth || 800;
                        let height = this.canvas.offsetHeight || 400;
                        
                        if (!width && container) {
                            width = Math.min(container.offsetWidth - 32, 1200);
                        }
                        if (!height && container) {
                            height = Math.min(container.offsetHeight - 200, 800);
                        }
                        
                        const dpr = window.devicePixelRatio || 1;
                        this.canvas.width = width * dpr;
                        this.canvas.height = height * dpr;
                        if (this.ctx) {
                            this.ctx.scale(dpr, dpr);
                        }
                        this.canvas.style.width = width + 'px';
                        this.canvas.style.height = height + 'px';
                        
                        if (this.engine) {
                            this.engine.canvas = { width: width, height: height };
                        }
                    };
                    setTimeout(resize, 100);
                }
                
                // Initialize audio engine if available
                if (window.AudioEngine && !window.audioEngine) {
                    try {
                        window.audioEngine = new AudioEngine();
                        // Init is async, wait for it then start music
                        window.audioEngine.init().then((success) => {
                            if (success && window.audioEngine) {
                                // Ensure audio context is resumed
                                if (window.audioEngine.audioContext && window.audioEngine.audioContext.state === 'suspended') {
                                    window.audioEngine.audioContext.resume().then(() => {
                                        console.log('AudioEngine: Context resumed, starting music');
                                        if (window.audioEngine.startMusic) {
                                            window.audioEngine.startMusic('gameplay', this.engine.difficulty);
                                        }
                                    }).catch(e => {
                                        console.warn('AudioEngine: Could not resume context', e);
                                    });
                                } else if (window.audioEngine.startMusic) {
                                    console.log('AudioEngine: Starting music');
                                    window.audioEngine.startMusic('gameplay', this.engine.difficulty);
                                }
                            } else {
                                console.warn('AudioEngine: Initialization failed or audio disabled');
                            }
                        }).catch(e => {
                            console.warn('AudioEngine: Initialization error', e);
                        });
                    } catch (e) {
                        console.warn('AudioEngine: Could not initialize', e);
                    }
                } else if (window.audioEngine) {
                    // Audio engine already exists, just start/resume music
                    if (window.audioEngine.audioContext && window.audioEngine.audioContext.state === 'suspended') {
                        window.audioEngine.audioContext.resume().then(() => {
                            if (window.audioEngine.startMusic) {
                                window.audioEngine.startMusic('gameplay', this.engine.difficulty);
                            }
                        });
                    } else if (window.audioEngine.startMusic) {
                        window.audioEngine.startMusic('gameplay', this.engine.difficulty);
                    }
                }
                
                // Update music difficulty as game progresses
                this.lastDifficultyUpdate = 0;
                
                // Mark as played for future sessions
                if (window.CONFIG?.FEATURES?.LOCAL_STORAGE_SUPPORT) {
                    try {
                        localStorage.setItem('dhHasPlayed', 'true');
                    } catch (e) {
                        // Ignore storage errors
                    }
                }
                
                this.gameLoop();
            } catch (error) {
                console.error('SurvivalGame: Error starting game', error);
                this.announceToScreenReader('Error starting game');
            }
        }
        
        updateCanvasConfig() {
            this.engine.config.canvas = {
                width: this.canvas.width,
                height: this.canvas.height
            };
        }
        
        initHud() {
            this.hud = {
                container: document.getElementById('gameHud'),
                score: document.getElementById('gameHudScore'),
                level: document.getElementById('gameHudLevel'),
                difficulty: document.getElementById('gameHudDifficulty'),
                lives: document.getElementById('gameHudLives'),
                comboCard: document.getElementById('gameHudComboCard'),
                combo: document.getElementById('gameHudCombo'),
                comboStreak: document.getElementById('gameHudComboStreak'),
                powerups: document.getElementById('gameHudPowerups'),
                status: document.getElementById('gameHudStatus'),
                statusMessage: document.getElementById('gameHudStatusMessage')
            };
            this.hudCache = {
                score: null,
                level: null,
                difficulty: null,
                lives: null,
                comboMultiplier: null,
                killStreak: null,
                powerupSignature: ''
            };
            this.lastHudUpdate = 0;
            this.statusTimeout = null;
            this.lastStatusKillStreak = 0;
            this.lastStatusComboTier = 0;
            
            if (this.hud?.container) {
                this.hud.container.dataset.active = 'false';
                this.hud.container.setAttribute('aria-hidden', 'true');
            }
        }
        
        updateHud() {
            if (!this.hud || !this.hud.container || !this.engine) return;
            
            const shouldShow = this.engine.state !== 'menu';
            this.hud.container.dataset.active = shouldShow ? 'true' : 'false';
            this.hud.container.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
            if (!shouldShow) return;
            
            const now = performance.now();
            if (this.lastHudUpdate && now - this.lastHudUpdate < 90) {
                return;
            }
            this.lastHudUpdate = now;
            
            if (this.hud.score) {
                if (this.hudCache.score !== this.engine.score) {
                    this.hud.score.textContent = this.engine.score.toLocaleString();
                    this.hudCache.score = this.engine.score;
                    this.hud.score.parentElement?.parentElement?.setAttribute('data-active', 'true');
                }
            }
            
            if (this.hud.level) {
                if (this.hudCache.level !== this.engine.level) {
                    this.hud.level.textContent = this.engine.level;
                    this.hudCache.level = this.engine.level;
                }
            }
            
            if (this.hud.difficulty) {
                const diff = `${this.engine.difficulty.toFixed(1)}x`;
                if (this.hudCache.difficulty !== diff) {
                    this.hud.difficulty.textContent = diff;
                    this.hudCache.difficulty = diff;
                }
            }
            
            if (this.hud.lives) {
                if (this.hudCache.lives !== this.engine.lives) {
                    const lives = Math.max(0, this.engine.lives);
                    this.hud.lives.innerHTML = '';
                    for (let i = 0; i < lives; i++) {
                        const icon = document.createElement('i');
                        icon.className = 'fas fa-heart';
                        this.hud.lives.appendChild(icon);
                    }
                    if (lives === 0) {
                        const icon = document.createElement('i');
                        icon.className = 'fas fa-heart-crack';
                        this.hud.lives.appendChild(icon);
                    }
                    this.hudCache.lives = this.engine.lives;
                }
            }
            
            if (this.hud.combo && this.hud.comboStreak && this.hud.comboCard) {
                const comboValue = `x${this.engine.comboMultiplier.toFixed(1)}`;
                if (this.hudCache.comboMultiplier !== comboValue) {
                    this.hud.combo.textContent = comboValue;
                    this.hudCache.comboMultiplier = comboValue;
                }
                
                if (this.hudCache.killStreak !== this.engine.killStreak) {
                    this.hud.comboStreak.textContent = `Streak ${this.engine.killStreak}`;
                    this.hudCache.killStreak = this.engine.killStreak;
                }
                
                if (this.engine.combo > 1) {
                    this.hud.comboCard.dataset.active = 'true';
                    if (this.engine.combo >= 4 || this.engine.killStreak >= 5) {
                        this.hud.comboCard.dataset.state = 'overdrive';
                    } else {
                        this.hud.comboCard.dataset.state = 'boost';
                    }
                } else {
                    this.hud.comboCard.dataset.active = 'false';
                    this.hud.comboCard.removeAttribute('data-state');
                    this.hud.comboCard.classList.remove('is-pulsing');
                }
                
                if (this.engine.frenzy?.active) {
                    this.hud.comboCard.dataset.frenzy = String(this.engine.frenzy.tier);
                } else if (this.hud.comboCard.dataset.frenzy) {
                    delete this.hud.comboCard.dataset.frenzy;
                }
            }
            
            this.renderPowerupHud();
        }
        
        renderPowerupHud() {
            if (!this.hud?.powerups || !this.engine?.player?.powerups) return;
            
            const activePowerups = this.engine.player.powerups.filter(Boolean);
            if (this.engine.frenzy?.active && !activePowerups.some(p => p?.type === 'frenzy')) {
                activePowerups.push({
                    type: 'frenzy',
                    expiresAt: this.engine.frenzy.expiresAt,
                    startedAt: this.engine.gameTime,
                    duration: Math.max(0, this.engine.frenzy.expiresAt - this.engine.gameTime)
                });
            }
            if (activePowerups.length === 0) {
                if (this.hud.powerups.innerHTML !== '') {
                    this.hud.powerups.innerHTML = '';
                }
                this.hudCache.powerupSignature = '';
                return;
            }
            
            const signature = activePowerups
                .map(p => `${p.type}-${Math.round((p.expiresAt - this.engine.gameTime) / 100)}`)
                .join('|');
            
            if (this.hudCache.powerupSignature === signature) {
                return;
            }
            this.hudCache.powerupSignature = signature;
            
            this.hud.powerups.innerHTML = '';
            const durationBase = window.CONFIG?.GAME?.POWERUP_DURATION_BASE || 10000;
            
            activePowerups.forEach(powerup => {
                const info = POWERUP_ICON_MAP[powerup.type];
                const element = document.createElement('div');
                element.className = 'hud-powerup';
                
                const totalDuration = powerup.duration || durationBase;
                const timeLeft = Math.max(0, powerup.expiresAt - this.engine.gameTime);
                const progress = timeLeft / totalDuration;
                element.style.setProperty('--powerup-progress', Math.max(0, Math.min(1, progress)));
                element.style.setProperty('--powerup-color', info?.color || 'rgba(56, 189, 248, 0.85)');
                
                const icon = document.createElement('i');
                icon.className = info?.icon || 'fas fa-circle';
                icon.classList.add('hud-powerup__icon');
                element.appendChild(icon);
                
                const label = document.createElement('span');
                label.className = 'hud-powerup__label';
                label.textContent = (info?.label || powerup.type || '').slice(0, 10);
                element.appendChild(label);
                
                this.hud.powerups.appendChild(element);
            });
        }
        
        flashStatus(message, variant = 'info') {
            if (!this.hud?.status || !this.hud?.statusMessage) return;
            
            this.hud.status.dataset.variant = variant;
            this.hud.statusMessage.textContent = message;
            this.hud.status.classList.add('is-active');
            
            if (this.statusTimeout) {
                clearTimeout(this.statusTimeout);
            }
            this.statusTimeout = setTimeout(() => {
                this.hud?.status?.classList.remove('is-active');
            }, 1600);
        }
        
        triggerComboPulse() {
            if (!this.hud?.comboCard) return;
            this.hud.comboCard.classList.remove('is-pulsing');
            void this.hud.comboCard.offsetWidth; // force reflow
            this.hud.comboCard.classList.add('is-pulsing');
        }
        
        update(deltaTime) {
            if (this.engine.state !== 'playing') return;
            
            const previousCombo = this.engine.combo;
            const previousKillStreak = this.engine.killStreak;
            
            // Update music difficulty and tempo with score
            if (window.audioEngine && window.audioEngine.updateDifficulty) {
                const now = performance.now();
                if (!this.lastDifficultyUpdate || now - this.lastDifficultyUpdate > 2000) {
                    window.audioEngine.updateDifficulty(this.engine.difficulty, this.engine.score);
                    this.lastDifficultyUpdate = now;
                }
            }
            
            // Update engine
            const result = this.engine.update(deltaTime, this.keys, this.mouse);
            
            // Handle engine events
            if (result) {
                if (result.type === 'collect') {
                    this.particles.createCollectExplosion(result.x, result.y, result.color);
                    if (window.game && typeof window.game.addPoints === 'function') {
                        try {
                            window.game.addPoints(Math.floor(10 * this.engine.comboMultiplier), 'Collected item');
                            if (typeof window.game.incrementParticles === 'function') {
                                window.game.incrementParticles(5);
                            }
                        } catch (e) {
                            console.warn('SurvivalGame: Error calling gamification on collect:', e);
                        }
                    }
                    // Play collect sound if audio engine available
                    if (window.audioEngine) {
                        window.audioEngine.playSound('collect');
                    }
                } else if (result.type === 'hit') {
                    this.particles.createExplosion(result.x, result.y, '#ef4444', 40, 6);
                    if (window.audioEngine) {
                        window.audioEngine.playSound('hit');
                    }
                    this.flashStatus('Hull integrity breached!', 'danger');
                } else if (result.type === 'bossSpawned') {
                    this.flashStatus('BOSS INCOMING!', 'danger');
                    if (window.audioEngine) {
                        window.audioEngine.playSound('explosion');
                    }
                } else if (result.type === 'bossKilled') {
                    // Enhanced explosion for boss death
                    const bossSize = result.enemy.radius || 40;
                    this.particles.createEnemyDeath(result.x, result.y, result.enemy);
                    
                    // Create more explosion bullets for boss
                    const bulletCount = 20;
                    this.engine.createExplosionBullets(result.x, result.y, bulletCount);
                    
                    this.flashStatus('BOSS DEFEATED!', 'success');
                    if (window.audioEngine) {
                        window.audioEngine.playSound('levelup');
                    }
                } else if (result.type === 'enemyKilled') {
                    // Enhanced explosion for enemy death
                    const enemySize = result.enemy.radius || 10;
                    const explosionCount = Math.floor(60 + enemySize * 2);
                    this.particles.createEnemyDeath(result.x, result.y, result.enemy);
                    
                    // Create explosion bullets that shoot out and hit other enemies
                    const bulletCount = Math.min(12, Math.floor(8 + enemySize * 0.5));
                    this.engine.createExplosionBullets(result.x, result.y, bulletCount);
                    
                    // Chain explosion effect
                    if (result.chainExplosion) {
                        this.particles.createChainExplosion(result.x, result.y);
                        if (window.audioEngine) {
                            window.audioEngine.playSound('explosion');
                        }
                    }
                    
                    // Kill streak bonus with enhanced feedback and full screen effects
                    if (result.killStreak >= 5) {
                        this.particles.createKillStreakEffect(result.x, result.y, result.killStreak);
                        
                        // Full screen effect for major milestones
                        const milestones = [10, 20, 30, 50];
                        if (milestones.includes(result.killStreak)) {
                            this.particles.createFullScreenKillStreak(result.killStreak);
                            if (window.audioEngine) {
                                window.audioEngine.playSound('levelup'); // Use levelup sound for milestones
                            }
                        }
                    }
                    
                    if (result.killStreak >= 5 && result.killStreak > this.lastStatusKillStreak) {
                        this.flashStatus(`Kill streak ${result.killStreak}!`, 'danger');
                        this.lastStatusKillStreak = result.killStreak;
                    }
                    if (result.chainExplosion) {
                        this.flashStatus('Chain reaction!', 'warning');
                    }
                    
                    if (window.game && typeof window.game.addPoints === 'function') {
                        try {
                            window.game.addPoints(result.score || 10, `Kill Streak x${result.killStreak || 1}`);
                        } catch (e) {
                            console.warn('SurvivalGame: Error calling gamification.addPoints:', e);
                        }
                    }
                    if (window.audioEngine) {
                        window.audioEngine.playSound('enemyKilled');
                        // Sync music with enemy kills at high tempo
                        if (window.audioEngine.syncWithGameEvent) {
                            window.audioEngine.syncWithGameEvent('enemyKilled');
                        }
                    }
                } else if (result.type === 'killstreakMilestone') {
                    const streak = result.killStreak || this.engine.killStreak;
                    const streakX = result.x || this.engine.player?.x || this.canvas.width / 2;
                    const streakY = result.y || this.engine.player?.y || this.canvas.height / 2;
                    if (this.particles?.createKillStreakEffect) {
                        this.particles.createKillStreakEffect(streakX, streakY, streak);
                    }
                    this.flashStatus(`Kill streak ${streak}!`, 'success');
                    this.triggerComboPulse();
                    if (window.game && typeof window.game.addPoints === 'function') {
                        try {
                            window.game.addPoints(50 + streak * 5, `Kill streak ${streak}`);
                            if (typeof window.game.showScorePopup === 'function') {
                                window.game.showScorePopup(50 + streak * 5, `Kill streak ${streak}`);
                            }
                        } catch (e) {
                            console.warn('SurvivalGame: Error awarding killstreak bonus:', e);
                        }
                    }
                    if (window.audioEngine?.syncWithGameEvent) {
                        window.audioEngine.syncWithGameEvent('killstreak', { streak });
                    }
                } else if (result.type === 'frenzyStart') {
                    const tier = result.tier || this.engine.frenzy?.tier || 1;
                    if (this.engine.player) {
                        this.particles.createFrenzyBurst(this.engine.player.x, this.engine.player.y, tier);
                    }
                    this.flashStatus(`FRENZY TIER ${tier}!`, 'success');
                    this.triggerComboPulse();
                    if (window.game) {
                        try {
                            if (typeof window.game.showScorePopup === 'function') {
                                window.game.showScorePopup(75 * tier, `Frenzy Tier ${tier}`);
                            }
                            if (typeof window.game.addPoints === 'function') {
                                window.game.addPoints(75 * tier, `Frenzy Tier ${tier}`);
                            }
                            if (typeof window.game.unlockAchievement === 'function') {
                                const achievementId = tier >= 3 ? 'hazard-overdrive' : 'frenzy-online';
                                const title = tier >= 3 ? 'Chaos Commander' : 'Frenzy Online';
                                const desc = tier >= 3 ? 'Maxed out Frenzy mode!' : 'Activated Frenzy mode!';
                                window.game.unlockAchievement(achievementId, title, desc, 100 * tier);
                            }
                        } catch (e) {
                            console.warn('SurvivalGame: Error updating gamification for Frenzy:', e);
                        }
                    }
                    if (window.audioEngine?.syncWithGameEvent) {
                        window.audioEngine.syncWithGameEvent('frenzy-start', { tier });
                    }
                } else if (result.type === 'frenzyExtend') {
                    const tier = result.tier || this.engine.frenzy?.tier || 1;
                    this.flashStatus('Frenzy extended!', 'info');
                    if (window.audioEngine?.syncWithGameEvent) {
                        window.audioEngine.syncWithGameEvent('frenzy-extend', { tier });
                    }
                } else if (result.type === 'frenzyEnd') {
                    this.flashStatus('Frenzy cooled down', 'warning');
                    if (window.audioEngine?.syncWithGameEvent) {
                        window.audioEngine.syncWithGameEvent('frenzy-end', { tier: result.tier });
                    }
                } else if (result.type === 'powerup') {
                    // Enhanced power-up pickup effects
                    this.particles.createExplosion(result.x, result.y, result.color, 50, 6);
                    
                    // Check for power-up combinations for synergy announcement
                    const activePowerups = this.engine.player.powerups.map(p => p.type);
                    const newCombos = [];
                    
                    if (result.type === 'rapidfire' && activePowerups.includes('spreadshot') && activePowerups.includes('explosive')) {
                        newCombos.push('ULTIMATE COMBO!');
                    } else if (result.type === 'spreadshot' && activePowerups.includes('explosive')) {
                        newCombos.push('Spread + Explosive Synergy!');
                    } else if (result.type === 'rapidfire' && activePowerups.includes('spreadshot')) {
                        newCombos.push('Rapid + Spread Synergy!');
                    }
                    
                    // Spawn animation effect
                    if (window.CONFIG?.GAME?.POWERUP_SPAWN_ANIMATION) {
                        for (let i = 0; i < 20; i++) {
                            const angle = (Math.PI * 2 * i) / 20;
                            this.particles.particles.push({
                                x: result.x,
                                y: result.y,
                                vx: Math.cos(angle) * 3,
                                vy: Math.sin(angle) * 3,
                                radius: 3 + Math.random() * 3,
                                color: result.color,
                                life: 400 + Math.random() * 200,
                                maxLife: 600,
                                alpha: 1,
                                gravity: -0.05,
                                shrink: true
                            });
                        }
                    }
                    
                    // Announce synergy
                    if (newCombos.length > 0 && window.game && typeof window.game.addPoints === 'function') {
                        try {
                            window.game.addPoints(50, newCombos[0]);
                        } catch (e) {
                            console.warn('SurvivalGame: Error calling gamification.addPoints for combo:', e);
                        }
                    }
                    
                    const powerupMsg = {
                        health: 'Health restored',
                        speed: 'Speed boost',
                        shield: 'Shield activated',
                        multiplier: 'Score multiplier',
                        rapidfire: 'Rapid Fire!',
                        spreadshot: 'Spread Shot!',
                        explosive: 'Explosive Rounds!',
                        frenzy: 'Frenzy Mode!',
                        pierce: 'Pierce Rounds!',
                        regen: 'Health Regeneration!',
                        doubleDamage: 'Double Damage!',
                        freeze: 'Freeze Enemies!',
                        magnet: 'Magnet Power!',
                        godmode: 'GOD MODE!'
                    };
                    const powerupType = result.powerupType || result.type || 'powerup';
                    if (window.game && typeof window.game.addPoints === 'function') {
                        try {
                            window.game.addPoints(25, powerupMsg[powerupType] || 'Power-up');
                        } catch (e) {
                            console.warn('SurvivalGame: Error calling gamification.addPoints:', e);
                        }
                    }
                    const statusLabel = powerupMsg[powerupType] || 'System boost';
                    if (powerupType === 'health') {
                        this.flashStatus('Integrity restored +1', 'success');
                    } else {
                        this.flashStatus(`${statusLabel}!`, 'success');
                    }
                    if (window.audioEngine) {
                        // Play specific power-up sound
                        const soundType = powerupType === 'health' || powerupType === 'speed' 
                            ? 'powerup' 
                            : `powerup-${powerupType}`;
                        window.audioEngine.playSound(soundType);
                    }
                } else if (result.type === 'levelup') {
                    this.particles.createLevelUp();
                    if (window.game && typeof window.game.unlockAchievement === 'function') {
                        try {
                            window.game.unlockAchievement(
                                `level-${result.level}`,
                                `Survived Level ${result.level}`,
                                `Reached level ${result.level} in Survival Game!`,
                                50 * result.level
                            );
                        } catch (e) {
                            console.warn('SurvivalGame: Error calling gamification.unlockAchievement for level up:', e);
                        }
                    }
                    if (window.audioEngine) {
                        window.audioEngine.playSound('levelup');
                        // Sync music with level up
                        if (window.audioEngine.syncWithGameEvent) {
                            window.audioEngine.syncWithGameEvent('levelup');
                        }
                    }
                    this.flashStatus(`Sector ${result.level} reached`, 'info');
                } else if (result.type === 'gameover') {
                    this.gameOver(result.score, result.level);
                    if (window.audioEngine) {
                        window.audioEngine.stopMusic();
                    }
                    this.flashStatus('Critical failure detected', 'danger');
                }
            }
            
            if (this.engine.combo > previousCombo) {
                this.triggerComboPulse();
                if (this.engine.combo >= 3 && this.engine.combo > this.lastStatusComboTier) {
                    if (this.engine.combo % 3 === 0) {
                        if (this.engine.player) {
                            this.particles.createComboSurge(
                                this.engine.player.x,
                                this.engine.player.y,
                                this.engine.combo
                            );
                        }
                        this.flashStatus(`Combo ${this.engine.combo}x online`, 'info');
                        this.lastStatusComboTier = this.engine.combo;
                    }
                }
            } else if (this.engine.combo <= 1) {
                this.lastStatusComboTier = 0;
            }
            
            if (this.engine.killStreak < previousKillStreak) {
                this.lastStatusKillStreak = Math.min(this.lastStatusKillStreak, this.engine.killStreak);
            }
            
            // Auto-fire interval management (handles continuous shooting)
            // Works with BOTH mouse click AND spacebar - spacebar shoots toward mouse cursor
            const isShooting = (this.mouse.down || this.spacebarDown) && this.engine.state === 'playing' && this.mouse.x > 0 && this.mouse.y > 0;
            
            if (isShooting) {
                if (!this.shootInterval && this.engine.player?.weapon) {
                    const fireRate = this.engine.player.weapon.fireRate || 10;
                    this.shootInterval = setInterval(() => {
                        const stillShooting = (this.mouse.down || this.spacebarDown) && this.engine.state === 'playing' && this.mouse.x > 0 && this.mouse.y > 0;
                        if (stillShooting) {
                            if (this.engine.shoot(this.mouse.x, this.mouse.y)) {
                                if (window.audioEngine) {
                                    window.audioEngine.playSound('shoot');
                                }
                            }
                        } else {
                            if (this.shootInterval) {
                                clearInterval(this.shootInterval);
                                this.shootInterval = null;
                            }
                        }
                    }, 1000 / fireRate);
                }
            } else {
                if (this.shootInterval) {
                    clearInterval(this.shootInterval);
                    this.shootInterval = null;
                }
            }
            
            // Continuous trail particles
            if (this.engine.player && this.engine.state === 'playing') {
                this.particles.createTrail(this.engine.player.x, this.engine.player.y, this.engine.player.color);
                
                // Muzzle flash when shooting (mouse OR spacebar)
                if ((this.mouse.down || this.spacebarDown) && this.engine.player.weapon) {
                    const now = this.engine.gameTime;
                    const weapon = this.engine.player.weapon;
                    const minInterval = 1000 / weapon.fireRate;
                    if (now - weapon.lastFired < minInterval + 50) {
                        // Just fired - create muzzle flash
                        const angle = this.engine.mouseAngle || 0;
                        this.particles.createGunMuzzleFlash(
                            this.engine.player.x,
                            this.engine.player.y,
                            angle
                        );
                    }
                }
            }
            
            // Update particles
            this.particles.update(deltaTime);
        }
        
        render() {
            this.renderer.clear();
            
            if (this.engine.state === 'menu') {
                this.renderer.renderMenu(this.canvas);
            } else if (this.engine.state === 'playing' || this.engine.state === 'paused') {
                this.renderer.renderGame(
                    this.engine,
                    this.particles,
                    this.particles.screenShake,
                    this.mouse
                );
                this.renderer.renderUI(this.engine);
                
                if (this.engine.state === 'paused') {
                    this.renderer.renderPaused();
                }
            } else if (this.engine.state === 'gameover') {
                this.renderer.renderGame(
                    this.engine,
                    this.particles,
                    this.particles.screenShake,
                    this.mouse
                );
                this.renderer.renderGameOver(this.engine);
            }
            
            this.updateHud();
        }
        
        gameOver(score, level) {
            // Update gamification system with proper error handling
            if (window.game && typeof window.game.addPoints === 'function') {
                try {
                    window.game.addPoints(score, `Survival Game Score: ${score}`);
                    
                    // Unlock achievements based on performance
                    if (typeof window.game.unlockAchievement === 'function') {
                        if (score > 1000) {
                            window.game.unlockAchievement('survival-master', 'Survival Master', `Scored ${score} points!`, 100);
                        }
                        if (level >= 5) {
                            window.game.unlockAchievement('level-master', 'Level Master', `Reached level ${level}!`, 200);
                        }
                        if (score > 5000) {
                            window.game.unlockAchievement('legend', 'Legend', `Scored ${score} points!`, 500);
                        }
                    }
                    
                    // Check high score at game completion (milestone event)
                    if (typeof window.game.checkHighScore === 'function') {
                        window.game.checkHighScore();
                    }
                } catch (e) {
                    console.warn('SurvivalGame: Error updating gamification on game over:', e);
                }
            }
            
            // Show daisyUI modal for game over - Use DaisyUI Blueprint pattern
            const modal = document.getElementById('gameOverModal');
            if (modal) {
                const scoreEl = document.getElementById('gameOverScore');
                const levelEl = document.getElementById('gameOverLevel');
                if (scoreEl) scoreEl.textContent = score.toLocaleString();
                if (levelEl) levelEl.textContent = level;
                
                // Use native dialog API if available, fallback to class-based toggle
                if (typeof modal.showModal === 'function') {
                    modal.showModal();
                } else {
                    // Fallback: Add modal-open class to body and show modal
                    document.body.classList.add('modal-open');
                    modal.classList.add('modal-open');
                    modal.style.display = 'block';
                    
                    // Add backdrop
                    let backdrop = document.querySelector('.modal-backdrop');
                    if (!backdrop) {
                        backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop';
                        backdrop.setAttribute('aria-hidden', 'true');
                        document.body.appendChild(backdrop);
                    }
                    backdrop.classList.add('active');
                }
                
                // Focus trap for accessibility - Native dialog handles focus, but ensure first button is focused
                const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    setTimeout(() => firstFocusable.focus(), 100);
                }
                
                // ESC key handling - Native dialog handles this, but ensure it works
                modal.addEventListener('close', () => {
                    // Restore focus when modal closes
                    const lastFocused = document.activeElement;
                    if (lastFocused && lastFocused.blur) {
                        lastFocused.blur();
                    }
                });
                
                // ESC key handler
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        this.restartGame();
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler, { once: true });
                
                // Announce to screen readers
                this.announceToScreenReader(`Game Over. Final Score: ${score}. Level Reached: ${level}`);
            }
        }
        
        gameLoop() {
            const now = performance.now();
            let deltaTime = now - this.lastFrame;
            this.lastFrame = now;
            
            // Cap delta time to prevent large jumps (e.g., tab switching)
            // Max 100ms = 10 FPS minimum
            const MAX_DELTA = 100;
            if (deltaTime > MAX_DELTA) {
                deltaTime = MAX_DELTA;
            }
            
            // Update FPS counter
            this.updateFPS(deltaTime);
            
            // Update performance monitor
            if (window.PerformanceMonitor && window.PerformanceMonitor.updateFPS) {
                window.PerformanceMonitor.updateFPS(this.performance.fps, deltaTime);
            }
            
            // Adaptive quality based on FPS
            this.adjustQuality();
            
            // Only continue loop if game is still valid
            if (this.canvas && this.ctx && this.engine) {
                this.update(deltaTime);
                this.render();
                
                // Throttle requestAnimationFrame for background tabs
                if (document.hidden) {
                    // Slow down when tab is hidden
                    setTimeout(() => {
                        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
                    }, 100);
                } else {
                    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
                }
            }
        }
        
        updateFPS(deltaTime) {
            this.performance.frameCount++;
            const now = performance.now();
            
            if (now - this.performance.lastFpsUpdate >= 1000) {
                // Calculate FPS
                this.performance.fps = Math.round((this.performance.frameCount * 1000) / (now - this.performance.lastFpsUpdate));
                this.performance.frameCount = 0;
                this.performance.lastFpsUpdate = now;
                
                // Track FPS history (keep last 10 samples)
                this.performance.fpsHistory.push(this.performance.fps);
                if (this.performance.fpsHistory.length > 10) {
                    this.performance.fpsHistory.shift();
                }
                
                // Log FPS in debug mode
                if (window.CONFIG?.DEBUG) {
                    console.log(`[Performance] FPS: ${this.performance.fps}, Quality: ${this.performance.qualityLevel}`);
                }
            }
        }
        
        adjustQuality() {
            const avgFPS = this.performance.fpsHistory.length > 0
                ? this.performance.fpsHistory.reduce((a, b) => a + b, 0) / this.performance.fpsHistory.length
                : this.performance.fps;
            
            const currentQuality = this.performance.qualityLevel;
            let newQuality = currentQuality;
            
            // Adjust quality based on FPS
            if (avgFPS < this.performance.minFPS && currentQuality === 'high') {
                newQuality = 'medium';
            } else if (avgFPS < this.performance.minFPS - 10 && currentQuality === 'medium') {
                newQuality = 'low';
            } else if (avgFPS >= this.performance.targetFPS && currentQuality === 'low') {
                newQuality = 'medium';
            } else if (avgFPS >= this.performance.targetFPS + 5 && currentQuality === 'medium') {
                newQuality = 'high';
            }
            
            if (newQuality !== currentQuality) {
                this.performance.qualityLevel = newQuality;
                this.applyQualitySettings(newQuality);
                
                if (window.CONFIG?.DEBUG) {
                    console.log(`[Performance] Quality adjusted: ${currentQuality} → ${newQuality} (FPS: ${avgFPS.toFixed(1)})`);
                }
            }
        }
        
        applyQualitySettings(quality) {
            const perfConfig = window.CONFIG?.PERFORMANCE || {};
            
            // Update particle system quality
            if (this.particles && this.particles.setQuality) {
                this.particles.setQuality(quality);
            }
            
            // Update engine quality
            if (this.engine && this.engine.setQuality) {
                this.engine.setQuality(quality);
            }
            
            // Store quality level for other systems
            this.currentQuality = quality;
            
            // Use requestIdleCallback for non-critical updates if available
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    // Update any non-critical UI elements here
                    if (window.CONFIG?.DEBUG) {
                        console.log(`[Performance] Quality level: ${quality}`);
                    }
                }, { timeout: 1000 });
            }
        }
        
        showMenu() {
            this.engine.state = 'menu';
            if (this.hud?.container) {
                this.hud.container.dataset.active = 'false';
                this.hud.container.setAttribute('aria-hidden', 'true');
            }
            // Close game over modal if open - DaisyUI Blueprint pattern
            const modal = document.getElementById('gameOverModal');
            if (modal) {
                if (typeof modal.close === 'function') {
                    modal.close();
                } else {
                    // Fallback: Remove modal-open class
                    document.body.classList.remove('modal-open');
                    modal.classList.remove('modal-open');
                    modal.style.display = 'none';
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.classList.remove('active');
                    }
                }
            }
            this.gameLoop();
        }
        
        restartGame() {
            const modal = document.getElementById('gameOverModal');
            if (modal) {
                if (typeof modal.close === 'function') {
                    modal.close();
                } else {
                    // Fallback: Remove modal-open class
                    document.body.classList.remove('modal-open');
                    modal.classList.remove('modal-open');
                    modal.style.display = 'none';
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.classList.remove('active');
                    }
                }
            }
            this.startGame();
        }
        
        // Accessibility: Announce to screen readers
        announceToScreenReader(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
        }
        
        // Cleanup method for proper resource management
        dispose() {
            try {
                // Cancel animation frame
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
                
                // Clear shoot interval
                if (this.shootInterval) {
                    clearInterval(this.shootInterval);
                    this.shootInterval = null;
                }
                
                // Remove event listeners if stored
                if (this.scrollPreventionHandlers) {
                    if (this.scrollPreventionHandlers.documentWheelHandler) {
                        document.removeEventListener('wheel', this.scrollPreventionHandlers.documentWheelHandler, { passive: false });
                    }
                    if (this.scrollPreventionHandlers.windowTouchHandler) {
                        window.removeEventListener('touchmove', this.scrollPreventionHandlers.windowTouchHandler, { passive: false });
                    }
                }
                
                // Clear resize observer if exists
                if (this.resizeObserver) {
                    this.resizeObserver.disconnect();
                    this.resizeObserver = null;
                }
                
                // Stop game engine
                if (this.engine) {
                    this.engine.state = 'menu';
                }
                
                // Clear particles
                if (this.particles) {
                    this.particles.particles = [];
                    this.particles.explosions = [];
                }
            } catch (error) {
                console.warn('SurvivalGame: Error during dispose', error);
            }
        }
    }
    
    // Expose class globally for loaders and integration tests
    window.SurvivalGame = SurvivalGame;
    
    // Global cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.survivalGame && typeof window.survivalGame.dispose === 'function') {
            window.survivalGame.dispose();
        }
    });
})();
