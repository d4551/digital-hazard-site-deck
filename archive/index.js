gsap.registerPlugin(ScrollTrigger);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const cursorFollower = document.querySelector('.cursor-follower');
const cursorDot = document.querySelector('.cursor-dot');

if (cursorFollower && cursorDot && !prefersReduced) {
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursorFollower, {
            x: e.clientX - 10,
            y: e.clientY - 10,
            duration: 0.3,
            ease: 'power2.out'
        });
        gsap.to(cursorDot, {
            x: e.clientX - 3,
            y: e.clientY - 3,
            duration: 0.1
        });
    });

    document.querySelectorAll('a, button, .feature-card, .stat-card, .mechanic-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(cursorFollower, { scale: 1.5, duration: 0.3 });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(cursorFollower, { scale: 1, duration: 0.3 });
        });
    });
}

const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        if (navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    }));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

if (!prefersReduced) {
    gsap.to('.hero', {
        opacity: 1,
        duration: 1.5,
        ease: 'power3.out'
    });
}

if (!prefersReduced) {
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            y: 80,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                end: 'bottom 60%',
                toggleActions: 'play none none reverse'
            }
        });
    });
}

if (!prefersReduced) {
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            y: 100,
            opacity: 0,
            scale: 0.8,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'back.out(1.7)',
            scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            }
        });
    });
}

