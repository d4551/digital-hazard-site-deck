/**
 * Shared Animation Utilities
 * DRY principles: Centralized animation patterns using GSAP and ScrollTrigger
 * Based on Context7 GSAP documentation and best practices
 */

(function() {
    'use strict';
    
    if (!window.DHAnimations) {
        window.DHAnimations = {};
    }
    
    const Animations = window.DHAnimations;
    let gsapRegistered = false;
    let scrollTriggerRegistered = false;
    
    /**
     * Register GSAP plugins (prevents duplicate registration)
     */
    Animations.registerGSAP = function() {
        if (gsapRegistered) return Promise.resolve();
        
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded');
            return Promise.reject(new Error('GSAP not available'));
        }
        
        if (typeof ScrollTrigger !== 'undefined' && !scrollTriggerRegistered) {
            try {
                gsap.registerPlugin(ScrollTrigger);
                scrollTriggerRegistered = true;
            } catch (e) {
                console.warn('ScrollTrigger registration failed:', e);
            }
        }
        
        gsapRegistered = true;
        return Promise.resolve();
    };
    
    /**
     * Animate element on scroll (ScrollTrigger pattern)
     * @param {string|HTMLElement} target - Target selector or element
     * @param {Object} animationProps - GSAP animation properties
     * @param {Object} triggerOptions - ScrollTrigger options
     * @returns {Object} GSAP animation and ScrollTrigger instance
     */
    Animations.scrollIn = function(target, animationProps = {}, triggerOptions = {}) {
        return Animations.registerGSAP().then(() => {
            if (typeof gsap === 'undefined') return null;
            
            const defaults = {
                y: 80,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out'
            };
            
            const animProps = Object.assign({}, defaults, animationProps);
            
            const scrollDefaults = {
                trigger: target,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
                once: true
            };
            
            const scrollProps = Object.assign({}, scrollDefaults, triggerOptions);
            
            return gsap.from(target, {
                ...animProps,
                scrollTrigger: scrollProps
            });
        });
    };
    
    /**
     * Batch scroll animations for multiple elements
     * @param {string|Array} targets - Target selectors or elements
     * @param {Object} options - Animation options
     * @returns {Array} Array of animations
     */
    Animations.scrollInBatch = function(targets, options = {}) {
        return Animations.registerGSAP().then(() => {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                return [];
            }
            
            const {
                stagger = 0.15,
                y = 100,
                opacity = 0,
                scale = 0.8,
                duration = 0.8,
                ease = 'back.out(1.7)',
                start = 'top 90%'
            } = options;
            
            const elements = Array.isArray(targets) ? targets : Array.from(document.querySelectorAll(targets));
            
            return ScrollTrigger.batch(elements, {
                onEnter: (batch) => {
                    gsap.from(batch, {
                        y,
                        opacity,
                        scale,
                        duration,
                        stagger,
                        ease,
                        scrollTrigger: {
                            trigger: batch[0],
                            start,
                            toggleActions: 'play none none reverse'
                        }
                    });
                },
                once: true
            });
        });
    };
    
    /**
     * Animate counter (number increment)
     * @param {HTMLElement} element - Target element
     * @param {number} target - Target value
     * @param {Object} options - Animation options
     */
    Animations.animateCounter = function(element, target, options = {}) {
        if (!element) return;
        
        const {
            duration = 2000,
            suffix = '',
            decimals = 0,
            easing = 'easeOutExpo'
        } = options;
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: { val: 0 },
                val: target,
                duration,
                easing,
                update: function(anim) {
                    const value = anim.animations[0].currentValue;
                    if (decimals > 0) {
                        element.textContent = value.toFixed(decimals) + suffix;
                    } else {
                        element.textContent = Math.floor(value) + suffix;
                    }
                }
            });
        } else {
            // Fallback: instant update
            element.textContent = (decimals > 0 ? target.toFixed(decimals) : Math.floor(target)) + suffix;
        }
    };
    
    /**
     * Setup counter animations for all elements with data-target attribute
     * @param {Object} options - Options
     */
    Animations.setupCounters = function(options = {}) {
        return Animations.registerGSAP().then(() => {
            if (typeof ScrollTrigger === 'undefined') return;
            
            const elements = document.querySelectorAll('[data-target]');
            
            elements.forEach(element => {
                const target = parseFloat(element.getAttribute('data-target'));
                const suffix = element.getAttribute('data-suffix') || '';
                const decimals = element.getAttribute('data-decimals');
                
                ScrollTrigger.create({
                    trigger: element,
                    start: 'top 80%',
                    onEnter: () => {
                        Animations.animateCounter(element, target, {
                            suffix,
                            decimals: decimals ? parseInt(decimals) : 0
                        });
                    },
                    once: true
                });
            });
        });
    };
    
    /**
     * Fade in element
     * @param {string|HTMLElement} target - Target
     * @param {Object} options - Options
     */
    Animations.fadeIn = function(target, options = {}) {
        return Animations.registerGSAP().then(() => {
            if (typeof gsap === 'undefined') {
                // Fallback: CSS animation
                const el = typeof target === 'string' ? document.querySelector(target) : target;
                if (el) {
                    el.style.opacity = '0';
                    el.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => el.style.opacity = '1', 10);
                }
                return;
            }
            
            const {
                duration = 0.5,
                delay = 0,
                ease = 'power2.out'
            } = options;
            
            return gsap.to(target, {
                opacity: 1,
                duration,
                delay,
                ease
            });
        });
    };
    
    /**
     * Fade out element
     * @param {string|HTMLElement} target - Target
     * @param {Object} options - Options
     */
    Animations.fadeOut = function(target, options = {}) {
        return Animations.registerGSAP().then(() => {
            if (typeof gsap === 'undefined') {
                // Fallback: CSS animation
                const el = typeof target === 'string' ? document.querySelector(target) : target;
                if (el) {
                    el.style.transition = 'opacity 0.5s ease';
                    el.style.opacity = '0';
                }
                return;
            }
            
            const {
                duration = 0.5,
                delay = 0,
                ease = 'power2.in',
                remove = false
            } = options;
            
            const anim = gsap.to(target, {
                opacity: 0,
                duration,
                delay,
                ease,
                onComplete: () => {
                    if (remove) {
                        const el = typeof target === 'string' ? document.querySelector(target) : target;
                        if (el) el.remove();
                    }
                }
            });
            
            return anim;
        });
    };
    
    /**
     * Scale element
     * @param {string|HTMLElement} target - Target
     * @param {number} scale - Scale value
     * @param {Object} options - Options
     */
    Animations.scale = function(target, scale, options = {}) {
        return Animations.registerGSAP().then(() => {
            if (typeof gsap === 'undefined') return;
            
            const {
                duration = 0.3,
                ease = 'back.out(1.7)'
            } = options;
            
            return gsap.to(target, {
                scale,
                duration,
                ease
            });
        });
    };
    
    
    /**
     * Apply glitch effect
     * @param {string|HTMLElement} target - Target
     * @param {Object} options - Options
     */
    Animations.glitch = function(target, options = {}) {
        return Animations.registerGSAP().then(() => {
            if (typeof gsap === "undefined") return;
            
            const {
                duration = 0.5,
                intensity = 1,
                repeats = 1
            } = options;
            
            const tl = gsap.timeline();
            tl.to(target, {
                x: "random(-5, 5)",
                y: "random(-5, 5)",
                duration: duration / 10,
                repeat: 10,
                yoyo: true,
                ease: "power2.inOut"
            });
            
            return tl;
        });
    }
    // Auto-register on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            Animations.registerGSAP();
        });
    } else {
        Animations.registerGSAP();
    }
    
    window.DHAnimations = Animations;
})();
