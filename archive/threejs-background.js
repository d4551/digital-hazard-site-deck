import * as THREE from 'three';
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
camera.position.z = 50;

const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = prefersReduced ? 1000 : 3000;
const posArray = new Float32Array(particlesCount * 3);
const colors = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 200;
    posArray[i + 1] = (Math.random() - 0.5) * 200;
    posArray[i + 2] = (Math.random() - 0.5) * 200;

    const orangeShade = Math.random();
    colors[i] = 1;
    colors[i + 1] = 0.4 + orangeShade * 0.3;
    colors[i + 2] = 0;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

const torusGeometry = new THREE.TorusGeometry(10, 1, 16, 100);
const torusMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8c00,
    wireframe: true,
    transparent: true,
    opacity: 0.2
});
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.set(30, -20, -30);
scene.add(torus);

const octahedronGeometry = new THREE.OctahedronGeometry(8);
const octahedronMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    wireframe: true,
    transparent: true,
    opacity: 0.2
});
const octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial);
octahedron.position.set(-30, 20, -40);
scene.add(octahedron);

let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

let lastTime = performance.now();
let frames = 0;
let fps = 60;

let running = true;
function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    particlesMesh.rotation.y += 0.0005;
    particlesMesh.rotation.x += 0.0003;

    const speedScale = prefersReduced ? 0.4 : 1;
    torus.rotation.x += 0.005 * speedScale;
    torus.rotation.y += 0.008 * speedScale;

    octahedron.rotation.x += 0.003 * speedScale;
    octahedron.rotation.y += 0.006 * speedScale;

    camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);

    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        document.getElementById('fps').textContent = fps;
        document.getElementById('particles').textContent = particlesCount;
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.threeScene = { scene, camera, renderer };

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        running = false;
    } else {
        if (!running) {
            running = true;
            requestAnimationFrame(animate);
        }
    }
});
