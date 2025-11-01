import './style.css';
import { game } from './gamification.js';
import { PresentationDeck } from './presentation.js';
import { ThreeJSScene, ParticleSystem } from './threejs.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Digital Hazard Site Deck - Initializing...');

  // Initialize presentation deck
  const deck = new PresentationDeck();

  // Navigation button handlers
  document.getElementById('prev-btn')?.addEventListener('click', () => deck.prevSlide());
  document.getElementById('next-btn')?.addEventListener('click', () => deck.nextSlide());

  // Easter Egg: Konami Code
  let konamiCode = [];
  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  
  document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    if (konamiCode.length > konamiSequence.length) {
      konamiCode.shift();
    }
    if (konamiCode.join(',') === konamiSequence.join(',')) {
      game.foundEasterEgg('konami', 'Konami Code');
      activateKonamiEffect();
    }
  });

  function activateKonamiEffect() {
    document.body.style.transform = 'rotate(360deg)';
    document.body.style.transition = 'transform 2s';
    setTimeout(() => {
      document.body.style.transform = 'rotate(0deg)';
    }, 2000);
  }

  // Easter Egg: Secret button click counter
  let secretClicks = 0;
  document.getElementById('logo')?.addEventListener('click', () => {
    secretClicks++;
    if (secretClicks === 5) {
      game.foundEasterEgg('logo', 'Logo Master');
      const logo = document.getElementById('logo');
      logo.classList.add('animate-spin');
      setTimeout(() => logo.classList.remove('animate-spin'), 2000);
    }
  });

  // Easter Egg: Theme switcher hidden combo
  const themeBtn = document.getElementById('theme-toggle');
  let themeClicks = 0;
  themeBtn?.addEventListener('dblclick', () => {
    themeClicks++;
    if (themeClicks === 3) {
      game.foundEasterEgg('theme', 'Theme Hunter');
      cycleRandomTheme();
    }
  });

  // Theme management
  const themes = ["light", "dark", "cupcake", "cyberpunk", "synthwave", "retro", "valentine", "halloween", "forest"];
  let currentThemeIndex = 1; // Start with dark

  function cycleRandomTheme() {
    currentThemeIndex = Math.floor(Math.random() * themes.length);
    document.documentElement.setAttribute('data-theme', themes[currentThemeIndex]);
  }

  themeBtn?.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    document.documentElement.setAttribute('data-theme', themes[currentThemeIndex]);
    game.addPoints(5, 'Theme changed');
  });

  // Reset button
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    game.reset();
  });

  // Initialize Three.js scenes
  setTimeout(() => {
    // Hero 3D scene
    const heroScene = new ThreeJSScene('hero-3d');
    if (heroScene.container) {
      const cube = heroScene.addRotatingCube(0x00ffff);
      cube.position.x = -2;
      const sphere = heroScene.addRotatingSphere(0xff00ff, 0.8);
      sphere.position.x = 2;
      heroScene.start();
    }

    // Particle system for background
    const particles = new ParticleSystem('particles-bg');
    if (particles.container) {
      particles.start();
    }

    // Another 3D scene
    const scene3d = new ThreeJSScene('threejs-scene');
    if (scene3d.container) {
      scene3d.addRotatingCube(0xff6600);
      scene3d.start();
    }
  }, 100);

  // Interactive card hover effects
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('shadow-2xl', 'scale-105');
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('shadow-2xl', 'scale-105');
    });
  });

  // Add points for various interactions
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      game.addPoints(5, 'Link clicked');
    });
  });

  // Badge showcase
  document.getElementById('badges-display')?.addEventListener('click', () => {
    showBadgeModal();
  });

  function showBadgeModal() {
    const modal = document.getElementById('badge-modal');
    if (modal) {
      modal.checked = true;
    }
  }

  console.log('Digital Hazard Site Deck - Ready!');
  game.updateProgress();
});