if (!prefersReduced) {
    gsap.from('.engine-text', {
        x: -150,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.engine-text',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });
}

if (!prefersReduced) {
    gsap.from('.engine-visual', {
        x: 150,
        opacity: 0,
        scale: 0.9,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.engine-visual',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });
}

if (!prefersReduced) {
    gsap.from('.game-image', {
        scale: 0.7,
        opacity: 0,
        rotation: -10,
        duration: 1.2,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: '.game-image',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });
}

if (!prefersReduced) {
    gsap.from('.game-details', {
        x: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.game-details',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });
}

gsap.utils.toArray('.stat-card').forEach((card, i) => {
    const number = card.querySelector('.stat-number');
    const target = parseInt(number.getAttribute('data-target'));

    gsap.from(card, {
        y: 80,
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        delay: i * 0.15,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            onEnter: () => animateNumber(number, target),
            toggleActions: 'play none none none'
        }
    });
});

function animateNumber(element, target) {
    const suffix = element.getAttribute('data-suffix') || '';
    const isDecimal = target % 1 !== 0;
    if (prefersReduced) {
        element.textContent = (isDecimal ? target.toFixed(2) : Math.floor(target)) + suffix;
        return;
    }
    anime({
        targets: { val: 0 },
        val: target,
        duration: 2000,
        easing: 'easeOutExpo',
        update: function(anim) {
            const value = anim.animations[0].currentValue;
            if (isDecimal) {
                element.textContent = value.toFixed(2) + suffix;
            } else {
                element.textContent = Math.floor(value) + suffix;
            }
        }
    });
}

if (!prefersReduced) {
    gsap.from('.contact-info', {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.contact-info',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });
}

if (!prefersReduced) {
    anime({
        targets: '.social-links a',
        translateY: [100, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutExpo'
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

gsap.utils.toArray('.mechanic-item').forEach((item, i) => {
    if (!prefersReduced) {
        gsap.from(item, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            delay: i * 0.1,
            ease: 'back.out(2)',
            scrollTrigger: {
                trigger: item,
                start: 'top 90%'
            }
        });
    }
    item.addEventListener('click', () => {
        if (!prefersReduced) {
            anime({
                targets: item,
                scale: [1, 1.2, 1],
                duration: 400,
                easing: 'easeInOutQuad'
            });
        }
    });
});

// Gamification System
const GameState = {
    level: 1,
    score: 0,
    xp: 0,
    xpToNext: 100,
    achievements: {},
    particleCount: 0,
    sectionsVisited: new Set(),
    socialClicks: new Set(),
    easterEggsFound: new Set(),
    lastInteraction: Date.now(),
    combo: 0,
    comboTimeout: null
};

// Load from localStorage
function loadGameState() {
    try {
        const saved = localStorage.getItem('digitalHazardGameState');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(GameState, parsed);
            GameState.sectionsVisited = new Set(parsed.sectionsVisited || []);
            GameState.socialClicks = new Set(parsed.socialClicks || []);
            GameState.easterEggsFound = new Set(parsed.easterEggsFound || []);
        }
        updateHUD();
    } catch (error) {
        console.error('Error loading game state:', error);
        updateHUD();
    }
}

function saveGameState() {
    try {
        const toSave = {
            ...GameState,
            sectionsVisited: Array.from(GameState.sectionsVisited),
            socialClicks: Array.from(GameState.socialClicks),
            easterEggsFound: Array.from(GameState.easterEggsFound)
        };
        localStorage.setItem('digitalHazardGameState', JSON.stringify(toSave));
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

function addScore(points, showPopup = true) {
    GameState.score += points;
    GameState.xp += points;
    updateHUD();
    saveGameState();

    if (showPopup) {
        showScorePopup(points);
    }

    // Check level up
    if (GameState.xp >= GameState.xpToNext) {
        levelUp();
    }

    // Combo system
    clearTimeout(GameState.comboTimeout);
    GameState.combo++;
    GameState.comboTimeout = setTimeout(() => {
        if (GameState.combo > 1) {
            showCombo(GameState.combo);
        }
        GameState.combo = 0;
    }, 1000);

    if (GameState.combo > 1) {
        const comboCounter = document.getElementById('comboCounter');
        const comboNumber = document.getElementById('comboNumber');
        if (comboCounter && comboNumber) {
            comboCounter.classList.add('active');
            comboNumber.textContent = GameState.combo;
        }
    }
}

function levelUp() {
    GameState.level++;
    GameState.xp -= GameState.xpToNext;
    GameState.xpToNext = Math.floor(GameState.xpToNext * 1.5);
    unlockAchievement('Level Up', `Reached level ${GameState.level}!`);
    updateHUD();
}

function unlockAchievement(name, desc) {
    if (GameState.achievements[name]) return;
    GameState.achievements[name] = true;
    saveGameState();
    showAchievement(name, desc);
}

function showScorePopup(points) {
    const popup = document.getElementById('scorePopup');
    const number = document.getElementById('scoreNumber');
    if (popup && number) {
        number.textContent = `+${points}`;
        popup.style.left = Math.random() * (window.innerWidth - 200) + 'px';
        popup.style.top = Math.random() * (window.innerHeight - 100) + 'px';
        popup.classList.add('active');
        setTimeout(() => popup.classList.remove('active'), 1000);
    }
}

// Queue notifications to avoid overlap
const _notifQueue = [];
let _notifActive = false;
function showAchievement(title, desc) {
    _notifQueue.push({ title, desc });
    if (!_notifActive) _processNotifQueue();
}
function _processNotifQueue() {
    if (_notifQueue.length === 0) { _notifActive = false; return; }
    _notifActive = true;
    const { title, desc } = _notifQueue.shift();
    const notification = document.getElementById('achievementNotification');
    const titleEl = document.getElementById('achievementTitle');
    const descEl = document.getElementById('achievementDesc');
    if (notification && titleEl && descEl) {
        titleEl.textContent = title;
        descEl.textContent = desc;
        notification.classList.add('show');
        addScore(100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(_processNotifQueue, 250);
        }, 4000);
    } else {
        setTimeout(_processNotifQueue, 0);
    }
}

function showCombo(combo) {
    const comboCounter = document.getElementById('comboCounter');
    if (comboCounter) {
        setTimeout(() => comboCounter.classList.remove('active'), 2000);
    }
    addScore(combo * 5, false);
}

function updateHUD() {
    const levelNumber = document.getElementById('levelNumber');
    const discoveryScore = document.getElementById('discoveryScore');
    const particleCount = document.getElementById('particleCount');
    const levelFill = document.getElementById('levelFill');
    const badgeText = document.getElementById('badgeText');
    
    if (levelNumber) levelNumber.textContent = GameState.level;
    if (discoveryScore) discoveryScore.textContent = GameState.score.toLocaleString();
    if (particleCount) particleCount.textContent = GameState.particleCount.toLocaleString();
    
    if (levelFill) {
        const fillPercent = (GameState.xp / GameState.xpToNext) * 100;
        levelFill.style.width = fillPercent + '%';
    }

    // Update badge based on achievements
    if (badgeText) {
        if (GameState.achievements['Easter Egg Hunter']) {
            badgeText.textContent = 'Master Explorer';
        } else if (GameState.achievements['Particle Master']) {
            badgeText.textContent = 'Particle Master';
        } else if (GameState.achievements['Explorer']) {
            badgeText.textContent = 'Explorer';
        }
    }
}

// Loading Screen
const loadingTips = [
    'Pioneering the future of game development',
    'AI-powered content generation',
    'Where pixels rebel and imagination runs wild',
    'Building next-generation gaming experiences',
    'HazardForge AI Engine initializing...'
];

function simulateLoading() {
    const progressBar = document.getElementById('loadingProgress');
    const percentage = document.getElementById('loadingPercentage');
    const tip = document.getElementById('loadingTip');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (!progressBar || !percentage || !tip || !loadingScreen) return;
    
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        progressBar.style.width = progress + '%';
        percentage.textContent = Math.floor(progress) + '%';

        if (progress >= 25 && progress < 50) {
            tip.textContent = loadingTips[1];
        } else if (progress >= 50 && progress < 75) {
            tip.textContent = loadingTips[2];
        } else if (progress >= 75 && progress < 100) {
            tip.textContent = loadingTips[3];
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                unlockAchievement('First Visit', 'Welcome to Digital Hazard Studio!');
            }, 500);
        }
    }, 100);
}

// Enhanced Demo Canvas with Gamification
const demoCanvas = document.getElementById('demo-canvas');
let demoCtx = null;
let animationFrameId = null;
const MAX_PARTICLES = prefersReduced ? 150 : 500;

if (demoCanvas) {
    demoCtx = demoCanvas.getContext('2d');
    demoCanvas.width = demoCanvas.offsetWidth || 800;
    demoCanvas.height = demoCanvas.offsetHeight || 600;
}

let demoParticles = [];
let isDrawing = false;
let lastParticleTime = 0;

class DemoParticle {
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
        this.targetX = x;
        this.targetY = y;
    }

    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 1;
        this.size *= 0.98;
    }

    draw() {
        demoCtx.fillStyle = this.color;
        demoCtx.globalAlpha = this.life / this.maxLife;
        demoCtx.shadowBlur = 10;
        demoCtx.shadowColor = this.color;
        demoCtx.beginPath();
        demoCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        demoCtx.fill();
        demoCtx.shadowBlur = 0;
    }
}

if (demoCanvas && demoCtx) {
    demoCanvas.addEventListener('mousedown', () => isDrawing = true);
    demoCanvas.addEventListener('mouseup', () => isDrawing = false);
    demoCanvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            const rect = demoCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const now = Date.now();
            if (now - lastParticleTime > 16) {
                // Limit particles
                if (demoParticles.length >= MAX_PARTICLES) {
                    demoParticles = demoParticles.slice(-MAX_PARTICLES + 5);
                }
                for (let i = 0; i < 5; i++) {
                    demoParticles.push(new DemoParticle(x, y));
                }
                GameState.particleCount += 5;
                addScore(5);
                lastParticleTime = now;
            }
        }
    });

    demoCanvas.addEventListener('click', (e) => {
        const rect = demoCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const particlesToAdd = Math.min(30, MAX_PARTICLES - demoParticles.length);
        for (let i = 0; i < particlesToAdd; i++) {
            demoParticles.push(new DemoParticle(x, y));
        }
        GameState.particleCount += particlesToAdd;
        addScore(particlesToAdd);

        if (GameState.particleCount >= 1000 && !GameState.achievements['Particle Master']) {
            unlockAchievement('Particle Master', 'Created 1000+ particles!');
        }
    });
}

function animateDemo() {
    if (!demoCanvas || !demoCtx) return;
    
    // Limit particle array size
    if (demoParticles.length > MAX_PARTICLES) {
        demoParticles = demoParticles.slice(-MAX_PARTICLES);
    }
    
    demoCtx.fillStyle = 'rgba(10, 10, 10, 0.15)';
    demoCtx.fillRect(0, 0, demoCanvas.width, demoCanvas.height);

    demoParticles = demoParticles.filter(p => p.life > 0);
    
    // Update all particles
    demoParticles.forEach(p => {
        p.update();
    });

    // Draw connection lines between nearby particles (limit connections for performance)
    const maxConnections = Math.min(demoParticles.length, 100);
    for (let i = 0; i < maxConnections; i++) {
        const particle = demoParticles[i];
        if (!particle || particle.life <= 0) continue;
        
        for (let j = i + 1; j < Math.min(demoParticles.length, i + 10); j++) {
            const other = demoParticles[j];
            if (!other || other.life <= 0) continue;
            
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 50) {
                const alpha = 0.3 * (1 - dist / 50) * Math.min(particle.life / 100, other.life / 100);
                demoCtx.strokeStyle = `rgba(255, 140, 0, ${alpha})`;
                demoCtx.lineWidth = 1;
                demoCtx.beginPath();
                demoCtx.moveTo(particle.x, particle.y);
                demoCtx.lineTo(other.x, other.y);
                demoCtx.stroke();
            }
        }
    }

    // Draw all particles
    demoParticles.forEach(p => {
        p.draw();
    });

    animationFrameId = requestAnimationFrame(animateDemo);
}

