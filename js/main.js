// main.js - Interactive Game-Like Landing Page Logic with Fluid Animations

import { initBackground } from './threejs-background.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';

// Initialize 3D Background
initBackground('landing-background', true); // Enable mouse interactivity for game feel

// Video Handler
const video = document.getElementById('intro-video');
const muteBtn = document.getElementById('mute-toggle');

muteBtn.addEventListener('click', () => {
  video.muted = !video.muted;
  muteBtn.innerHTML = video.muted ? '<i class="fa-solid fa-volume-mute"></i>' : '<i class="fa-solid fa-volume-high"></i>';
});

// Game Modal Handler (Placeholder for full game integration)
const gameModal = document.getElementById('game-dialog');
const gameBtn = document.getElementById('open-game');
const closeGameBtn = document.querySelector('[data-close-modal]');

gameBtn.addEventListener('click', () => {
  gameModal.showModal();
  // TODO: Initialize actual game in #game-container
  initMiniGame();
});

closeGameBtn.addEventListener('click', () => {
  gameModal.close();
  // TODO: Pause or destroy game instance
});

// Simple Mini-Game Placeholder using Three.js
function initMiniGame() {
  const container = document.getElementById('game-root');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();

  // Cleanup on modal close
  gameModal.addEventListener('close', () => {
    renderer.domElement.remove();
  }, { once: true });
}

// Fluid Animations with GSAP
document.addEventListener('DOMContentLoaded', () => {
  gsap.from('.hero-content', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
    stagger: 0.2
  });

  gsap.from('.stat', {
    duration: 1,
    scale: 0.8,
    opacity: 0,
    stagger: 0.1,
    ease: 'elastic.out(1, 0.5)',
    scrollTrigger: {
      trigger: '#experience-section',
      start: 'top 80%',
    }
  });

  gsap.from('.card', {
    duration: 1.2,
    x: -50,
    opacity: 0,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#media-section',
      start: 'top 80%',
    }
  });

  gsap.from('.tech-item', {
    duration: 1,
    rotationY: 90,
    opacity: 0,
    stagger: 0.1,
    ease: 'back.out(1.7)',
    scrollTrigger: {
      trigger: '#tech-section',
      start: 'top 80%',
    }
  });
});

// Scroll-Based Parallax for Game Depth
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('.parallax').forEach(el => {
    el.style.transform = `translateY(${scrollY * 0.1}px)`;
  });
});
