// Legacy fallback for file:// protocol — uses global THREE and GSAP
(function() {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // The following mirrors present.js logic without ESM import
  const gameState = {
    viewedSlides: new Set([0]),
    discoveredItems: new Set(),
    totalScore: 0,
    comboCount: 0,
    comboTimer: null,
    comboMultiplier: 1.0,
    secretsFound: new Set(),
    powerups: { multiplier: { active: false, cooldown: 0 }, reveal: { active: false, cooldown: 0 }, freeze: { active: false, cooldown: 0 } },
    achievements: (() => { try { return JSON.parse(localStorage.getItem('dhAchievements') || '[]'); } catch { return []; } })(),
    highScore: (() => { try { return parseInt(localStorage.getItem('dhHighScore') || '0'); } catch { return 0; } })()
  };

  // Minimal init to avoid full duplication: kick off three background and core UI
  function initThreeJS() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.position.z = 30;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = prefersReduced ? 700 : 2000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.3, color: 0xff6b00, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(10, 0.4, 16, 100), new THREE.MeshBasicMaterial({ color: 0xff6b00, wireframe: true, transparent: true, opacity: 0.3 }));
    scene.add(ring);
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => { mouseX = (e.clientX / window.innerWidth) * 2 - 1; mouseY = -(e.clientY / window.innerHeight) * 2 + 1; });
    let running = true;
    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
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
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else { running = true; requestAnimationFrame(animate); } });
  }

  function initScorePopup() {
    window.addPoints = function(points) {
      gameState.totalScore += points;
      const scoreNumber = document.getElementById('scoreNumber');
      const popup = document.getElementById('scorePopup');
      if (popup && scoreNumber) {
        scoreNumber.textContent = '+' + points;
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 1000);
      }
    };
  }

  function initScrollEffects() {
    if (prefersReduced || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.slide .slide-content h2, .slide .steam-widget, .slide .stats-grid, .slide .feature-grid, .slide .team-grid').forEach(el => {
      gsap.from(el, { y: 40, opacity: 0, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ initThreeJS(); initScorePopup(); initScrollEffects(); });
  } else {
    initThreeJS(); initScorePopup(); initScrollEffects();
  }
})();