// Debounce utility function
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

if (demoCanvas && demoCtx) {
    animateDemo();
    
    // Debounced resize handler
    const handleResize = debounce(() => {
        if (demoCanvas) {
            demoCanvas.width = demoCanvas.offsetWidth || 800;
            demoCanvas.height = demoCanvas.offsetHeight || 600;
        }
    }, 150);
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });
}

// Easter Eggs
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let logoClickCount = 0;
let hazardIconClickCount = 0;
let digitalHazardClickCount = 0;
let emailHoverStart = null;
let scrollDirection = [];
let developerMode = false;

document.addEventListener('keydown', (e) => {
    // Konami Code
    konamiCode.push(e.code);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        developerMode = true;
        document.body.classList.add('hazard-mode');
        unlockAchievement('Konami Code', 'Developer mode activated!');
        konamiCode = [];
        setTimeout(() => {
            document.body.classList.remove('hazard-mode');
        }, 5000);
    }

    // Keyboard shortcuts
    if (e.ctrlKey && e.shiftKey) {
        if (e.key === 'D' || e.code === 'KeyD') {
            e.preventDefault();
            showDevStats();
        } else if (e.key === 'H' || e.code === 'KeyH') {
            e.preventDefault();
            triggerHazardForgeEasterEgg();
        } else if (e.key === 'P' || e.code === 'KeyP') {
            e.preventDefault();
            triggerParticleExplosion();
        }
    }
});

