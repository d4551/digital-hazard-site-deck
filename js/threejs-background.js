// threejs-background.js - Fluid Animated 3D Particle Background for Game-Like Experience

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export function initBackground(containerId, isInteractive = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Particle System
  const particleCount = 5000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 10;
    positions[i + 1] = (Math.random() - 0.5) * 10;
    positions[i + 2] = (Math.random() - 0.5) * 10;

    colors[i] = Math.random(); // Green-ish tones
    colors[i + 1] = 1;
    colors[i + 2] = Math.random() * 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Fluid Animation
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    particles.rotation.y += delta * 0.1;
    particles.rotation.x += delta * 0.05;

    // Sine wave movement for fluidity
    const time = clock.getElapsedTime();
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(time + positions[i]) * 0.01;
      if (positions[i + 1] > 5) positions[i + 1] = -5;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Optional Interactivity (e.g., mouse control)
  if (isInteractive) {
    window.addEventListener('mousemove', (event) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      camera.position.x = mouseX * 2;
      camera.position.y = mouseY * 2;
      camera.lookAt(scene.position);
    });
  }
}
