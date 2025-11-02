// Configuration Constants - Single source of truth for all game/app constants
// Separation of concerns: All magic numbers and hardcoded values centralized here
// Converted to non-module script for static compatibility

(function() {
    'use strict';
    
    /**
     * Main configuration object
     * @type {Object}
     */
    const CONFIG = {
        // Z-Index Layering System (for visual hierarchy)
        Z_INDEX: {
            BACKGROUND: -10,
            CANVAS: 0,
            CONTENT: 10,
            HUD: 50,
            MODALS: 100,
            LOADING: 9999,
            MAX: 99999
        },
        
        // Animation & Timing
        ANIMATION: {
            FAST: 150,
            NORMAL: 300,
            SLOW: 500,
            VERY_SLOW: 1000,
            EASING: {
                EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
                EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.6, 1)',
                BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }
        },
        
        // Game Configuration
        GAME: {
            INITIAL_SPEED: 4.5,
            MAX_SPEED: 7,
            INITIAL_LIVES: 3,
            MAX_LIVES: 5,
            INITIAL_DIFFICULTY: 1.5,
            DIFFICULTY_INCREMENT: 0.3,
            DIFFICULTY_INTERVAL: 15000, // ms
            COLLECTIBLE_SPAWN_RATE: 600, // base ms (reduced for faster gameplay)
            ENEMY_SPAWN_RATE: 1500, // base ms (reduced for faster gameplay)
            ENEMY_START_DELAY: 1000, // ms (reduced for immediate action)
            POWERUP_SPAWN_INTERVAL: 8000, // ms
            POWERUP_SPAWN_CHANCE: 0.4,
            POWERUP_DURATION_BASE: 10000, // 10 seconds base duration
            POWERUP_SPAWN_ANIMATION: true,
            INVULNERABLE_DURATION: 1500, // ms
            COMBO_TIMEOUT: 1500, // ms (reduced for more challenge)
            COMBO_MULTIPLIER_INCREMENT: 0.15,
            LEVEL_SCORE_THRESHOLD: 300, // Reduced for quicker progression
            FRENZY_BASE_DURATION: 6000,
            FRENZY_TIER_BONUS: 2500,
            FRENZY_MAX_TIER: 3,
            FRENZY_COMBO_THRESHOLDS: [6, 12, 20],
            FRENZY_STREAK_THRESHOLDS: [10, 20, 35],
            COLLECTIBLE_ATTRACTION_DISTANCE: 150,
            COLLECTIBLE_ATTRACTION_SPEED: 2,
            PARTICLE_TRAIL_LENGTH: 8,
            PLAYER_RADIUS: 15,
            // Weapon Configuration
            WEAPON_FIRE_RATE: 10, // bullets per second
            BULLET_SPEED: 12, // projectile velocity
            BULLET_DAMAGE: 1, // damage per bullet
            BULLET_LIFETIME: 2000, // max bullet travel time in ms
            // Explosion Configuration
            EXPLOSION_PARTICLE_COUNT: 60, // particles per explosion
            EXPLOSION_PARTICLE_COUNT_ENHANCED: 100, // enhanced explosion particle count
            EXPLOSION_SCREEN_SHAKE: 15, // shake intensity
            CHAIN_EXPLOSION_RADIUS: 80, // trigger radius for chain explosions
            // Audio Configuration
            AUDIO_ENABLED: true, // Feature flag (respects user preferences)
            MUSIC_VOLUME: 0.5, // Background music volume 0-1
            SFX_VOLUME: 0.7, // Sound effects volume 0-1
            CHIPTUNE_TEMPO: 140, // BPM for music (adjustable with difficulty)
            CHIPTUNE_CHANNELS: 5, // Number of audio channels (lead, bass, harmony, percussion, arp)
            TEMPO_SCALING_ENABLED: true, // Scale tempo with difficulty
            PATTERN_VARIATIONS: true, // Enable pattern variations
            AUDIO_CONTEXT_AUTO_START: false, // Requires user interaction
            // Control Configuration
            MOUSE_SENSITIVITY: 0.8, // Mouse following strength
            MOVEMENT_SMOOTHING: true, // Enable velocity-based movement smoothing
            SCROLL_PREVENTION_ENABLED: true, // Prevent scroll during gameplay
            // Animation Configuration
            ANIMATION_SPEED_MULTIPLIER: 1.0 // Global animation speed (scales with level)
        },
        
        // Gamification
        GAMIFICATION: {
            INITIAL_LEVEL: 1,
            INITIAL_XP: 0,
            BASE_XP_MULTIPLIER: 1.5,
            BASE_XP_AMOUNT: 100,
            POINTS_PER_COLLECTIBLE: 10,
            POINTS_PER_SLIDE: 10,
            POINTS_PER_SECTION: 10,
            POINTS_PER_THEME_CHANGE: 5,
            BADGE_THRESHOLDS: {
                POINTS_100: 100,
                POINTS_500: 500,
                POINTS_1000: 1000,
                EGG_COLLECTOR: 3,
                EXPLORER: 5,
                PARTICLE_MASTER: 1000
            },
            ACHIEVEMENT_REWARDS: {
                DEFAULT: 50,
                LEVEL_UP: 100,
                SURVIVAL_MASTER: 100,
                LEVEL_MASTER: 200,
                LEGEND: 500
            }
        },
        
        // Responsive Breakpoints (matching Tailwind defaults)
        BREAKPOINTS: {
            SM: 640,
            MD: 768,
            LG: 1024,
            XL: 1280,
            '2XL': 1536
        },
        
        // Theme Colors (matching DaisyUI hazard theme)
        COLORS: {
            PRIMARY: '#f97316',
            SECONDARY: '#38bdf8',
            ACCENT: '#facc15',
            NEUTRAL: '#0f172a',
            BASE_100: '#020617',
            BASE_200: '#0b1120',
            BASE_300: '#111827',
            SUCCESS: '#22c55e',
            WARNING: '#f59e0b',
            ERROR: '#ef4444',
            INFO: '#38bdf8'
        },
        
        // Spacing System (4px base grid)
        SPACING: {
            XS: 4,
            SM: 8,
            MD: 16,
            LG: 24,
            XL: 32,
            '2XL': 48,
            '3XL': 64
        },
        
        // Border Radius
        RADIUS: {
            SM: 4,
            MD: 8,
            LG: 12,
            XL: 16,
            FULL: 9999
        },
        
        // Performance
        PERFORMANCE: {
            PARTICLE_COUNT_REDUCED: 100,
            PARTICLE_COUNT_NORMAL: 500,
            THREEJS_PARTICLES_REDUCED: 1000,
            THREEJS_PARTICLES_NORMAL: 3000,
            DEBOUNCE_DELAY: 250,
            RESIZE_THROTTLE: 100,
            // Adaptive quality settings
            TARGET_FPS: 60,
            MIN_FPS: 45,
            PARTICLE_QUALITY_MULTIPLIERS: {
                LOW: 0.5,
                MEDIUM: 0.75,
                HIGH: 1
            },
            PARTICLE_BURST_CAP: 120,
            PARTICLE_POOL_SIZE: 150,
            PARTICLE_RECOVERY_RATE: 0.25,
            // Device detection
            IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            // Performance budgets
            MAX_ENEMIES_HIGH: 30,
            MAX_ENEMIES_MEDIUM: 22,
            MAX_ENEMIES_LOW: 15,
            MAX_BULLETS_HIGH: 100,
            MAX_BULLETS_MEDIUM: 75,
            MAX_BULLETS_LOW: 50,
            MAX_COLLECTIBLES_HIGH: 20,
            MAX_COLLECTIBLES_MEDIUM: 15,
            MAX_COLLECTIBLES_LOW: 10
        },
        
        // LocalStorage Keys
        STORAGE: {
            POINTS: 'dhPoints',
            BADGES: 'dhBadges',
            EASTER_EGGS: 'dhEasterEggs',
            LEVEL: 'dhLevel',
            XP: 'dhXP',
            ACHIEVEMENTS: 'dhAchievements',
            DISCOVERED: 'dhDiscovered',
            SECTIONS_VISITED: 'dhSectionsVisited',
            QUESTS: 'dhQuests',
            POWERUPS: 'dhPowerups',
            PARTICLES: 'dhParticles',
            INTERACTIONS: 'dhInteractions',
            VIEWED_SLIDES: 'dhViewedSlides',
            THEME: 'dhTheme'
        },
        
        // Feature Flags
        FEATURES: {
            REDUCED_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            WEBGL_SUPPORT: (function() {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
                } catch {
                    return false;
                }
            })(),
            LOCAL_STORAGE_SUPPORT: (function() {
                try {
                    const test = '__localStorage_test__';
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;
                } catch {
                    return false;
                }
            })()
        }
    };
    
    // Make CONFIG available globally
    window.CONFIG = CONFIG;
    window.CONFIG_READY = true;
    
    // Dispatch ready event
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.dispatchEvent(new Event('configReady'));
        });
    } else {
        window.dispatchEvent(new Event('configReady'));
    }
})();
