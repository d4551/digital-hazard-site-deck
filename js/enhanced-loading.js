/**
 * Enhanced Loading System with Progress Tracking
 * Provides better feedback for all loading phases
 */

(function() {
    'use strict';
    
    // Track loading state
    const loadingState = {
        config: false,
        styles: false,
        fonts: false,
        icons: false,
        threeJS: false,
        animations: false,
        game: false,
        gamification: false,
        complete: false
    };
    
    // Progress tracking
    let loadedModules = 0;
    const totalModules = 9;
    let loadingStartTime = Date.now();
    
    /**
     * Update loading progress
     * @param {number} loaded - Number of loaded modules
     * @param {number} total - Total modules
     */
    function updateProgress(loaded, total) {
        loadedModules = loaded;
        const progress = Math.round((loaded / total) * 100);
        
        // Update progress bar
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) {
            progressBar.value = progress;
            progressBar.setAttribute('value', progress);
        }
        
        // Update percentage text
        const percentageEl = document.getElementById('loadingPercentage');
        if (percentageEl) {
            percentageEl.textContent = `${progress}%`;
        }
        
        // Update loading tip based on progress
        updateLoadingTip(progress);
        
        // Check if loading is complete
        if (loaded >= total) {
            completeLoading();
        }
    }
    
    /**
     * Update loading tip based on progress
     * @param {number} progress - Current progress percentage
     */
    function updateLoadingTip(progress) {
        const tipEl = document.getElementById('loadingTip');
        if (!tipEl) return;
        
        let tip = '';
        if (progress < 20) {
            tip = 'Loading configuration...';
        } else if (progress < 40) {
            tip = 'Initializing styles and fonts...';
        } else if (progress < 60) {
            tip = 'Setting up 3D graphics...';
        } else if (progress < 80) {
            tip = 'Loading game systems...';
        } else {
            tip = 'Almost ready! Click around to find secrets...';
        }
        
        tipEl.textContent = tip;
    }
    
    /**
     * Mark a loading phase as complete
     * @param {string} phase - Loading phase name
     */
    function markPhaseComplete(phase) {
        if (loadingState[phase] === false) {
            loadingState[phase] = true;
            loadedModules++;
            updateProgress(loadedModules, totalModules);
        }
    }
    
    /**
     * Complete loading and hide loading screen
     */
    function completeLoading() {
        loadingState.complete = true;
        const loadTime = Date.now() - loadingStartTime;
        
        // Add minimum loading time for better UX
        const minLoadTime = 2000; // 2 seconds
        const remainingTime = Math.max(0, minLoadTime - loadTime);
        
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    
                    // Dispatch loading complete event
                    window.dispatchEvent(new CustomEvent('loadingComplete', {
                        detail: { loadTime: Date.now() - loadingStartTime }
                    }));
                    
                }, 500);
            }
        }, remainingTime);
    }
    
    // Listen for module loading events
    window.addEventListener('configReady', () => markPhaseComplete('config'));
    window.addEventListener('stylesLoaded', () => markPhaseComplete('styles'));
    window.addEventListener('fontsLoaded', () => markPhaseComplete('fonts'));
    window.addEventListener('iconsLoaded', () => markPhaseComplete('icons'));
    window.addEventListener('threeJSReady', () => markPhaseComplete('threeJS'));
    window.addEventListener('animationsReady', () => markPhaseComplete('animations'));
    window.addEventListener('gamificationReady', () => markPhaseComplete('gamification'));
    window.addEventListener('gameReady', () => markPhaseComplete('game'));
    
    // Manual progress updates for libraries that don't dispatch events
    setTimeout(() => markPhaseComplete('icons'), 100);
    setTimeout(() => markPhaseComplete('animations'), 200);
    
    // Fallback: complete loading after timeout
    setTimeout(() => {
        if (!loadingState.complete) {
            console.warn('Loading timeout reached, completing manually');
            updateProgress(totalModules, totalModules);
        }
    }, 10000);
    
    // Expose functions globally for manual updates
    window.LoadingSystem = {
        markPhaseComplete,
        updateProgress,
        completeLoading
    };
    
})();
