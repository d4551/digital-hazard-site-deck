/**
 * Presentation Effects Manager
 * Dramatic glitch effects, animations, and screen-wide visual impact
 * for presentation gamification system
 */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const PresentationEffects = {
        // Track last score/level check to avoid spam
        lastScoreCheck: null,
        lastLevelCheck: null,
        
        /**
         * Apply chromatic aberration glitch effect
         */
        chromaticGlitch(element, duration = 500) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('chromatic-glitch');
            element.setAttribute('data-text', element.textContent || element.innerText);

            setTimeout(() => {
                element.classList.remove('chromatic-glitch');
                element.removeAttribute('data-text');
            }, duration);
        },

        /**
         * Create screen flash effect
         */
        screenFlash(color = 'primary', duration = 400) {
            if (prefersReducedMotion) return;

            const flash = document.createElement('div');
            flash.className = `screen-flash ${color}`;
            document.body.appendChild(flash);

            setTimeout(() => {
                flash.remove();
            }, duration);
        },

        /**
         * Apply dramatic screen shake with intensity levels
         * Enhanced with GSAP for smoother shake if available
         */
        screenShake(intensity = 'medium') {
            if (prefersReducedMotion) return;

            const shakeConfig = {
                'low': { duration: 400, strength: 3, count: 5 },
                'medium': { duration: 600, strength: 6, count: 8 },
                'high': { duration: 800, strength: 10, count: 12 }
            };
            
            const config = shakeConfig[intensity] || shakeConfig.medium;

            // Trigger additional glitch overlays for a more intense distortion feel
            if (window.DHScreenEffects && window.DHScreenEffects.GlitchSystem) {
                const glitchSystem = window.DHScreenEffects.GlitchSystem;
                const rgbShift = typeof glitchSystem.rgbShift === 'function'
                    ? glitchSystem.rgbShift.bind(glitchSystem)
                    : null;
                const staticNoise = typeof glitchSystem.staticNoise === 'function'
                    ? glitchSystem.staticNoise.bind(glitchSystem)
                    : null;

                if (rgbShift) {
                    const rgbDuration = Math.max(220, config.duration + 120);
                    const rgbIntensity = Math.min(0.95, 0.35 + (config.strength / 10) * 0.45);
                    requestAnimationFrame(() => rgbShift(rgbDuration, rgbIntensity));
                }

                if (staticNoise) {
                    const noiseDuration = Math.max(200, config.duration);
                    requestAnimationFrame(() => staticNoise(noiseDuration));
                }
            }

            // Apply temporary distortion filter classes mapped to intensity
            const distortionClass = intensity === 'high'
                ? 'screen-distortion-strong'
                : intensity === 'low'
                    ? 'screen-distortion-soft'
                    : 'screen-distortion';

            document.body.classList.remove('screen-distortion-soft', 'screen-distortion', 'screen-distortion-strong');

            // Force reflow so the animation restarts even if class was just removed
            void document.body.offsetWidth;

            document.body.classList.add(distortionClass);
            setTimeout(() => {
                document.body.classList.remove(distortionClass);
            }, config.duration + 300);

            // Use GSAP if available for smoother shake
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline();
                const shakeStrength = config.strength;
                
                for (let i = 0; i < config.count; i++) {
                    const offset = (i / config.count) * config.duration;
                    tl.to(document.body, {
                        x: (Math.random() - 0.5) * shakeStrength * 2,
                        y: (Math.random() - 0.5) * shakeStrength * 2,
                        rotation: (Math.random() - 0.5) * shakeStrength * 0.3,
                        duration: 0.05,
                        ease: 'power1.inOut'
                    }, offset);
                }
                
                tl.to(document.body, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    duration: 0.2,
                    ease: 'power2.out'
                });
                
                return;
            }

            // Fallback CSS class shake
            const shakeClass = `dramatic-shake-${intensity}`;
            document.body.classList.add(shakeClass);

            setTimeout(() => {
                document.body.classList.remove(shakeClass);
            }, config.duration);
        },

        /**
         * Create scan line effect
         */
        scanLine() {
            if (prefersReducedMotion) return;

            const scan = document.createElement('div');
            scan.className = 'scan-line';
            document.body.appendChild(scan);

            setTimeout(() => {
                scan.remove();
            }, 2000);
        },

        /**
         * Apply data corruption glitch
         */
        dataCorruption(element, duration = 600) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('data-corruption');

            setTimeout(() => {
                element.classList.remove('data-corruption');
            }, duration);
        },

        /**
         * Create radial burst explosion effect with enhanced animation
         * Features: Multi-stage expansion, opacity fade, scale animation
         */
        radialBurst(x, y, color = 'primary', size = 200) {
            if (prefersReducedMotion) return;

            const burst = document.createElement('div');
            burst.className = 'radial-burst-enhanced';
            burst.style.position = 'fixed';
            burst.style.left = `${x - size / 2}px`;
            burst.style.top = `${y - size / 2}px`;
            burst.style.width = `${size}px`;
            burst.style.height = `${size}px`;
            burst.style.pointerEvents = 'none';
            burst.style.zIndex = '9999';
            burst.style.borderRadius = '50%';

            // Enhanced gradient based on color
            if (color === 'primary') {
                burst.style.background = `radial-gradient(circle,
                    rgba(255, 255, 255, 0.95) 0%,
                    hsl(var(--p) / 0.8) 25%,
                    hsl(var(--p) / 0.5) 40%,
                    transparent 70%
                )`;
            } else if (color === 'success') {
                burst.style.background = `radial-gradient(circle,
                    rgba(255, 255, 255, 0.95) 0%,
                    hsl(var(--su) / 0.8) 25%,
                    hsl(var(--su) / 0.5) 40%,
                    transparent 70%
                )`;
            } else if (color === 'warning') {
                burst.style.background = `radial-gradient(circle,
                    rgba(255, 255, 255, 0.95) 0%,
                    hsl(var(--wa) / 0.8) 25%,
                    hsl(var(--wa) / 0.5) 40%,
                    transparent 70%
                )`;
            }

            document.body.appendChild(burst);

            // Enhanced animation with GSAP if available
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(burst, 
                    {
                        scale: 0,
                        opacity: 0,
                        rotation: 0
                    },
                    {
                        scale: 2.5,
                        opacity: 1,
                        rotation: 180,
                        duration: 0.4,
                        ease: 'power2.out'
                    }
                );
                
                gsap.to(burst, {
                    scale: 3.5,
                    opacity: 0,
                    rotation: 360,
                    duration: 0.8,
                    delay: 0.4,
                    ease: 'power2.in',
                    onComplete: () => burst.remove()
                });
            } else {
                // Fallback CSS animation
                burst.style.transition = 'all 1.2s ease-out';
                burst.style.transform = 'scale(0)';
                burst.style.opacity = '0';
                
                requestAnimationFrame(() => {
                    burst.style.transform = 'scale(2.5)';
                    burst.style.opacity = '1';
                    
                    setTimeout(() => {
                        burst.style.transform = 'scale(3.5)';
                        burst.style.opacity = '0';
                        setTimeout(() => burst.remove(), 800);
                    }, 400);
                });
            }
        },

        /**
         * Apply glitch text effect
         */
        glitchText(element, duration = 500) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('glitch-text');
            element.setAttribute('data-text', element.textContent || element.innerText);

            setTimeout(() => {
                element.classList.remove('glitch-text');
                element.removeAttribute('data-text');
            }, duration);
        },

        /**
         * Create achievement explosion effect
         */
        achievementExplosion(x, y) {
            if (prefersReducedMotion) return;

            const explosion = document.createElement('div');
            explosion.className = 'achievement-explosion';
            explosion.style.left = `${x - 150}px`;
            explosion.style.top = `${y - 150}px`;
            document.body.appendChild(explosion);

            setTimeout(() => {
                explosion.remove();
            }, 1500);
        },

        /**
         * Apply digital distortion effect
         */
        digitalDistortion(element, duration = 600) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('digital-distortion');

            setTimeout(() => {
                element.classList.remove('digital-distortion');
            }, duration);
        },

        /**
         * Create energy pulse effect
         */
        energyPulse(element, duration = 1500) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('energy-pulse');

            setTimeout(() => {
                element.classList.remove('energy-pulse');
            }, duration);
        },

        /**
         * Apply combo glow effect
         */
        comboGlow(element, duration = 2000) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('combo-glow');

            setTimeout(() => {
                element.classList.remove('combo-glow');
            }, duration);
        },

        /**
         * Quest banner glitch effect
         */
        questBannerGlitch(element, duration = 800) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('quest-banner-glitch');

            setTimeout(() => {
                element.classList.remove('quest-banner-glitch');
            }, duration);
        },

        /**
         * High combo warning effect
         */
        highComboWarning(element, duration = 1000) {
            if (prefersReducedMotion || !element) return;

            element.classList.add('high-combo-warning');

            setTimeout(() => {
                element.classList.remove('high-combo-warning');
            }, duration);
        },

        /**
         * Dramatic score popup animation
         */
        scorePopupDramatic(element) {
            if (!element) return;

            element.classList.add('score-popup-dramatic');
            // Animation is handled by CSS
        },

        /**
         * Epic achievement celebration
         */
        epicAchievement(title, description) {
            if (prefersReducedMotion) {
                // Simple fallback
                if (window.game) {
                    window.game.showToast(title, 'success');
                }
                return;
            }

            // Screen effects
            this.screenFlash('rainbow', 600);
            this.screenShake('high');
            this.scanLine();

            // Create epic overlay
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 flex items-center justify-center z-[calc(var(--z-presentation-modals)+200)] pointer-events-none';
            overlay.style.background = 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, transparent 70%)';
            
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="text-6xl md:text-9xl font-bold mb-4 glitch-text" data-text="${title}" style="color: hsl(var(--p)); text-shadow: 0 0 20px currentColor;">
                        ${title}
                    </div>
                    <div class="text-xl md:text-3xl text-base-content/90">
                        ${description}
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Explosion at center
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            this.achievementExplosion(centerX, centerY);
            this.radialBurst(centerX, centerY, 'primary');

            // Remove after animation
            setTimeout(() => {
                overlay.remove();
            }, 3000);
        },

        /**
         * Epic combo celebration
         */
        epicCombo(multiplier) {
            if (prefersReducedMotion) return;

            // Screen flash
            this.screenFlash('warning', 300);
            
            // Glitch combo counter
            const comboCounter = document.getElementById('comboCounter');
            if (comboCounter) {
                this.chromaticGlitch(comboCounter, 500);
                this.comboGlow(comboCounter, 2000);
            }

            const comboNumber = document.getElementById('comboNumber');
            if (comboNumber) {
                this.glitchText(comboNumber, 500);
            }

            // High combo warning for multipliers > 10
            if (multiplier > 10) {
                this.screenShake('high');
                this.scanLine();
                
                if (comboCounter) {
                    this.highComboWarning(comboCounter, 1000);
                }
            }
        },

        /**
         * Epic quest completion
         */
        epicQuestComplete(questName) {
            if (prefersReducedMotion) return;

            // Dramatic effects
            this.screenFlash('success', 500);
            this.screenShake('medium');
            this.scanLine();

            // Find quest element and apply glitch
            const questElements = document.querySelectorAll(`[data-quest], .quest-item`);
            questElements.forEach(el => {
                if (el.textContent.includes(questName)) {
                    this.questBannerGlitch(el, 800);
                    this.dataCorruption(el, 600);
                    this.radialBurst(
                        el.getBoundingClientRect().left + el.offsetWidth / 2,
                        el.getBoundingClientRect().top + el.offsetHeight / 2,
                        'success'
                    );
                }
            });
        },

        /**
         * Epic milestone celebration
         */
        epicMilestone(milestoneText, secondaryText = '') {
            if (prefersReducedMotion) {
                // Simple fallback
                if (window.game && window.game.showToast) {
                    window.game.showToast(milestoneText, 'success');
                }
                return;
            }

            // Full screen effects
            this.screenFlash('rainbow', 800);
            this.screenShake('high');
            this.scanLine();

            // Multiple radial bursts
            const bursts = [
                { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
                { x: window.innerWidth * 0.8, y: window.innerHeight * 0.3 },
                { x: window.innerWidth * 0.5, y: window.innerHeight * 0.7 }
            ];

            bursts.forEach((pos, index) => {
                setTimeout(() => {
                    this.radialBurst(pos.x, pos.y, 'primary');
                }, index * 200);
            });

            // Create milestone overlay
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 flex items-center justify-center z-[calc(var(--z-presentation-modals)+200)] pointer-events-none';
            overlay.style.background = 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, transparent 70%)';
            
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="text-5xl md:text-8xl font-bold mb-4 chromatic-glitch" data-text="${milestoneText}" style="color: hsl(var(--p));">
                        ${milestoneText}
                    </div>
                    ${secondaryText ? `<div class="text-2xl md:text-4xl text-base-content/80">${secondaryText}</div>` : ''}
                </div>
            `;

            document.body.appendChild(overlay);

            // Apply glitch to text
            const textElement = overlay.querySelector('.chromatic-glitch');
            if (textElement) {
                setTimeout(() => {
                    this.chromaticGlitch(textElement, 800);
                }, 100);
            }

            // Remove after animation
            setTimeout(() => {
                overlay.remove();
            }, 3000);
        },

        /**
         * Score popup with dramatic effect - tied to score thresholds
         * Enhanced with multi-stage animation and intensity scaling
         */
        dramaticScorePopup(element, points) {
            if (!element) return;
            
            // Calculate intensity based on points
            const isBigScore = points > 500;
            const intensity = isBigScore ? 1.3 : 1.1;
            const shakeIntensity = isBigScore ? 'high' : 'medium';
            
            // Apply screen effects for big scores
            if (isBigScore) {
                this.screenFlash('primary', 200);
                this.screenShake(shakeIntensity);
            }
            
            // Enhanced animation using GSAP if available
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline();
                
                // Initial dramatic entrance
                gsap.set(element, {
                    opacity: 0,
                    scale: 0.2,
                    y: 0,
                    rotation: -20,
                    filter: 'blur(10px) brightness(0.5)'
                });
                
                tl.to(element, {
                    opacity: 1,
                    scale: intensity,
                    y: -50,
                    rotation: 0,
                    filter: 'blur(0px) brightness(1.5)',
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.4)'
                })
                // Pulse sequence
                .to(element, {
                    scale: intensity * 1.15,
                    filter: 'brightness(2)',
                    duration: 0.15,
                    ease: 'power2.out'
                })
                .to(element, {
                    scale: intensity,
                    filter: 'brightness(1.2)',
                    duration: 0.15,
                    ease: 'power2.in'
                })
                // Hold visible
                .to({}, { duration: isBigScore ? 1.2 : 0.8 })
                // Exit animation
                .to(element, {
                    opacity: 0,
                    scale: intensity * 0.6,
                    y: -70,
                    rotation: 10,
                    filter: 'blur(5px) brightness(0.8)',
                    duration: 0.4,
                    ease: 'power2.in'
                });
                
                return;
            }
            
            // Fallback for other animation libraries or CSS
            element.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            element.style.transform = `scale(${intensity}) translateY(-50px)`;
            element.style.opacity = '1';
            element.style.filter = 'brightness(1.5)';
            
            setTimeout(() => {
                element.style.transform = `scale(${intensity * 0.6}) translateY(-70px)`;
                element.style.opacity = '0';
                element.style.filter = 'brightness(0.8)';
            }, isBigScore ? 1200 : 800);

            // Apply dramatic animation class
            this.scorePopupDramatic(element);

            // Score-based glitch effects - multiple thresholds
            if (points >= 500) {
                // EXTREME score (500+) - Maximum drama
                this.screenFlash('rainbow', 400);
                this.screenShake('high');
                this.scanLine();
                setTimeout(() => {
                    this.chromaticGlitch(element, 600);
                }, 200);
            } else if (points >= 300) {
                // Very high score (300-499) - High drama
                this.screenFlash('warning', 300);
                this.screenShake('medium');
                setTimeout(() => {
                    this.chromaticGlitch(element, 500);
                    this.dataCorruption(element, 400);
                }, 200);
            } else if (points >= 200) {
                // High score (200-299) - Medium drama
                this.screenFlash('primary', 250);
                setTimeout(() => {
                    this.chromaticGlitch(element, 400);
                }, 200);
            } else if (points >= 100) {
                // Medium score (100-199) - Light glitch
                setTimeout(() => {
                    this.chromaticGlitch(element, 300);
                }, 200);
            } else if (points >= 50) {
                // Low-medium score (50-99) - Subtle effect
                element.classList.add('score-popup-subtle');
            }
        },
        
        /**
         * Check survival game score and trigger effects based on thresholds
         */
        checkSurvivalGameScore() {
            if (!window.survivalGame || !window.survivalGame.engine) return;
            
            const gameScore = window.survivalGame.engine.score || 0;
            const gameLevel = window.survivalGame.engine.level || 1;
            
            // Score threshold-based dramatic effects
            if (gameScore >= 5000) {
                // LEGENDARY SCORE - Maximum intensity
                if (!this.lastScoreCheck || gameScore !== this.lastScoreCheck) {
                    this.screenFlash('rainbow', 800);
                    this.screenShake('high');
                    this.scanLine();
                    
                    // Multiple radial bursts
                    const bursts = [
                        { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
                        { x: window.innerWidth * 0.8, y: window.innerHeight * 0.7 },
                        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }
                    ];
                    bursts.forEach((pos, index) => {
                        setTimeout(() => {
                            this.radialBurst(pos.x, pos.y, 'primary');
                        }, index * 300);
                    });
                    
                    this.lastScoreCheck = gameScore;
                }
            } else if (gameScore >= 3000) {
                // EPIC SCORE - Very high intensity
                if (!this.lastScoreCheck || gameScore - this.lastScoreCheck >= 500) {
                    this.screenFlash('warning', 600);
                    this.screenShake('medium');
                    this.radialBurst(window.innerWidth / 2, window.innerHeight / 2, 'primary');
                    this.lastScoreCheck = gameScore;
                }
            } else if (gameScore >= 2000) {
                // HIGH SCORE - Medium-high intensity
                if (!this.lastScoreCheck || gameScore - this.lastScoreCheck >= 500) {
                    this.screenFlash('primary', 400);
                    this.screenShake('medium');
                    this.lastScoreCheck = gameScore;
                }
            } else if (gameScore >= 1000) {
                // GOOD SCORE - Medium intensity
                if (!this.lastScoreCheck || gameScore - this.lastScoreCheck >= 300) {
                    this.screenFlash('success', 300);
                    const comboCounter = document.getElementById('comboCounter');
                    if (comboCounter) {
                        this.chromaticGlitch(comboCounter, 400);
                    }
                    this.lastScoreCheck = gameScore;
                }
            } else if (gameScore >= 500) {
                // DECENT SCORE - Light intensity
                if (!this.lastScoreCheck || gameScore - this.lastScoreCheck >= 200) {
                    const scorePopup = document.getElementById('scorePopup');
                    if (scorePopup) {
                        this.chromaticGlitch(scorePopup, 300);
                    }
                    this.lastScoreCheck = gameScore;
                }
            }
            
            // Level-based effects (every 5 levels)
            if (gameLevel > 0 && gameLevel % 5 === 0) {
                if (!this.lastLevelCheck || gameLevel !== this.lastLevelCheck) {
                    this.screenFlash('primary', 500);
                    this.screenShake('medium');
                    this.scanLine();
                    this.radialBurst(window.innerWidth / 2, window.innerHeight / 2, 'primary');
                    this.lastLevelCheck = gameLevel;
                }
            }
        }
    };

    // Enhance existing gamification effects
    function enhanceGamificationEffects() {
        if (!window.game) {
            setTimeout(enhanceGamificationEffects, 500);
            return;
        }

        // Enhance achievement unlock
        const originalUnlockAchievement = window.game.unlockAchievement?.bind(window.game);
        if (originalUnlockAchievement) {
            window.game.unlockAchievement = function(...args) {
                const [achievementId, achievementTitle, achievementDescription, bonusPoints] = args;
                const wasAlreadyUnlocked = Array.isArray(this.achievements)
                    ? this.achievements.some((ach) => ach.id === achievementId)
                    : false;

                const result = originalUnlockAchievement(...args);

                // Skip visuals if nothing new was unlocked (original returns undefined)
                if (wasAlreadyUnlocked) {
                    return result;
                }

                const achievement =
                    Array.isArray(this.achievements)
                        ? this.achievements.find((ach) => ach.id === achievementId)
                        : null;

                const resolvedTitle =
                    achievement?.title || achievementTitle || 'Achievement Unlocked!';
                const resolvedDescription =
                    achievement?.description || achievementDescription || '';
                const resolvedBonus =
                    typeof bonusPoints === 'number'
                        ? bonusPoints
                        : achievement?.rewardPoints || 0;

                if (resolvedBonus >= 200) {
                    PresentationEffects.epicAchievement(resolvedTitle, resolvedDescription);
                } else {
                    PresentationEffects.screenFlash('success', 300);
                    PresentationEffects.dataCorruption(
                        document.getElementById('achievementNotification'),
                        400
                    );
                }

                return result;
            };
        }

        // Enhance combo increments
        const originalIncrementCombo = window.game.incrementCombo?.bind(window.game);
        if (originalIncrementCombo) {
            window.game.incrementCombo = function() {
                const result = originalIncrementCombo();
                
                if (this.combo > 5) {
                    PresentationEffects.epicCombo(this.comboMultiplier);
                }
                
                return result;
            };
        }

        // Enhance quest completion
        const originalUpdateQuestProgress = window.game.updateQuestProgress?.bind(window.game);
        if (originalUpdateQuestProgress) {
            window.game.updateQuestProgress = function(questId, progress) {
                const result = originalUpdateQuestProgress(questId, progress);
                
                // Use questMap instead of quests (property name in UnifiedGamificationManager)
                if (result && this.questMap && this.questMap[questId]) {
                    const quest = this.questMap[questId];
                    const questCard = document.querySelector(`[data-quest-id="${questId}"]`);
                    
                    // Effects when quest completes
                    if (quest.completed && !prefersReducedMotion) {
                        const questName = questCard?.querySelector('[data-quest-name]')?.getAttribute('data-quest-name') || quest.name || questId;
                        PresentationEffects.epicQuestComplete(questName);
                        
                        // Quest card specific effects
                        if (questCard) {
                            PresentationEffects.questBannerGlitch(questCard, 800);
                            PresentationEffects.radialBurst(
                                questCard.getBoundingClientRect().left + questCard.offsetWidth / 2,
                                questCard.getBoundingClientRect().top + questCard.offsetHeight / 2,
                                'success'
                            );
                        }
                    } else if (questCard && !prefersReducedMotion && progress > 0) {
                        // Subtle effect on progress updates (every 25%)
                        const progressBar = questCard.querySelector('progress');
                        if (progressBar && quest.progress % 25 === 0) {
                            PresentationEffects.dataCorruption(questCard, 300);
                        }
                    }
                }
                
                return result;
            };
        }

        // Enhance level up
        const originalLevelUp = window.game.levelUp?.bind(window.game);
        if (originalLevelUp) {
            window.game.levelUp = function() {
                const result = originalLevelUp();
                
                if (result) {
                    PresentationEffects.screenFlash('primary', 500);
                    PresentationEffects.screenShake('medium');
                    PresentationEffects.radialBurst(
                        window.innerWidth / 2,
                        window.innerHeight / 2,
                        'primary'
                    );
                    
                    const levelDisplay = document.getElementById('levelNumber');
                    if (levelDisplay) {
                        PresentationEffects.glitchText(levelDisplay, 600);
                        PresentationEffects.energyPulse(levelDisplay.parentElement, 1500);
                    }
                }
                
                return result;
            };
        }

        // Enhance milestone celebrations
        const originalTriggerMilestone = window.game.triggerMilestoneCelebration?.bind(window.game);
        if (originalTriggerMilestone) {
            window.game.triggerMilestoneCelebration = function(type, mainText, secondaryText = '') {
                PresentationEffects.epicMilestone(mainText, secondaryText);
                // Still call original for backward compatibility
                originalTriggerMilestone(type, mainText, secondaryText);
            };
        }

        // Enhance score popups
        if (window.DHGameEffects?.AnimationManager) {
            const originalAnimateScore = window.DHGameEffects.AnimationManager.animateScorePopup?.bind(window.DHGameEffects.AnimationManager);
            if (originalAnimateScore) {
                window.DHGameEffects.AnimationManager.animateScorePopup = function(element, points) {
                    PresentationEffects.dramaticScorePopup(element, points);
                    originalAnimateScore(element, points);
                };
            }
        }

        // Hook into display update methods to trigger effects on value changes
        const originalUpdateComboDisplay = window.game.updateComboDisplay?.bind(window.game);
        if (originalUpdateComboDisplay) {
            let lastCombo = window.game.combo || 0;
            let lastMultiplier = window.game.comboMultiplier || 1.0;
            
            window.game.updateComboDisplay = function() {
                const result = originalUpdateComboDisplay();
                
                // Trigger effects on combo increase
                if (this.combo > lastCombo && this.combo > 1 && !prefersReducedMotion) {
                    const comboNumber = document.getElementById('comboNumber');
                    if (comboNumber) {
                        if (this.combo > 5) {
                            PresentationEffects.chromaticGlitch(comboNumber, 400);
                        }
                        if (this.combo > 10) {
                            PresentationEffects.glitchText(comboNumber, 500);
                        }
                    }
                    
                    // Epic combo effects for high multipliers
                    if (this.comboMultiplier > lastMultiplier && this.combo > 5) {
                        PresentationEffects.epicCombo(this.comboMultiplier);
                    }
                }
                
                // Multiplier glitch effect
                if (this.comboMultiplier !== lastMultiplier && this.comboMultiplier >= 2.0 && !prefersReducedMotion) {
                    const multiplierEl = document.getElementById('comboMultiplier');
                    if (multiplierEl) {
                        PresentationEffects.glitchText(multiplierEl, 400);
                        PresentationEffects.comboGlow(multiplierEl, 1500);
                    }
                }
                
                lastCombo = this.combo;
                lastMultiplier = this.comboMultiplier;
                
                return result;
            };
        }

        // Hook into level display updates
        const originalUpdateLevelDisplay = window.game.updateLevelDisplay?.bind(window.game);
        if (originalUpdateLevelDisplay) {
            let lastLevel = window.game.level || 1;
            
            window.game.updateLevelDisplay = function() {
                const result = originalUpdateLevelDisplay();
                
                // Trigger effects on level change
                if (this.level !== lastLevel && this.level > lastLevel && !prefersReducedMotion) {
                    const levelNumber = document.getElementById('levelNumber');
                    if (levelNumber) {
                        PresentationEffects.glitchText(levelNumber, 600);
                        PresentationEffects.energyPulse(levelNumber.parentElement, 1500);
                        PresentationEffects.screenFlash('primary', 300);
                    }
                }
                
                lastLevel = this.level;
                return result;
            };
        }

        // Hook into points display updates
        const originalUpdatePointsDisplay = window.game.updatePointsDisplay?.bind(window.game);
        if (originalUpdatePointsDisplay) {
            let lastPoints = window.game.points || 0;
            
            window.game.updatePointsDisplay = function() {
                const result = originalUpdatePointsDisplay();
                
                // Trigger effects on significant point gains
                const pointsGain = this.points - lastPoints;
                if (pointsGain > 0 && !prefersReducedMotion) {
                    const scoreDisplay = document.getElementById('discoveryScore');
                    if (scoreDisplay) {
                        PresentationEffects.energyPulse(scoreDisplay, 500);
                        if (pointsGain >= 50) {
                            PresentationEffects.chromaticGlitch(scoreDisplay, 300);
                        }
                        if (pointsGain >= 200) {
                            PresentationEffects.screenFlash('success', 200);
                        }
                    }
                }
                
                lastPoints = this.points;
                return result;
            };
        }

        // Note: Quest progress effects are already handled in the earlier hook above

        // Enhance power-up activation visual feedback
        const originalActivatePowerup = window.game.activatePowerup?.bind(window.game);
        if (originalActivatePowerup) {
            window.game.activatePowerup = function(type) {
                const result = originalActivatePowerup(type);
                
                if (result && !prefersReducedMotion) {
                    const powerupIndex = type === 'multiplier' ? '1' : type === 'reveal' ? '2' : '3';
                    const powerupEl = document.getElementById(`powerup${powerupIndex}`);
                    
                    if (powerupEl) {
                        PresentationEffects.energyPulse(powerupEl, 1000);
                        PresentationEffects.digitalDistortion(powerupEl, 400);
                        PresentationEffects.screenFlash('primary', 200);
                        PresentationEffects.radialBurst(
                            powerupEl.getBoundingClientRect().left + powerupEl.offsetWidth / 2,
                            powerupEl.getBoundingClientRect().top + powerupEl.offsetHeight / 2,
                            'primary'
                        );
                    }
                }
                
                return result;
            };
        }

        // Enhance showScorePopup to add dramatic effects
        const originalShowScorePopup = window.game.showScorePopup?.bind(window.game);
        if (originalShowScorePopup) {
            window.game.showScorePopup = function(points, message) {
                const result = originalShowScorePopup(points, message);
                const scorePopup = document.getElementById('scorePopup');
                if (scorePopup && !prefersReducedMotion) {
                    PresentationEffects.dramaticScorePopup(scorePopup, points);
                }
                return result;
            };
        }

        // Enhance achievement notification display
        const originalDisplayAchievementNotification = window.game.displayAchievementNotification?.bind(window.game);
        if (originalDisplayAchievementNotification) {
            window.game.displayAchievementNotification = function(title, description, bonusPoints) {
                const result = originalDisplayAchievementNotification(title, description, bonusPoints);
                const notification = document.getElementById('achievementNotification');
                if (notification && !prefersReducedMotion) {
                    const titleEl = notification.querySelector('#achievementTitle');
                    if (titleEl) {
                        setTimeout(() => PresentationEffects.glitchText(titleEl, 500), 100);
                    }
                    PresentationEffects.dataCorruption(notification, 600);
                }
                return result;
            };
        }

        // PresentationEffects initialized (silent - only log in dev mode)
    if (window.CONFIG?.DEBUG) {
        console.log('PresentationEffects: Dramatic effects wired into gamification system');
    }
    }

    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(enhanceGamificationEffects, 500);
        });
    } else {
        setTimeout(enhanceGamificationEffects, 500);
    }

    // Export to global scope
    window.PresentationEffects = PresentationEffects;

})();
