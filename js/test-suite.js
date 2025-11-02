// Game Integration Test Suite
// Conditionally loaded in development/debug mode only
// Provides comprehensive testing of game integration and UI/UX functionality

(function() {
    'use strict';
    
    /**
     * Comprehensive game integration test suite
     * Run window.testGameIntegration() in console to test all aspects
     */
    window.testGameIntegration = async function() {
        console.log('🧪 Starting Game Integration Tests...\n');
        
        const results = {
            passed: [],
            failed: [],
            warnings: []
        };
        
        const test = (name, fn) => {
            try {
                const result = fn();
                if (result === true || (result && result.passed)) {
                    results.passed.push(name);
                    console.log(`✅ ${name}`);
                    return true;
                } else if (result && result.warning) {
                    results.warnings.push(`${name}: ${result.message}`);
                    console.warn(`⚠️  ${name}: ${result.message}`);
                    return true;
                } else {
                    results.failed.push(`${name}: ${result?.message || 'Failed'}`);
                    console.error(`❌ ${name}: ${result?.message || 'Failed'}`);
                    return false;
                }
            } catch (error) {
                results.failed.push(`${name}: ${error.message}`);
                console.error(`❌ ${name}: ${error.message}`);
                return false;
            }
        };
        
        // Test 1: Check required classes exist
        test('Game classes loaded', () => {
            const required = ['GameEngine', 'GameRenderer', 'ParticleSystem', 'SurvivalGame'];
            const missing = required.filter(c => typeof window[c] === 'undefined');
            if (missing.length > 0) {
                return { passed: false, message: `Missing classes: ${missing.join(', ')}` };
            }
            return true;
        });
        
        // Test 2: Check game modal exists
        test('Game modal exists', () => {
            const modal = document.getElementById('gameModal');
            if (!modal) {
                return { passed: false, message: 'gameModal element not found' };
            }
            return true;
        });
        
        // Test 3: Check canvas exists
        test('Canvas element exists', () => {
            const canvas = document.getElementById('demo-canvas');
            if (!canvas) {
                return { passed: false, message: 'demo-canvas element not found' };
            }
            return true;
        });
        
        // Test 4: Check loading overlays exist
        test('Loading overlays exist', () => {
            const loadingOverlay = document.getElementById('gameLoadingOverlay');
            const errorOverlay = document.getElementById('gameErrorOverlay');
            const clickHint = document.getElementById('gameClickHint');
            
            if (!loadingOverlay) {
                return { passed: false, message: 'gameLoadingOverlay not found' };
            }
            if (!errorOverlay) {
                return { passed: false, message: 'gameErrorOverlay not found' };
            }
            if (!clickHint) {
                return { warning: true, message: 'gameClickHint not found (optional)' };
            }
            return true;
        });
        
        // Test 5: Check DHInit utilities
        test('DHInit utilities available', () => {
            if (!window.DHInit) {
                return { passed: false, message: 'DHInit not available' };
            }
            if (typeof window.DHInit.loadGameModules !== 'function') {
                return { passed: false, message: 'DHInit.loadGameModules not a function' };
            }
            if (typeof window.DHInit.initGameInModal !== 'function') {
                return { passed: false, message: 'DHInit.initGameInModal not a function' };
            }
            return true;
        });
        
        // Test 6: Check GameLoader utilities
        test('GameLoader utilities available', () => {
            if (!window.DHGameLoader) {
                return { passed: false, message: 'DHGameLoader not available' };
            }
            if (typeof window.DHGameLoader.initGame !== 'function') {
                return { passed: false, message: 'DHGameLoader.initGame not a function' };
            }
            return true;
        });
        
        // Test 7: Test modal open/close
        test('Modal can be opened and closed', async () => {
            const modal = document.getElementById('gameModal');
            if (!modal) {
                return { passed: false, message: 'Modal not found' };
            }
            
            // Open modal
            modal.showModal();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!modal.open) {
                return { passed: false, message: 'Modal failed to open' };
            }
            
            // Close modal
            modal.close();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (modal.open) {
                return { passed: false, message: 'Modal failed to close' };
            }
            
            return true;
        });
        
        // Test 8: Test game initialization (if modules loaded)
        test('Game can be initialized', async () => {
            if (typeof window.SurvivalGame === 'undefined') {
                return { warning: true, message: 'SurvivalGame class not loaded yet' };
            }
            
            const canvas = document.getElementById('demo-canvas');
            if (!canvas) {
                return { passed: false, message: 'Canvas not found' };
            }
            
            // Check if game instance exists or can be created
            if (window.survivalGame) {
                if (!window.survivalGame.engine) {
                    return { passed: false, message: 'Game instance exists but engine not initialized' };
                }
                return true;
            }
            
            return { warning: true, message: 'Game instance not created yet (will be created when modal opens)' };
        });
        
        // Test 9: Check questMap property (fix verification)
        test('Gamification questMap property exists', () => {
            if (!window.game) {
                return { warning: true, message: 'Gamification system not initialized' };
            }
            
            if (!window.game.questMap) {
                return { passed: false, message: 'game.questMap property missing (should use questMap, not quests)' };
            }
            
            return true;
        });
        
        // Test 10: Check for duplicate script loading
        test('No duplicate script tags', () => {
            const scripts = document.querySelectorAll('script[src*="game-engine.js"], script[src*="game-renderer.js"], script[src*="particle-system.js"]');
            const srcs = Array.from(scripts).map(s => s.src);
            const duplicates = srcs.filter((src, idx) => srcs.indexOf(src) !== idx);
            
            if (duplicates.length > 0) {
                return { passed: false, message: `Duplicate script tags found: ${duplicates.join(', ')}` };
            }
            
            return true;
        });
        
        // Test 11: Check localStorage state handling
        test('LocalStorage state handling', () => {
            try {
                const savedState = localStorage.getItem('dhGamificationState');
                if (savedState) {
                    // Try to parse it
                    const parsed = JSON.parse(savedState);
                    if (typeof parsed !== 'object') {
                        return { passed: false, message: 'Invalid savedState format in localStorage' };
                    }
                }
                return true;
            } catch (error) {
                return { passed: false, message: `LocalStorage parse error: ${error.message}` };
            }
        });
        
        // Test 12: Check console errors (basic check)
        test('No critical console errors detected', () => {
            // This is a basic check - in real scenario, you'd check error logs
            const hasRedeclaration = window.console._errors?.some(e => e.includes('redeclaration'));
            if (hasRedeclaration) {
                return { passed: false, message: 'Redeclaration errors detected in console' };
            }
            return true;
        });
        
        // Summary
        console.log('\n📊 Test Results Summary:');
        console.log(`✅ Passed: ${results.passed.length}`);
        console.log(`❌ Failed: ${results.failed.length}`);
        console.log(`⚠️  Warnings: ${results.warnings.length}`);
        
        if (results.failed.length > 0) {
            console.log('\n❌ Failed Tests:');
            results.failed.forEach(f => console.log(`   - ${f}`));
        }
        
        if (results.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            results.warnings.forEach(w => console.log(`   - ${w}`));
        }
        
        if (results.failed.length === 0 && results.warnings.length === 0) {
            console.log('\n🎉 All tests passed! Game integration looks good.');
        } else if (results.failed.length === 0) {
            console.log('\n✅ All critical tests passed! Some warnings noted.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the errors above.');
        }
        
        return results;
    };
    
    // Auto-run basic checks on page load
    if (document.readyState === 'complete') {
        setTimeout(() => {
            console.log('💡 Game Integration Test Suite available: Call window.testGameIntegration() to run comprehensive tests');
        }, 2000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log('💡 Game Integration Test Suite available: Call window.testGameIntegration() to run comprehensive tests');
            }, 2000);
        });
    }
})();


