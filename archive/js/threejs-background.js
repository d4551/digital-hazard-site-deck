/**
 * Nebula Ribbon Background
 * ------------------------------------------------------
 * Replaces the original background with a layered neon field:
 *  - Spiral particle nebula rendered with additive blending
 *  - Two dynamic ribbons orbiting through the scene
 *  - Minimal grid plane for depth cueing
 * The effect reacts lightly to pointer movement and respects
 * reduced-motion preferences.
 */

(async function createBackground() {
    'use strict';

    if (typeof window === 'undefined') return;
    if (window.location.protocol === 'file:') return;

    const canvas = document.getElementById('three-canvas') || document.getElementById('bg-canvas');
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Performance detection for low-end devices
    const isLowEndDevice = (() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return true;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer && (
                renderer.includes('Intel') && (
                    renderer.includes('HD Graphics') ||
                    renderer.includes('UHD Graphics') ||
                    renderer.includes('Iris') && renderer.includes('Graphics')
                ) ||
                renderer.includes('Mali') ||
                renderer.includes('Adreno') && renderer.includes('3') ||
                renderer.includes('PowerVR')
            )) {
                return true;
            }
        }
        return navigator.hardwareConcurrency <= 2 ||
               (navigator.deviceMemory && navigator.deviceMemory <= 2);
    })();

    const performanceMode = prefersReducedMotion ? 'reduced' :
                           isLowEndDevice ? 'low' : 'normal';

    // Ensure THREE is available
    if (typeof window.THREE === 'undefined') {
        try {
            const module = await import('./three.module.js');
            window.THREE = module.default || module;
        } catch (error) {
            console.warn('[DH Background] Failed to load three.module.js', error);
            return;
        }
    }

    const THREE = window.THREE;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.set(0, 0, 60);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode === "reduced" ? 1 : performanceMode === "low" ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const group = new THREE.Group();
    scene.add(group);

    /* ------------------------ Particle Nebula ------------------------ */
    const particleCount = performanceMode === "reduced" ? 300 : performanceMode === "low" ? 600 : 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        const angle = i * 0.24;
        const radius = 16 + Math.sin(i * 0.12) * 8;
        const height = (i / particleCount - 0.5) * 70;

        positions[index] = Math.cos(angle) * radius + Math.sin(i * 0.05) * 4;
        positions[index + 1] = height + Math.cos(i * 0.14) * 2;
        positions[index + 2] = Math.sin(angle) * radius + Math.cos(i * 0.08) * 6;

        const t = i / particleCount;
        const color = new THREE.Color().setHSL(0.58 + t * 0.15, 0.75, 0.55 + Math.sin(i * 0.11) * 0.1);

        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
    }

    const nebulaGeometry = new THREE.BufferGeometry();
    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const nebulaMaterial = new THREE.PointsMaterial({
        size: performanceMode === "reduced" ? 0.15 : performanceMode === "low" ? 0.25 : 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    group.add(nebula);

    /* ------------------------ Ribbon helpers ------------------------ */
    const ribbons = [];

    function createRibbon({ radius = 20, phase = 0, color = 0x7c3aed, opacity = 0.25 }) {
        const points = [];
        const segments = performanceMode === "reduced" ? 24 : performanceMode === "low" ? 32 : 48;
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const x = Math.cos(t + phase) * (radius + Math.sin(t * 1.5) * 4);
            const y = Math.sin(t * 0.8 + phase) * 12;
            const z = Math.sin(t + phase) * (radius + Math.cos(t * 1.2) * 3) - 10;
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments, 0.45, 8, true);
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.y = phase;
        group.add(mesh);
        ribbons.push(mesh);
    }

    createRibbon({ radius: 22, phase: 0, color: 0x38bdf8, opacity: 0.35 });
    createRibbon({ radius: 16, phase: Math.PI * 0.5, color: 0x7c3aed, opacity: 0.28 });

    /* ------------------------- Grid plane --------------------------- */
    const grid = new THREE.GridHelper(200, 40, 0x38bdf8, 0x1e293b);
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -60;
    group.add(grid);

    /* ------------------------ Interaction --------------------------- */
    let targetRotationX = 0;
    let targetRotationY = 0;

    function handlePointerMove(event) {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        targetRotationY = x * 0.25;
        targetRotationX = y * 0.15;
    }

    if (!prefersReducedMotion) {
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }

    /* ------------------------ Animation loop ------------------------ */
    let animationFrame = null;
    let isPaused = false;
    const clock = new THREE.Clock();

    // Animation speed multipliers based on performance
    const animSpeedMult = performanceMode === "reduced" ? 0.3 : performanceMode === "low" ? 0.6 : 1.0;

    function animate() {
        if (isPaused) return;
        
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        group.rotation.y += (targetRotationY - group.rotation.y) * 0.05 * animSpeedMult;
        group.rotation.x += (targetRotationX - group.rotation.x) * 0.05 * animSpeedMult;

        nebula.rotation.y += delta * 0.07 * animSpeedMult;
        nebula.rotation.x += delta * 0.03 * animSpeedMult;

        ribbons.forEach((mesh, index) => {
            mesh.rotation.y += delta * (0.12 + index * 0.05) * animSpeedMult;
            mesh.rotation.x = Math.sin(elapsed * 0.15 * animSpeedMult + index) * 0.2;
        });

        grid.position.y = Math.sin(elapsed * 0.5 * animSpeedMult) * 4 - 18;
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
    }
    animate();
    
    // Store animation frame globally for cleanup
    window.threeJSBackgroundAnimation = animationFrame;
    
    // Expose pause/resume functions
    window.DHThreeBackground = window.DHThreeBackground || {};
    window.DHThreeBackground.pause = function() {
        isPaused = true;
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    };
    
    window.DHThreeBackground.resume = function() {
        isPaused = false;
        if (!animationFrame) {
            animate();
        }
    };

    /* --------------------------- Resize ----------------------------- */
    function handleResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    /* --------------------------- Cleanup ---------------------------- */
    const cleanup = () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', handleResize);
        if (!prefersReducedMotion) {
            window.removeEventListener('pointermove', handlePointerMove);
        }

        nebulaGeometry.dispose();
        nebulaMaterial.dispose();
        ribbons.forEach((mesh) => {
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        renderer.dispose();
    };

    window.addEventListener('beforeunload', cleanup);
    window.dhBackgroundCleanup = cleanup;
})();
