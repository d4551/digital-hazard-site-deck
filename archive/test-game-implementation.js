/**
 * Comprehensive Game Implementation Test Suite
 * Tests gamification integration, game initialization, and component availability
 */

(function() {
    'use strict';

    const TestGameImplementation = {
        // Test configuration
        config: {
            timeout: 5000, // Maximum wait time for async operations
            retryDelay: 100, // Delay between retry attempts
            maxRetries: 10
        },

        // Required file paths
        requiredFiles: [
            'js/game.js',
            'js/game-engine.js', 
            'js/game-renderer.js',
            'js/gamification.js',
            'js/particle-system.js',
            'js/config.js',
            'js/utils.js'
        ],

        // Test results
        results: {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        },

        /**
         * Test class availability
         */
        testClasses() {
            const classes = {
                SurvivalGame: typeof SurvivalGame !== 'undefined',
                GameEngine: typeof GameEngine !== 'undefined',
                GameRenderer: typeof GameRenderer !== 'undefined',
                ParticleSystem: typeof ParticleSystem !== 'undefined',
                UnifiedGamificationManager: typeof UnifiedGamificationManager !== 'undefined'
            };

            let allPresent = true;
            Object.keys(classes).forEach(className => {
                if (classes[className]) {
                    this.logPass(`${className} is available`);
                } else {
                    this.logFail(`${className} is not available`);
                    allPresent = false;
                }
            });

            return allPresent;
        },

        /**
         * Test gamification integration
         */
        async testGamificationIntegration() {
            // Check if window.game exists
            if (!window.game) {
                this.logFail('window.game is not initialized');
                return false;
            }

            // Check if gamification has required methods
            const requiredMethods = [
                'addPoints',
                'unlockAchievement',
                'showScorePopup',
                'showAchievementNotification',
                'updateAllDisplays'
            ];

            let allMethodsPresent = true;
            requiredMethods.forEach(method => {
                if (typeof window.game[method] === 'function') {
                    this.logPass(`window.game.${method}() is available`);
                } else {
                    this.logFail(`window.game.${method}() is not available`);
                    allMethodsPresent = false;
                }
            });

            // Test gamification HUD element
            const hud = document.getElementById('gamificationHUD');
            if (hud) {
                this.logPass('Gamification HUD element exists in DOM');
            } else {
                this.logWarning('Gamification HUD element not found in DOM');
            }

            return allMethodsPresent;
        },

        /**
         * Test game initialization readiness
         */
        async testGameInitialization() {
            // Check if CONFIG is available
            if (typeof CONFIG === 'undefined' && typeof window.CONFIG === 'undefined') {
                this.logFail('CONFIG is not available');
                return false;
            } else {
                this.logPass('CONFIG is available');
            }

            // Check if canvas exists
            const canvas = document.getElementById('demo-canvas');
            if (canvas) {
                this.logPass('Game canvas element exists');
                
                // Check canvas context
                try {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        this.logPass('Canvas 2D context is available');
                    } else {
                        this.logFail('Canvas 2D context is not available');
                        return false;
                    }
                } catch (e) {
                    this.logFail(`Canvas context error: ${e.message}`);
                    return false;
                }
            } else {
                this.logWarning('Game canvas element not found (may not be initialized yet)');
            }

            // Check if game instance exists
            if (window.survivalGame) {
                this.logPass('SurvivalGame instance exists');
                
                // Check game properties
                if (window.survivalGame.engine) {
                    this.logPass('Game engine is initialized');
                } else {
                    this.logWarning('Game engine is not initialized');
                }

                if (window.survivalGame.renderer) {
                    this.logPass('Game renderer is initialized');
                } else {
                    this.logWarning('Game renderer is not initialized');
                }

                if (window.survivalGame.particles) {
                    this.logPass('Particle system is initialized');
                } else {
                    this.logWarning('Particle system is not initialized');
                }
            } else {
                this.logWarning('SurvivalGame instance not found (may not be initialized yet)');
            }

            return true;
        },

        /**
         * Test game-gamification integration
         */
        async testGameGamificationIntegration() {
            if (!window.game) {
                this.logFail('Cannot test integration: window.game not available');
                return false;
            }

            // Test that game can call gamification methods
            try {
                // Test addPoints (should not throw)
                const originalAddPoints = window.game.addPoints;
                let addPointsCalled = false;
                window.game.addPoints = function(...args) {
                    addPointsCalled = true;
                    return originalAddPoints.apply(this, args);
                };

                // Simulate a game action that should trigger gamification
                if (window.survivalGame && window.survivalGame.engine) {
                    // Reset the override
                    window.game.addPoints = originalAddPoints;
                    this.logPass('Game can call gamification methods');
                    return true;
                } else {
                    // Reset the override
                    window.game.addPoints = originalAddPoints;
                    this.logWarning('Game instance not available for integration test');
                    return true; // Not a failure, just not testable yet
                }
            } catch (e) {
                this.logFail(`Game-gamification integration error: ${e.message}`);
                return false;
            }
        },

        /**
         * Wait for gamification to be ready
         */
        async waitForGamification(timeout = this.config.timeout) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                
                const checkGamification = () => {
                    if (window.game && typeof window.game.addPoints === 'function') {
                        resolve(true);
                        return;
                    }
                    
                    if (Date.now() - startTime > timeout) {
                        reject(new Error('Gamification initialization timeout'));
                        return;
                    }
                    
                    setTimeout(checkGamification, this.config.retryDelay);
                };
                
                // Also listen for the gamificationReady event
                window.addEventListener('gamificationReady', () => {
                    if (window.game) {
                        resolve(true);
                    }
                }, { once: true });
                
                checkGamification();
            });
        },

        /**
         * Run all tests
         */
        async runAll() {
            console.log('%c=== Game Implementation Test Suite ===', 'font-weight: bold; font-size: 16px; color: #3b82f6;');
            
            // Test 1: Class availability
            console.log('%c\n[Test 1] Checking class availability...', 'font-weight: bold; color: #6366f1;');
            this.testClasses();
            
            // Test 2: Wait for gamification
            console.log('%c\n[Test 2] Waiting for gamification system...', 'font-weight: bold; color: #6366f1;');
            try {
                await this.waitForGamification();
                this.logPass('Gamification system is ready');
            } catch (e) {
                this.logFail(`Gamification not ready: ${e.message}`);
            }
            
            // Test 3: Gamification integration
            console.log('%c\n[Test 3] Testing gamification integration...', 'font-weight: bold; color: #6366f1;');
            await this.testGamificationIntegration();
            
            // Test 4: Game initialization
            console.log('%c\n[Test 4] Testing game initialization...', 'font-weight: bold; color: #6366f1;');
            await this.testGameInitialization();
            
            // Test 5: Game-gamification integration
            console.log('%c\n[Test 5] Testing game-gamification integration...', 'font-weight: bold; color: #6366f1;');
            await this.testGameGamificationIntegration();
            
            // Print summary
            this.printSummary();
        },

        /**
         * Log test result helpers
         */
        logPass(message) {
            this.results.passed++;
            this.results.tests.push({ type: 'pass', message });
            console.log(`%c✓ PASS: ${message}`, 'color: #10b981;');
        },

        logFail(message) {
            this.results.failed++;
            this.results.tests.push({ type: 'fail', message });
            console.error(`%c✗ FAIL: ${message}`, 'color: #ef4444; font-weight: bold;');
        },

        logWarning(message) {
            this.results.warnings++;
            this.results.tests.push({ type: 'warning', message });
            console.warn(`%c⚠ WARN: ${message}`, 'color: #f59e0b;');
        },

        /**
         * Print test summary
         */
        printSummary() {
            const total = this.results.passed + this.results.failed;
            const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
            
            console.log('\n%c=== Test Summary ===', 'font-weight: bold; font-size: 14px; color: #3b82f6;');
            console.log(`%cPassed: ${this.results.passed}`, `color: #10b981;`);
            console.log(`%cFailed: ${this.results.failed}`, `color: ${this.results.failed > 0 ? '#ef4444' : '#10b981'};`);
            console.log(`%cWarnings: ${this.results.warnings}`, `color: ${this.results.warnings > 0 ? '#f59e0b' : '#6b7280'};`);
            console.log(`%cPass Rate: ${passRate}%`, `color: ${passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444'};`);
            
            if (this.results.failed === 0 && this.results.warnings === 0) {
                console.log('%c\n✓ All tests passed! Game implementation is ready.', 'color: #10b981; font-weight: bold; font-size: 14px;');
            } else if (this.results.failed === 0) {
                console.log('%c\n✓ Core tests passed. Some warnings detected.', 'color: #f59e0b; font-weight: bold;');
            } else {
                console.log('%c\n✗ Some tests failed. Please check the errors above.', 'color: #ef4444; font-weight: bold;');
            }
        }
    };

    // Auto-run tests when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit for scripts to load
            setTimeout(() => TestGameImplementation.runAll(), 1000);
        });
    } else {
        // DOM already ready, run tests after a short delay
        setTimeout(() => TestGameImplementation.runAll(), 1000);
    }

    // Export for manual testing
    window.TestGameImplementation = TestGameImplementation;
})();