function showDevStats() {
    const overlay = document.getElementById('devStatsOverlay');
    const content = document.getElementById('devStatsContent');
    const fpsEl = document.getElementById('fps');
    const particlesEl = document.getElementById('particles');
    if (!overlay || !content) return;
    const stats = {
        'Game State': GameState,
        'Performance': { 'FPS': fpsEl ? fpsEl.textContent : 'N/A', 'Particles': particlesEl ? particlesEl.textContent : 'N/A' },
        'Browser': navigator.userAgent,
        'Screen': `${window.innerWidth}x${window.innerHeight}`,
        'Timestamp': new Date().toISOString()
    };
    content.textContent = JSON.stringify(stats, null, 2);
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
    const onEsc = (e) => { if (e.key === 'Escape') closeDevStats(); };
    document.addEventListener('keydown', onEsc, { once: true });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDevStats(); });
    unlockAchievement('Developer Stats', 'Accessed developer overlay');
}
function closeDevStats() {
    const overlay = document.getElementById('devStatsOverlay');
    if (overlay) overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function triggerHazardForgeEasterEgg() {
    const engineVisual = document.querySelector('.engine-visual');
    if (engineVisual) {
        anime({
            targets: engineVisual,
            scale: [1, 1.5, 1],
            rotate: [0, 360],
            duration: 2000,
            easing: 'easeInOutQuad'
        });
        unlockAchievement('HazardForge', 'Triggered HazardForge animation!');
    }
}

function triggerParticleExplosion() {
    if (!demoCanvas || !demoCtx) return;
    
    const particlesToAdd = Math.min(200, MAX_PARTICLES - demoParticles.length);
    for (let i = 0; i < particlesToAdd; i++) {
        const x = Math.random() * demoCanvas.width;
        const y = Math.random() * demoCanvas.height;
        demoParticles.push(new DemoParticle(x, y));
    }
    GameState.particleCount += particlesToAdd;
    addScore(particlesToAdd);
    unlockAchievement('Particle Explosion', 'Massive particle burst!');
}

// Logo click easter egg
const logoEl = document.querySelector('.logo');
if (logoEl) {
    logoEl.addEventListener('click', () => {
        logoClickCount++;
        if (logoClickCount === 5) {
            showAchievement('Logo Master', 'You really like our logo!');
            addScore(50);
        }
    });
}

// Hazard icon triple click
const hazardIconEl = document.querySelector('.hazard-icon');
if (hazardIconEl) {
    hazardIconEl.addEventListener('click', () => {
        hazardIconClickCount++;
        if (hazardIconClickCount === 3) {
            document.body.classList.add('hazard-mode');
            setTimeout(() => {
                document.body.classList.remove('hazard-mode');
            }, 3000);
            unlockAchievement('Hazard Mode', 'Inverted colors activated!');
        }
        setTimeout(() => hazardIconClickCount = 0, 2000);
    });
}

// Digital Hazard text click
const glitchTextEl = document.querySelector('.glitch-text');
if (glitchTextEl) {
    glitchTextEl.addEventListener('click', () => {
        digitalHazardClickCount++;
        if (digitalHazardClickCount === 10) {
            showAchievement('Persistent Clicker', 'Clicked 10 times on Digital Hazard!');
            addScore(100);
            digitalHazardClickCount = 0;
        }
    });
}

// Email hover easter egg
const emailElement = document.querySelector('a[href^="mailto:"]');
if (emailElement) {
    emailElement.addEventListener('mouseenter', () => {
        emailHoverStart = Date.now();
    });
    emailElement.addEventListener('mouseleave', () => {
        emailHoverStart = null;
    });
    setInterval(() => {
        if (emailHoverStart && Date.now() - emailHoverStart > 5000) {
            showAchievement('Patient Explorer', 'Hovered over email for 5 seconds!');
            addScore(25);
            emailHoverStart = null;
        }
    }, 1000);
}

// Scroll easter egg
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollDirection.push(scrollTop > lastScrollTop ? 'down' : 'up');
    if (scrollDirection.length > 6) scrollDirection.shift();
    lastScrollTop = scrollTop;

    if (scrollDirection.join(',') === 'down,down,down,up,up,up' || 
        scrollDirection.join(',') === 'up,up,up,down,down,down') {
        unlockAchievement('Scroll Master', 'Scrolled to bottom and back!');
    }
});

