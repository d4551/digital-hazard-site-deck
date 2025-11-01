// Static version - THREE is loaded globally

(function() {
    'use strict';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Modal utilities and accessibility helpers
    function trapFocus(modal) {
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return () => {};
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        function handleTab(e) {
            if (e.key !== 'Tab') return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
        modal.addEventListener('keydown', handleTab);
        return () => modal.removeEventListener('keydown', handleTab);
    }

    const backdrop = document.getElementById('modalBackdrop');
    let restoreFocusEl = null;
    let removeTrap = null;
    function openModal(el) {
        restoreFocusEl = document.activeElement;
        document.body.classList.add('modal-open');
        if (backdrop) backdrop.classList.add('show');
        el.classList.add('show', 'active');
        const focusTarget = el.querySelector('[autofocus], .achievement-gallery-close, button, [tabindex]');
        if (focusTarget) focusTarget.focus();
        removeTrap = trapFocus(el);
        function escHandler(e) { if (e.key === 'Escape') closeModal(el); }
        document.addEventListener('keydown', escHandler, { once: true });
        if (backdrop) {
            const backdropClick = () => closeModal(el);
            backdrop.addEventListener('click', backdropClick, { once: true });
        }
    }
    function closeModal(el) {
        el.classList.remove('show', 'active');
        if (backdrop) backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
        if (removeTrap) removeTrap();
        if (restoreFocusEl && restoreFocusEl.focus) restoreFocusEl.focus();
    }

    // Game state
    const gameState = {
        viewedSlides: new Set([0]),
        discoveredItems: new Set(),
        totalScore: 0,
        comboCount: 0,
        comboTimer: null,
        comboMultiplier: 1.0,
        secretsFound: new Set(),
        powerups: {
            multiplier: { active: false, cooldown: 0 },
            reveal: { active: false, cooldown: 0 },
            freeze: { active: false, cooldown: 0 }
        },
        achievements: (() => {
            try {
                return JSON.parse(localStorage.getItem('dhAchievements') || '[]');
            } catch (error) {
                console.error('Error loading achievements:', error);
                return [];
            }
        })(),
        highScore: (() => {
            try {
                return parseInt(localStorage.getItem('dhHighScore') || '0');
            } catch (error) {
                console.error('Error loading high score:', error);
                return 0;
            }
        })()
    };

    const loadingTips = [
        "Tip: Hover over cards to discover them and earn points!",
        "Tip: Click on the glowing orbs to find secrets...",
        "Tip: Build combos by discovering items quickly!",
        "Tip: Try the power-ups in the top-left corner!",
        "Tip: Complete all quests for a special reward!",
        "Pro Tip: There's a hidden mini-game at the end...",
        "Secret: Press arrow keys to navigate slides",
        "Tip: Your high score is saved between visits!"
    ];

    // Debounce utility function (shared across functions)
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function init() {
        initLoading();
        initCustomCursor();
        initThreeJS();
        initSlideNavigation();
        initGamification();
        initTooltips();
        initPowerups();
        initMinigame();
        initSoundEffects();
        initAchievementGallery();
        initKeyboardHelp();
        initEqualGridDistribution();
        initScrollEffects();
    }

    // Equal Grid Distribution - Ensures even number of items per column
    function initEqualGridDistribution() {
        function distributeGridItems(grid) {
            const items = Array.from(grid.children);
            const itemCount = items.length;
            
            if (itemCount === 0) return;
            
            // Calculate optimal columns for even distribution
            let optimalColumns;
            
            if (itemCount <= 1) {
                optimalColumns = 1;
            } else if (itemCount <= 2) {
                optimalColumns = 2;
            } else if (itemCount === 3) {
                optimalColumns = 3;
            } else if (itemCount === 4) {
                optimalColumns = 2; // 2 items per column (even)
            } else if (itemCount === 5) {
                optimalColumns = 5; // 1 per column (odd count, but equal)
            } else if (itemCount === 6) {
                optimalColumns = 3; // 2 items per column (even)
            } else {
                // For 7+, find factors that give even distribution
                // Prefer 2 or 3 columns for better layout
                if (itemCount % 3 === 0) {
                    optimalColumns = 3; // Divisible by 3
                } else if (itemCount % 2 === 0) {
                    optimalColumns = 2; // Divisible by 2
                } else {
                    optimalColumns = 3; // Default to 3
                }
            }
            
            // Apply optimal columns at large breakpoints
            const isLargeScreen = window.innerWidth >= 1000;
            
            if (isLargeScreen) {
                if (grid.classList.contains('stats-grid')) {
                    // Stats grid: 4 items = 2 columns (2, 2)
                    grid.style.gridTemplateColumns = itemCount === 4 ? 'repeat(2, 1fr)' : 
                                                     itemCount % 2 === 0 ? 'repeat(2, 1fr)' : 
                                                     'repeat(2, 1fr)';
                } else if (grid.classList.contains('feature-grid')) {
                    // Feature grid: 6 items = 3 columns (2, 2, 2)
                    grid.style.gridTemplateColumns = itemCount === 6 ? 'repeat(3, 1fr)' : 
                                                     itemCount % 3 === 0 ? 'repeat(3, 1fr)' : 
                                                     itemCount % 2 === 0 ? 'repeat(2, 1fr)' : 
                                                     'repeat(2, 1fr)';
                } else if (grid.classList.contains('team-grid')) {
                    // Team grid: 3 items = 3 columns (1, 1, 1)
                    grid.style.gridTemplateColumns = itemCount === 3 ? 'repeat(3, 1fr)' : 
                                                     itemCount % 2 === 0 ? 'repeat(2, 1fr)' : 
                                                     'repeat(3, 1fr)';
                }
            }
        }

        // Apply to all grids
        function updateAllGrids() {
            document.querySelectorAll('.stats-grid, .feature-grid, .team-grid').forEach(grid => {
                distributeGridItems(grid);
            });
        }

        // Run on load and resize
        updateAllGrids();
        
        // Use MutationObserver to handle dynamic content
        const observer = new MutationObserver(updateAllGrids);
        document.querySelectorAll('.stats-grid, .feature-grid, .team-grid').forEach(grid => {
            observer.observe(grid, { childList: true });
        });

        // Update on window resize - debounced
        let resizeTimer;
        const debouncedResize = debounce(() => {
            updateAllGrids();
        }, 250);
        
        window.addEventListener('resize', debouncedResize);
    }

    // Loading Screen
    function initLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingPercentage = document.getElementById('loadingPercentage');
        const loadingTip = document.getElementById('loadingTip');
        
        // Randomize tip
        loadingTip.textContent = loadingTips[Math.floor(Math.random() * loadingTips.length)];
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 25;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    playSound('start');
                }, 300);
            }
            loadingProgress.style.width = progress + '%';
            if (loadingPercentage) {
                loadingPercentage.textContent = Math.floor(progress) + '%';
            }
        }, 150);
    }

    // Custom Cursor
    function initCustomCursor() {
        const cursor = document.getElementById('customCursor');
        const follower = document.getElementById('cursorFollower');
        
        if (!cursor || !follower) return;
        
        let cursorX = 0, cursorY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
        });

        function animateFollower() {
            followerX += (cursorX - followerX) * 0.15;
            followerY += (cursorY - followerY) * 0.15;
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        document.addEventListener('mousedown', () => {
            cursor.classList.add('clicking');
            createParticleBurst(cursorX, cursorY);
        });

        document.addEventListener('mouseup', () => {
            cursor.classList.remove('clicking');
        });

        // Hover effect on interactive elements
        document.querySelectorAll('.stat-card, .feature-item, .team-member, .nav-btn, .powerup, .easter-egg').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
        });
    }

    // Three.js Background
    function initThreeJS() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.position.z = 30;

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = prefersReduced ? 700 : 2000;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.3,
            color: 0xff6b00,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Hazard Ring
        const ringGeometry = new THREE.TorusGeometry(10, 0.4, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6b00,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        scene.add(ring);

        let mouseX = 0, mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        let animationFrameId = null;

        let running = true;
        function animate() {
            if (!running) return;
            animationFrameId = requestAnimationFrame(animate);

            particlesMesh.rotation.x += 0.0005;
            particlesMesh.rotation.y += 0.001;

            const speedScale = prefersReduced ? 0.4 : 1;
            ring.rotation.x += 0.005 * speedScale;
            ring.rotation.y += 0.01 * speedScale;
            ring.rotation.z += 0.002 * speedScale;

            camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }

        animate();

        // Debounced resize handler
        const handleResize = debounce(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, 150);

        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                running = false;
            } else {
                if (!running) {
                    running = true;
                    requestAnimationFrame(animate);
                }
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            window.removeEventListener('resize', handleResize);
        });
    }

    // Slide Navigation
    function initSlideNavigation() {
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        let currentSlide = 0;

        const currentSlideSpan = document.getElementById('currentSlide');
        const totalSlidesSpan = document.getElementById('totalSlidesNav');
        const totalSlidesHUD = document.getElementById('totalSlides');
        const progressBar = document.getElementById('progressBar');
        const progressMilestones = document.querySelectorAll('.progress-milestone');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (totalSlidesSpan) totalSlidesSpan.textContent = totalSlides;
        if (totalSlidesHUD) totalSlidesHUD.textContent = totalSlides;

        function updateSlide() {
            slides.forEach((slide, index) => {
                slide.classList.remove('active', 'prev');
                if (index === currentSlide) {
                    slide.classList.add('active');
                    
                    // GSAP animation for slide content
                    const cards = slide.querySelectorAll('.stat-card, .team-member, .feature-item');
                    cards.forEach((card, cardIndex) => {
                        gsap.fromTo(card, 
                            { opacity: 0, y: 50, scale: 0.8 },
                            { 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                duration: prefersReduced ? 0 : 0.6,
                                delay: cardIndex * 0.08,
                                ease: 'power3.out'
                            }
                        );
                    });
                } else if (index < currentSlide) {
                    slide.classList.add('prev');
                }
            });

            if (currentSlideSpan) currentSlideSpan.textContent = currentSlide + 1;
            const progress = ((currentSlide + 1) / totalSlides) * 100;
            if (progressBar) progressBar.style.width = progress + '%';
            
            // Update progress milestones
            progressMilestones.forEach(milestone => {
                const milestonePercent = parseFloat(milestone.dataset.milestone);
                if (progress >= milestonePercent) {
                    milestone.classList.add('active');
                } else {
                    milestone.classList.remove('active');
                }
            });
            
            if (prevBtn) prevBtn.disabled = currentSlide === 0;
            if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;

            trackSlideView(currentSlide);
        }

        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateSlide();
                playSound('slide');
            }
        }

        function prevSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                updateSlide();
                playSound('slide');
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
            if (e.key === '?') {
                e.preventDefault();
                toggleKeyboardHelp();
            }
        });

        let touchStartX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) nextSlide();
            if (touchEndX - touchStartX > 50) prevSlide();
        });

        updateSlide();
    }

    // Achievement Gallery Initialization
    function initAchievementGallery() {
        // Keyboard shortcut 'A' to toggle achievement gallery
        document.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A') {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    toggleAchievementGallery();
                }
            }
        });

        // Also close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const gallery = document.getElementById('achievementGallery');
                if (gallery && gallery.classList.contains('show')) {
                    toggleAchievementGallery();
                }
                const help = document.getElementById('keyboardHelp');
                if (help && help.classList.contains('show')) {
                    toggleKeyboardHelp();
                }
            }
        });
    }

    // Keyboard Help
    function initKeyboardHelp() {
        const helpToggle = document.getElementById('helpToggle');
        const keyboardHelp = document.getElementById('keyboardHelp');
        const keyboardHelpClose = document.getElementById('keyboardHelpClose');

        if (helpToggle) {
            helpToggle.addEventListener('click', () => {
                toggleKeyboardHelp();
            });
        }

        if (keyboardHelpClose) {
            keyboardHelpClose.addEventListener('click', () => {
                toggleKeyboardHelp();
            });
        }
    }

    function toggleKeyboardHelp() {
        const help = document.getElementById('keyboardHelp');
        if (!help) return;
        if (help.classList.contains('show')) closeModal(help); else openModal(help);
    }

    // Achievement Gallery
    const achievementDefinitions = [
        { id: 'explorer', name: 'Explorer', desc: 'Viewed 5 slides', icon: '🗺️', category: 'Navigation' },
        { id: 'master_navigator', name: 'Master Navigator', desc: 'Viewed 10 slides', icon: '🧭', category: 'Navigation' },
        { id: 'completionist', name: 'Completionist', desc: 'Viewed all slides', icon: '🏆', category: 'Navigation' },
        { id: 'combo_starter', name: 'Combo Starter', desc: 'Achieved 5x combo', icon: '🔥', category: 'Mastery' },
        { id: 'combo_master', name: 'Combo Master', desc: 'Achieved 10x combo', icon: '⚡', category: 'Mastery' },
        { id: 'combo_legend', name: 'Combo Legend', desc: 'Achieved 20x combo', icon: '💥', category: 'Mastery' },
        { id: 'egg_hunter', name: 'Easter Egg Hunter', desc: 'Found all secrets', icon: '🥚👑', category: 'Discovery' }
    ];

    function toggleAchievementGallery() {
        const gallery = document.getElementById('achievementGallery');
        if (!gallery) return;
        if (gallery.classList.contains('show')) {
            closeModal(gallery);
        } else {
            openModal(gallery);
            renderAchievementGallery();
        }
    }

    function renderAchievementGallery() {
        const grid = document.getElementById('achievementGrid');
        if (!grid) return;

        grid.innerHTML = '';
        achievementDefinitions.forEach(achievement => {
            const card = document.createElement('div');
            card.className = 'achievement-card';
            const isUnlocked = gameState.achievements.includes(achievement.id);
            if (isUnlocked) card.classList.add('unlocked');

            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            `;
            grid.appendChild(card);
        });
    }

    const achievementGalleryClose = document.getElementById('achievementGalleryClose');
    if (achievementGalleryClose) achievementGalleryClose.addEventListener('click', toggleAchievementGallery);

    // Quest Panel Toggle
    const questToggle = document.getElementById('questToggle');
    const questPanel = document.getElementById('questPanel');
    if (questToggle && questPanel) {
        questToggle.addEventListener('click', () => {
            questPanel.classList.toggle('collapsed');
            const icon = questToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-right');
                icon.classList.toggle('fa-chevron-left');
            }
        });
    }

    // Gamification System
    function initGamification() {
        const achievementCount = document.getElementById('achievementCount');
        const levelNumber = document.getElementById('levelNumber');
        const levelFill = document.getElementById('levelFill');
        const discoveryScore = document.getElementById('discoveryScore');
        const comboCounter = document.getElementById('comboCounter');
        const comboNumber = document.getElementById('comboNumber');
        const comboMultiplier = document.getElementById('comboMultiplier');
        const badgeText = document.getElementById('badgeText');

        window.addPoints = function(points) {
            const finalPoints = Math.floor(points * gameState.comboMultiplier);
            gameState.totalScore += finalPoints;
            
            if (discoveryScore) {
                gsap.to(discoveryScore, {
                    textContent: gameState.totalScore,
                    duration: 0.5,
                    snap: { textContent: 1 },
                    ease: 'power2.out'
                });
            }
            
            showScorePopup(finalPoints);
            incrementCombo();
            updateQuests();
            checkHighScore();
        };

        window.trackSlideView = function(slideIndex) {
            if (!gameState.viewedSlides.has(slideIndex)) {
                gameState.viewedSlides.add(slideIndex);
                addPoints(100);
                updateProgress();
                
                if (gameState.viewedSlides.size === 5) {
                    showAchievement('Explorer', 'Viewed 5 slides! 🗺️', 300);
                }
                if (gameState.viewedSlides.size === 10) {
                    showAchievement('Master Navigator', 'Almost there! 🧭', 500);
                }
                if (gameState.viewedSlides.size === 12) {
                    showAchievement('Completionist', 'Viewed everything! 🏆', 1000);
                }
            }
        };

        function incrementCombo() {
            gameState.comboCount++;
            gameState.comboMultiplier = 1.0 + (gameState.comboCount * 0.1);
            
            if (comboNumber) comboNumber.textContent = gameState.comboCount;
            if (comboMultiplier) comboMultiplier.textContent = `×${gameState.comboMultiplier.toFixed(1)}`;
            if (comboCounter) comboCounter.classList.add('active');
            
            clearTimeout(gameState.comboTimer);
            gameState.comboTimer = setTimeout(() => {
                gameState.comboCount = 0;
                gameState.comboMultiplier = 1.0;
                if (comboNumber) comboNumber.textContent = '0';
                if (comboMultiplier) comboMultiplier.textContent = '×1.0';
                if (comboCounter) comboCounter.classList.remove('active');
            }, 3000);

            if (gameState.comboCount === 5) {
                showAchievement('Combo Starter', '5x Combo! 🔥', 200);
            }
            if (gameState.comboCount === 10) {
                showAchievement('Combo Master', '10x Combo! ⚡', 500);
            }
            if (gameState.comboCount === 20) {
                showAchievement('Combo Legend', '20x Combo! 💥', 1000);
            }
            
            // Update quests for combo tracking
            updateQuests();
        }

        function updateProgress() {
            if (achievementCount) achievementCount.textContent = gameState.viewedSlides.size;
            
            const progress = (gameState.viewedSlides.size / 12) * 100;
            if (levelFill) {
                gsap.to(levelFill, {
                    width: progress + '%',
                    duration: 0.5
                });
            }
            
            const level = Math.floor(gameState.viewedSlides.size / 3) + 1;
            if (levelNumber && levelNumber.textContent != level) {
                gsap.fromTo(levelNumber, 
                    { scale: 1 },
                    { scale: 1.5, duration: 0.2, yoyo: true, repeat: 1 }
                );
                levelNumber.textContent = level;
                playSound('levelup');
            }

            if (badgeText) {
                if (gameState.viewedSlides.size >= 12) badgeText.textContent = 'Legend';
                else if (gameState.viewedSlides.size >= 10) badgeText.textContent = 'Master';
                else if (gameState.viewedSlides.size >= 7) badgeText.textContent = 'Expert';
                else if (gameState.viewedSlides.size >= 4) badgeText.textContent = 'Adventurer';
                else badgeText.textContent = 'Rookie';
            }
        }

        function showScorePopup(score) {
            const popup = document.getElementById('scorePopup');
            const scoreNumber = document.getElementById('scoreNumber');
            if (popup && scoreNumber) {
                scoreNumber.textContent = '+' + score;
                popup.classList.add('show');
                playSound('points');
                setTimeout(() => { popup.classList.remove('show'); }, 1200);
            }
        }

        // Queue achievement notifications to avoid overlap
        const notifQueue = [];
        let notifActive = false;
        function showAchievement(title, desc, bonusPoints = 0) {
            notifQueue.push({ title, desc, bonusPoints });
            if (!notifActive) processNotifQueue();
        }
        function processNotifQueue() {
            if (notifQueue.length === 0) { notifActive = false; return; }
            notifActive = true;
            const { title, desc, bonusPoints } = notifQueue.shift();
            const notification = document.getElementById('achievementNotification');
            const titleElement = document.getElementById('achievementTitle');
            const descElement = document.getElementById('achievementDesc');
            // Persist achievement if defined
            const achievement = achievementDefinitions.find(a => a.name === title);
            if (achievement && !gameState.achievements.includes(achievement.id)) {
                gameState.achievements.push(achievement.id);
                try { localStorage.setItem('dhAchievements', JSON.stringify(gameState.achievements)); } catch {}
            }
            if (notification && titleElement && descElement) {
                titleElement.innerHTML = `<i class="fas fa-award"></i> ${title}`;
                descElement.textContent = desc;
                notification.classList.add('show');
                playSound('achievement');
                if (bonusPoints > 0) setTimeout(() => addPoints(bonusPoints), 500);
                const gallery = document.getElementById('achievementGallery');
                if (gallery && gallery.classList.contains('show')) renderAchievementGallery();
                updateQuests();
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(processNotifQueue, 300);
                }, 4000);
            } else {
                setTimeout(processNotifQueue, 0);
            }
        }

        function checkHighScore() {
            if (gameState.totalScore > gameState.highScore) {
                gameState.highScore = gameState.totalScore;
                try {
                    localStorage.setItem('dhHighScore', gameState.highScore);
                } catch (error) {
                    console.error('Error saving high score:', error);
                }
                
                const badge = document.getElementById('highscoreBadge');
                if (badge && !badge.classList.contains('show')) {
                    badge.classList.add('show');
                    playSound('highscore');
                    setTimeout(() => {
                        badge.classList.remove('show');
                    }, 3000);
                }
            }
        }

        function updateQuests() {
            const quest1 = document.getElementById('quest1');
            const quest2 = document.getElementById('quest2');
            const quest3 = document.getElementById('quest3');

            if (quest1) {
                const progress = quest1.querySelector('.quest-progress');
                const progressFill = document.getElementById('quest1Progress');
                const slidesViewed = gameState.viewedSlides.size;
                progress.textContent = `${slidesViewed}/12`;
                const progressPercent = (slidesViewed / 12) * 100;
                if (progressFill) progressFill.style.width = progressPercent + '%';
                
                if (slidesViewed === 12 && !quest1.classList.contains('completed')) {
                    quest1.classList.add('completed');
                    const reward = parseInt(quest1.dataset.reward) || 500;
                    addPoints(reward);
                    showAchievement('Quest Complete!', 'Viewed all slides!', 0);
                }
            }

            if (quest2) {
                const progress = quest2.querySelector('.quest-progress');
                const progressFill = document.getElementById('quest2Progress');
                const eggsFound = gameState.secretsFound.size;
                progress.textContent = `${eggsFound}/15`;
                const progressPercent = Math.min((eggsFound / 15) * 100, 100);
                if (progressFill) progressFill.style.width = progressPercent + '%';
                
                if (eggsFound >= 5 && !quest2.classList.contains('completed')) {
                    quest2.classList.add('completed');
                    const reward = parseInt(quest2.dataset.reward) || 1000;
                    addPoints(reward);
                    showAchievement('Quest Complete!', 'Found 5 easter eggs!', 0);
                }
            }

            if (quest3) {
                const progress = quest3.querySelector('.quest-progress');
                const progressFill = document.getElementById('quest3Progress');
                let maxCombo;
                try {
                    maxCombo = Math.max(gameState.comboCount, parseInt(localStorage.getItem('dhMaxCombo') || '0'));
                } catch (error) {
                    console.error('Error loading max combo:', error);
                    maxCombo = gameState.comboCount;
                }
                
                if (gameState.comboCount > maxCombo) {
                    try {
                        localStorage.setItem('dhMaxCombo', gameState.comboCount.toString());
                        maxCombo = gameState.comboCount;
                    } catch (error) {
                        console.error('Error saving max combo:', error);
                    }
                }
                
                if (progress) progress.textContent = `${maxCombo}/10`;
                const progressPercent = Math.min((maxCombo / 10) * 100, 100);
                if (progressFill) progressFill.style.width = progressPercent + '%';
                
                if (maxCombo >= 10 && !quest3.classList.contains('completed')) {
                    quest3.classList.add('completed');
                    const reward = parseInt(quest3.dataset.reward) || 750;
                    addPoints(reward);
                    showAchievement('Quest Complete!', 'Reached 10x combo!', 0);
                }
            }
        }

        // Click ripple
        document.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';
            document.body.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });

        // Card interactions
        document.querySelectorAll('.stat-card, .team-member, .feature-item').forEach(card => {
            card.addEventListener('mouseenter', function() {
                if (!this.classList.contains('discovered')) {
                    this.classList.add('discovered');
                    const points = parseInt(this.dataset.points) || 50;
                    addPoints(points);
                    playSound('discover');
                }
            });
        });

        // Easter eggs
        document.querySelectorAll('.easter-egg').forEach(egg => {
            egg.addEventListener('click', function(e) {
                e.stopPropagation();
                const secret = this.dataset.secret;
                if (!gameState.secretsFound.has(secret)) {
                    gameState.secretsFound.add(secret);
                    this.classList.add('found');
                    const points = parseInt(this.dataset.points) || 250;
                    showAchievement('Secret Found!', `You discovered "${secret}"! 🎉`, points);
                    createParticleBurst(e.clientX, e.clientY, 20);
                    
                    setTimeout(() => this.style.display = 'none', 600);
                    
                    if (gameState.secretsFound.size === 15) {
                        showAchievement('Easter Egg Hunter', 'Found ALL secrets! 🥚👑', 2000);
                    }
                }
            });
        });

        updateProgress();
    }

    // Particle Burst
    function createParticleBurst(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 100 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }

    // Tooltips
    function initTooltips() {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;

        document.querySelectorAll('[data-points]').forEach(element => {
            element.addEventListener('mouseenter', function(e) {
                const points = this.dataset.points;
                if (points && !this.classList.contains('discovered')) {
                    tooltip.textContent = `Hover to earn ${points} points!`;
                    tooltip.classList.add('show');
                }
            });

            element.addEventListener('mousemove', function(e) {
                tooltip.style.left = e.clientX + 20 + 'px';
                tooltip.style.top = e.clientY + 20 + 'px';
            });

            element.addEventListener('mouseleave', function() {
                tooltip.classList.remove('show');
            });
        });
    }

    // Power-ups
    function initPowerups() {
        document.querySelectorAll('.powerup').forEach(powerup => {
            powerup.addEventListener('click', function() {
                const type = this.dataset.type;
                activatePowerup(type);
            });
        });

        // Update cooldown timers - store interval ID for cleanup
        const cooldownInterval = setInterval(() => {
            Object.keys(gameState.powerups).forEach(type => {
                if (gameState.powerups[type].cooldown > 0) {
                    gameState.powerups[type].cooldown--;
                    updatePowerupCooldown(type);
                }
            });
        }, 1000);
        
        // Store interval ID for cleanup
        window.powerupCooldownInterval = cooldownInterval;
    }

    function updatePowerupCooldown(type) {
        const powerup = document.querySelector(`[data-type="${type}"]`);
        const cooldownText = document.getElementById(`powerup${type === 'multiplier' ? '1' : type === 'reveal' ? '2' : '3'}CooldownText`);
        const cooldownOverlay = powerup?.querySelector('.powerup-cooldown-overlay');
        
        if (!powerup) return;

        const cooldown = gameState.powerups[type].cooldown;
        
        if (cooldown > 0) {
            powerup.disabled = true;
            if (cooldownText) cooldownText.textContent = cooldown;
        } else {
            powerup.disabled = false;
            if (cooldownText) cooldownText.textContent = '0';
        }
    }

    function activatePowerup(type) {
        if (gameState.powerups[type].cooldown > 0) return;

        const powerup = document.querySelector(`[data-type="${type}"]`);
        if (!powerup) return;

        gameState.powerups[type].active = true;
        powerup.classList.add('active');
        playSound('powerup');

        switch(type) {
            case 'multiplier':
                gameState.comboMultiplier *= 2;
                showAchievement('Power-Up!', '2x Points for 10 seconds! ⚡', 0);
                setTimeout(() => {
                    gameState.comboMultiplier /= 2;
                    gameState.powerups[type].active = false;
                    powerup.classList.remove('active');
                }, 10000);
                gameState.powerups[type].cooldown = 30;
                break;

            case 'reveal':
                document.querySelectorAll('.easter-egg:not(.found)').forEach(egg => {
                    egg.style.animation = 'eggPulse 0.5s ease-in-out infinite';
                    egg.style.transform = 'scale(1.5)';
                });
                showAchievement('Power-Up!', 'Secrets revealed for 5 seconds! 👁️', 0);
                setTimeout(() => {
                    document.querySelectorAll('.easter-egg:not(.found)').forEach(egg => {
                        egg.style.animation = '';
                        egg.style.transform = '';
                    });
                    gameState.powerups[type].active = false;
                    powerup.classList.remove('active');
                }, 5000);
                gameState.powerups[type].cooldown = 45;
                break;

            case 'freeze':
                clearTimeout(gameState.comboTimer);
                showAchievement('Power-Up!', 'Combo timer frozen for 10 seconds! ❄️', 0);
                setTimeout(() => {
                    gameState.powerups[type].active = false;
                    powerup.classList.remove('active');
                    gameState.comboTimer = setTimeout(() => {
                        gameState.comboCount = 0;
                        gameState.comboMultiplier = 1.0;
                    }, 3000);
                }, 10000);
                gameState.powerups[type].cooldown = 60;
                break;
        }

        updatePowerupCooldown(type);
    }

    // Mini-game
    function initMinigame() {
        const startBtn = document.getElementById('startMinigame');
        const overlay = document.getElementById('minigameOverlay');
        const closeBtn = document.getElementById('closeMinigame');
        const canvas = document.getElementById('minigameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreDisplay = document.getElementById('minigameScore');
        const timeDisplay = document.getElementById('minigameTime');

        let minigameActive = false;
        let minigameScore = 0;
        let minigameTime = 30;
        let targets = [];

        startBtn.addEventListener('click', () => {
            openModal(overlay);
            startMinigame();
        });

        closeBtn.addEventListener('click', () => {
            closeModal(overlay);
            minigameActive = false;
        });

        canvas.addEventListener('click', (e) => {
            if (!minigameActive) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            targets.forEach((target, index) => {
                const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);
                if (dist < target.radius) {
                    minigameScore += 10;
                    scoreDisplay.textContent = minigameScore;
                    targets.splice(index, 1);
                    playSound('hit');
                }
            });
        });

        function startMinigame() {
            minigameActive = true;
            minigameScore = 0;
            minigameTime = 30;
            targets = [];
            scoreDisplay.textContent = '0';
            timeDisplay.textContent = '30';

            const timer = setInterval(() => {
                minigameTime--;
                timeDisplay.textContent = minigameTime;

                if (minigameTime <= 0) {
                    clearInterval(timer);
                    clearInterval(gameLoop);
                    minigameActive = false;
                    const bonus = minigameScore * 10;
                    showAchievement('Mini-Game Complete!', `Earned ${bonus} bonus points! 🎮`, bonus);
                    setTimeout(() => closeModal(overlay), 3000);
                }
            }, 1000);

            const gameLoop = setInterval(() => {
                if (targets.length < 5 && Math.random() < 0.3) {
                    targets.push({
                        x: Math.random() * (canvas.width - 40) + 20,
                        y: Math.random() * (canvas.height - 40) + 20,
                        radius: 20,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4
                    });
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                targets.forEach(target => {
                    target.x += target.vx;
                    target.y += target.vy;

                    if (target.x < target.radius || target.x > canvas.width - target.radius) target.vx *= -1;
                    if (target.y < target.radius || target.y > canvas.height - target.radius) target.vy *= -1;

                    ctx.beginPath();
                    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff6b00';
                    ctx.fill();
                    ctx.strokeStyle = '#ffab00';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                });
            }, 1000 / 60);
        }
    }

    // Sound Effects (Visual)
    function initSoundEffects() {
        // Sound effect visualizations
    }

    function playSound(type) {
        const sounds = {
            'start': '🎵',
            'slide': '➡️',
            'points': '💰',
            'discover': '✨',
            'achievement': '🏆',
            'levelup': '⬆️',
            'powerup': '⚡',
            'hit': '💥',
            'highscore': '👑'
        };

        const icon = sounds[type] || '🔊';
        
        // Visual sound wave
        const wave = document.createElement('div');
        wave.className = 'sound-wave';
        wave.textContent = icon;
        wave.style.left = '50%';
        wave.style.top = '50%';
        wave.style.fontSize = '2rem';
        wave.style.display = 'flex';
        wave.style.alignItems = 'center';
        wave.style.justifyContent = 'center';
        document.body.appendChild(wave);
        
        setTimeout(() => wave.remove(), 500);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.powerupCooldownInterval) {
            clearInterval(window.powerupCooldownInterval);
        }
    });
})();
    // Scroll-based effects for overflow scenarios and long slides
    function initScrollEffects() {
        if (prefersReduced || !window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);
        const targets = [
            '.slide .slide-content h2',
            '.slide .steam-widget',
            '.slide .stats-grid',
            '.slide .feature-grid',
            '.slide .team-grid',
            '.quest-panel',
            '.powerup-container',
            '.nav-controls'
        ];
        targets.forEach(sel => {
            gsap.utils.toArray(sel).forEach(el => {
                gsap.from(el, {
                    y: 40,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        once: true
                    }
                });
            });
        });
    }
