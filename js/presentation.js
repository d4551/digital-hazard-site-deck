// Presentation/Slide Deck System - Static Compatible
// Works with unified gamification system

(function() {
    'use strict';
    
    const SWIPE_THRESHOLD = 50; // pixels
    
    class PresentationDeck {
        constructor() {
            this.slides = document.querySelectorAll('.slide');
            this.currentSlide = 0;
            this.totalSlides = this.slides.length;
            
            if (window.game) {
                window.game.totalSlides = this.totalSlides;
            }
            
            this.init();
        }
        
        init() {
            if (this.slides.length === 0) return;
            
            // Hide all slides except the first one
            this.slides.forEach((slide, index) => {
                slide.classList.remove('active');
                if (index === 0) {
                    slide.classList.add('active');
                }
            });
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                    e.preventDefault();
                    this.nextSlide();
                } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                    e.preventDefault();
                    this.prevSlide();
                } else if (e.key === '?') {
                    e.preventDefault();
                    this.showHelp();
                } else if (e.key === 'a' || e.key === 'A') {
                    e.preventDefault();
                    this.showAchievements();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    this.goToSlide(0);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    this.goToSlide(this.slides.length - 1);
                }
            });
            
            // Touch swipe support
            let touchStartX = 0;
            let touchEndX = 0;
            let touchStartY = 0;
            let touchEndY = 0;
            
            document.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            });
            
            document.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                this.handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY);
            });
            
            // Button handlers
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.prevSlide());
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.nextSlide());
            }
            
            // Help toggle
            const helpToggle = document.getElementById('helpToggle');
            if (helpToggle) {
                helpToggle.addEventListener('click', () => this.showHelp());
            }
            
            // Game button - opens the new survival game modal
            const gameBtn = document.getElementById('startMinigame');
            if (gameBtn) {
                // Remove old minigame listeners and add new game modal listener
                gameBtn.addEventListener('click', () => this.startMinigame());
            }
            
            this.updateNavigation();
            this.initEasterEggs();
            this.initRebelTracking();
        }
        
        initRebelTracking() {
            if (!window.game) return;
            
            // Track manifesto fragments
            document.querySelectorAll('.manifesto-fragment').forEach(fragment => {
                fragment.addEventListener('click', function(e) {
                    const fragmentId = this.getAttribute('data-fragment');
                    if (fragmentId && window.game) {
                        window.game.collectManifestoFragment(fragmentId);
                        this.classList.add('rebel-action');
                        setTimeout(() => this.classList.remove('rebel-action'), 1000);
                    }
                });
            });
            
            // Track deck references when slides are viewed
            this.slides.forEach((slide, index) => {
                const deckRef = slide.getAttribute('data-deck-reference');
                const compassRef = slide.getAttribute('data-compass-reference');
                
                if (deckRef && window.game) {
                    window.game.trackDeckReference(deckRef, `slide-${index}`);
                }
                if (compassRef && window.game) {
                    window.game.trackCompassStat(compassRef);
                }
            });
            
            // Track compass stats on click
            document.querySelectorAll('[data-compass-stat]').forEach(stat => {
                stat.addEventListener('click', function(e) {
                    const statId = this.getAttribute('data-compass-stat');
                    if (statId && window.game) {
                        window.game.trackCompassStat(statId);
                        this.classList.add('rebel-action');
                        setTimeout(() => this.classList.remove('rebel-action'), 1000);
                    }
                });
            });
            
            // Track deck references on easter egg clicks
            document.querySelectorAll('[data-deck-reference]').forEach(ref => {
                ref.addEventListener('click', function(e) {
                    const deckType = this.getAttribute('data-deck-reference');
                    const refId = this.getAttribute('data-secret') || this.id || 'unknown';
                    if (deckType && window.game) {
                        window.game.trackDeckReference(deckType, refId);
                    }
                });
            });
        }
        
        handleSwipe(startX, endX, startY, endY) {
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Only process horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                if (deltaX < 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        }
        
        nextSlide() {
            if (this.currentSlide < this.slides.length - 1) {
                this.goToSlide(this.currentSlide + 1);
            }
        }
        
        prevSlide() {
            if (this.currentSlide > 0) {
                this.goToSlide(this.currentSlide - 1);
            }
        }
        
        goToSlide(index) {
            if (index < 0 || index >= this.slides.length) return;
            
            // Hide current slide
            this.slides[this.currentSlide].classList.remove('active');
            
            // Show new slide
            this.currentSlide = index;
            this.slides[this.currentSlide].classList.add('active');
            
            // Update gamification
            if (window.game) {
                window.game.viewSlide(this.currentSlide);
            }
            
            this.updateNavigation();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        updateNavigation() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const currentSlideEl = document.getElementById('currentSlide');
            const totalSlidesNav = document.getElementById('totalSlidesNav');
            const progressBar = document.getElementById('progressBar');
            
            if (prevBtn) {
                prevBtn.disabled = this.currentSlide === 0;
                prevBtn.classList.toggle('btn-disabled', this.currentSlide === 0);
            }
            if (nextBtn) {
                nextBtn.disabled = this.currentSlide === this.slides.length - 1;
                nextBtn.classList.toggle('btn-disabled', this.currentSlide === this.slides.length - 1);
            }
            if (currentSlideEl) {
                currentSlideEl.textContent = this.currentSlide + 1;
            }
            if (totalSlidesNav) {
                totalSlidesNav.textContent = this.totalSlides;
            }
            if (progressBar) {
                const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
                progressBar.value = progress;
            }
        }
        
        initEasterEggs() {
            // Wire up all easter eggs
            document.querySelectorAll('.easter-egg').forEach(egg => {
                egg.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const secret = egg.getAttribute('data-secret');
                    const points = parseInt(egg.getAttribute('data-points') || '100', 10);
                    
                    if (window.game && secret) {
                        window.game.foundEasterEgg(secret, secret.charAt(0).toUpperCase() + secret.slice(1), points);
                        egg.classList.add('opacity-50');
                        egg.style.pointerEvents = 'none';
                    }
                });
            });
            
            // Wire up all data-points elements
            document.querySelectorAll('[data-points]').forEach(element => {
                if (element.classList.contains('easter-egg')) return; // Already handled
                
                element.addEventListener('click', function() {
                    const points = parseInt(this.getAttribute('data-points') || '10', 10);
                    if (window.game && !this.classList.contains('discovered')) {
                        this.classList.add('discovered');
                        window.game.addPoints(points, 'Discovery');
                    }
                });
            });
        }
        
        showHelp() {
            const modal = document.getElementById('keyboardHelp');
            if (modal) {
                modal.showModal();
            }
        }
        
        showAchievements() {
            const modal = document.getElementById('achievementGallery');
            if (modal && window.game) {
                this.updateAchievementGallery();
                modal.showModal();
            }
        }
        
        updateAchievementGallery() {
            const grid = document.getElementById('achievementGrid');
            if (!grid || !window.game) return;
            
            grid.innerHTML = '';
            
            if (window.game.achievements.length === 0) {
                grid.innerHTML = '<p class="text-center text-base-content/70 col-span-full">No achievements unlocked yet. Keep exploring!</p>';
                return;
            }
            
            window.game.achievements.forEach(achievement => {
                const card = document.createElement('div');
                card.className = 'card bg-base-200 border border-base-300';
                card.innerHTML = `
                    <div class="card-body">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-trophy text-accent text-2xl"></i>
                            <div>
                                <h4 class="font-bold">${achievement.name}</h4>
                                <p class="text-sm text-base-content/70">${achievement.description}</p>
                                <p class="text-xs text-base-content/60 mt-1">
                                    ${new Date(achievement.unlockedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
        
        startMinigame() {
            // Open the game modal - game initialization happens automatically via init-shared.js MutationObserver
            const gameModal = document.getElementById('gameModal');
            if (gameModal && typeof gameModal.showModal === 'function') {
                gameModal.showModal();
            } else {
                console.warn('[Presentation] gameModal not found');
                // Fallback: redirect to index.html if game modal not found
                window.location.href = 'index.html#game';
            }
        }
        
        initMinigame() {
            // Disabled - using new survival game instead of old minigame
            // Old minigame code removed - game button now opens gameModal with new survival game
            // This method is kept for compatibility but does nothing
            return;
        }
    }
    
    // Initialize when DOM is ready and CONFIG is available
    function init() {
        if (!window.CONFIG_READY) {
            window.addEventListener('configReady', init, { once: true });
            return;
        }
        
        const deck = new PresentationDeck();
        window.presentationDeck = deck;
    }
    
    function readyInit() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            setTimeout(init, 100);
        }
    }
    
    if (window.CONFIG_READY) {
        readyInit();
    } else {
        window.addEventListener('configReady', readyInit, { once: true });
    }
})();
