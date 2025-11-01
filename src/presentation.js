// Presentation/Slide Deck System
import { game } from './gamification.js';

class PresentationDeck {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.currentSlide = 0;
    game.totalSlides = this.slides.length;
    this.init();
  }

  init() {
    // Hide all slides except the first one
    this.slides.forEach((slide, index) => {
      slide.style.display = index === 0 ? 'flex' : 'none';
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prevSlide();
      }
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });

    const handleSwipe = () => {
      if (touchEndX < touchStartX - 50) this.nextSlide();
      if (touchEndX > touchStartX + 50) this.prevSlide();
    };
    this.handleSwipe = handleSwipe;

    this.updateNavigation();
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.slides[this.currentSlide].style.display = 'none';
      this.currentSlide++;
      this.slides[this.currentSlide].style.display = 'flex';
      game.currentSlide = this.currentSlide;
      game.updateProgress();
      game.addPoints(10, 'Slide completed');
      this.updateNavigation();
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.slides[this.currentSlide].style.display = 'none';
      this.currentSlide--;
      this.slides[this.currentSlide].style.display = 'flex';
      game.currentSlide = this.currentSlide;
      game.updateProgress();
      this.updateNavigation();
    }
  }

  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.slides[this.currentSlide].style.display = 'none';
      this.currentSlide = index;
      this.slides[this.currentSlide].style.display = 'flex';
      game.currentSlide = this.currentSlide;
      game.updateProgress();
      this.updateNavigation();
    }
  }

  updateNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const slideCounter = document.getElementById('slide-counter');

    if (prevBtn) {
      prevBtn.disabled = this.currentSlide === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentSlide === this.slides.length - 1;
    }
    if (slideCounter) {
      slideCounter.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
    }
  }
}

export { PresentationDeck };
