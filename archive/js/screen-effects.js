// Screen Effects Module - Explosions, Glitches, and Full-Screen Effects
// Integrates with gamification system and animation libraries
// Uses GSAP/Anime.js for animations, Canvas for particle effects

(function() {
    'use strict';
    
    // Namespace
    if (!window.DHScreenEffects) {
        window.DHScreenEffects = {};
    }
    
    const ScreenEffects = window.DHScreenEffects;
    
    /**
     * Explosion Particle System
     * Creates particle explosions at specified coordinates
     */
    ScreenEffects.ExplosionSystem = {
        canvas: null,
        ctx: null,
        particles: [],
        active: false,
        
        /**
         * Initialize explosion canvas
         */
        init() {
            if (this.canvas) return;
            
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'explosion-canvas';
            this.canvas.className = 'fixed inset-0 pointer-events-none';
            this.canvas.style.zIndex = '9998';
            this.canvas.style.display = 'block';
            document.body.appendChild(this.canvas);
            
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            
            window.addEventListener('resize', () => this.resize());
            this.animate();
        },
        
        /**
         * Resize canvas to match viewport
         */
        resize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },
        
        /**
         * Create explosion at coordinates
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {string} color - Particle color
         * @param {number} intensity - Explosion intensity (default: 50)
         */
        createExplosion(x, y, color = '#ff6b35', intensity = 50) {
            if (!this.canvas) this.init();
            
            const particleCount = Math.floor(intensity * 0.8);
            const baseColors = color.split(',') || [color];
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
                const speed = 2 + Math.random() * 8;
                const size = 2 + Math.random() * 6;
                const life = 30 + Math.random() * 40;
                const particleColor = baseColors[Math.floor(Math.random() * baseColors.length)];
                
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: size,
                    life: life,
                    maxLife: life,
                    color: particleColor.trim(),
                    gravity: 0.15,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2
                });
            }
            
            this.active = true;
        },
        
        /**
         * Animation loop
         */
        animate() {
            if (!this.ctx || !this.canvas) return;
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and draw particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.rotation += p.rotationSpeed;
                p.life--;
                
                // Fade out
                const alpha = p.life / p.maxLife;
                
                // Draw particle
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                this.ctx.restore();
                
                // Remove dead particles
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
            
            if (this.particles.length > 0 || this.active) {
                requestAnimationFrame(() => this.animate());
            } else {
                this.active = false;
            }
        }
    };
    
    /**
     * Glitch Effect System
     * Creates screen glitch/distortion effects
     */
    ScreenEffects.GlitchSystem = {
        /**
         * Apply RGB shift glitch
         * @param {number} duration - Duration in ms
         * @param {number} intensity - Glitch intensity (0-1)
         */
        rgbShift(duration = 200, intensity = 0.5) {
            const glitchLayer = document.createElement('div');
            glitchLayer.className = 'glitch-overlay fixed inset-0 pointer-events-none';
            glitchLayer.style.zIndex = '9999';
            glitchLayer.style.mixBlendMode = 'screen';
            glitchLayer.style.opacity = '0';
            
            // Clone body content with RGB shifts
            const clone = document.body.cloneNode(true);
            clone.style.filter = 'hue-rotate(90deg)';
            clone.style.transform = 'translate(2px, 0)';
            glitchLayer.appendChild(clone);
            
            document.body.appendChild(glitchLayer);
            
            // Animate with GSAP or CSS
            if (typeof gsap !== 'undefined') {
                gsap.to(glitchLayer, {
                    opacity: intensity,
                    duration: duration / 1000 / 2,
                    ease: 'power2.inOut',
                    yoyo: true,
                    repeat: Math.floor(duration / 100),
                    onComplete: () => glitchLayer.remove()
                });
            } else {
                glitchLayer.style.opacity = intensity.toString();
                glitchLayer.style.transition = `opacity ${duration / 2}ms ease-in-out`;
                setTimeout(() => {
                    glitchLayer.style.opacity = '0';
                    setTimeout(() => glitchLayer.remove(), duration / 2);
                }, duration / 2);
            }
        },
        
        /**
         * Apply screen shake effect
         * @param {number} duration - Duration in ms
         * @param {number} intensity - Shake intensity (default: 10)
         */
        screenShake(duration = 300, intensity = 10) {
            const body = document.body;
            const originalTransform = body.style.transform || '';
            
            if (typeof gsap !== 'undefined') {
                gsap.to(body, {
                    x: () => (Math.random() - 0.5) * intensity * 2,
                    y: () => (Math.random() - 0.5) * intensity * 2,
                    duration: duration / 1000,
                    ease: 'power2.out',
                    repeat: Math.floor(duration / 50),
                    onComplete: () => {
                        gsap.set(body, { clearProps: 'transform' });
                    }
                });
            } else if (typeof anime !== 'undefined') {
                anime({
                    targets: body,
                    translateX: () => (Math.random() - 0.5) * intensity * 2,
                    translateY: () => (Math.random() - 0.5) * intensity * 2,
                    duration: duration,
                    easing: 'easeOutQuad',
                    complete: () => {
                        body.style.transform = originalTransform;
                    }
                });
            }
        },
        
        /**
         * Apply digital noise/static effect
         * @param {number} duration - Duration in ms
         */
        staticNoise(duration = 150) {
            const noiseOverlay = document.createElement('div');
            noiseOverlay.className = 'static-noise fixed inset-0 pointer-events-none';
            noiseOverlay.style.zIndex = '9999';
            noiseOverlay.style.opacity = '0.3';
            noiseOverlay.style.background = `
                repeating-linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.1),
                    rgba(0, 0, 0, 0.1) 1px,
                    transparent 1px,
                    transparent 2px
                ),
                repeating-linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.05),
                    transparent 1px,
                    transparent 2px
                )
            `;
            noiseOverlay.style.backgroundSize = '4px 4px';
            noiseOverlay.style.animation = 'staticFlicker 0.1s infinite';
            
            document.body.appendChild(noiseOverlay);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(noiseOverlay, {
                    opacity: 0.3,
                    duration: duration / 1000 / 4,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => noiseOverlay.remove()
                });
            } else {
                setTimeout(() => noiseOverlay.remove(), duration);
            }
        }
    };
    
    /**
     * Full-Screen Overlay Effects
     * Creates immersive full-screen visual effects
     */
    ScreenEffects.FullScreenOverlay = {
        /**
         * Flash effect - quick white/color flash
         * @param {string} color - Flash color (default: white)
         * @param {number} duration - Duration in ms
         */
        flash(color = '#ffffff', duration = 200) {
            const flashOverlay = document.createElement('div');
            flashOverlay.className = 'flash-overlay fixed inset-0 pointer-events-none';
            flashOverlay.style.zIndex = '10000';
            flashOverlay.style.backgroundColor = color;
            flashOverlay.style.opacity = '0';
            
            document.body.appendChild(flashOverlay);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(flashOverlay, {
                    opacity: 0.8,
                    duration: duration / 1000 / 2,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => flashOverlay.remove()
                });
            } else {
                flashOverlay.style.transition = `opacity ${duration / 2}ms ease-out`;
                flashOverlay.style.opacity = '0.8';
                setTimeout(() => {
                    flashOverlay.style.opacity = '0';
                    setTimeout(() => flashOverlay.remove(), duration / 2);
                }, duration / 2);
            }
        },
        
        /**
         * Radial burst effect from center
         * @param {string} color - Burst color
         * @param {number} intensity - Burst intensity
         */
        radialBurst(color = '#ff6b35', intensity = 1.0) {
            const burstOverlay = document.createElement('div');
            burstOverlay.className = 'radial-burst fixed inset-0 pointer-events-none';
            burstOverlay.style.zIndex = '9999';
            burstOverlay.style.background = `radial-gradient(circle, ${color}80 0%, transparent 70%)`;
            burstOverlay.style.opacity = '0';
            
            document.body.appendChild(burstOverlay);
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(burstOverlay,
                    { opacity: 0, scale: 0.5 },
                    {
                        opacity: intensity * 0.6,
                        scale: 2,
                        duration: 0.4,
                        ease: 'power2.out',
                        onComplete: () => {
                            gsap.to(burstOverlay, {
                                opacity: 0,
                                duration: 0.3,
                                onComplete: () => burstOverlay.remove()
                            });
                        }
                    }
                );
            } else {
                burstOverlay.style.transition = 'all 0.4s ease-out';
                burstOverlay.style.opacity = (intensity * 0.6).toString();
                burstOverlay.style.transform = 'scale(2)';
                setTimeout(() => {
                    burstOverlay.style.opacity = '0';
                    setTimeout(() => burstOverlay.remove(), 300);
                }, 400);
            }
        },
        
        /**
         * Achievement celebration overlay
         * @param {string} title - Achievement title
         */
        achievementCelebration(title) {
            const celebration = document.createElement('div');
            celebration.className = 'achievement-celebration fixed inset-0 pointer-events-none flex items-center justify-center';
            celebration.style.zIndex = '10001';
            celebration.innerHTML = `
                <div class="celebration-content text-center">
                    <div class="text-9xl mb-4 animate-bounce">🎉</div>
                    <div class="text-4xl font-bold text-primary mb-2">${title}</div>
                    <div class="text-2xl text-base-content/70">BREAKING THE META!</div>
                </div>
            `;
            
            document.body.appendChild(celebration);
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(celebration,
                    { opacity: 0, scale: 0.8 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.5,
                        ease: 'back.out(2)',
                        onComplete: () => {
                            setTimeout(() => {
                                gsap.to(celebration, {
                                    opacity: 0,
                                    scale: 1.2,
                                    duration: 0.4,
                                    onComplete: () => celebration.remove()
                                });
                            }, 2000);
                        }
                    }
                );
            } else {
                celebration.style.opacity = '0';
                celebration.style.transform = 'scale(0.8)';
                celebration.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                
                setTimeout(() => {
                    celebration.style.opacity = '1';
                    celebration.style.transform = 'scale(1)';
                    
                    setTimeout(() => {
                        celebration.style.opacity = '0';
                        celebration.style.transform = 'scale(1.2)';
                        setTimeout(() => celebration.remove(), 400);
                    }, 2000);
                }, 10);
            }
        },
        
        /**
         * Level up full-screen effect
         */
        levelUp() {
            // Combine multiple effects
            this.flash('#ff6b35', 300);
            this.radialBurst('#ffd700', 1.5);
            
            setTimeout(() => {
                ScreenEffects.GlitchSystem.rgbShift(400, 0.3);
                ScreenEffects.GlitchSystem.screenShake(500, 15);
            }, 150);
            
            // Create level up text
            const levelText = document.createElement('div');
            levelText.className = 'level-up-text fixed inset-0 pointer-events-none flex items-center justify-center';
            levelText.style.zIndex = '10002';
            levelText.innerHTML = `
                <div class="text-center">
                    <div class="text-8xl font-bold text-primary mb-4" style="text-shadow: 0 0 20px currentColor;">LEVEL UP!</div>
                    <div class="text-3xl text-accent">The Meta Trembles</div>
                </div>
            `;
            
            document.body.appendChild(levelText);
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(levelText,
                    { opacity: 0, scale: 0.5, rotation: -10 },
                    {
                        opacity: 1,
                        scale: 1.2,
                        rotation: 0,
                        duration: 0.6,
                        ease: 'back.out(2)',
                        onComplete: () => {
                            setTimeout(() => {
                                gsap.to(levelText, {
                                    opacity: 0,
                                    scale: 1.5,
                                    rotation: 10,
                                    duration: 0.4,
                                    onComplete: () => levelText.remove()
                                });
                            }, 1500);
                        }
                    }
                );
            } else {
                levelText.style.opacity = '0';
                levelText.style.transform = 'scale(0.5) rotate(-10deg)';
                levelText.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                
                setTimeout(() => {
                    levelText.style.opacity = '1';
                    levelText.style.transform = 'scale(1.2) rotate(0deg)';
                    
                    setTimeout(() => {
                        levelText.style.opacity = '0';
                        levelText.style.transform = 'scale(1.5) rotate(10deg)';
                        setTimeout(() => levelText.remove(), 400);
                    }, 1500);
                }, 10);
            }
        }
    };
    
    /**
     * Integrate with gamification system
     */
    ScreenEffects.integrateGamification = function() {
        if (!window.game) {
            setTimeout(() => ScreenEffects.integrateGamification(), 500);
            return;
        }
        
        const game = window.game;
        
        // Enhance unlockAchievement
        if (game.unlockAchievement) {
            const originalUnlockAchievement = game.unlockAchievement.bind(game);
            game.unlockAchievement = function(id, name, description, bonusPoints) {
                const result = originalUnlockAchievement(id, name, description, bonusPoints);
                
                // Create explosion at random screen position
                const x = window.innerWidth * 0.3 + Math.random() * window.innerWidth * 0.4;
                const y = window.innerHeight * 0.3 + Math.random() * window.innerHeight * 0.4;
                ScreenEffects.ExplosionSystem.createExplosion(x, y, '#ff6b35, #ffd700, #ff3366', 80);
                
                // Apply glitch effects
                ScreenEffects.GlitchSystem.rgbShift(300, 0.4);
                ScreenEffects.GlitchSystem.staticNoise(200);
                
                // Show achievement celebration
                ScreenEffects.FullScreenOverlay.achievementCelebration(name);
                
                return result;
            };
        }
        
        // Enhance levelUp
        if (game.levelUp) {
            const originalLevelUp = game.levelUp?.bind(game);
            if (originalLevelUp) {
                game.levelUp = function() {
                    const result = originalLevelUp();
                    
                    // Full level up sequence
                    ScreenEffects.FullScreenOverlay.levelUp();
                    
                    // Multiple explosions
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            const x = Math.random() * window.innerWidth;
                            const y = Math.random() * window.innerHeight;
                            ScreenEffects.ExplosionSystem.createExplosion(x, y, '#ffd700, #ff6b35', 60);
                        }, i * 100);
                    }
                    
                    return result;
                };
            }
        }
        
        // Enhance addPoints for large point gains
        if (game.addPoints) {
            const originalAddPoints = game.addPoints.bind(game);
            game.addPoints = function(amount, reason, showPopup) {
                const result = originalAddPoints(amount, reason, showPopup);
                
                // Large point gains get explosion effect
                if (amount > 500) {
                    const popup = document.getElementById('scorePopup');
                    if (popup) {
                        const rect = popup.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;
                        ScreenEffects.ExplosionSystem.createExplosion(x, y, '#00ff00, #00ffff', 40);
                        ScreenEffects.FullScreenOverlay.flash('#00ff0080', 150);
                    }
                }
                
                return result;
            };
        }
        
        // Enhance foundEasterEgg
        if (game.foundEasterEgg) {
            const originalFoundEasterEgg = game.foundEasterEgg.bind(game);
            game.foundEasterEgg = function(eggId, eggName, points) {
                const result = originalFoundEasterEgg(eggId, eggName, points);
                
                // Glitch effect for easter eggs
                ScreenEffects.GlitchSystem.rgbShift(250, 0.3);
                ScreenEffects.GlitchSystem.staticNoise(150);
                
                // Small explosion
                const egg = document.querySelector(`[data-secret="${eggId}"]`);
                if (egg) {
                    const rect = egg.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    ScreenEffects.ExplosionSystem.createExplosion(x, y, '#ff00ff, #00ffff', 30);
                }
                
                return result;
            };
        }
        
        // Enhance activatePowerup
        if (game.activatePowerup) {
            const originalActivatePowerup = game.activatePowerup.bind(game);
            game.activatePowerup = function(type) {
                const result = originalActivatePowerup(type);
                
                // Power-up specific effects
                const button = document.getElementById(`powerup${['multiplier', 'reveal', 'freeze'].indexOf(type) + 1}`);
                if (button) {
                    const rect = button.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    ScreenEffects.ExplosionSystem.createExplosion(x, y, '#ffff00, #ff6600', 50);
                    ScreenEffects.FullScreenOverlay.radialBurst('#ffff0080', 0.8);
                }
                
                return result;
            };
        }
        
        // Enhance checkHighScore
        if (game.checkHighScore) {
            const originalCheckHighScore = game.checkHighScore.bind(game);
            game.checkHighScore = function() {
                const result = originalCheckHighScore();
                
                if (result) {
                    // High score celebration
                    ScreenEffects.FullScreenOverlay.flash('#ffd700', 400);
                    ScreenEffects.GlitchSystem.screenShake(600, 20);
                    
                    // Multiple golden explosions
                    for (let i = 0; i < 8; i++) {
                        setTimeout(() => {
                            const x = Math.random() * window.innerWidth;
                            const y = Math.random() * window.innerHeight;
                            ScreenEffects.ExplosionSystem.createExplosion(x, y, '#ffd700, #ffaa00', 70);
                        }, i * 80);
                    }
                }
                
                return result;
            };
        }
        
        console.log('ScreenEffects: Integrated with gamification system');
    };
    
    // Initialize on DOM ready
    function init() {
        ScreenEffects.ExplosionSystem.init();
        
        // Integrate after gamification loads
        if (window.game) {
            ScreenEffects.integrateGamification();
        } else {
            window.addEventListener('gameReady', () => {
                ScreenEffects.integrateGamification();
            }, { once: true });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

