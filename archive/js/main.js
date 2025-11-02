// Unified Main Application Script
// Combines functionality from src/main.js, archive/index.js, and static/index.js

(function() {
    'use strict';

    const prefersReduced = window.DHInit?.prefersReducedMotion?.() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Initialize GSAP - Use shared animation utilities (DRY)
    if (window.DHAnimations && typeof window.DHAnimations.registerGSAP === 'function') {
        window.DHAnimations.registerGSAP();
    } else if (window.DHInit && typeof window.DHInit.initAnimations === 'function') {
        window.DHInit.initAnimations();
    } else if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // Fallback if shared utility not available
        gsap.registerPlugin(ScrollTrigger);
    }

    // Loading Screen
    function initLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('loadingProgress');
        const percentage = document.getElementById('loadingPercentage');
        const tip = document.getElementById('loadingTip');
        
        if (!loadingScreen) return;
        
        const tips = [
            'Pioneering the future of game development',
            'AI-powered content generation',
            'Where pixels rebel and imagination runs wild',
            'Building next-generation gaming experiences',
            'HazardForge AI Engine initializing...'
        ];
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            if (progressBar) {
                progressBar.value = progress;
            }
            if (percentage) {
                percentage.textContent = Math.floor(progress) + '%';
            }
            
            if (tip && progress % 25 < 5) {
                tip.textContent = tips[Math.floor(Math.random() * tips.length)];
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        if (window.game) {
                            window.game.unlockAchievement('first-visit', 'First Visit', 'Welcome to Digital Hazard Studio!', 50);
                        }
                    }, 500);
                }, 500);
            }
        }, 100);
    }

    // Three.js Background - with error handling
    function initThreeJS() {
        try {
            const canvas = document.getElementById('three-canvas');
            if (!canvas) {
                console.warn('Three.js: Canvas element not found');
                return;
            }
            
            if (typeof THREE === 'undefined') {
                // Check if we're running from file:// protocol (won't work with ES modules)
                if (window.location.protocol === 'file:') {
                    // Silent degradation - Three.js background is optional enhancement
                    return; // Don't retry if it's a file:// protocol issue
                }
                
                console.warn('Three.js: Library not loaded, retrying...');
                // Retry after a delay (max 3 retries)
                if (!window.threeJSRetryCount) window.threeJSRetryCount = 0;
                window.threeJSRetryCount++;
                if (window.threeJSRetryCount < 3) {
                    setTimeout(initThreeJS, 500);
                } else {
                    console.warn('Three.js: Max retries reached. Background will not be available.');
                }
                return;
            }
            
            if (!window.CONFIG?.FEATURES?.WEBGL_SUPPORT) {
                console.warn('Three.js: WebGL not supported');
                canvas.style.display = 'none';
                return;
            }
        
        // Ensure canvas element has transparent background
        canvas.style.backgroundColor = 'transparent';
        canvas.style.display = 'block';
        
        const scene = new THREE.Scene();
        // Explicitly set scene background to null for transparency
        scene.background = null;
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas, 
            alpha: true, 
            antialias: true,
            premultipliedAlpha: false 
        });
        
        // Set transparent clear color so 3D background shows through
        renderer.setClearColor(0x000000, 0);
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.position.z = 5;
        
        // Create particles
        const particleCount = prefersReduced ? 100 : 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 20;
            
            colors[i] = Math.random();
            colors[i + 1] = Math.random() * 0.5 + 0.5;
            colors[i + 2] = 1;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particles, material);
        scene.add(particleSystem);
        
        let animationFrameId = null;
        let resizeHandler = null;
        let isPaused = false;
        
        function animate() {
            if (isPaused) return;
            animationFrameId = requestAnimationFrame(animate);
            particleSystem.rotation.x += 0.001;
            particleSystem.rotation.y += 0.002;
            renderer.render(scene, camera);
        }
        
        // Store animation frame globally and expose pause/resume
        window.mainThreeJSAnimation = null;
        window.DHThreeBackground = window.DHThreeBackground || {};
        window.DHThreeBackground.pause = function() {
            isPaused = true;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                window.mainThreeJSAnimation = null;
            }
        };
        window.DHThreeBackground.resume = function() {
            isPaused = false;
            if (!animationFrameId) {
                animate();
            }
        };
        
        // Use throttle from utils if available, otherwise inline implementation
        const throttleResize = (function() {
            if (typeof window.throttle === 'function') {
                return window.throttle;
            }
            let inThrottle = false;
            return function(func, limit) {
                return function(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            };
        })();
        
        resizeHandler = throttleResize(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, window.CONFIG?.PERFORMANCE?.RESIZE_THROTTLE || 100);
        
        window.addEventListener('resize', resizeHandler);
        
        // Cleanup function
        const cleanup = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
            // Dispose Three.js objects
            if (particleSystem) {
                particleSystem.geometry.dispose();
                particleSystem.material.dispose();
            }
            if (renderer) {
                renderer.dispose();
            }
        };
        
        window.addEventListener('beforeunload', cleanup);
        animate();
        window.mainThreeJSAnimation = animationFrameId;
        } catch (error) {
            console.error('Three.js initialization error:', error);
            // Hide canvas on error
            const canvas = document.getElementById('three-canvas');
            if (canvas) {
                canvas.style.display = 'none';
            }
        }
    }

    // Interactive Game (replaces particle canvas)
    function initGame() {
        // Game is now handled by game.js
        // This function can trigger game initialization if needed
        if (window.survivalGame) {
            // Game already initialized
        }
    }
    
    // Legacy particle canvas function (kept for compatibility)
    function initParticleCanvas() {
        const canvas = document.getElementById('demo-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || 800;
        canvas.height = canvas.offsetHeight || 400;
        
        const MAX_PARTICLES = prefersReduced ? 150 : 500;
        let particles = [];
        let isDrawing = false;
        let lastTime = 0;
        
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 5 + 2;
                this.speedX = Math.random() * 4 - 2;
                this.speedY = Math.random() * 4 - 2;
                this.color = `hsl(${Math.random() * 60 + 15}, 100%, 50%)`;
                this.life = 100;
                this.maxLife = 100;
                this.gravity = 0.05;
            }
            
            update() {
                this.speedY += this.gravity;
                this.x += this.speedX;
                this.y += this.speedY;
                this.life--;
                this.size *= 0.98;
            }
            
            draw() {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life / this.maxLife;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        
        canvas.addEventListener('mousedown', () => isDrawing = true);
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const now = Date.now();
                
                if (now - lastTime > 16) {
                    if (particles.length >= MAX_PARTICLES) {
                        particles = particles.slice(-MAX_PARTICLES + 5);
                    }
                    
                    for (let i = 0; i < 5; i++) {
                        particles.push(new Particle(x, y));
                    }
                    
                    if (window.game) {
                        window.game.incrementParticles(5);
                        window.game.addPoints(5, 'Particle created');
                    }
                    
                    lastTime = now;
                }
            }
        });
        
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const particlesToAdd = Math.min(30, MAX_PARTICLES - particles.length);
            
            for (let i = 0; i < particlesToAdd; i++) {
                particles.push(new Particle(x, y));
            }
            
            if (window.game) {
                window.game.incrementParticles(particlesToAdd);
                window.game.addPoints(particlesToAdd, 'Particle burst');
            }
        });
        
        function animate() {
            ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            // Draw connections
            const maxConnections = Math.min(particles.length, 100);
            for (let i = 0; i < maxConnections; i++) {
                const p1 = particles[i];
                if (!p1 || p1.life <= 0) continue;
                
                for (let j = i + 1; j < Math.min(particles.length, i + 10); j++) {
                    const p2 = particles[j];
                    if (!p2 || p2.life <= 0) continue;
                    
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 50) {
                        const alpha = 0.3 * (1 - dist / 50) * Math.min(p1.life / 100, p2.life / 100);
                        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        function handleResize() {
            canvas.width = canvas.offsetWidth || 800;
            canvas.height = canvas.offsetHeight || 400;
        }
        
        window.addEventListener('resize', handleResize);
        animate();
    }

    // Scroll Animations with GSAP - Use shared utilities (DRY)
    function initScrollAnimations() {
        if (prefersReduced) return;
        
        // Use shared animation utilities
        if (window.DHAnimations) {
            // Animate section titles
            window.DHAnimations.scrollIn('.section-title', {
                y: 80,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out'
            });
            
            // Animate feature cards in batch
            window.DHAnimations.scrollInBatch('.feature-card', {
                stagger: 0.15,
                y: 100,
                opacity: 0,
                scale: 0.8,
                duration: 0.8,
                ease: 'back.out(1.7)',
                start: 'top 90%'
            });
            
            // Setup counter animations
            window.DHAnimations.setupCounters();
        } else {
            // Fallback to direct GSAP if utilities not available
            if (typeof gsap === 'undefined') return;
            
            gsap.utils.toArray('.section-title').forEach(title => {
                gsap.from(title, {
                    y: 80,
                    opacity: 0,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: title,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                });
            });
            
            window.DHAnimations?.setupCounters();
        }
    }

    // Smooth Scroll
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offset = 80;
                    const targetPosition = target.offsetTop - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Section Tracking and Scroll-in Animations
    function initSectionTracking() {
        const sections = document.querySelectorAll('section[id]');
        const scrollInSections = document.querySelectorAll('.section-scroll-in');
        
        // Scroll-in animation observer (works with or without GSAP)
        if (scrollInSections.length > 0) {
            const scrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Only observe once for performance
                        scrollObserver.unobserve(entry.target);
                    }
                });
            }, { 
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            scrollInSections.forEach(section => {
                scrollObserver.observe(section);
            });
        }
        
        // Section visit tracking
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (window.game) {
                        window.game.visitSection(sectionId);
                    }
                }
            });
        }, { threshold: 0.5 });
        
        sections.forEach(section => observer.observe(section));
    }

    // Interactive Elements
    function initInteractiveElements() {
        // Feature cards click tracking
        document.querySelectorAll('[data-points]').forEach(element => {
            element.addEventListener('click', function() {
                const points = parseInt(this.getAttribute('data-points') || '10');
                if (window.game && !this.classList.contains('discovered')) {
                    this.classList.add('discovered');
                    window.game.addPoints(points, 'Discovery');
                }
            });
        });
        
        // Mechanic items hover
        document.querySelectorAll('.mechanic-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                if (!prefersReduced) {
                    this.style.transform = 'scale(1.1)';
                }
            });
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }

  // Easter Eggs
  function initEasterEggs() {
    // Konami Code
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
      konamiCode.push(e.code);
      if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
      }
      if (konamiCode.join(',') === konamiSequence.join(',')) {
        if (window.game) {
          window.game.foundEasterEgg('konami', 'Konami Code', 500);
        }
        document.body.classList.add('animate-spin');
        setTimeout(() => {
          document.body.classList.remove('animate-spin');
        }, 2000);
      }
    });
    
    // Logo clicks
    let logoClicks = 0;
    const logo = document.querySelector('.navbar-brand') || document.querySelector('.navbar-start a');
    logo?.addEventListener('click', () => {
      logoClicks++;
      if (logoClicks === 5 && window.game) {
        window.game.foundEasterEgg('logo-master', 'Logo Master', 200);
        logo.classList.add('animate-bounce');
        setTimeout(() => logo.classList.remove('animate-bounce'), 2000);
      }
    });
    
    // Wire up all easter egg elements
    document.querySelectorAll('.easter-egg, [data-secret]').forEach(egg => {
      egg.addEventListener('click', function(e) {
        e.stopPropagation();
        const secret = this.getAttribute('data-secret');
        const points = parseInt(this.getAttribute('data-points') || '100', 10);
        
        if (window.game && secret) {
          const eggName = secret.charAt(0).toUpperCase() + secret.slice(1).replace(/-/g, ' ');
          window.game.foundEasterEgg(secret, eggName, points);
          this.classList.add('opacity-50');
          this.style.pointerEvents = 'none';
        }
    });
  });

    // Wire up all data-points elements
    document.querySelectorAll('[data-points]').forEach(element => {
      if (element.hasAttribute('data-secret')) return; // Already handled
      
      element.addEventListener('click', function() {
        const points = parseInt(this.getAttribute('data-points') || '10', 10);
        if (window.game && !this.classList.contains('discovered')) {
          this.classList.add('discovered');
          window.game.addPoints(points, 'Discovery');
        }
      });
    });
    
    // Email hover easter egg
    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink) {
      let hoverCount = 0;
      emailLink.addEventListener('mouseenter', () => {
        hoverCount++;
        if (hoverCount === 10 && window.game) {
          window.game.foundEasterEgg('email-hover', 'Persistent Contact', 150);
        }
      });
    }
    
    // Social link tracking
    document.querySelectorAll('a[href*="linkedin"], a[href*="discord"], a[href*="instagram"], a[href*="facebook"]').forEach(link => {
      link.addEventListener('click', () => {
        if (window.game) {
          window.game.addPoints(20, 'Social engagement');
        }
      });
    });
    
    // CLICK PATTERN EASTER EGGS
    let clickPattern = [];
    let lastClickTime = 0;
    const patternTimeout = 2000; // 2 seconds to complete pattern
    
    document.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastClickTime > patternTimeout) {
        clickPattern = [];
      }
      clickPattern.push({ x: e.clientX, y: e.clientY, time: now });
      lastClickTime = now;
      
      // Keep only last 10 clicks
      if (clickPattern.length > 10) {
        clickPattern.shift();
      }
      
      // CIRCLE PATTERN - Click in a circular motion
      if (clickPattern.length >= 8) {
        const centerX = clickPattern.reduce((sum, p) => sum + p.x, 0) / clickPattern.length;
        const centerY = clickPattern.reduce((sum, p) => sum + p.y, 0) / clickPattern.length;
        const distances = clickPattern.map(p => Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2)));
        const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length;
        
        // Low variance means clicks are roughly circular
        if (variance < Math.pow(avgDist * 0.3, 2) && avgDist > 50 && window.game) {
          window.game.foundEasterEgg('circle-clicker', 'Circle Master', 250);
          clickPattern = [];
        }
      }
      
      // RAPID CLICKS - 10 clicks in 1 second
      const recentClicks = clickPattern.filter(p => now - p.time < 1000);
      if (recentClicks.length >= 10 && window.game) {
        window.game.foundEasterEgg('rapid-clicker', 'Click Spammer', 300);
        clickPattern = [];
      }
    });
    
    // KEYBOARD SHORTCUT EASTER EGGS
    const keyboardEasterEggs = {
      'KeyD,KeyO,KeyO,KeyM': { id: 'doom', name: 'DOOM Player', points: 666 },
      'KeyI,KeyD,KeyD,KeyQ,KeyD': { id: 'iddqd', name: 'IDDQD Cheat', points: 500 },
      'KeyI,KeyD,KeyK,KeyF,KeyA': { id: 'idkfa', name: 'IDKFA Cheat', points: 500 },
      'KeyU,KeyP,KeyU,KeyP,KeyD,KeyO,KeyW,KeyN': { id: 'upupdown', name: 'Contra Code', points: 400 },
      'KeyT,KeyH,KeyE,KeyT,KeyR,KeyI,KeyX': { id: 'thematrix', name: 'The Matrix', points: 777 },
      'KeyD,KeyE,KeyB,KeyU,KeyG': { id: 'debug', name: 'Debug Mode', points: 300 },
      'KeyP,KeyO,KeyW,KeyE,KeyR': { id: 'power', name: 'POWER USER', points: 400 },
      'KeyC,KeyH,KeyE,KeyA,KeyT': { id: 'cheat', name: 'Cheat Activated', points: 999 },
      'KeyM,KeyA,KeyX,KeyI,KeyM,KeyU,KeyM': { id: 'maximus', name: 'Maximus Decimus', points: 500 },
      'KeyG,KeyO,KeyD,KeyM,KeyO,KeyD,KeyE': { id: 'godmode', name: 'God Mode', points: 1000 }
    };
    
    let keySequence = [];
    const keyTimeout = 3000;
    let lastKeyTime = 0;
    
    document.addEventListener('keydown', (e) => {
      const now = Date.now();
      if (now - lastKeyTime > keyTimeout) {
        keySequence = [];
      }
      
      // Skip if modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey && e.code.startsWith('Shift')) {
        return;
      }
      
      keySequence.push(e.code);
      lastKeyTime = now;
      
      // Keep only last 15 keys
      if (keySequence.length > 15) {
        keySequence.shift();
      }
      
      // Check all keyboard easter eggs
      for (const [sequence, egg] of Object.entries(keyboardEasterEggs)) {
        const seqArray = sequence.split(',');
        const sequenceStr = keySequence.slice(-seqArray.length).join(',');
        if (sequenceStr === sequence && window.game) {
          if (!window.game.easterEggsFound.includes(egg.id)) {
            window.game.foundEasterEgg(egg.id, egg.name, egg.points);
            // Special effects for certain easter eggs
            if (egg.id === 'iddqd' || egg.id === 'godmode') {
              if (window.DHGameEffects?.AnimationManager) {
                window.DHGameEffects.AnimationManager.matrixRain(document.body);
              }
            }
          }
          keySequence = [];
          break;
        }
      }
    });
    
    // TIME-BASED EASTER EGGS
    function checkTimeBasedEggs() {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();
      
      if (window.game) {
        // Midnight easter egg
        if (hour === 0 && minute === 0 && !window.game.easterEggsFound.includes('midnight')) {
          window.game.foundEasterEgg('midnight', 'Midnight Warrior', 400);
        }
        
        // 4:20 easter egg (90s reference)
        if (hour === 16 && minute === 20 && !window.game.easterEggsFound.includes('420')) {
          window.game.foundEasterEgg('420', 'Blaze It', 420);
        }
        
        // 9:11 easter egg (emergency)
        if (hour === 9 && minute === 11 && !window.game.easterEggsFound.includes('emergency')) {
          window.game.foundEasterEgg('emergency', 'Emergency Services', 350);
        }
        
        // Weekend warrior (Saturday)
        if (day === 6 && hour >= 12 && hour < 14 && !window.game.easterEggsFound.includes('weekend-warrior')) {
          window.game.foundEasterEgg('weekend-warrior', 'Weekend Warrior', 250);
        }
      }
    }
    
    // Check every minute
    setInterval(checkTimeBasedEggs, 60000);
    checkTimeBasedEggs(); // Check immediately
    
    // SCROLL PATTERN EASTER EGGS
    let scrollPattern = [];
    let lastScrollTime = 0;
    const scrollPatternTimeout = 3000;
    
    window.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastScrollTime > scrollPatternTimeout) {
        scrollPattern = [];
      }
      
      const scrollY = window.scrollY || window.pageYOffset;
      scrollPattern.push({ y: scrollY, time: now });
      lastScrollTime = now;
      
      if (scrollPattern.length > 20) {
        scrollPattern.shift();
      }
      
      // INFINITE SCROLL - Scroll up and down repeatedly
      if (scrollPattern.length >= 10) {
        const MIN_SCROLL_DELTA = 50; // Minimum pixels to count as intentional scroll
        let directionChanges = 0;
        for (let i = 1; i < scrollPattern.length; i++) {
          const prev = scrollPattern[i - 1].y;
          const curr = scrollPattern[i].y;
          const delta = Math.abs(curr - prev);
          // Only count significant scrolls to avoid false positives from smooth scrolling
          if (delta > MIN_SCROLL_DELTA) {
            if ((prev < curr && i > 1 && scrollPattern[i - 2].y > prev) ||
                (prev > curr && i > 1 && scrollPattern[i - 2].y < prev)) {
              directionChanges++;
            }
          }
        }
        if (directionChanges >= 8 && window.game && !window.game.easterEggsFound.includes('scroll-master')) {
          window.game.foundEasterEgg('scroll-master', 'Scroll Master', 350);
          scrollPattern = [];
        }
      }
      
      // BOTTOM OF PAGE - Scroll to very bottom
      if (scrollY + window.innerHeight >= document.documentElement.scrollHeight - 10) {
        if (window.game && !window.game.easterEggsFound.includes('bottom-reached')) {
          window.game.foundEasterEgg('bottom-reached', 'Bottom Reached', 200);
        }
      }
    });
    
    // MOUSE MOVEMENT PATTERN EASTER EGGS
    let mouseMovements = [];
    let lastMouseTime = 0;
    const mousePatternTimeout = 2000;
    
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastMouseTime > mousePatternTimeout) {
        mouseMovements = [];
      }
      
      mouseMovements.push({ x: e.clientX, y: e.clientY, time: now });
      lastMouseTime = now;
      
      if (mouseMovements.length > 30) {
        mouseMovements.shift();
      }
      
      // FIGURE 8 PATTERN - Mouse moves in figure-8 pattern
      if (mouseMovements.length >= 20) {
        const first = mouseMovements[0];
        const last = mouseMovements[mouseMovements.length - 1];
        const distance = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));
        
        // Check if path crosses itself (figure-8 characteristic)
        let crosses = 0;
        for (let i = 3; i < mouseMovements.length - 3; i++) {
          const p1 = mouseMovements[i];
          const p2 = mouseMovements[i + 1];
          
          for (let j = i + 4; j < mouseMovements.length - 1; j++) {
            const p3 = mouseMovements[j];
            const p4 = mouseMovements[j + 1];
            
            // Simple line intersection check
            const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
            if (Math.abs(denom) > 0.001) {
              crosses++;
            }
          }
        }
        
        if (crosses > 2 && distance > 100 && window.game && !window.game.easterEggsFound.includes('figure-eight')) {
          window.game.foundEasterEgg('figure-eight', 'Figure 8 Master', 400);
          mouseMovements = [];
        }
      }
      
      // RAPID MOVEMENT - Fast mouse movements
      if (mouseMovements.length >= 5) {
        let totalDistance = 0;
        for (let i = 1; i < mouseMovements.length; i++) {
          const dist = Math.sqrt(
            Math.pow(mouseMovements[i].x - mouseMovements[i - 1].x, 2) +
            Math.pow(mouseMovements[i].y - mouseMovements[i - 1].y, 2)
          );
          totalDistance += dist;
        }
        const timeSpan = mouseMovements[mouseMovements.length - 1].time - mouseMovements[0].time;
        const speed = totalDistance / (timeSpan / 1000); // pixels per second
        
        if (speed > 2000 && window.game && !window.game.easterEggsFound.includes('speed-demon')) {
          window.game.foundEasterEgg('speed-demon', 'Speed Demon', 300);
          mouseMovements = [];
        }
      }
    });
    
    // RANDOM HIDDEN CLICKS EASTER EGG - Click specific screen corners
    const cornerClickEggs = {
      'top-left': { id: 'corner-top-left', name: 'Top Left Explorer', points: 150 },
      'top-right': { id: 'corner-top-right', name: 'Top Right Explorer', points: 150 },
      'bottom-left': { id: 'corner-bottom-left', name: 'Bottom Left Explorer', points: 150 },
      'bottom-right': { id: 'corner-bottom-right', name: 'Bottom Right Explorer', points: 150 }
    };
    
    document.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const threshold = 30; // 30px from corner
      
      if (x < threshold && y < threshold && window.game) {
        if (!window.game.easterEggsFound.includes('corner-top-left')) {
          window.game.foundEasterEgg('corner-top-left', 'Top Left Explorer', 150);
        }
      } else if (x > width - threshold && y < threshold && window.game) {
        if (!window.game.easterEggsFound.includes('corner-top-right')) {
          window.game.foundEasterEgg('corner-top-right', 'Top Right Explorer', 150);
        }
      } else if (x < threshold && y > height - threshold && window.game) {
        if (!window.game.easterEggsFound.includes('corner-bottom-left')) {
          window.game.foundEasterEgg('corner-bottom-left', 'Bottom Left Explorer', 150);
        }
      } else if (x > width - threshold && y > height - threshold && window.game) {
        if (!window.game.easterEggsFound.includes('corner-bottom-right')) {
          window.game.foundEasterEgg('corner-bottom-right', 'Bottom Right Explorer', 150);
        }
      }
    });
    
    // 90S REFERENCES EASTER EGGS
    // Right-click 5 times for right-click egg
    let rightClicks = 0;
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      rightClicks++;
      if (rightClicks === 5 && window.game && !window.game.easterEggsFound.includes('right-click-master')) {
        window.game.foundEasterEgg('right-click-master', 'Right Click Master (90s Style)', 250);
        rightClicks = 0;
      }
    });
    
    // Double-click 10 times
    let doubleClicks = 0;
    let lastClick = 0;
    document.addEventListener('dblclick', () => {
      doubleClicks++;
      if (doubleClicks === 10 && window.game && !window.game.easterEggsFound.includes('double-click-master')) {
        window.game.foundEasterEgg('double-click-master', 'Double Click Champion', 300);
        doubleClicks = 0;
      }
    });
    
    // SECRET CODE ENTRY - Type specific phrases
    let typedText = '';
    document.addEventListener('keydown', (e) => {
      // Only track letter keys
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        typedText += e.key.toLowerCase();
        if (typedText.length > 20) {
          typedText = typedText.slice(-20);
        }
        
        // Check for secret phrases
        const secretPhrases = {
          'showmethemoney': { id: 'starcraft', name: 'StarCraft Cheat', points: 500 },
          'thereisnospoon': { id: 'matrix', name: 'Matrix Reference', points: 400 },
          'rosebud': { id: 'sims', name: 'The Sims Cheat', points: 350 },
          'motherlode': { id: 'sims2', name: 'The Sims 2 Cheat', points: 350 },
          'poweroverwhelming': { id: 'starcraft2', name: 'StarCraft 2 Cheat', points: 500 },
          'greedisgood': { id: 'warcraft', name: 'Warcraft Cheat', points: 400 },
          'whosyourdaddy': { id: 'warcraft2', name: 'Warcraft 2 Cheat', points: 400 },
          'noclip': { id: 'doom2', name: 'No Clip Mode', points: 600 },
          'bigdaddy': { id: 'gta', name: 'GTA Reference', points: 300 },
          'leet': { id: '1337', name: '1337 H4X0R', points: 1337 }
        };
        
        for (const [phrase, egg] of Object.entries(secretPhrases)) {
          if (typedText.includes(phrase) && window.game) {
            if (!window.game.easterEggsFound.includes(egg.id)) {
              window.game.foundEasterEgg(egg.id, egg.name, egg.points);
              typedText = '';
            }
          }
        }
      } else if (e.key === 'Backspace') {
        typedText = typedText.slice(0, -1);
      } else if (e.key === 'Escape') {
        typedText = '';
      }
    });
  }

    // Track manifesto fragments, deck references, and rebel actions
    function initRebelTracking() {
        if (!window.game) {
            setTimeout(initRebelTracking, 500);
            return;
        }
        
        // Manifesto fragments
        document.querySelectorAll('.manifesto-fragment').forEach(fragment => {
            fragment.addEventListener('click', function() {
                const fragmentId = this.getAttribute('data-fragment');
                if (fragmentId && window.game) {
                    window.game.collectManifestoFragment(fragmentId);
                    this.classList.add('rebel-action', 'particle-burst');
                    setTimeout(() => {
                        this.classList.remove('rebel-action', 'particle-burst');
                    }, 2000);
                }
            });
        });
        
        // Deck references
        document.querySelectorAll('[data-deck-reference]').forEach(ref => {
            ref.addEventListener('click', function() {
                const deckType = this.getAttribute('data-deck-reference');
                const refId = this.getAttribute('data-secret') || this.id || 'unknown';
                if (deckType && window.game) {
                    window.game.trackDeckReference(deckType, refId);
                    if (window.game.comboMultiplier >= 5) {
                        this.classList.add('glitch');
                        setTimeout(() => this.classList.remove('glitch'), 500);
                    }
                }
            });
        });
        
        // Compass stats
        document.querySelectorAll('[data-compass-stat]').forEach(stat => {
            stat.addEventListener('click', function() {
                const statId = this.getAttribute('data-compass-stat');
                if (statId && window.game) {
                    window.game.trackCompassStat(statId);
                    this.classList.add('rebel-action');
                    setTimeout(() => this.classList.remove('rebel-action'), 1000);
                }
            });
        });
        
        // Interactive badges - achievement tracking
        document.querySelectorAll('.interactive-badge').forEach(badge => {
            badge.addEventListener('click', function() {
                const achievementId = this.getAttribute('data-achievement');
                const points = parseInt(this.getAttribute('data-points') || '100', 10);
                
                if (achievementId && window.game) {
                    // Add points
                    window.game.addPoints(points, `Achievement: ${achievementId}`);
                    
                    // Visual feedback
                    this.classList.add('rebel-action', 'particle-burst');
                    setTimeout(() => {
                        this.classList.remove('rebel-action', 'particle-burst');
                    }, 2000);
                    
                    // Check if achievement unlocked
                    if (window.game.checkRebelAchievements) {
                        window.game.checkRebelAchievements();
                    }
                }
            });
            
            // Keyboard accessibility
            badge.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
        
        // Think Different easter eggs - Logo click tracking
        let logoClickCount = 0;
        // Find logo elements using valid selectors
        const logoElements = [
            document.querySelector('.logo'),
            document.querySelector('[aria-label*="logo"]'),
            document.querySelector('[aria-label*="Logo"]'),
            ...Array.from(document.querySelectorAll('h1')).filter(el => el.textContent.includes('Digital Hazard'))
        ].filter(Boolean);
        
        logoElements.forEach(logo => {
            if (logo) {
                logo.addEventListener('click', function() {
                    logoClickCount++;
                    if (logoClickCount >= 5 && window.game) {
                        window.game.trackThinkDifferent('logo-click-5x');
                        logoClickCount = 0;
                    }
                });
            }
        });

        // Konami code is handled in index.js to avoid duplication
    }

    // Initialize everything
    function init() {
        initLoading();
        // initThreeJS(); // Disabled - using threejs-background.js module instead
        initGame(); // Game replaces particle canvas
        initScrollAnimations();
        initSmoothScroll();
        initSectionTracking();
        initInteractiveElements();
        initEasterEggs();
        initRebelTracking();
        
        // Initialization complete - no console output needed
    }

    // Wait for CONFIG before initializing
    function readyInit() {
        if (!window.CONFIG_READY) {
            window.addEventListener('configReady', readyInit, { once: true });
            return;
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            setTimeout(init, 100); // Give time for game.js to load
        }
    }
    
    if (window.CONFIG_READY) {
        readyInit();
    } else {
        window.addEventListener('configReady', readyInit, { once: true });
    }
})();
