(function() {
    'use strict';

    const isFileProtocol = window.location.protocol === 'file:';
    const supportsModules = (() => {
        try {
            new Function('import("")');
            return true;
        } catch (error) {
            return false;
        }
    })();

    const assetPrefix = (typeof window !== 'undefined' && window.DH_ASSET_PREFIX) || '';
    const withPrefix = (path) => {
        if (!path) {
            return path;
        }
        return /^(?:https?:)?\/\//.test(path) ? path : assetPrefix + path;
    };

    const isPresentPage = window.location.href.includes('present.html');
    const isIndexPage = window.location.pathname === '/' ||
        window.location.pathname.endsWith('/index.html') ||
        window.location.href.includes('index.html');

    const loaderPromise = (supportsModules && !isFileProtocol)
        ? loadESModules()
        : loadFallbackScripts();

    window.DHInitLoaderReady = loaderPromise.catch(error => {
        console.warn('[DHInit] Module loader encountered an error, continuing with partial features:', error);
    });

    async function loadESModules() {
        try {
            // Core configuration utilities
            await import('./config.js');
            await import('./utils.js');
            
            // Object pool - must load before game modules
            await import('./object-pool.js');
            
            // Performance monitoring
            await import('./performance-monitor.js');

            // Animation libraries - Use CDN for better performance
            const useCDN = !window.location.href.includes('localhost') && window.location.protocol !== 'file:';
            
            if (useCDN) {
                // Load GSAP from CDN
                await loadScriptFromCDN('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js');
                await loadScriptFromCDN('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js');
                // Load Anime.js from CDN
                await loadScriptFromCDN('https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js');
                // Load Three.js from CDN
                const threeModule = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
                window.THREE = threeModule.default || threeModule;
            } else {
                // Fallback to local files
                await import('./gsap.min.js');
                await import('./ScrollTrigger.min.js');
                await import('./anime.min.js');
                // Three.js module (keep reference on window for legacy scripts)
                const threeModule = await import('./three.module.js');
                window.THREE = threeModule.default || threeModule;
            }

            // Shared application modules
            await import('./shared-threejs.js');
            await import('./game-loader.js');
            await import('./init-shared.js');
            await import('./icon-utils.js');
            
            // Enhanced libraries (load asynchronously, non-blocking)
            import('./enhanced-libraries.js').catch(err => {
                console.warn('[DHInit] Enhanced libraries failed to load:', err);
            });

            // Optional background effects for landing page
            if (isIndexPage) {
                import('./threejs-background.js').catch(err => {
                    console.warn('[DHInit] Background failed to load (index):', err);
                });
            }

            // Presentation specific modules
            if (isPresentPage) {
                await import('./present.js');
                await import('./presentation.js');
            }

            return true;
        } catch (error) {
            console.warn('[DHInit] ES module loading failed; switching to fallback scripts:', error);
            return loadFallbackScripts();
        }
    }
    
    function loadScriptFromCDN(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            document.head.appendChild(script);
        });
    }

    function loadFallbackScripts() {
        const useCDN = !window.location.href.includes('localhost') && window.location.protocol !== 'file:';
        
        const scripts = [
            withPrefix('js/config.js'),
            withPrefix('js/utils.js'),
            withPrefix('js/object-pool.js'),
            withPrefix('js/performance-monitor.js')
        ];
        
        // Load libraries from CDN or local
        if (useCDN) {
            // CDN libraries loaded via script tags in HTML head
            // They'll be available globally
        } else {
            scripts.push(
                withPrefix('js/gsap.min.js'),
                withPrefix('js/ScrollTrigger.min.js'),
                withPrefix('js/anime.min.js')
            );
        }
        
        scripts.push(
            withPrefix('js/shared-threejs.js'),
            withPrefix('js/game-loader.js'),
            withPrefix('js/init-shared.js'),
            withPrefix('js/icon-utils.js'),
            withPrefix('js/enhanced-libraries.js') // Load async, non-blocking
        );

        if (isIndexPage) {
            scripts.push(withPrefix('js/threejs-background.js'));
        }

        if (isPresentPage) {
            scripts.push(withPrefix('js/present.js'), withPrefix('js/presentation.js'));
        }

        return loadScriptsSequentially(scripts);
    }

    function loadScriptsSequentially(list) {
        return list.reduce((promise, src) => {
            return promise.then(() => appendScript(src));
        }, Promise.resolve());
    }

    function appendScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.onload = () => resolve();
            script.onerror = () => {
                console.error(`[DHInit] Failed to load script: ${src}`);
                resolve(); // Resolve to allow other scripts to continue loading
            };
            document.head.appendChild(script);
        });
    }
})();