// Section tracking
const sections = document.querySelectorAll('section[id]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (!GameState.sectionsVisited.has(sectionId)) {
                GameState.sectionsVisited.add(sectionId);
                addScore(10);
                if (GameState.sectionsVisited.size === sections.length && !GameState.achievements['Explorer']) {
                    unlockAchievement('Explorer', 'Visited all sections!');
                }
            }
        }
    });
}, { threshold: 0.5 });

sections.forEach(section => observer.observe(section));

// Social link tracking
document.querySelectorAll('.social-links a').forEach(link => {
    link.addEventListener('click', () => {
        const href = link.getAttribute('href');
        if (!GameState.socialClicks.has(href)) {
            GameState.socialClicks.add(href);
            addScore(20);
            if (GameState.socialClicks.size === 4 && !GameState.achievements['Social Butterfly']) {
                unlockAchievement('Social Butterfly', 'Clicked all social links!');
            }
        }
    });
});

// Code block easter egg
const codeBlock = document.querySelector('.code-block');
if (codeBlock) {
    const codeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !GameState.achievements['Code Reader']) {
                unlockAchievement('Code Reader', 'Viewed the HazardForge code!');
            }
        });
    }, { threshold: 0.5 });
    codeObserver.observe(codeBlock);
}

// Tooltip system
const tooltip = document.getElementById('tooltip');
if (tooltip) {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const tooltipText = e.target.getAttribute('data-tooltip');
            if (tooltipText) {
                tooltip.textContent = tooltipText;
                tooltip.style.left = e.clientX + 10 + 'px';
                tooltip.style.top = e.clientY + 10 + 'px';
                tooltip.classList.add('show');
            }
        });
        el.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
        el.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.clientX + 10 + 'px';
            tooltip.style.top = e.clientY + 10 + 'px';
        });
    });
}

// Active nav highlighting
window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 100;
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            const section = document.querySelector(href);
            if (section) {
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;
                if (scrollPos >= top && scrollPos <= bottom) {
                    link.style.color = '#ff8c00';
                } else {
                    link.style.color = '#fff';
                }
            }
        }
    });
});

// Console easter egg (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('%cDigital Hazard Studio', 'color: #ff8c00; font-size: 20px; font-weight: bold;');
    console.log('%cHazardForge AI Engine v1.0', 'color: #ffa500; font-size: 12px;');
    console.log('%c\n   _    _  _       _  _    _    _  _    _  _\n  | |  | || |     | || |  | |  | || |  | || |\n  | |__| || |_    | || |  | |  | || |  | || |\n  |  __  ||   |   | || |  | |  | || |  | || |\n  | |  | || | |   | || |  | |  | || |  | || |\n  |_|  |_||_| |_  |_||_|  |_|  |_||_|  |_||_|\n\n  Easter Egg Found! Type "help" for commands.\n', 'color: #00ff00; font-family: monospace;');
}

// Initialize
loadGameState();
simulateLoading();
