const DHThree = {};
window.DHThree = DHThree;    
    const Three = DHThree;
    
    /**
     * Initialize Three.js scene with standard setup
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} Scene, camera, renderer objects
     */
    Three.initScene = async function(options = {}) {
        const {
            canvas = null,
            canvasId = null,
            fov = 75,
            near = 0.1,
            far = 1000,
            alpha = true,
            antialias = true,
            backgroundColor = null,
            pixelRatio = null,
            onResize = null
        } = options;
        
        // Get canvas
        let canvasEl = canvas;
        if (!canvasEl && canvasId) {
            canvasEl = document.getElementById(canvasId);
        }
        
        if (!canvasEl) {
            return Promise.reject(new Error('Canvas element not found'));
        }
        
        // Load Three.js if needed
        if (typeof THREE === 'undefined') {
            try {
                const threeModule = await import('./three.module.js');
                window.THREE = threeModule.default || threeModule;
            } catch (error) {
                console.error('Failed to load Three.js:', error);
                return Promise.reject(error);
            }
        }
        
        const THREE = window.THREE;
        
        // Setup canvas
        canvasEl.style.backgroundColor = backgroundColor || 'transparent';
        canvasEl.style.display = 'block';
        
        // Create scene
        const scene = new THREE.Scene();
        if (backgroundColor) {
            scene.background = new THREE.Color(backgroundColor);
        } else {
            scene.background = null; // Transparent
        }
        
        // Create camera
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = 50;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            alpha: alpha,
            antialias: antialias,
            premultipliedAlpha: false
        });
        
        if (alpha) {
            renderer.setClearColor(0x000000, 0);
        }
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(pixelRatio || Math.min(window.devicePixelRatio, 2));
        
        // Resize handler
        const resizeHandler = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            if (onResize) {
                onResize({ camera, renderer, scene });
            }
        };
        
        const throttledResize = window.throttle ? window.throttle(resizeHandler, 100) : resizeHandler;
        window.addEventListener('resize', throttledResize);
        
        // Cleanup function
        const cleanup = () => {
            window.removeEventListener('resize', throttledResize);
            renderer.dispose();
            // Note: Scene cleanup should be handled by caller
        };
        
        return {
            scene,
            camera,
            renderer,
            cleanup,
            canvas: canvasEl
        };
    };
    
    /**
     * Create particle system
     * @param {Object} options - Particle configuration
     * @returns {THREE.Points} Particle system
     */
    Three.createParticleSystem = function(options = {}) {
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js not loaded');
        }
        
        const {
            count = 3000,
            spread = 200,
            size = 0.8,
            opacity = 0.8,
            colors = null,
            prefersReduced = false
        } = options;
        
        const particleCount = prefersReduced ? Math.floor(count / 3) : count;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const particleColors = colors || new Float32Array(particleCount * 3);
        
        // Generate positions
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * spread;
            positions[i + 1] = (Math.random() - 0.5) * spread;
            positions[i + 2] = (Math.random() - 0.5) * spread;
            
            // Generate colors if not provided
            if (!colors) {
                const orangeShade = Math.random();
                particleColors[i] = 1; // R
                particleColors[i + 1] = 0.4 + orangeShade * 0.3; // G
                particleColors[i + 2] = 0; // B
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        
        const material = new THREE.PointsMaterial({
            size,
            vertexColors: true,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Points(geometry, material);
    };
    
    /**
     * Create wireframe geometry
     * @param {string} type - Geometry type ('torus', 'octahedron', etc.)
     * @param {Object} options - Geometry options
     * @returns {THREE.Mesh} Wireframe mesh
     */
    Three.createWireframe = function(type, options = {}) {
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js not loaded');
        }
        
        const {
            color = 0xff8c00,
            opacity = 0.2,
            wireframe = true,
            ...geometryOptions
        } = options;
        
        let geometry;
        
        switch (type) {
            case 'torus':
                geometry = new THREE.TorusGeometry(
                    geometryOptions.radius || 10,
                    geometryOptions.tube || 1,
                    geometryOptions.radialSegments || 16,
                    geometryOptions.tubularSegments || 100
                );
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(
                    geometryOptions.radius || 8,
                    geometryOptions.detail || 0
                );
                break;
            case 'box':
            case 'sphere':
                geometry = new THREE.SphereGeometry(
                    geometryOptions.radius || 5,
                    geometryOptions.widthSegments || 32,
                    geometryOptions.heightSegments || 16
                );
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    geometryOptions.radiusTop || 5,
                    geometryOptions.radiusBottom || 5,
                    geometryOptions.height || 10,
                    geometryOptions.radialSegments || 32
                );
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(
                    geometryOptions.radius || 5,
                    geometryOptions.height || 10,
                    geometryOptions.radialSegments || 32
                );
                break;                geometry = new THREE.BoxGeometry(
                    geometryOptions.width || 10,
                    geometryOptions.height || 10,
                    geometryOptions.depth || 10
                );
                break;
            default:
                throw new Error(`Unknown geometry type: ${type}`);
        }
        
        const material = new THREE.MeshBasicMaterial({
            color,
            wireframe,
            transparent: true,
            opacity
        });
        
        return new THREE.Mesh(geometry, material);
    };
    
    /**
     * Create animation loop with performance optimization
     * @param {Function} updateFn - Update function
     * @param {Function} renderFn - Render function
     * @returns {Function} Cleanup function
     */
    Three.createAnimationLoop = function(updateFn, renderFn) {
        let animationFrameId = null;
        let lastTime = performance.now();
        let running = true;
        
        const animate = () => {
            if (!running) return;
            
            const now = performance.now();
            const deltaTime = now - lastTime;
            lastTime = now;
            
            if (updateFn) {
                updateFn(deltaTime);
            }
            
            if (renderFn) {
                renderFn();
            }
            
            animationFrameId = requestAnimationFrame(animate);
        };
        
        // Pause when tab is hidden
        const visibilityHandler = () => {
            running = !document.hidden;
            if (running && !animationFrameId) {
                animate();
            } else if (!running && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };
        
        document.addEventListener('visibilitychange', visibilityHandler);
        
        animate();
        
        // Return cleanup function
        return () => {
            running = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            document.removeEventListener('visibilitychange', visibilityHandler);
        };
    };
    
    /**
     * Setup mouse interaction for camera
     * @param {THREE.Camera} camera - Camera to control
     * @param {Object} options - Interaction options
     * @returns {Function} Cleanup function
     */
    Three.setupMouseInteraction = function(camera, options = {}) {
        const {
            sensitivity = 5,
            smoothing = 0.05
        } = options;
        
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        
        const onMouseMove = (event) => {
            targetX = (event.clientX / window.innerWidth) * 2 - 1;
            targetY = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        
        document.addEventListener('mousemove', onMouseMove);
        
        const updateCamera = () => {
            currentX += (targetX * sensitivity - currentX) * smoothing;
            currentY += (targetY * sensitivity - currentY) * smoothing;
            
            camera.position.x = currentX;
            camera.position.y = currentY;
            camera.lookAt(camera.parent ? camera.parent.position : new THREE.Vector3(0, 0, 0));
        };
        
        const interval = setInterval(updateCamera, 16);
        
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            clearInterval(interval);
        };
    };

