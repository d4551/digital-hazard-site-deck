// presentation.js - Game-Like Presentation Deck with Fluid Slide Animations and Embedded Interactions

import { initBackground } from './threejs-background.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';

// Initialize 3D Background
initBackground('presentation-background'); // Non-interactive for presentation focus

// Slide Management
const slides = document.querySelectorAll('.deck-slide');
let currentSlide = 0;
const totalSlides = slides.length;
const progressBar = document.getElementById('slide-progress');
const slideCounter = document.getElementById('slide-counter');
const prevBtn = document.getElementById('prev-slide');
const nextBtn = document.getElementById('next-slide');
const autoPlayBtn = document.getElementById('auto-play');
let autoPlayInterval = null;

// Update UI
function updateProgress() {
  const progress = ((currentSlide + 1) / totalSlides) * 100;
  progressBar.value = progress;
  slideCounter.textContent = `Slide ${currentSlide + 1} / ${totalSlides}`;
}

// Animate Slide Transition
function goToSlide(index) {
  gsap.to(slides[currentSlide], { duration: 0.5, opacity: 0, x: index > currentSlide ? -50 : 50, ease: 'power2.in' });
  currentSlide = (index + totalSlides) % totalSlides;
  gsap.fromTo(slides[currentSlide], 
    { opacity: 0, x: index > currentSlide ? 50 : -50 },
    { duration: 0.5, opacity: 1, x: 0, ease: 'power2.out' }
  );
  slides.forEach((slide, i) => slide.classList.toggle('active', i === currentSlide));
  updateProgress();
}

// Navigation Events
prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
  if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
});

// Auto-Play Toggle
autoPlayBtn.addEventListener('click', () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    autoPlayBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i> Auto';
  } else {
    autoPlayInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
    autoPlayBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i> Stop';
  }
});

// Video in Slide
const slideVideo = document.getElementById('slide-video');
slideVideo.addEventListener('play', () => {
  // Pause auto-play if active
  if (autoPlayInterval) clearInterval(autoPlayInterval);
});

// Embedded Game in Slide
const gameContainer = document.getElementById('presentation-game');
const restartBtn = document.getElementById('restart-embedded-game');

function initEmbeddedGame() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, gameContainer.clientWidth / gameContainer.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
  gameContainer.appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();

  return renderer;
}

let gameRenderer = initEmbeddedGame();

restartBtn.addEventListener('click', () => {
  gameContainer.innerHTML = '';
  gameRenderer = initEmbeddedGame();
});

// Resize Handlers
window.addEventListener('resize', () => {
  // Update game renderer size if on game slide
  if (currentSlide === 2 && gameRenderer) {
    gameRenderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
  }
});

// Initial Setup
goToSlide(0);
