/**
 * Gaming UI Enhancements
 * Adds gaming-style visual effects, animations, and interactions
 * Think Different. Be OP. Break the Meta.
 */

(function() {
    'use strict';

    const GamingUI = {
        initialized: false,
        scanlineEffect: null,
        glitchEffects: [],
        
        /**
         * Initialize all gaming UI enhancements
         */
        init() {
            if (this.initialized) return;
            
            console.log('[GamingUI] Initializing gaming-style enhancements...');
            
            // Add scanline effects
            this.addScanlines();
            
            // Add glitch effects to titles
            this.addGlitchEffects();
            
            // Enhance buttons with power-up effects
            this.enhanceButtons();
            
            // Add hover glow effects
            this.addGlowEffects();
            
            // Add screen shake on interactions
            this.addScreenShake();
            
            // Add combo visual effects
            this.addComboEffects();
            
            // Add level-up notifications
            this.addLevelUpEffects();
            
            this.initialized = true;
            console.log('[GamingUI] Gaming UI enhancements active');
        },
        
        /**
         * Add CRT scanline effects
         */
        addScanlines() {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes scanline {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100%; }
                }
                
                .gaming-scanlines::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        rgba(255, 255, 255, 0) 50%,
                        rgba(0, 0, 0, 0.05) 50%
                    );
                    background-size: 100% 4px;
                    pointer-events: none;
                    animation: scanline 8s linear infinite;
                    z-index: 1;
                }
                
                .gaming-crt-glow::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(
                        ellipse at center,
                        rgba(255, 255, 255, 0.1) 0%,
                        transparent 70%
                    );
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes glitch {
                    0%, 100% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                }
                
                .gaming-glitch {
                    position: relative;
                    animation: glitch 0.3s ease-in-out;
                }
                
                .gaming-glitch::before,
                .gaming-glitch::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                
                .gaming-glitch::before {
                    animation: glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse;
                    color: #f97316;
                    z-index: -1;
                }
                
                .gaming-glitch::after {
                    animation: glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse;
                    color: #38bdf8;
                    z-index: -2;
                }
                
                @keyframes neon-pulse {
                    0%, 100% { 
                        text-shadow: 0 0 10px currentColor,
                                     0 0 20px currentColor,
                                     0 0 30px currentColor;
                        filter: brightness(1);
                    }
                    50% { 
                        text-shadow: 0 0 20px currentColor,
                                     0 0 30px currentColor,
                                     0 0 40px currentColor,
                                     0 0 50px currentColor;
                        filter: brightness(1.3);
                    }
                }
                
                .gaming-neon-pulse {
                    animation: neon-pulse 2s ease-in-out infinite;
                }
                
                @keyframes power-up {
                    0% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.05); filter: brightness(1.2) drop-shadow(0 0 20px currentColor); }
                    100% { transform: scale(1); filter: brightness(1); }
                }
                
                .gaming-power-up {
                    animation: power-up 0.5s ease-in-out;
                }
                
                @keyframes screen-shake {
                    0%, 100% { transform: translate(0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 2px); }
                    20%, 40%, 60%, 80% { transform: translate(2px, -2px); }
                }
                
                .gaming-screen-shake {
                    animation: screen-shake 0.5s ease-in-out;
                }
                
                .gaming-glow-hover {
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .gaming-glow-hover::before {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    border-radius: inherit;
                    padding: 2px;
                    background: linear-gradient(45deg, #f97316, #38bdf8, #facc15);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .gaming-glow-hover:hover::before {
                    opacity: 1;
                    animation: rotate-border 2s linear infinite;
                }
                
                @keyframes rotate-border {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                
                @keyframes level-up {
                    0% { 
                        transform: scale(0) rotate(-180deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2) rotate(0deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }
                
                .gaming-level-up {
                    animation: level-up 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                .gaming-combo-text {
                    font-family: var(--font-display);
                    font-weight: bold;
                    background: linear-gradient(45deg, #f97316, #facc15);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: neon-pulse 1s ease-in-out infinite;
                }
            `;
            document.head.appendChild(style);
        },
        
        /**
         * Add glitch effects to section titles
         */
        addGlitchEffects() {
            const titles = document.querySelectorAll('.section-title, h1, h2');
            titles.forEach((title, index) => {
                // Add glitch effect on hover
                title.addEventListener('mouseenter', () => {
                    if (!title.classList.contains('gaming-glitch')) {
                        const originalText = title.textContent;
                        title.setAttribute('data-text', originalText);
                        title.classList.add('gaming-glitch');
                        
                        setTimeout(() => {
                            title.classList.remove('gaming-glitch');
                        }, 300);
                    }
                });
                
                // Random glitch every 10-20 seconds
                const glitchInterval = Math.random() * 10000 + 10000;
                setInterval(() => {
                    if (Math.random() < 0.3) { // 30% chance
                        const originalText = title.textContent;
                        title.setAttribute('data-text', originalText);
                        title.classList.add('gaming-glitch');
                        setTimeout(() => {
                            title.classList.remove('gaming-glitch');
                        }, 300);
                    }
                }, glitchInterval);
            });
        },
        
        /**
         * Enhance buttons with gaming effects
         */
        enhanceButtons() {
            const buttons = document.querySelectorAll('.btn, button');
            buttons.forEach(button => {
                // Add glow on hover
                button.classList.add('gaming-glow-hover');
                
                // Power-up effect on click
                button.addEventListener('click', () => {
                    button.classList.add('gaming-power-up');
                    setTimeout(() => {
                        button.classList.remove('gaming-power-up');
                    }, 500);
                    
                    // Award points
                    if (window.game && window.game.addPoints) {
                        window.game.addPoints(5);
                    }
                });
            });
        },
        
        /**
         * Add glow effects to cards and interactive elements
         */
        addGlowEffects() {
            const cards = document.querySelectorAll('.card, .dh-card, .panel-blur');
            cards.forEach(card => {
                card.classList.add('gaming-glow-hover');
                
                card.addEventListener('click', () => {
                    // Create ripple effect
                    const ripple = document.createElement('div');
                    ripple.style.cssText = `
                        position: absolute;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%);
                        width: 20px;
                        height: 20px;
                        pointer-events: none;
                        animation: ripple 0.6s ease-out;
                    `;
                    
                    const style = document.createElement('style');
                    style.textContent = `
                        @keyframes ripple {
                            0% { transform: scale(0); opacity: 1; }
                            100% { transform: scale(20); opacity: 0; }
                        }
                    `;
                    document.head.appendChild(style);
                    
                    card.style.position = 'relative';
                    card.style.overflow = 'hidden';
                    card.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 600);
                });
            });
        },
        
        /**
         * Add screen shake effect
         */
        addScreenShake() {
            // Listen for specific events that should trigger screen shake
            window.addEventListener('achievement-unlocked', () => {
                document.body.classList.add('gaming-screen-shake');
                setTimeout(() => {
                    document.body.classList.remove('gaming-screen-shake');
                }, 500);
            });
        },
        
        /**
         * Add combo visual effects
         */
        addComboEffects() {
            // Enhance combo counter if it exists
            const comboCounter = document.getElementById('comboCounter');
            if (comboCounter) {
                const observer = new MutationObserver(() => {
                    comboCounter.classList.add('gaming-power-up');
                    setTimeout(() => {
                        comboCounter.classList.remove('gaming-power-up');
                    }, 500);
                });
                
                observer.observe(comboCounter, { 
                    childList: true, 
                    subtree: true 
                });
            }
        },
        
        /**
         * Add level-up notification effects
         */
        addLevelUpEffects() {
            window.addEventListener('level-up', (event) => {
                const notification = document.createElement('div');
                notification.className = 'gaming-level-up fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]';
                notification.innerHTML = `
                    <div class="card bg-gradient-to-r from-primary to-accent text-primary-content shadow-2xl p-8 text-center">
                        <div class="text-6xl font-bold mb-2 gaming-combo-text">LEVEL UP!</div>
                        <div class="text-2xl">Level ${event.detail?.level || '?'}</div>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // Screen shake
                document.body.classList.add('gaming-screen-shake');
                setTimeout(() => {
                    document.body.classList.remove('gaming-screen-shake');
                }, 500);
                
                // Remove notification after 2 seconds
                setTimeout(() => {
                    notification.style.animation = 'level-up 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) reverse';
                    setTimeout(() => notification.remove(), 600);
                }, 2000);
            });
        },
        
        /**
         * Create particle burst effect
         */
        createParticleBurst(x, y, count = 20) {
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                z-index: 9999;
            `;
            
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                const angle = (Math.PI * 2 * i) / count;
                const velocity = 100 + Math.random() * 100;
                const size = 4 + Math.random() * 4;
                
                const colors = ['#f97316', '#38bdf8', '#facc15'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                particle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${color};
                `;
                
                container.appendChild(particle);
                
                // Animate particle
                let posX = 0;
                let posY = 0;
                let velX = Math.cos(angle) * velocity;
                let velY = Math.sin(angle) * velocity;
                const gravity = 200;
                const startTime = Date.now();
                
                const animate = () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    if (elapsed > 1) {
                        particle.remove();
                        return;
                    }
                    
                    velY += gravity * 0.016;
                    posX += velX * 0.016;
                    posY += velY * 0.016;
                    
                    particle.style.transform = `translate(${posX}px, ${posY}px)`;
                    particle.style.opacity = 1 - elapsed;
                    
                    requestAnimationFrame(animate);
                };
                
                animate();
            }
            
            document.body.appendChild(container);
            setTimeout(() => container.remove(), 1500);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GamingUI.init());
    } else {
        GamingUI.init();
    }

    // Export to window
    window.GamingUI = GamingUI;

    console.log('[GamingUI] Gaming UI enhancement system loaded');
})();
