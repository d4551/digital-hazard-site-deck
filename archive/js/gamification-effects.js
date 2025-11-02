// Gamification Effects Module - Sound effects and animations
// Integrates with existing gamification.js and audio-engine.js
// Uses GSAP/Anime.js for animations, daisyUI for UI patterns

(function() {
    'use strict';
    
    // Namespace to prevent conflicts
    if (!window.DHGameEffects) {
        window.DHGameEffects = {};
    }
    
    const GameEffects = window.DHGameEffects;
    
    /**
     * Sound Effects Manager
     * Integrates with AudioEngine for gamification sound effects
     */
    GameEffects.SoundManager = {
        /**
         * Play sound effect using AudioEngine or fallback
         * @param {string} type - Sound type
         * @param {number} volume - Volume multiplier (0-1)
         */
        play(type, volume = 1.0) {
            // Check if audio is enabled
            if (window.CONFIG && !window.CONFIG.GAME?.AUDIO_ENABLED) {
                return;
            }
            
            // Check for reduced motion preference
            if (window.CONFIG?.FEATURES?.REDUCED_MOTION) {
                return;
            }
            
            // Use AudioEngine if available
            if (window.audioEngine && typeof window.audioEngine.playSound === 'function') {
                const originalVolume = window.audioEngine.sfxVolume;
                if (volume !== 1.0) {
                    window.audioEngine.sfxVolume = Math.max(0, Math.min(1, originalVolume * volume));
                }
                window.audioEngine.playSound(type);
                if (volume !== 1.0) {
                    window.audioEngine.sfxVolume = originalVolume;
                }
                return;
            }
            
            // Fallback: Create simple Web Audio API sound
            this.playFallback(type, volume);
        },
        
        /**
         * Initialize audio context on user interaction
         */
        initAudioContext() {
            if (this.audioContext && this.audioContext.state !== 'closed') {
                return;
            }
            
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            
            try {
                this.audioContext = new AudioContextClass();
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().catch(() => {
                        console.warn('AudioContext resume requires user interaction');
                    });
                }
            } catch (error) {
                console.warn('Failed to initialize AudioContext:', error);
            }
        },
        
        /**
         * Fallback sound effect using Web Audio API
         */
        playFallback(type, volume = 1.0) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                
                // Use existing context or create one (requires user interaction)
                if (!this.audioContext) {
                    // Only create if we have user interaction
                    if (document.hasFocus()) {
                        this.audioContext = new AudioContextClass();
                    } else {
                        // Store intent to play, will be created on next interaction
                        return;
                    }
                }
                
                const context = this.audioContext;
                if (context.state === 'suspended') {
                    // Resume requires user interaction - queue for next interaction
                    context.resume().catch(() => {
                        // Will be created on next user interaction
                    });
                    return;
                }
                
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                gainNode.gain.value = 0.3 * volume;
                gainNode.connect(context.destination);
                oscillator.connect(gainNode);
                
                const now = context.currentTime;
                
                switch(type) {
                    case 'points':
                    case 'collect':
                        oscillator.type = 'triangle';
                        oscillator.frequency.value = 523.25; // C5
                        oscillator.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
                        gainNode.gain.setValueAtTime(0.3 * volume, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                        oscillator.start(now);
                        oscillator.stop(now + 0.15);
                        break;
                        
                    case 'achievement':
                    case 'levelup':
                        oscillator.type = 'square';
                        oscillator.frequency.value = 523.25;
                        oscillator.frequency.linearRampToValueAtTime(659.25, now + 0.1);
                        oscillator.frequency.linearRampToValueAtTime(783.99, now + 0.2);
                        gainNode.gain.setValueAtTime(0.4 * volume, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                        oscillator.start(now);
                        oscillator.stop(now + 0.3);
                        break;
                        
                    case 'combo':
                        oscillator.type = 'square';
                        oscillator.frequency.value = 440;
                        oscillator.frequency.linearRampToValueAtTime(880, now + 0.08);
                        gainNode.gain.setValueAtTime(0.35 * volume, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                        oscillator.start(now);
                        oscillator.stop(now + 0.12);
                        break;
                        
                    case 'powerup':
                        oscillator.type = 'triangle';
                        oscillator.frequency.value = 261.63;
                        oscillator.frequency.linearRampToValueAtTime(523.25, now + 0.2);
                        gainNode.gain.setValueAtTime(0.4 * volume, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                        oscillator.start(now);
                        oscillator.stop(now + 0.25);
                        break;
                        
                    case 'quest':
                        oscillator.type = 'sine';
                        oscillator.frequency.value = 659.25; // E5
                        oscillator.frequency.linearRampToValueAtTime(783.99, now + 0.15);
                        gainNode.gain.setValueAtTime(0.3 * volume, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                        oscillator.start(now);
                        oscillator.stop(now + 0.2);
                        break;
                        
                    case 'easteregg':
                        // Mysterious shimmering sound
                        oscillator.type = 'triangle';
                        oscillator.frequency.value = 440;
                        oscillator.frequency.linearRampToValueAtTime(659.25, now + 0.1);
                        oscillator.frequency.linearRampToValueAtTime(880, now + 0.2);
                        gainNode.gain.setValueAtTime(0.25 * volume, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                        oscillator.start(now);
                        oscillator.stop(now + 0.25);
                        break;
                        
                    default:
                        oscillator.type = 'sine';
                        oscillator.frequency.value = 440;
                        gainNode.gain.setValueAtTime(0.2 * volume, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                        oscillator.start(now);
                        oscillator.stop(now + 0.1);
                }
            } catch (e) {
                console.warn('GameEffects: Failed to play fallback sound', e);
            }
        }
    };
    
    /**
     * Animation Manager
     * Uses GSAP and Anime.js for UI animations
     */
    GameEffects.AnimationManager = {
        /**
         * Animate score popup with enhanced animations
         * Features: Dynamic scaling based on points, smoother easing, better timing
         */
        animateScorePopup(element, points) {
            if (!element) return;
            
            // Calculate animation intensity based on points value
            const intensity = Math.min(1.2, 1 + (points / 1000) * 0.2); // Scale up to 1.2x for high scores
            const durationMultiplier = points > 500 ? 1.3 : 1.0; // Longer duration for big scores
            
            // Use GSAP if available (preferred - smoothest animations)
            if (typeof gsap !== 'undefined') {
                // Set initial state
                gsap.set(element, {
                        opacity: 0,
                    scale: 0.3,
                    y: 0,
                    rotation: -15,
                    transformOrigin: 'center center'
                });
                
                // Animate in with bounce
                gsap.to(element, {
                        opacity: 1,
                    scale: intensity,
                    y: -40,
                    rotation: 0,
                    duration: 0.5 * durationMultiplier,
                    ease: 'elastic.out(1, 0.5)', // More pronounced bounce
                        onComplete: () => {
                        // Slight pulse for emphasis
                        gsap.to(element, {
                            scale: intensity * 1.05,
                            duration: 0.15,
                            yoyo: true,
                            repeat: 1,
                            ease: 'power2.inOut',
                            onComplete: () => {
                                // Fade out with slight upward movement
                            gsap.to(element, {
                                opacity: 0,
                                    scale: intensity * 0.7,
                                    y: -60,
                                    rotation: 5,
                                    duration: 0.4,
                                    delay: 0.8,
                                ease: 'power2.in'
                            });
                        }
                        });
                    }
                });
                return;
            }
            
            // Use Anime.js if available
            if (typeof anime !== 'undefined') {
                const timeline = anime.timeline({
                    easing: 'easeOutElastic',
                    duration: 500 * durationMultiplier
                });
                
                timeline
                    .add({
                    targets: element,
                        opacity: [0, 1],
                        scale: [0.3, intensity],
                        translateY: [0, -40],
                        rotate: [-15, 0],
                        duration: 500 * durationMultiplier,
                        easing: 'easeOutElastic(1, .5)'
                    })
                    .add({
                        targets: element,
                        scale: [intensity, intensity * 1.05, intensity],
                        duration: 300,
                        easing: 'easeInOutQuad'
                    })
                    .add({
                        targets: element,
                        opacity: [1, 0],
                        scale: [intensity, intensity * 0.7],
                        translateY: [-40, -60],
                        rotate: [0, 5],
                        duration: 400,
                        delay: 800,
                        easing: 'easeInQuad'
                });
                return;
            }
            
            // Enhanced fallback CSS animation with keyframes
            const keyframes = [
                { opacity: 0, transform: 'scale(0.3) translateY(0) rotate(-15deg)' },
                { opacity: 1, transform: `scale(${intensity}) translateY(-40px) rotate(0deg)` },
                { opacity: 1, transform: `scale(${intensity * 1.05}) translateY(-40px) rotate(0deg)` },
                { opacity: 1, transform: `scale(${intensity}) translateY(-40px) rotate(0deg)` },
                { opacity: 0, transform: `scale(${intensity * 0.7}) translateY(-60px) rotate(5deg)` }
            ];
            
            element.animate(keyframes, {
                duration: 1700 * durationMultiplier,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                fill: 'forwards'
            });
        },
        
        /**
         * Animate achievement notification with enhanced entrance
         * Features: Slide in from right with rotation, bounce, pulse, then slide out
         */
        animateAchievement(element) {
            if (!element) return;
            
            if (typeof gsap !== 'undefined') {
                // Create timeline for complex animation sequence
                const tl = gsap.timeline();
                
                // Set initial state
                gsap.set(element, {
                        opacity: 0,
                    x: 500,
                    y: 0,
                    rotation: 15,
                    scale: 0.5,
                    transformOrigin: 'right center'
                });
                
                // Slide in with bounce
                tl.to(element, {
                        opacity: 1,
                        x: 0,
                    y: 0,
                    rotation: 0,
                        scale: 1,
                    duration: 0.6,
                    ease: 'back.out(1.4)'
                })
                // Pulse for emphasis
                .to(element, {
                    scale: 1.08,
                    y: -5,
                    duration: 0.2,
                    ease: 'power2.out'
                })
                .to(element, {
                    scale: 1,
                    y: 0,
                    duration: 0.2,
                    ease: 'power2.in'
                })
                // Hold visible
                .to({}, { duration: 4.0 })
                // Slide out with slight rotation
                .to(element, {
                                    opacity: 0,
                    x: 500,
                    y: 20,
                    rotation: -15,
                    scale: 0.8,
                    duration: 0.4,
                                    ease: 'power2.in'
                                });
                
                return;
            }
            
            if (typeof anime !== 'undefined') {
                const timeline = anime.timeline({
                    easing: 'easeOutElastic',
                    duration: 600
                });
                
                timeline
                    .add({
                    targets: element,
                        opacity: [0, 1],
                        translateX: [500, 0],
                        translateY: [0, 0],
                        rotate: [15, 0],
                        scale: [0.5, 1],
                        duration: 600,
                    easing: 'easeOutElastic(1, .8)'
                    })
                    .add({
                        targets: element,
                        scale: [1, 1.08, 1],
                        translateY: [0, -5, 0],
                        duration: 400,
                        easing: 'easeInOutQuad'
                    })
                    .add({
                        targets: element,
                        opacity: [1, 0],
                        translateX: [0, 500],
                        translateY: [0, 20],
                        rotate: [0, -15],
                        scale: [1, 0.8],
                        duration: 400,
                        delay: 4000,
                        easing: 'easeInQuad'
                });
                return;
            }
            
            // Enhanced fallback with Web Animations API
            const keyframes = [
                { opacity: 0, transform: 'translateX(500px) translateY(0) rotate(15deg) scale(0.5)' },
                { opacity: 1, transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)' },
                { opacity: 1, transform: 'translateX(0) translateY(-5px) rotate(0deg) scale(1.08)' },
                { opacity: 1, transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)' },
                { opacity: 0, transform: 'translateX(500px) translateY(20px) rotate(-15deg) scale(0.8)' }
            ];
            
            element.animate(keyframes, {
                duration: 5600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                fill: 'forwards'
            });
        },
        
        /**
         * Animate combo counter with dynamic scaling based on combo value
         * Features: Larger bounce for higher combos, rotation, glow effect
         */
        animateCombo(element, comboValue = 0) {
            if (!element) return;
            
            // Calculate intensity based on combo value
            const intensity = Math.min(1.4, 1.0 + (comboValue / 20) * 0.4); // Scale up to 1.4x for high combos
            const rotationAmount = comboValue > 5 ? 10 : 5;
            
            if (typeof gsap !== 'undefined') {
                // Create more dramatic animation for higher combos
                const tl = gsap.timeline();
                
                tl.fromTo(element,
                    {
                        scale: 0.4,
                        rotation: -rotationAmount * 2,
                        filter: 'brightness(0.5)'
                    },
                    {
                        scale: intensity,
                        rotation: rotationAmount,
                        filter: 'brightness(1.5)',
                        duration: 0.3,
                        ease: 'back.out(1.8)'
                    }
                )
                .to(element, {
                    scale: intensity * 0.95,
                    rotation: 0,
                    filter: 'brightness(1.2)',
                    duration: 0.2,
                    ease: 'power2.inOut'
                })
                .to(element, {
                    scale: 1,
                    rotation: 0,
                    filter: 'brightness(1)',
                    duration: 0.2,
                    ease: 'power2.inOut'
                });
                
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    scale: [0.4, intensity, intensity * 0.95, 1],
                    rotate: [-rotationAmount * 2, rotationAmount, 0],
                    filter: ['brightness(0.5)', 'brightness(1.5)', 'brightness(1.2)', 'brightness(1)'],
                    duration: 700,
                    easing: 'easeOutElastic(1, .6)'
                });
                return;
            }
            
            // Fallback with Web Animations API
            const keyframes = [
                { transform: 'scale(0.4) rotate(-15deg)', filter: 'brightness(0.5)' },
                { transform: `scale(${intensity}) rotate(${rotationAmount}deg)`, filter: 'brightness(1.5)' },
                { transform: `scale(${intensity * 0.95}) rotate(0deg)`, filter: 'brightness(1.2)' },
                { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' }
            ];
            
            element.animate(keyframes, {
                duration: 700,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                fill: 'forwards'
            });
        },
        
        /**
         * Pulse animation for power-up buttons
         */
        animatePowerupButton(element, active = false) {
            if (!element) return;
            
            if (typeof gsap !== 'undefined') {
                if (active) {
                    gsap.to(element, {
                        scale: 1.2,
                        duration: 0.2,
                        yoyo: true,
                        repeat: 3,
                        ease: 'power2.inOut'
                    });
                } else {
                    gsap.to(element, {
                        scale: 1.1,
                        duration: 0.15,
                        yoyo: true,
                        repeat: 1,
                        ease: 'power2.inOut'
                    });
                }
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    scale: active ? [1, 1.2, 1] : [1, 1.1, 1],
                    duration: active ? 800 : 300,
                    easing: 'easeInOutQuad'
                });
            }
        },
        
        /**
         * Shake animation for errors/warnings
         */
        shake(element) {
            if (!element) return;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(element, {
                    x: [0, -10, 10, -10, 10, 0],
                    duration: 0.5,
                    ease: 'power2.inOut'
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    translateX: [0, -10, 10, -10, 10, 0],
                    duration: 500,
                    easing: 'easeInOutQuad'
                });
            }
        },
        
        /**
         * Level up celebration animation
         */
        celebrateLevelUp(element) {
            if (!element) return;
            
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline();
                tl.to(element, {
                    scale: 1.3,
                    rotation: 5,
                    duration: 0.3,
                    ease: 'power2.out'
                })
                .to(element, {
                    scale: 1,
                    rotation: -5,
                    duration: 0.2
                })
                .to(element, {
                    scale: 1.1,
                    rotation: 0,
                    duration: 0.3,
                    ease: 'back.out(2)'
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    scale: [1, 1.3, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                    duration: 800,
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        },
        
        /**
         * Rotate/spin animation with multiple styles
         */
        rotateSpin(element, style = 'normal') {
            if (!element) return;
            
            const styles = {
                normal: { rotation: 360, duration: 0.6 },
                fast: { rotation: 720, duration: 0.4 },
                slow: { rotation: 360, duration: 1.0 },
                bounce: { rotation: [0, 180, 360], duration: 0.8 },
                reverse: { rotation: -360, duration: 0.6 }
            };
            
            const config = styles[style] || styles.normal;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(element, {
                    rotation: config.rotation,
                    duration: config.duration,
                    ease: style === 'bounce' ? 'bounce.out' : 'power2.inOut'
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    rotate: Array.isArray(config.rotation) ? config.rotation : [0, config.rotation],
                    duration: config.duration * 1000,
                    easing: style === 'bounce' ? 'easeOutElastic(1, .8)' : 'easeInOutQuad'
                });
            }
        },
        
        /**
         * Bounce animation with multiple intensities
         */
        bounce(element, intensity = 'medium') {
            if (!element) return;
            
            const intensities = {
                light: { scale: [1, 1.1, 1], duration: 400 },
                medium: { scale: [1, 1.2, 1], duration: 600 },
                heavy: { scale: [1, 1.4, 0.9, 1], duration: 800 },
                extreme: { scale: [1, 1.6, 0.8, 1.2, 1], duration: 1000 }
            };
            
            const config = intensities[intensity] || intensities.medium;
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(element, 
                    { scale: 1 },
                    {
                        scale: config.scale[1] || 1.2,
                        duration: config.duration / 1000,
                        yoyo: true,
                        repeat: config.scale.length > 3 ? 2 : 1,
                        ease: 'power2.out'
                    }
                );
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    scale: config.scale,
                    duration: config.duration,
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        },
        
        /**
         * Flip animation - 3D rotation
         */
        flip(element, direction = 'horizontal') {
            if (!element) return;
            
            const axes = {
                horizontal: { rotationY: 360 },
                vertical: { rotationX: 360 },
                both: { rotationY: 360, rotationX: 180 }
            };
            
            const axis = axes[direction] || axes.horizontal;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(element, {
                    ...axis,
                    duration: 0.6,
                    ease: 'power2.inOut',
                    transformPerspective: 1000
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                const props = {};
                if (axis.rotationY !== undefined) props.rotateY = [0, axis.rotationY];
                if (axis.rotationX !== undefined) props.rotateX = [0, axis.rotationX];
                
                anime({
                    targets: element,
                    ...props,
                    duration: 600,
                    easing: 'easeInOutQuad',
                    perspective: 1000
                });
            }
        },
        
        /**
         * Wave animation - sequential element animation
         */
        wave(elements, delay = 50) {
            if (!elements || elements.length === 0) return;
            
            const elementArray = Array.isArray(elements) ? elements : [elements];
            
            if (typeof gsap !== 'undefined') {
                elementArray.forEach((el, index) => {
                    if (el) {
                        gsap.fromTo(el,
                            { y: 0, opacity: 0.5 },
                            {
                                y: -20,
                                opacity: 1,
                                duration: 0.3,
                                delay: (index * delay) / 1000,
                                yoyo: true,
                                repeat: 1,
                                ease: 'power2.inOut'
                            }
                        );
                    }
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: elementArray,
                    translateY: [0, -20, 0],
                    opacity: [0.5, 1, 0.5],
                    duration: 800,
                    delay: anime.stagger(delay),
                    easing: 'easeInOutQuad'
                });
            }
        },
        
        /**
         * Ripple effect from a point
         */
        ripple(element, centerX, centerY, color = 'primary') {
            if (!element) return;
            
            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            ripple.style.position = 'absolute';
            ripple.style.left = `${centerX}px`;
            ripple.style.top = `${centerY}px`;
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.borderRadius = '50%';
            ripple.style.border = `2px solid hsl(var(--${color}))`;
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = '9999';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.opacity = '0.8';
            
            document.body.appendChild(ripple);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(ripple, {
                    width: 200,
                    height: 200,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    onComplete: () => ripple.remove()
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: ripple,
                    width: [20, 200],
                    height: [20, 200],
                    opacity: [0.8, 0],
                    duration: 800,
                    easing: 'easeOutQuad',
                    complete: () => ripple.remove()
                });
            }
        },
        
        /**
         * Zigzag animation - chaotic movement
         */
        zigzag(element, intensity = 'medium') {
            if (!element) return;
            
            const intensities = {
                light: { distance: 10, duration: 400 },
                medium: { distance: 20, duration: 600 },
                heavy: { distance: 30, duration: 800 }
            };
            
            const config = intensities[intensity] || intensities.medium;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(element, {
                    x: [0, config.distance, -config.distance, config.distance, -config.distance, 0],
                    y: [0, -config.distance, config.distance, -config.distance, config.distance, 0],
                    duration: config.duration / 1000,
                    ease: 'power2.inOut'
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    translateX: [0, config.distance, -config.distance, config.distance, -config.distance, 0],
                    translateY: [0, -config.distance, config.distance, -config.distance, config.distance, 0],
                    duration: config.duration,
                    easing: 'easeInOutQuad'
                });
            }
        },
        
        /**
         * Pulsate animation - breathing effect
         */
        pulsate(element, duration = 2000) {
            if (!element) return;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(element, {
                    scale: 1.15,
                    opacity: 0.8,
                    duration: duration / 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    scale: [1, 1.15, 1],
                    opacity: [1, 0.8, 1],
                    duration: duration,
                    easing: 'easeInOutSine',
                    loop: true
                });
            }
        },
        
        /**
         * Stagger animation - random delay elements
         */
        stagger(elements, baseDelay = 100, randomize = true) {
            if (!elements || elements.length === 0) return;
            
            const elementArray = Array.isArray(elements) ? elements : [elements];
            
            if (typeof gsap !== 'undefined') {
                elementArray.forEach((el, index) => {
                    if (el) {
                        const delay = randomize ? 
                            (index * baseDelay + Math.random() * baseDelay) / 1000 :
                            (index * baseDelay) / 1000;
                        
                        gsap.fromTo(el,
                            { scale: 0, opacity: 0 },
                            {
                                scale: 1,
                                opacity: 1,
                                duration: 0.4,
                                delay: delay,
                                ease: 'back.out(1.7)'
                            }
                        );
                    }
                });
                return;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: elementArray,
                    scale: [0, 1],
                    opacity: [0, 1],
                    duration: 400,
                    delay: anime.stagger(baseDelay, { start: 0 }),
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        },
        
        /**
         * Glow pulse animation - color intensity
         */
        glowPulse(element, color = 'primary', intensity = 'medium') {
            if (!element) return;
            
            const intensities = {
                light: { scale: 1.05, duration: 1000 },
                medium: { scale: 1.1, duration: 800 },
                heavy: { scale: 1.2, duration: 600 }
            };
            
            const config = intensities[intensity] || intensities.medium;
            
            if (typeof gsap !== 'undefined') {
                const glow = gsap.to(element, {
                    boxShadow: `0 0 20px hsl(var(--${color})), 0 0 40px hsl(var(--${color}))`,
                    scale: config.scale,
                    duration: config.duration / 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
                
                // Store glow animation for cleanup
                if (!element._glowAnimation) {
                    element._glowAnimation = glow;
                }
                
                return glow;
            }
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: element,
                    boxShadow: [
                        '0 0 10px hsl(var(--' + color + '))',
                        '0 0 30px hsl(var(--' + color + '))',
                        '0 0 10px hsl(var(--' + color + '))'
                    ],
                    scale: [1, config.scale, 1],
                    duration: config.duration,
                    easing: 'easeInOutSine',
                    loop: true
                });
            }
        },
        
        /**
         * Matrix rain effect (for high scores/milestones)
         */
        matrixRain(container) {
            if (!container || prefersReducedMotion) return;
            
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()';
            const columns = Math.floor(window.innerWidth / 20);
            const drops = Array(columns).fill(0);
            
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9998';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            document.body.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#0F4';
            ctx.font = '15px monospace';
            
            let frame = 0;
            const animate = () => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                for (let i = 0; i < drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    const x = i * 20;
                    const y = drops[i] * 20;
                    
                    ctx.fillStyle = '#0F4';
                    ctx.fillText(text, x, y);
                    
                    if (y > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
                
                frame++;
                if (frame < 60) {
                    requestAnimationFrame(animate);
                } else {
                    canvas.remove();
                }
            };
            
            animate();
        },
        
        /**
         * Score-based animation selection - picks style based on points
         */
        animateScorePopupVaried(element, points) {
            if (!element) return;
            
            // Choose animation style based on point value
            let style;
            if (points >= 1000) style = 'epic';
            else if (points >= 500) style = 'extreme';
            else if (points >= 300) style = 'heavy';
            else if (points >= 200) style = 'medium';
            else if (points >= 100) style = 'light';
            else style = 'normal';
            
            const styles = {
                normal: () => this.animateScorePopup(element, points),
                light: () => {
                    this.bounce(element, 'light');
                    this.animateScorePopup(element, points);
                },
                medium: () => {
                    this.bounce(element, 'medium');
                    this.rotateSpin(element, 'normal');
                    this.animateScorePopup(element, points);
                },
                heavy: () => {
                    this.bounce(element, 'heavy');
                    this.flip(element, 'horizontal');
                    this.animateScorePopup(element, points);
                },
                extreme: () => {
                    this.bounce(element, 'extreme');
                    this.zigzag(element, 'heavy');
                    this.glowPulse(element, 'primary', 'heavy');
                    this.animateScorePopup(element, points);
                },
                epic: () => {
                    this.bounce(element, 'extreme');
                    this.flip(element, 'both');
                    this.zigzag(element, 'heavy');
                    this.glowPulse(element, 'accent', 'heavy');
                    this.matrixRain(document.body);
                    this.animateScorePopup(element, points);
                }
            };
            
            const animator = styles[style] || styles.normal;
            animator();
        }
    };
    
    /**
     * UI Enhancement Manager
     * Adds daisyUI loading animations and visual feedback
     */
    GameEffects.UIManager = {
        /**
         * Show loading spinner on power-up button during cooldown
         */
        showPowerupCooldown(buttonId, duration) {
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            // Add daisyUI loading spinner
            const loading = button.querySelector('.loading') || document.createElement('span');
            if (!loading.classList.contains('loading')) {
                loading.className = 'loading loading-spinner loading-sm absolute inset-0 m-auto opacity-50';
                button.appendChild(loading);
            }
            
            // Animate cooldown overlay
            const cooldownOverlay = button.querySelector(`#${buttonId}Cooldown`);
            if (cooldownOverlay && typeof gsap !== 'undefined') {
                gsap.fromTo(cooldownOverlay,
                    { opacity: 0, scale: 1 },
                    { opacity: 0.9, duration: 0.2 }
                );
                
                // Animate circular progress (simulated)
                gsap.to(cooldownOverlay, {
                    rotation: 360,
                    duration: duration / 1000,
                    ease: 'none'
                });
            }
        },
        
        /**
         * Hide loading spinner from power-up button
         */
        hidePowerupCooldown(buttonId) {
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            const loading = button.querySelector('.loading');
            if (loading) {
                if (typeof gsap !== 'undefined') {
                    gsap.to(loading, {
                        opacity: 0,
                        scale: 0,
                        duration: 0.2,
                        onComplete: () => loading.remove()
                    });
                } else {
                    loading.remove();
                }
            }
        },
        
        /**
         * Add badge indicator with animation
         */
        addBadgeIndicator(element, text, color = 'primary') {
            if (!element) return;
            
            // Check if indicator already exists
            let indicator = element.querySelector('.indicator-item');
            if (!indicator) {
                // Wrap element in indicator if not already wrapped
                const wrapper = document.createElement('div');
                wrapper.className = 'indicator';
                element.parentNode.insertBefore(wrapper, element);
                wrapper.appendChild(element);
                
                indicator = document.createElement('span');
                indicator.className = `indicator-item indicator-top indicator-end badge badge-${color} badge-sm`;
                wrapper.appendChild(indicator);
            }
            
            indicator.textContent = text;
            indicator.style.display = 'block';
            
            // Animate appearance
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(indicator,
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }
                );
            }
        },
        
        /**
         * Remove badge indicator
         */
        removeBadgeIndicator(element) {
            if (!element) return;
            
            const indicator = element.querySelector('.indicator-item');
            if (indicator) {
                if (typeof gsap !== 'undefined') {
                    gsap.to(indicator, {
                        scale: 0,
                        opacity: 0,
                        duration: 0.2,
                        onComplete: () => {
                            indicator.style.display = 'none';
                        }
                    });
                } else {
                    indicator.style.display = 'none';
                }
            }
        }
    };
    
    /**
     * Main integration function
     * Enhances gamification methods with sound and animations
     */
    GameEffects.enhanceGamification = function() {
        if (!window.game) {
            console.warn('GameEffects: window.game not found, retrying...');
            setTimeout(() => GameEffects.enhanceGamification(), 500);
            return;
        }
        
        const game = window.game;
        
        // Prevent double-wrapping
        if (game._effectsEnhanced) {
            if (window.CONFIG?.DEBUG) {
                console.log('GameEffects: Already enhanced, skipping');
            }
            return;
        }
        game._effectsEnhanced = true;
        
        // Enhance addPoints method
        const originalAddPoints = game.addPoints.bind(game);
        game.addPoints = function(amount, reason, showPopup) {
            const result = originalAddPoints(amount, reason, showPopup);
            
            // Play sound effect
            GameEffects.SoundManager.play('points', amount > 100 ? 1.2 : 1.0);
            
            // Enhance score popup animation
            if (showPopup) {
                const popup = document.getElementById('scorePopup');
                if (popup) {
                    GameEffects.AnimationManager.animateScorePopup(popup, amount);
                }
            }
            
            return result;
        };
        
        // Enhance unlockAchievement method
        const originalUnlockAchievement = game.unlockAchievement.bind(game);
        game.unlockAchievement = function(id, name, description, bonusPoints) {
            const result = originalUnlockAchievement(id, name, description, bonusPoints);
            
            // Play achievement sound
            GameEffects.SoundManager.play('achievement', 1.2);
            
            // Animate achievement notification
            setTimeout(() => {
                const notification = document.getElementById('achievementNotification');
                if (notification) {
                    GameEffects.AnimationManager.animateAchievement(notification);
                }
            }, 100);
            
            return result;
        };
        
        // Enhance levelUp method
        const originalLevelUp = game.levelUp?.bind(game);
        if (originalLevelUp) {
            game.levelUp = function() {
                const result = originalLevelUp();
                
                // Play level up sound
                GameEffects.SoundManager.play('levelup', 1.3);
                
                // Animate level display
                const levelDisplay = document.getElementById('levelNumber');
                if (levelDisplay) {
                    GameEffects.AnimationManager.celebrateLevelUp(levelDisplay.parentElement);
                }
                
                return result;
            };
        }
        
        // Enhance incrementCombo method
        const originalIncrementCombo = game.incrementCombo?.bind(game);
        if (originalIncrementCombo) {
            game.incrementCombo = function() {
                const result = originalIncrementCombo();
                
                // Play combo sound for combos > 3
                if (this.combo > 3) {
                    GameEffects.SoundManager.play('combo', Math.min(1.5, 1.0 + (this.combo - 3) * 0.1));
                }
                
                // Animate combo counter
                const comboCounter = document.getElementById('comboCounter');
                const comboValue = game.combo || 0;
                if (comboCounter) {
                    GameEffects.AnimationManager.animateCombo(comboCounter, comboValue);
                }
                
                const comboNumber = document.getElementById('comboNumber');
                if (comboNumber) {
                    GameEffects.AnimationManager.animateCombo(comboNumber, comboValue);
                }
                
                return result;
            };
        }
        
        // Enhance activatePowerup method
        const originalActivatePowerup = game.activatePowerup?.bind(game);
        if (originalActivatePowerup) {
            game.activatePowerup = function(type) {
                const result = originalActivatePowerup(type);
                
                // Play power-up sound
                GameEffects.SoundManager.play('powerup', 1.1);
                
                // Animate power-up button
                const buttonId = `powerup${['multiplier', 'reveal', 'freeze'].indexOf(type) + 1}`;
                const button = document.getElementById(buttonId);
                if (button) {
                    GameEffects.AnimationManager.animatePowerupButton(button, true);
                }
                
                return result;
            };
        }
        
        // Enhance foundEasterEgg method (actual method name in gamification.js)
        if (game.foundEasterEgg && typeof game.foundEasterEgg === 'function') {
            const originalFoundEasterEgg = game.foundEasterEgg.bind(game);
            game.foundEasterEgg = function(eggId, eggName, points) {
                const result = originalFoundEasterEgg(eggId, eggName, points);
                
                // Play easter egg sound
                GameEffects.SoundManager.play('easteregg', 0.9);
                
                return result;
            };
        }
        
        // Also enhance discoverEasterEgg if it exists (alias method)
        if (game.discoverEasterEgg && typeof game.discoverEasterEgg === 'function') {
            const originalDiscoverEasterEgg = game.discoverEasterEgg.bind(game);
            game.discoverEasterEgg = function(eggId, eggName, points) {
                const result = originalDiscoverEasterEgg(eggId, eggName, points);
                
                // Play easter egg sound
                GameEffects.SoundManager.play('easteregg', 0.9);
                
                return result;
            };
        }
        
        // Enhance completeQuest method (if exists)
        if (game.completeQuest && typeof game.completeQuest === 'function') {
            const originalCompleteQuest = game.completeQuest.bind(game);
            game.completeQuest = function(questId, reward) {
                const result = originalCompleteQuest(questId, reward);
                
                // Play quest completion sound
                GameEffects.SoundManager.play('quest', 1.1);
                
                return result;
            };
        }
        
        // Enhance updateQuestProgress method (if exists)
        if (game.updateQuestProgress && typeof game.updateQuestProgress === 'function') {
            const originalUpdateQuestProgress = game.updateQuestProgress.bind(game);
            game.updateQuestProgress = function(questId, progress) {
                const result = originalUpdateQuestProgress(questId, progress);
                
                // Play subtle quest progress sound
                // Use questMap instead of quests (property name in UnifiedGamificationManager)
                if (this.questMap && this.questMap[questId]) {
                    const quest = this.questMap[questId];
                    if (quest && quest.completed && progress > 0) {
                        GameEffects.SoundManager.play('quest', 1.1);
                    }
                }
                
                return result;
            };
        }
        
        // GameEffects initialized (silent - only log in dev mode)
    if (window.CONFIG?.DEBUG) {
        console.log('GameEffects: Gamification enhanced with sound and animations');
    }
    };
    
    // Initialize AudioContext on user interaction (fixes console warnings)
    let audioInitialized = false;
    let audioInitHandlers = null;
    
    function initAudioOnInteraction() {
        if (audioInitialized) return;
        
        const initAudio = () => {
            if (audioInitialized) return;
            audioInitialized = true;
            
            if (window.DHGameEffects?.SoundManager) {
                window.DHGameEffects.SoundManager.initAudioContext();
            }
            
            // Clean up listeners after initialization
            if (audioInitHandlers) {
                audioInitHandlers.forEach(({ event, handler }) => {
                    document.removeEventListener(event, handler);
                });
                audioInitHandlers = null;
            }
        };
        
        // Store handlers for cleanup
        audioInitHandlers = [];
        const events = ['click', 'keydown', 'touchstart', 'mousedown'];
        
        events.forEach(event => {
            const handler = initAudio;
            audioInitHandlers.push({ event, handler });
            document.addEventListener(event, handler, { once: true, passive: true });
        });
    }
    
    // Auto-enhance when DOM and game are ready
    function init() {
        // Initialize audio on user interaction
        initAudioOnInteraction();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => GameEffects.enhanceGamification(), 500);
            });
        } else {
            setTimeout(() => GameEffects.enhanceGamification(), 500);
        }
    }
    
    // Wait for CONFIG if needed
    if (window.CONFIG_READY) {
        init();
    } else {
        window.addEventListener('configReady', init, { once: true });
    }
    
})();

