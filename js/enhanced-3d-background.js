/**
 * Enhanced 3D Background System
 * Gaming-style 3D effects for Digital Hazard Studio
 * Features:
 * - Fluid particle systems
 * - Geometric shapes with neon effects
 * - Performance-optimized animations
 * - Responsive to user interaction
 */

(function() {
    'use strict';

    const DHBackground3D = {
        scenes: {},
        animationFrames: {},
        isInitialized: false,
        
        /**
         * Initialize enhanced 3D background
         * @param {string} canvasId - Canvas element ID
         * @param {Object} options - Configuration options
         */
        async init(canvasId, options = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`[DH3D] Canvas not found: ${canvasId}`);
                return null;
            }

            // Load Three.js if needed
            if (typeof THREE === 'undefined') {
                try {
                    const threeModule = await import('./three.module.js');
                    window.THREE = threeModule.default || threeModule;
                } catch (error) {
                    console.error('[DH3D] Failed to load Three.js:', error);
                    return null;
                }
            }

            const THREE = window.THREE;
            
            // Performance detection
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            const defaultOptions = {
                particleCount: isMobile ? 500 : 1500,
                geometryCount: isMobile ? 3 : 6,
                enableInteraction: !prefersReducedMotion,
                enableNeonGlow: !prefersReducedMotion,
                animationSpeed: prefersReducedMotion ? 0.3 : 1.0,
                colors: {
                    primary: 0xf97316,   // Orange
                    secondary: 0x38bdf8, // Blue
                    accent: 0xfacc15     // Yellow
                }
            };

            options = { ...defaultOptions, ...options };

            // Setup scene
            const scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x000000, 10, 200);

            // Camera
            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            camera.position.z = 50;

            // Renderer
            const renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: !isMobile
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
            renderer.setClearColor(0x000000, 0);

            // Create scene objects
            const objects = {
                particles: this.createParticleSystem(THREE, options),
                geometries: this.createGeometries(THREE, options),
                lights: this.createLights(THREE, options)
            };

            // Add objects to scene
            scene.add(objects.particles);
            objects.geometries.forEach(geo => scene.add(geo));
            objects.lights.forEach(light => scene.add(light));

            // Mouse interaction
            const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
            if (options.enableInteraction) {
                document.addEventListener('mousemove', (event) => {
                    mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
                    mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
                });
            }

            // Animation loop
            const animate = () => {
                this.animationFrames[canvasId] = requestAnimationFrame(animate);

                // Smooth mouse following
                mouse.x += (mouse.targetX - mouse.x) * 0.05;
                mouse.y += (mouse.targetY - mouse.y) * 0.05;

                // Update camera based on mouse
                if (options.enableInteraction) {
                    camera.position.x = mouse.x * 5;
                    camera.position.y = mouse.y * 5;
                    camera.lookAt(scene.position);
                }

                // Animate particles
                const time = Date.now() * 0.0005 * options.animationSpeed;
                const positions = objects.particles.geometry.attributes.position;
                const count = positions.count;
                
                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;
                    const x = positions.array[i3];
                    const y = positions.array[i3 + 1];
                    
                    positions.array[i3 + 1] = y + Math.sin(time + x * 0.05) * 0.02;
                    positions.array[i3 + 2] += Math.cos(time + y * 0.05) * 0.01;
                    
                    // Reset particles that go too far
                    if (positions.array[i3 + 2] > 50) {
                        positions.array[i3 + 2] = -50;
                    }
                }
                positions.needsUpdate = true;

                // Animate geometries
                objects.geometries.forEach((geo, index) => {
                    geo.rotation.x += 0.001 * options.animationSpeed;
                    geo.rotation.y += 0.002 * options.animationSpeed;
                    geo.position.y = Math.sin(time + index) * 2;
                });

                // Render
                renderer.render(scene, camera);
            };

            // Resize handler
            const handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', handleResize);

            // Store scene data
            this.scenes[canvasId] = {
                scene,
                camera,
                renderer,
                objects,
                mouse,
                cleanup: () => {
                    if (this.animationFrames[canvasId]) {
                        cancelAnimationFrame(this.animationFrames[canvasId]);
                        delete this.animationFrames[canvasId];
                    }
                    window.removeEventListener('resize', handleResize);
                    renderer.dispose();
                    // Dispose geometries and materials
                    objects.particles.geometry.dispose();
                    objects.particles.material.dispose();
                    objects.geometries.forEach(geo => {
                        geo.geometry.dispose();
                        geo.material.dispose();
                    });
                }
            };

            // Start animation
            animate();
            this.isInitialized = true;
            
            console.log('[DH3D] Enhanced background initialized:', canvasId);
            return this.scenes[canvasId];
        },

        /**
         * Create particle system
         */
        createParticleSystem(THREE, options) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(options.particleCount * 3);
            const colors = new Float32Array(options.particleCount * 3);

            for (let i = 0; i < options.particleCount; i++) {
                const i3 = i * 3;
                
                // Position
                positions[i3] = (Math.random() - 0.5) * 200;
                positions[i3 + 1] = (Math.random() - 0.5) * 200;
                positions[i3 + 2] = (Math.random() - 0.5) * 100;

                // Color (mix of primary, secondary, accent)
                const colorChoice = Math.random();
                let color;
                if (colorChoice < 0.4) {
                    color = new THREE.Color(options.colors.primary);
                } else if (colorChoice < 0.7) {
                    color = new THREE.Color(options.colors.secondary);
                } else {
                    color = new THREE.Color(options.colors.accent);
                }
                
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: 2,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.8
            });

            return new THREE.Points(geometry, material);
        },

        /**
         * Create geometric shapes with neon effects
         */
        createGeometries(THREE, options) {
            const geometries = [];
            const shapes = [
                { type: 'box', size: [4, 4, 4] },
                { type: 'sphere', size: [3, 32, 32] },
                { type: 'torus', size: [3, 1, 16, 100] },
                { type: 'octahedron', size: [4, 0] },
                { type: 'tetrahedron', size: [4, 0] },
                { type: 'dodecahedron', size: [3, 0] }
            ];

            const colors = [
                options.colors.primary,
                options.colors.secondary,
                options.colors.accent
            ];

            for (let i = 0; i < Math.min(options.geometryCount, shapes.length); i++) {
                const shape = shapes[i];
                let geometry;

                switch (shape.type) {
                    case 'box':
                        geometry = new THREE.BoxGeometry(...shape.size);
                        break;
                    case 'sphere':
                        geometry = new THREE.SphereGeometry(...shape.size);
                        break;
                    case 'torus':
                        geometry = new THREE.TorusGeometry(...shape.size);
                        break;
                    case 'octahedron':
                        geometry = new THREE.OctahedronGeometry(...shape.size);
                        break;
                    case 'tetrahedron':
                        geometry = new THREE.TetrahedronGeometry(...shape.size);
                        break;
                    case 'dodecahedron':
                        geometry = new THREE.DodecahedronGeometry(...shape.size);
                        break;
                }

                const material = new THREE.MeshPhongMaterial({
                    color: colors[i % colors.length],
                    emissive: colors[i % colors.length],
                    emissiveIntensity: 0.2,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3
                });

                const mesh = new THREE.Mesh(geometry, material);
                
                // Position
                const angle = (i / options.geometryCount) * Math.PI * 2;
                const radius = 30;
                mesh.position.x = Math.cos(angle) * radius;
                mesh.position.z = Math.sin(angle) * radius;
                mesh.position.y = 0;

                geometries.push(mesh);
            }

            return geometries;
        },

        /**
         * Create lighting
         */
        createLights(THREE, options) {
            const lights = [];

            // Ambient light
            const ambient = new THREE.AmbientLight(0xffffff, 0.3);
            lights.push(ambient);

            // Point lights with colors
            const colors = [
                options.colors.primary,
                options.colors.secondary,
                options.colors.accent
            ];

            colors.forEach((color, i) => {
                const light = new THREE.PointLight(color, 1, 100);
                const angle = (i / colors.length) * Math.PI * 2;
                light.position.set(
                    Math.cos(angle) * 40,
                    20,
                    Math.sin(angle) * 40
                );
                lights.push(light);
            });

            return lights;
        },

        /**
         * Pause animation
         */
        pause(canvasId) {
            if (this.animationFrames[canvasId]) {
                cancelAnimationFrame(this.animationFrames[canvasId]);
                delete this.animationFrames[canvasId];
            }
        },

        /**
         * Resume animation
         */
        resume(canvasId) {
            const sceneData = this.scenes[canvasId];
            if (!sceneData) return;

            const animate = () => {
                this.animationFrames[canvasId] = requestAnimationFrame(animate);
                sceneData.renderer.render(sceneData.scene, sceneData.camera);
            };
            animate();
        },

        /**
         * Cleanup
         */
        dispose(canvasId) {
            const sceneData = this.scenes[canvasId];
            if (sceneData && sceneData.cleanup) {
                sceneData.cleanup();
                delete this.scenes[canvasId];
            }
        }
    };

    // Export to window
    window.DHBackground3D = DHBackground3D;

    // Auto-initialize for index page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('three-canvas');
            if (canvas && !window.location.href.includes('present.html')) {
                DHBackground3D.init('three-canvas');
            }
        });
    } else {
        const canvas = document.getElementById('three-canvas');
        if (canvas && !window.location.href.includes('present.html')) {
            DHBackground3D.init('three-canvas');
        }
    }

    console.log('[DH3D] Enhanced 3D background system loaded');
})();
