// Three.js 3D Components
import * as THREE from 'three';

class ThreeJSScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 5;
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.objects = [];
  }

  onWindowResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  addRotatingCube(color = 0x00ff00) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    this.objects.push({ mesh: cube, type: 'cube' });
    return cube;
  }

  addRotatingSphere(color = 0xff0000, radius = 1) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);
    this.objects.push({ mesh: sphere, type: 'sphere' });
    return sphere;
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Rotate all objects
    this.objects.forEach(obj => {
      obj.mesh.rotation.x += 0.01;
      obj.mesh.rotation.y += 0.01;
    });
    
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.addLights();
    this.animate();
  }
}

// Create floating particles effect
class ParticleSystem {
  constructor(containerId, count = 100) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 50;
    
    // Create particles
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < count; i++) {
      positions.push((Math.random() - 0.5) * 100);
      positions.push((Math.random() - 0.5) * 100);
      positions.push((Math.random() - 0.5) * 100);
      
      colors.push(Math.random());
      colors.push(Math.random());
      colors.push(Math.random());
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
    
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.particles.rotation.x += 0.001;
    this.particles.rotation.y += 0.002;
    
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.animate();
  }
}

export { ThreeJSScene, ParticleSystem };
