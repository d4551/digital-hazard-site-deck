// 3D Survival Game Remake using Three.js
// Based on original 2D game logic, adapted to 3D

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Powerup map (adapted from original)
const POWERUP_ICON_MAP = {
  rapidfire: { icon: 'fas fa-bolt', color: 'rgba(250, 204, 21, 0.95)', label: 'Rapid Fire' },
  spreadshot: { icon: 'fas fa-wand-magic-sparkles', color: 'rgba(251, 191, 36, 0.95)', label: 'Spread Shot' },
  explosive: { icon: 'fas fa-bomb', color: 'rgba(248, 113, 113, 0.95)', label: 'Explosive' },
  multiplier: { icon: 'fas fa-star', color: 'rgba(34, 197, 94, 0.95)', label: 'Multiplier' },
  shield: { icon: 'fas fa-shield-halved', color: 'rgba(14, 165, 233, 0.95)', label: 'Shield' },
  speed: { icon: 'fas fa-forward-fast', color: 'rgba(59, 130, 246, 0.95)', label: 'Speed' },
  health: { icon: 'fas fa-heart-pulse', color: 'rgba(239, 68, 68, 0.95)', label: 'Health' },
  frenzy: { icon: 'fas fa-fire-flame-curved', color: 'rgba(248, 113, 113, 0.95)', label: 'Frenzy' },
  pierce: { icon: 'fas fa-arrow-right', color: 'rgba(139, 92, 246, 0.95)', label: 'Pierce' },
  regen: { icon: 'fas fa-plus-circle', color: 'rgba(16, 185, 129, 0.95)', label: 'Regen' },
  doubleDamage: { icon: 'fas fa-sword', color: 'rgba(245, 158, 11, 0.95)', label: '2x Damage' },
  freeze: { icon: 'fas fa-snowflake', color: 'rgba(6, 182, 212, 0.95)', label: 'Freeze' },
  magnet: { icon: 'fas fa-magnet', color: 'rgba(236, 72, 153, 0.95)', label: 'Magnet' },
  godmode: { icon: 'fas fa-crown', color: 'rgba(255, 215, 0, 0.95)', label: 'God Mode' }
};

// Basic Particle System for 3D
class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  createExplosion(x, y, z, color = 0xff0000, count = 50, size = 0.1) {
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(x, y, z);
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(Math.random() * 5);
      particle.life = Math.random() * 2 + 1;
      this.scene.add(particle);
      this.particles.push(particle);
    }
  }

  update(delta) {
    this.particles = this.particles.filter(p => {
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p);
        return false;
      }
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.multiplyScalar(0.95); // friction
      return true;
    });
  }
}

// Main 3D Survival Game class
class SurvivalGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.z = 5;

    this.player = this.createPlayer();
    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.particleSystem = new ParticleSystem(this.scene);

    this.score = 0;
    this.level = 1;
    this.state = 'menu';

    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };

    this.initEvents();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  createPlayer() {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    this.scene.add(player);
    return player;
  }

  createEnemy() {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(geometry, material);
    enemy.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    this.scene.add(enemy);
    this.enemies.push(enemy);
    return enemy;
  }

  shoot() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.position.copy(this.player.position);
    bullet.velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion).multiplyScalar(5);
    this.scene.add(bullet);
    this.bullets.push(bullet);
  }

  initEvents() {
    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    this.canvas.addEventListener('mousedown', () => { this.mouse.down = true; this.shoot(); });
    this.canvas.addEventListener('mouseup', () => { this.mouse.down = false; });
    // Add more events as needed
  }

  update() {
    // Player movement
    const speed = 0.1;
    if (this.keys['KeyW']) this.player.position.z -= speed;
    if (this.keys['KeyS']) this.player.position.z += speed;
    if (this.keys['KeyA']) this.player.position.x -= speed;
    if (this.keys['KeyD']) this.player.position.x += speed;

    // Spawn enemies
    if (Math.random() < 0.01) this.createEnemy();

    // Update bullets
    this.bullets = this.bullets.filter(b => {
      b.position.add(b.velocity);
      if (b.position.z < -10) {
        this.scene.remove(b);
        return false;
      }
      return true;
    });

    // Collision detection (simple)
    this.enemies = this.enemies.filter(e => {
      this.bullets.forEach(b => {
        if (b.position.distanceTo(e.position) < 0.4) {
          this.scene.remove(e);
          this.scene.remove(b);
          this.particleSystem.createExplosion(e.position.x, e.position.y, e.position.z);
          this.score += 10;
          return false;
        }
      });
      return true;
    });

    this.particleSystem.update(0.016); // assuming 60fps
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.state === 'playing') {
      this.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  startGame() {
    this.state = 'playing';
    // Reset score, etc.
    this.score = 0;
    this.level = 1;
  }

  // Add more methods for powerups, levels, etc., based on original logic
}

// Export for use in main.js or presentation.js
export { SurvivalGame };
