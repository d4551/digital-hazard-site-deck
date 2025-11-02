/**
 * Game Engine - Core Game Logic (Centralized Implementation)
 *
 * ARCHITECTURE OVERVIEW:
 * ======================
 * This engine implements a complete survival game with the following systems:
 *
 * CORE SYSTEMS:
 * - Player: Movement, weapons, power-ups, invulnerability
 * - Enemies: AI pathfinding, spawning, collision, health system
 * - Bullets: Physics, collision detection, weapon synergies
 * - Collectibles: Attraction mechanics, scoring, spawning
 * - Power-ups: Duration-based effects, synergies, HUD integration
 *
 * ADVANCED FEATURES:
 * - Frenzy Mode: 3-tier system with combo/streak triggers
 * - Combo System: Multipliers, visual feedback, persistence
 * - Difficulty Scaling: Dynamic enemy speed/spawn rates
 * - Kill Streaks: Chain explosions, milestone rewards
 * - Level Progression: Score-based advancement
 *
 * INTEGRATIONS:
 * - ParticleSystem: Visual effects for all game events
 * - AudioEngine: Synchronized sound effects and music
 * - Gamification: Achievements, quests, scoring
 * - PerformanceMonitor: FPS tracking and quality adjustment
 * - HUD: Real-time status updates
 *
 * STATE MANAGEMENT:
 * - Menu, Playing, Paused, GameOver states
 * - Event queue system for decoupled feedback
 * - Proper cleanup and resource management
 *
 * CONFIGURATION:
 * All game parameters centralized in config.js for easy tuning
 *
 * @author Digital Hazard Studio
 * @version 2.0
 */
// Game Engine - Core game logic (separation of concerns)
// Uses config.js for constants

/**
 * GAME LOGIC IMPLEMENTATION SUMMARY
 * ==================================
 *
 * PLAYER SYSTEM:
 * - Velocity-based movement with WASD/arrows + mouse aiming
 * - Invulnerability frames after taking damage
 * - Trail rendering for visual feedback
 * - Speed/power-up modifications
 *
 * WEAPON SYSTEM:
 * - Basic: Single shot toward mouse
 * - Spread: 5-7 bullets in arc (ultimate combo: 7 bullets)
 * - Explosive: Chain reaction explosions
 * - Synergies: Rapidfire + Spread/Explosive combinations
 * - Fire rate limiting and ammo management
 *
 * ENEMY AI:
 * - Pathfinding: Direct movement toward player
 * - Spawning: From screen edges with wave patterns
 * - Types: Normal, Fast, Tank, Blitz (frenzy mode)
 * - Difficulty scaling: Speed increases over time
 * - Swarm mechanics: Group fast enemies
 *
 * POWER-UP SYSTEM:
 * - Health: Restore lives
 * - Speed: Temporary movement boost
 * - Shield: Damage immunity
 * - Multiplier: Score bonus
 * - Rapidfire: Increased fire rate
 * - Spreadshot: Multi-bullet spread
 * - Explosive: Chain explosions
 * - Frenzy: Ultimate mode activation
 *
 * FRENZY MODE:
 * - 3 tiers based on combo/kill streak thresholds
 * - Speed boost, fire rate increase, spawn rate changes
 * - Visual/audio feedback with screen effects
 * - Duration extension mechanics
 *
 * SCORING SYSTEM:
 * - Collectibles: Base points × level × combo multiplier
 * - Enemy kills: Streak bonuses (5x, 10x, 20x, 30x, 50x)
 * - Level progression: Score-based advancement
 * - Combo persistence: Timeout-based decay
 *
 * DIFFICULTY SCALING:
 * - Enemy speed: Linear increase over time
 * - Spawn rate: Exponential decrease
 * - Enemy count: Capped with quality settings
 *
 * PERFORMANCE:
 * - Object pooling for bullets/enemies/collectibles
 * - Quality settings: Low/Medium/High with automatic adjustment
 * - FPS monitoring and adaptive quality
 * - Memory management with cleanup
 */
class GameEngine {
    /**
     * Creates a new GameEngine instance
     * @param {Object} config - Configuration object
     * @param {Object} config.canvas - Canvas dimensions
     * @param {number} config.canvas.width - Canvas width
     * @param {number} config.canvas.height - Canvas height
     * @throws {Error} If config is invalid
     */
    constructor(config) {
        if (!config || !config.canvas) {
            throw new Error('GameEngine requires valid config with canvas dimensions');
        }
        
        this.config = config;
        this.state = 'menu';
        this.score = 0;
        this.lives = window.CONFIG?.GAME?.INITIAL_LIVES || 3;
        this.level = 1;
        this.gameTime = 0;
        this.difficulty = window.CONFIG?.GAME?.INITIAL_DIFFICULTY || 1.5;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1.0;
        
        // Game objects
        this.player = null;
        this.collectibles = [];
        this.enemies = [];
        this.items = [];
        this.bullets = [];
        this.damageNumbers = [];
        
        // Timing
        this.lastFrame = 0;
        this.spawnTimer = 0;
        this.itemSpawnTimer = 0;
        this.enemySpawnTimer = 0;
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.eventQueue = [];
        this.intensityWave = false;
        this.intensityWaveEnd = 0;
        this.bossSpawnTimer = 0;
        this.bossActive = false;
        this.bossSpawnInterval = 60000; // Spawn boss every 60 seconds
        this.frenzy = {
            active: false,
            tier: 0,
            expiresAt: 0,
            speedBoost: 0,
            fireRateMultiplier: 1,
            lastComboTier: 0,
            lastKillTier: 0,
            source: null
        };
        
        // Performance settings
        this.qualityLevel = 'high';
        this.maxEnemies = 30;
        this.maxBullets = 100;
        this.maxCollectibles = 20;
        
        // Object pools (lazy initialization)
        this.bulletPool = null;
        this.enemyPool = null;
        this.collectiblePool = null;
        
        if (typeof window.createBulletPool === 'function') {
            this.bulletPool = window.createBulletPool(20);
        }
        if (typeof window.createEnemyPool === 'function') {
            this.enemyPool = window.createEnemyPool(10);
        }
        if (typeof window.createCollectiblePool === 'function') {
            this.collectiblePool = window.createCollectiblePool(20);
        }
    }
    
    setQuality(quality) {
        this.qualityLevel = quality;
        const config = window.CONFIG?.PERFORMANCE || {};
        
        switch(quality) {
            case 'low':
                this.maxEnemies = 15;
                this.maxBullets = 50;
                this.maxCollectibles = 10;
                break;
            case 'medium':
                this.maxEnemies = 22;
                this.maxBullets = 75;
                this.maxCollectibles = 15;
                break;
            case 'high':
            default:
                this.maxEnemies = 30;
                this.maxBullets = 100;
                this.maxCollectibles = 20;
                break;
        }
    }
    
    /**
     * Starts a new game session
     * Initializes player, resets game state, and sets up initial game objects
     */
    startGame() {
        try {
            this.state = 'playing';
            this.score = 0;
            this.lives = window.CONFIG?.GAME?.INITIAL_LIVES || 3;
            this.level = 1;
            this.gameTime = 0;
            this.difficulty = window.CONFIG?.GAME?.INITIAL_DIFFICULTY || 1.5;
            this.combo = 0;
            this.comboMultiplier = 1.0;
            this.collectibles = [];
            this.enemies = [];
            this.items = [];
            this.bullets = [];
            this.damageNumbers = [];
            this.killStreak = 0;
            this.lastKillTime = 0;
            this.eventQueue = [];
            this.intensityWave = false;
            this.intensityWaveEnd = 0;
            this.bossSpawnTimer = 0;
            this.bossActive = false;
            this.bossSpawnInterval = 60000; // Spawn boss every 60 seconds
            this.frenzy = {
                active: false,
                tier: 0,
                expiresAt: 0,
                speedBoost: 0,
                fireRateMultiplier: 1,
                lastComboTier: 0,
                lastKillTier: 0,
                source: null
            };
            
            const centerX = this.config.canvas.width / 2;
            const centerY = this.config.canvas.height / 2;
            const playerRadius = window.CONFIG?.GAME?.PLAYER_RADIUS || 15;
            const playerSpeed = window.CONFIG?.GAME?.INITIAL_SPEED || 4.5;
            
            const gameConfig = window.CONFIG?.GAME || {};
            this.player = {
                x: centerX,
                y: centerY,
                radius: playerRadius,
                speed: playerSpeed,
                baseSpeed: playerSpeed,
                velocityX: 0,
                velocityY: 0,
                color: window.CONFIG?.COLORS?.PRIMARY || '#f97316',
                invulnerable: 0,
                trail: [],
                powerups: [], // Array of active power-ups
                    weapon: {
                    type: 'basic',
                    baseFireRate: gameConfig.WEAPON_FIRE_RATE || 10,
                    fireRate: gameConfig.WEAPON_FIRE_RATE || 10,
                    damage: gameConfig.BULLET_DAMAGE || 1,
                    damageMultiplier: 1,
                    bulletSpeed: gameConfig.BULLET_SPEED || 12,
                    lastFired: 0,
                    pierce: false
            }
            };
            this.bullets = [];
            this.damageNumbers = [];
            this.killStreak = 0;
            this.lastKillTime = 0;
        } catch (error) {
            console.error('GameEngine: Error starting game', error);
            this.state = 'error';
        }
    }
    
    /**
     * Updates game state
     * @param {number} deltaTime - Time elapsed since last frame (milliseconds)
     * @param {Object} keys - Keyboard state object
     * @param {Object} mouse - Mouse state object with x, y coordinates
     * @returns {Object|null} Update result object with type and data, or null
     */
    update(deltaTime, keys, mouse) {
        if (this.state !== 'playing' || !this.player) return null;
        
        const queuedEvent = this.eventQueue.length > 0 ? this.eventQueue.shift() : null;
        const deliver = (event) => {
            if (event) {
                if (queuedEvent) {
                    this.eventQueue.unshift(queuedEvent);
                }
                return event;
            }
            return queuedEvent;
        };
        
        try {
                // Validate and cap inputs
            if (!deltaTime || deltaTime <= 0 || !isFinite(deltaTime)) {
                // Silently handle invalid deltaTime (common on first frame or when tab is hidden)
                // Use a default small delta to prevent freezing
                deltaTime = 16.67; // ~60fps default
        }
                
                // Cap delta time to prevent physics glitches (max 100ms = 10 FPS minimum)
                const MAX_DELTA = 100;
                if (deltaTime > MAX_DELTA) {
                    deltaTime = MAX_DELTA;
            }
            
            if (!keys || typeof keys !== 'object') keys = {};
            if (!mouse || typeof mouse !== 'object') mouse = { x: 0, y: 0 };
            
            this.gameTime += deltaTime;
            const difficultyConfig = window.CONFIG?.GAME || {};
            const baseDifficulty = difficultyConfig.INITIAL_DIFFICULTY || 1.5;
            const increment = difficultyConfig.DIFFICULTY_INCREMENT || 0.3;
            const interval = difficultyConfig.DIFFICULTY_INTERVAL || 15000;
            this.difficulty = baseDifficulty + Math.floor(this.gameTime / interval) * increment;
            
            if (this.frenzy.active && this.gameTime >= this.frenzy.expiresAt) {
                this.endFrenzy();
            }
        
        // Update player invulnerability
        if (this.player.invulnerable > 0) {
            this.player.invulnerable -= deltaTime;
    }
        
        // Update combo (reduced timeout for more challenge)
        const comboTimeout = window.CONFIG?.GAME?.COMBO_TIMEOUT || 1500;
        this.comboTimer += deltaTime;
        if (this.comboTimer > comboTimeout) {
            if (this.combo > 1) {
                this.comboMultiplier = 1.0 + (this.combo - 1) * 0.15;
            } else {
                this.combo = 0;
                this.comboMultiplier = 1.0;
        }
            this.comboTimer = 0;
    }
        
        // Update power-ups - remove expired ones and play warning sound
        this.player.powerups = this.player.powerups.filter(powerup => {
            const timeLeft = powerup.expiresAt - this.gameTime;
            
            // Play expiration warning sound when 2 seconds remain
            if (timeLeft <= 2000 && timeLeft > 1500 && !powerup.warningPlayed) {
                powerup.warningPlayed = true;
                if (window.audioEngine) {
                    window.audioEngine.playSound('powerup-expire');
            }
        }
            
            if (this.gameTime >= powerup.expiresAt) {
                // Power-up expired - run cleanup effect
                if (powerup.effect) {
                    powerup.effect();
            }
                return false; // Remove from array
        }
            return true;
        });
        
        // Apply active power-up effects and synergies
        const hasMultiplier = this.player.powerups.some(p => p.type === 'multiplier');
        const hasRegen = this.player.powerups.some(p => p.type === 'regen');
        
        // Health regeneration
        if (hasRegen && this.lives < 5) {
            const regenRate = 5000; // Heal every 5 seconds
            if (!this.lastRegen || this.gameTime - this.lastRegen > regenRate) {
                this.lives = Math.min(5, this.lives + 1);
                this.lastRegen = this.gameTime;
            }
        }
        
        if (hasMultiplier) {
            // Extended combo timer with multiplier active
            this.comboTimer = Math.max(0, this.comboTimer - deltaTime * 0.5); // Slower decay
    }
        
        // Power-up combination synergies
        const hasSpreadshot = this.player.powerups.some(p => p.type === 'spreadshot');
        const hasExplosive = this.player.powerups.some(p => p.type === 'explosive');
        const hasRapidfire = this.player.powerups.some(p => p.type === 'rapidfire');
        
        // Synergy: Spreadshot + Explosive = Each spread bullet explodes
        if (hasSpreadshot && hasExplosive && this.player.weapon.type === 'spread') {
            // Enhanced spread with explosive - already handled in shoot() method
            // Visual indicator: extra glow on bullets
    }
        
        // Synergy: Rapidfire + Spreadshot = Faster spread shots
        if (hasRapidfire && hasSpreadshot) {
            // Fire rate is already boosted by rapidfire, spread adds more bullets
            // Visual: different bullet color or size
    }
        
        // Synergy: All three weapon power-ups = Ultimate weapon mode
        if (hasRapidfire && hasSpreadshot && hasExplosive) {
            // Visual feedback: special aura color
            // Already handled by weapon type being 'spread' or 'explosive'
    }
        
        this.checkFrenzyTriggers();
        
        // Player movement with smoothing
        const movementSmoothing = window.CONFIG?.GAME?.MOVEMENT_SMOOTHING !== false;
        const mouseSensitivity = window.CONFIG?.GAME?.MOUSE_SENSITIVITY || 0.8;
        
        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy -= this.player.speed;
        if (keys['KeyS'] || keys['ArrowDown']) dy += this.player.speed;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= this.player.speed;
        if (keys['KeyD'] || keys['ArrowRight']) dx += this.player.speed;
        
        // Diagonal movement normalization (less penalty)
        if (dx !== 0 && dy !== 0) {
            dx *= 0.85; // Improved from 0.707
            dy *= 0.85;
    }
        
        if (movementSmoothing) {
            // Velocity-based movement with acceleration/deceleration
            const acceleration = 0.15;
            const friction = 0.92;
            
            // Target velocity
            const targetVx = dx;
            const targetVy = dy;
            
            // Accelerate toward target velocity
            this.player.velocityX += (targetVx - this.player.velocityX) * acceleration;
            this.player.velocityY += (targetVy - this.player.velocityY) * acceleration;
            
            // Apply friction
            this.player.velocityX *= friction;
            this.player.velocityY *= friction;
            
            // Apply velocity to position
            this.player.x += this.player.velocityX * deltaTime * 0.01;
            this.player.y += this.player.velocityY * deltaTime * 0.01;
        } else {
            // Direct movement
            this.player.x += dx * deltaTime * 0.01;
            this.player.y += dy * deltaTime * 0.01;
    }
        
        // Mouse following with sensitivity
        if (mouse.x > 0 && mouse.y > 0) {
            const mx = mouse.x - this.player.x;
            const my = mouse.y - this.player.y;
            const dist = Math.sqrt(mx * mx + my * my);
            if (dist > 5) {
                const followStrength = this.player.speed * mouseSensitivity * deltaTime * 0.01;
                this.player.x += (mx / dist) * Math.min(followStrength, dist * 0.5);
                this.player.y += (my / dist) * Math.min(followStrength, dist * 0.5);
        }
    }
        
        // Keep player in bounds
        this.player.x = Math.max(this.player.radius, Math.min(this.config.canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.config.canvas.height - this.player.radius, this.player.y));
        
        // Trail effect
        this.player.trail.push({ x: this.player.x, y: this.player.y, alpha: 1.0 });
        if (this.player.trail.length > 8) this.player.trail.shift();
        this.player.trail.forEach((point, i) => {
            point.alpha = i / this.player.trail.length;
        });

            // Update animation speed multiplier based on level and frenzy state
            const baseAnimationMultiplier = 1.0 + (this.level - 1) * 0.1;
            const frenzyVisualBoost = this.frenzy.active ? 1 + this.frenzy.tier * 0.15 : 1;
            this.animationSpeedMultiplier = baseAnimationMultiplier * frenzyVisualBoost;
            
            // Intensity waves - temporary 2x spawn rates
            if (this.intensityWave && this.gameTime > this.intensityWaveEnd) {
                this.intensityWave = false;
            } else if (!this.intensityWave && Math.random() < 0.01 && this.gameTime > 30000) {
                // Start intensity wave randomly after 30 seconds
                this.intensityWave = true;
                this.intensityWaveEnd = this.gameTime + 10000; // 10 second wave
        }
            
            // Faster spawning - use config with intensity wave modifier
            const gameConfig = window.CONFIG?.GAME || {};
            this.spawnTimer += deltaTime;
            const frenzySpawnBoost = this.frenzy.active ? 1 + this.frenzy.tier * 0.6 : 1;
            const spawnRate = (gameConfig.COLLECTIBLE_SPAWN_RATE || 600) / (this.intensityWave ? 2 : 1) / frenzySpawnBoost;
            if (this.spawnTimer > spawnRate / this.difficulty) {
                this.spawnCollectible();
                this.spawnTimer = 0;
    }
            
            // More frequent enemies - use config with intensity wave modifier
            this.enemySpawnTimer += deltaTime;
            const enemyRate = (gameConfig.ENEMY_SPAWN_RATE || 1500) / (this.intensityWave ? 2 : 1) / frenzySpawnBoost;
            const enemyDelay = gameConfig.ENEMY_START_DELAY || 1000;
            if (this.enemySpawnTimer > enemyRate / this.difficulty) {
                if (this.gameTime > enemyDelay) {
                    // Spawn more enemies per wave
                    const frenzyWaveBoost = this.frenzy.active ? this.frenzy.tier : 0;
                    const enemiesPerWave = Math.min(6, Math.floor(1 + this.difficulty * 0.6 + frenzyWaveBoost));
                    for (let i = 0; i < enemiesPerWave; i++) {
                        this.spawnEnemy();
                }
                    // Occasionally spawn swarm (group of fast enemies)
                    const swarmChance = (this.intensityWave ? 0.4 : 0.2) + (this.frenzy.active ? 0.1 * this.frenzy.tier : 0);
                    const baseSwarmCount = this.intensityWave ? 6 : 4;
                    if (Math.random() < Math.min(0.85, swarmChance)) {
                        const swarmCount = baseSwarmCount + (this.frenzy.active ? this.frenzy.tier : 0);
                        for (let i = 0; i < swarmCount; i++) {
                            setTimeout(() => this.spawnEnemy('fast'), i * 100);
                    }
                }
            }
                this.enemySpawnTimer = 0;
        }
            
            // Power-ups - use config (increased spawn rate)
            this.itemSpawnTimer += deltaTime;
            const powerupInterval = (gameConfig.POWERUP_SPAWN_INTERVAL || 8000) * 0.7; // 30% more frequent
            const powerupChance = Math.min(0.6, (gameConfig.POWERUP_SPAWN_CHANCE || 0.4) * 1.2); // Increased chance
            if (this.itemSpawnTimer > powerupInterval && Math.random() < powerupChance) {
                this.spawnPowerUp();
                this.itemSpawnTimer = 0;
        }
            
            // Boss spawning - spawn boss every 60 seconds or after clearing many enemies
            this.bossSpawnTimer += deltaTime;
            const enemyKillCount = this.killStreak || 0;
            const shouldSpawnBoss = !this.bossActive && (
                this.bossSpawnTimer > this.bossSpawnInterval || 
                (enemyKillCount > 0 && enemyKillCount % 50 === 0)
            );
            
            if (shouldSpawnBoss && this.enemies.length < this.maxEnemies - 3) {
                this.spawnBoss();
                this.bossSpawnTimer = 0;
            }
        
        // Update collectibles - attract to player
        const collected = [];
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            item.rotation += 0.2; // Faster rotation
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Attract when close (magnet power-up increases range)
            const hasMagnet = this.player.powerups.some(p => p.type === 'magnet');
            const attractionDistance = hasMagnet ? 300 : 150;
            if (dist < attractionDistance && dist > 0) {
                const attractionSpeed = hasMagnet ? 4 : 2;
                item.x += (dx / dist) * attractionSpeed * (1 - dist / attractionDistance);
                item.y += (dy / dist) * attractionSpeed * (1 - dist / attractionDistance);
        }
            
            if (dist < this.player.radius + item.radius) {
                this.score += Math.floor(10 * this.level * this.comboMultiplier);
                this.combo++;
                this.comboTimer = 0;
                this.checkFrenzyTriggers();
                collected.push({ type: 'collect', x: item.x, y: item.y, color: item.color });
                
                // Release collectible back to pool
                if (this.collectiblePool) {
                    this.collectiblePool.release(item);
                }
                
                this.collectibles.splice(i, 1);
        }
    }
        
        if (collected.length > 0) {
            const [first, ...rest] = collected;
            if (rest.length > 0) {
                this.eventQueue.push(...rest);
            }
            return deliver(first); // Return first collected item for explosion
    }
        
        // Update enemies - faster movement with boss AI
        let hitResult = null;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Update enemy rotation for shaped enemies
            if (enemy.rotation !== undefined) {
                enemy.rotation += 0.05 * deltaTime * 0.01;
            }
            
            // Boss AI pattern
            if (enemy.isBoss) {
                enemy.bossPatternTimer += deltaTime;
                
                // Boss movement pattern: circles around player
                const patternPhase = (enemy.bossPatternTimer / 2000) % (Math.PI * 2);
                const orbitRadius = 150;
                const orbitX = this.player.x + Math.cos(patternPhase) * orbitRadius;
                const orbitY = this.player.y + Math.sin(patternPhase) * orbitRadius;
                
                const dx = orbitX - enemy.x;
                const dy = orbitY - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const speedMultiplier = enemy.speed * this.difficulty * deltaTime * 0.01;
                    enemy.x += (dx / dist) * speedMultiplier;
                    enemy.y += (dy / dist) * speedMultiplier;
                }
            } else {
                // Normal enemy movement toward player
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    // Faster enemy movement with animation speed multiplier
                    const frenzySpeedBoost = this.frenzy.active ? 1 + this.frenzy.tier * 0.3 : 1;
                    const speedMultiplier = enemy.speed * this.difficulty * this.animationSpeedMultiplier * frenzySpeedBoost * deltaTime * 0.015;
                    enemy.x += (dx / dist) * speedMultiplier;
                    enemy.y += (dy / dist) * speedMultiplier;
                }
            }
            
            const dist = Math.sqrt(
                Math.pow(this.player.x - enemy.x, 2) + 
                Math.pow(this.player.y - enemy.y, 2)
            );
            
            const playerDist = Math.sqrt(
                Math.pow(this.player.x - enemy.x, 2) + 
                Math.pow(this.player.y - enemy.y, 2)
            );
            
            if (playerDist < this.player.radius + enemy.radius && this.player.invulnerable <= 0 && !hitResult) {
                this.lives--;
                const invulnerableDuration = window.CONFIG?.GAME?.INVULNERABLE_DURATION || 1500;
                this.player.invulnerable = invulnerableDuration;
                hitResult = { type: 'hit', x: this.player.x, y: this.player.y };
        }
            
            // Remove off-screen (bosses don't despawn)
            if (!enemy.isBoss && (enemy.x < -50 || enemy.x > this.config.canvas.width + 50 ||
                enemy.y < -50 || enemy.y > this.config.canvas.height + 50)) {
                // Release enemy back to pool
                if (this.enemyPool) {
                    this.enemyPool.release(enemy);
                }
                this.enemies.splice(i, 1);
            } else if (enemy.isBoss) {
                // Keep boss on screen
                enemy.x = Math.max(50, Math.min(this.config.canvas.width - 50, enemy.x));
                enemy.y = Math.max(50, Math.min(this.config.canvas.height - 50, enemy.y));
            }
    }
        
        if (hitResult) return deliver(hitResult);
        
        // Update power-ups
        let powerupResult = null;
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.rotation += 0.1;
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.player.radius + item.radius) {
                this.applyPowerUp(item.type);
                powerupResult = { 
                    type: 'powerup', 
                    x: item.x, 
                    y: item.y, 
                    color: item.color,
                    powerupType: item.type,
                    rarity: item.rarity || 'common'
                };
                this.items.splice(i, 1);
        }
    }
        
        if (powerupResult) return deliver(powerupResult);
        
        // Update bullets
        const bulletResults = this.updateBullets(deltaTime);
        if (bulletResults && bulletResults.length > 0) {
            // Return first kill for immediate feedback
            const [first, ...rest] = bulletResults;
            if (rest.length > 0) {
                this.eventQueue.push(...rest);
            }
            return deliver(first);
    }
        
        // Update damage numbers (fade and move up)
        this.damageNumbers = this.damageNumbers.filter(dmg => {
            dmg.y -= 30 * deltaTime * 0.01;
            dmg.alpha -= 0.02 * deltaTime * 0.01;
            dmg.life -= deltaTime;
            return dmg.life > 0 && dmg.alpha > 0;
        });
        
        // Level up - use config
        const levelThreshold = window.CONFIG?.GAME?.LEVEL_SCORE_THRESHOLD || 400;
        const maxLives = window.CONFIG?.GAME?.MAX_LIVES || 5;
        const newLevel = Math.floor(this.score / levelThreshold) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.lives = Math.min(maxLives, this.lives + 1);
            return deliver({ type: 'levelup', level: this.level });
    }
        
        if (this.lives <= 0) {
            this.state = 'gameover';
            return deliver({ type: 'gameover', score: this.score, level: this.level });
        }
        
        return deliver(null);
        } catch (error) {
            console.error('GameEngine: Error in update', error);
            return deliver({ type: 'error', message: error.message });
        }
    }
    
    getFrenzyDuration(tier = 1) {
        const base = window.CONFIG?.GAME?.FRENZY_BASE_DURATION || 6000;
        const bonus = window.CONFIG?.GAME?.FRENZY_TIER_BONUS || 2500;
        return base + Math.max(0, tier - 1) * bonus;
    }
    
    extendFrenzy(source = 'combo', tier = this.frenzy.tier || 1) {
        if (!this.frenzy.active) return;
        const extension = this.getFrenzyDuration(Math.max(tier, this.frenzy.tier)) * 0.5;
        this.frenzy.expiresAt = Math.max(this.frenzy.expiresAt, this.gameTime + extension);
        this.eventQueue.push({
            type: 'frenzyExtend',
            tier: this.frenzy.tier,
            source
        });
    }
    
    startFrenzy(tier = 1, source = 'combo') {
        const maxTier = window.CONFIG?.GAME?.FRENZY_MAX_TIER || 3;
        const clampedTier = Math.max(1, Math.min(maxTier, tier));
        
        if (this.frenzy.active) {
            if (clampedTier > this.frenzy.tier) {
                this.endFrenzy(true);
            } else {
                this.extendFrenzy(source, clampedTier);
                return;
            }
        }
        
        const duration = this.getFrenzyDuration(clampedTier);
        const speedBoost = 0.6 + clampedTier * 0.3;
        const fireRateMultiplier = 1 + clampedTier * 0.35;
        this.frenzy.active = true;
        this.frenzy.tier = clampedTier;
        this.frenzy.expiresAt = this.gameTime + duration;
        this.frenzy.speedBoost = speedBoost;
        this.frenzy.fireRateMultiplier = fireRateMultiplier;
        this.frenzy.source = source;
        
        if (this.player) {
            const maxSpeed = window.CONFIG?.GAME?.MAX_SPEED || 9;
            this.player.speed = Math.min(maxSpeed, this.player.speed + speedBoost);
            if (this.player.weapon) {
                this.player.weapon.fireRate *= fireRateMultiplier;
            }
        }
        
        this.eventQueue.push({
            type: 'frenzyStart',
            tier: clampedTier,
            source,
            duration
        });
    }
    
    endFrenzy(silent = false) {
        if (!this.frenzy.active) {
            return;
        }
        
        if (this.player) {
            const baseSpeed = this.player.baseSpeed || (window.CONFIG?.GAME?.INITIAL_SPEED || 4.5);
            this.player.speed = Math.max(baseSpeed, this.player.speed - (this.frenzy.speedBoost || 0));
            if (this.player.weapon) {
                const divisor = this.frenzy.fireRateMultiplier || 1;
                if (divisor !== 0) {
                    const baseFireRate = this.player.weapon.baseFireRate || this.player.weapon.fireRate;
                    this.player.weapon.fireRate = Math.max(baseFireRate, this.player.weapon.fireRate / divisor);
                }
            }
        }
        
        const tier = this.frenzy.tier;
        this.frenzy.active = false;
        this.frenzy.tier = 0;
        this.frenzy.expiresAt = 0;
        this.frenzy.speedBoost = 0;
        this.frenzy.fireRateMultiplier = 1;
        this.frenzy.source = null;
        this.frenzy.lastComboTier = 0;
        this.frenzy.lastKillTier = 0;
        
        if (!silent) {
            this.eventQueue.push({
                type: 'frenzyEnd',
                tier
            });
        }
    }
    
    checkFrenzyTriggers() {
        const comboThresholds = window.CONFIG?.GAME?.FRENZY_COMBO_THRESHOLDS || [6, 12, 20];
        const streakThresholds = window.CONFIG?.GAME?.FRENZY_STREAK_THRESHOLDS || [10, 20, 35];
        
        const comboTier = comboThresholds.reduce((tier, threshold, index) => {
            return this.combo >= threshold ? index + 1 : tier;
        }, 0);
        
        if (comboTier > 0) {
            if (!this.frenzy.active || comboTier > this.frenzy.tier) {
                this.startFrenzy(comboTier, 'combo');
            }
            this.frenzy.lastComboTier = comboTier;
        } else if (this.combo <= 1) {
            this.frenzy.lastComboTier = 0;
        }
        
        const killTier = streakThresholds.reduce((tier, threshold, index) => {
            return this.killStreak >= threshold ? index + 1 : tier;
        }, 0);
        
        if (killTier > 0) {
            if (!this.frenzy.active || killTier > this.frenzy.tier) {
                this.startFrenzy(killTier, 'killstreak');
            } else if (this.frenzy.active && killTier === this.frenzy.tier && this.killStreak % streakThresholds[killTier - 1] === 0) {
                this.extendFrenzy('killstreak', killTier);
            }
            this.frenzy.lastKillTier = killTier;
        } else if (this.killStreak <= 1) {
            this.frenzy.lastKillTier = 0;
        }
    }
    
    spawnCollectible() {
        // Limit collectibles based on quality
        if (this.collectibles.length >= this.maxCollectibles) {
            return;
        }
        
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: x = Math.random() * this.config.canvas.width; y = -20; break;
            case 1: x = this.config.canvas.width + 20; y = Math.random() * this.config.canvas.height; break;
            case 2: x = Math.random() * this.config.canvas.width; y = this.config.canvas.height + 20; break;
            case 3: x = -20; y = Math.random() * this.config.canvas.height; break;
    }
        
        const collectible = this.collectiblePool ? this.collectiblePool.acquire() : {};
        collectible.x = x;
        collectible.y = y;
        collectible.radius = 8 + Math.random() * 4;
        collectible.color = `hsl(${Math.random() * 60 + 15}, 100%, 55%)`;
        collectible.rotation = Math.random() * Math.PI * 2;
        collectible.speed = 1 + Math.random() * 2;
        
        this.collectibles.push(collectible);
    }
    
    spawnEnemy(type = null) {
        // Limit enemies based on quality
        if (this.enemies.length >= this.maxEnemies) {
            return null;
        }
        
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        // Spawn closer to player for immediate action
        const offset = 50;
        switch(side) {
            case 0: x = Math.random() * this.config.canvas.width; y = -offset; break;
            case 1: x = this.config.canvas.width + offset; y = Math.random() * this.config.canvas.height; break;
            case 2: x = Math.random() * this.config.canvas.width; y = this.config.canvas.height + offset; break;
            case 3: x = -offset; y = Math.random() * this.config.canvas.height; break;
    }
        
        // Enemy types with different shapes
        if (!type) {
            const weights = [
                { type: 'fast', weight: 0.25 },
                { type: 'normal', weight: 0.2 },
                { type: 'tank', weight: 0.15 },
                { type: 'triangle', weight: 0.15 },
                { type: 'square', weight: 0.1 },
                { type: 'diamond', weight: 0.1 },
                { type: 'hexagon', weight: 0.05 }
            ];
            if (this.frenzy.active) {
                weights.push({ type: 'blitz', weight: 0.12 * this.frenzy.tier });
            }
            const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0);
            let roll = Math.random() * totalWeight;
            for (const entry of weights) {
                roll -= entry.weight;
                if (roll <= 0) {
                    type = entry.type;
                    break;
                }
            }
        }
        
        const enemy = this.enemyPool ? this.enemyPool.acquire() : {};
        
        switch(type) {
            case 'fast':
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'fast';
                enemy.shape = 'circle';
                enemy.radius = 8 + Math.random() * 4;
                enemy.color = '#ff6b35';
                enemy.speed = 2.5 + Math.random() * this.difficulty * 1.5;
                enemy.pulse = 0;
                enemy.health = 1;
                enemy.maxHealth = 1;
                break;
            case 'tank':
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'tank';
                enemy.shape = 'circle';
                enemy.radius = 18 + Math.random() * 6;
                enemy.color = '#dc2626';
                enemy.speed = 0.8 + Math.random() * this.difficulty * 0.5;
                enemy.pulse = 0;
                enemy.health = 3;
                enemy.maxHealth = 3;
                break;
            case 'blitz':
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'blitz';
                enemy.shape = 'circle';
                enemy.radius = 9 + Math.random() * 3;
                enemy.color = '#fbbf24';
                enemy.speed = 3.2 + Math.random() * this.difficulty * 2.0;
                enemy.pulse = 0;
                enemy.health = 1;
                enemy.maxHealth = 1;
                break;
            case 'triangle':
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'triangle';
                enemy.shape = 'triangle';
                enemy.radius = 10 + Math.random() * 6;
                enemy.color = '#f97316';
                enemy.speed = 1.8 + Math.random() * this.difficulty * 1.2;
                enemy.pulse = 0;
                enemy.health = 2;
                enemy.maxHealth = 2;
                enemy.rotation = Math.random() * Math.PI * 2;
                break;
            case 'square':
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'square';
                enemy.shape = 'square';
                enemy.radius = 11 + Math.random() * 5;
                enemy.color = '#ef4444';
                enemy.speed = 1.6 + Math.random() * this.difficulty;
                enemy.pulse = 0;
                enemy.health = 2;
                enemy.maxHealth = 2;
                enemy.rotation = Math.random() * Math.PI * 2;
                break;
            case 'diamond':
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'diamond';
                enemy.shape = 'diamond';
                enemy.radius = 9 + Math.random() * 5;
                enemy.color = '#a855f7';
                enemy.speed = 2.2 + Math.random() * this.difficulty * 1.3;
                enemy.pulse = 0;
                enemy.health = 1;
                enemy.maxHealth = 1;
                enemy.rotation = Math.random() * Math.PI * 2;
                break;
            case 'hexagon':
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'hexagon';
                enemy.shape = 'hexagon';
                enemy.radius = 12 + Math.random() * 4;
                enemy.color = '#06b6d4';
                enemy.speed = 1.4 + Math.random() * this.difficulty * 0.9;
                enemy.pulse = 0;
                enemy.health = 2;
                enemy.maxHealth = 2;
                enemy.rotation = Math.random() * Math.PI * 2;
                break;
            default: // normal
                enemy.x = x;
                enemy.y = y;
                enemy.type = 'normal';
                enemy.shape = 'circle';
                enemy.radius = 10 + Math.random() * 8;
                enemy.color = '#ef4444';
                enemy.speed = 1.5 + Math.random() * this.difficulty;
                enemy.pulse = 0;
                enemy.health = 1;
                enemy.maxHealth = 1;
        }
        
        this.enemies.push(enemy);
        return enemy;
    }
    
    spawnBoss() {
        if (this.bossActive || this.enemies.length >= this.maxEnemies - 3) return null;
        
        this.bossActive = true;
        
        // Spawn boss from center of screen
        const centerX = this.config.canvas.width / 2;
        const centerY = this.config.canvas.height / 2;
        
        const enemy = this.enemyPool ? this.enemyPool.acquire() : {};
        enemy.x = centerX;
        enemy.y = centerY;
        enemy.type = 'boss';
        enemy.shape = 'circle';
        enemy.radius = 35 + Math.random() * 15;
        enemy.color = '#ff0000';
        enemy.speed = 1.2 + Math.random() * this.difficulty * 0.3;
        enemy.pulse = 0;
        enemy.health = 15 + Math.floor(this.level * 2);
        enemy.maxHealth = enemy.health;
        enemy.isBoss = true;
        enemy.bossPattern = 0;
        enemy.bossPatternTimer = 0;
        
        this.enemies.push(enemy);
        
        // Queue boss spawn event
        this.eventQueue.push({
            type: 'bossSpawned',
            x: enemy.x,
            y: enemy.y,
            enemy: enemy
        });
        
        return enemy;
    }
    
    spawnPowerUp() {
        // Enhanced rarity system: Common, Rare, Epic, Legendary
        const common = ['health', 'speed'];
        const rare = ['rapidfire', 'spreadshot', 'shield', 'pierce', 'regen'];
        const epic = ['explosive', 'multiplier', 'doubleDamage', 'freeze', 'magnet'];
        const legendary = ['frenzy', 'godmode'];
        
        let type;
        const rand = Math.random();
        if (rand < 0.45) {
            type = common[Math.floor(Math.random() * common.length)];
        } else if (rand < 0.75) {
            type = rare[Math.floor(Math.random() * rare.length)];
        } else if (rand < 0.95) {
            type = epic[Math.floor(Math.random() * epic.length)];
        } else {
            type = legendary[Math.floor(Math.random() * legendary.length)];
        }
        
        const colors = {
            health: '#22c55e',
            speed: '#38bdf8',
            shield: '#facc15',
            multiplier: '#a855f7',
            rapidfire: '#ff6b35',
            spreadshot: '#38bdf8',
            explosive: '#dc2626',
            frenzy: '#f97316',
            pierce: '#8b5cf6',
            regen: '#10b981',
            doubleDamage: '#f59e0b',
            freeze: '#06b6d4',
            magnet: '#ec4899',
            godmode: '#ffd700'
        };
        
        const rarity = common.includes(type) ? 'common' : 
                      (rare.includes(type) ? 'rare' : 
                      (epic.includes(type) ? 'epic' : 'legendary'));
        const size = rarity === 'legendary' ? 18 : 
                    (rarity === 'epic' ? 16 : 
                    (rarity === 'rare' ? 14 : 12));
        
        this.items.push({
            x: Math.random() * this.config.canvas.width,
            y: Math.random() * this.config.canvas.height,
            radius: size,
            color: colors[type],
            type: type,
            rarity: rarity,
            rotation: 0,
            pulse: 0,
            spawnTime: this.gameTime
        });
    }
    
    applyPowerUp(type) {
        const duration = window.CONFIG?.GAME?.POWERUP_DURATION_BASE || 10000;
        
        switch(type) {
            case 'health':
                this.lives = Math.min(5, this.lives + 1);
                // No duration - instant effect
                break;
            case 'speed':
                // Stack speed boosts with duration
                const existingSpeed = this.player.powerups.find(p => p.type === 'speed');
                if (existingSpeed) {
                    existingSpeed.expiresAt = this.gameTime + duration;
                    existingSpeed.startedAt = this.gameTime;
                    existingSpeed.duration = duration;
                    this.player.speed = Math.min(8, this.player.speed + 0.5);
                } else {
                    this.player.powerups.push({
                        type: 'speed',
                        expiresAt: this.gameTime + duration,
                        startedAt: this.gameTime,
                        duration,
                        effect: () => { this.player.speed = Math.max(window.CONFIG?.GAME?.INITIAL_SPEED || 4.5, this.player.speed - 0.8); }
                    });
                    this.player.speed = Math.min(8, this.player.speed + 0.8);
                }
                break;
            case 'shield':
                this.player.invulnerable = duration;
                // Add visual shield power-up
                this.player.powerups.push({
                    type: 'shield',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: null // Shield handled by invulnerable flag
                });
                break;
            case 'multiplier':
                // Stack multiplier power-ups
                const existingMultiplier = this.player.powerups.find(p => p.type === 'multiplier');
                if (existingMultiplier) {
                    existingMultiplier.expiresAt = this.gameTime + duration;
                    existingMultiplier.startedAt = this.gameTime;
                    existingMultiplier.duration = duration;
                } else {
                    this.player.powerups.push({
                        type: 'multiplier',
                        expiresAt: this.gameTime + duration,
                        startedAt: this.gameTime,
                        duration,
                        effect: null // Multiplier handled separately
                    });
                }
                this.score += 200;
                this.combo += 5;
                break;
            case 'rapidfire':
                // Enhanced fire rate (2.0x instead of 1.5x)
                const existingRapidfire = this.player.powerups.find(p => p.type === 'rapidfire');
                if (existingRapidfire) {
                    existingRapidfire.expiresAt = this.gameTime + duration;
                    existingRapidfire.startedAt = this.gameTime;
                    existingRapidfire.duration = duration;
                } else {
                    this.player.powerups.push({
                        type: 'rapidfire',
                        expiresAt: this.gameTime + duration,
                        startedAt: this.gameTime,
                        duration,
                        effect: () => { 
                            this.player.weapon.fireRate = this.player.weapon.baseFireRate;
                            this.player.weapon.type = 'basic';
                        }
                    });
                    this.player.weapon.fireRate = this.player.weapon.baseFireRate * 2.0;
                }
                break;
            case 'spreadshot':
                // 5 bullets instead of 3, wider angle
                this.player.powerups.push({
                    type: 'spreadshot',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: () => { this.player.weapon.type = 'basic'; }
                });
                this.player.weapon.type = 'spread';
                break;
            case 'explosive':
                // Larger blast radius
                this.player.powerups.push({
                    type: 'explosive',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: () => { this.player.weapon.type = 'basic'; }
                });
                this.player.weapon.type = 'explosive';
                break;
            case 'frenzy':
                {
                    const maxTier = window.CONFIG?.GAME?.FRENZY_MAX_TIER || 3;
                    const inferredTier = Math.min(
                        maxTier,
                        1 + Math.floor(this.combo / ((window.CONFIG?.GAME?.FRENZY_COMBO_THRESHOLDS || [6])[0] || 6))
                    );
                    const frenzyDuration = this.getFrenzyDuration(inferredTier);
                    this.player.powerups.push({
                        type: 'frenzy',
                        expiresAt: this.gameTime + frenzyDuration,
                        startedAt: this.gameTime,
                        duration: frenzyDuration,
                        effect: () => { this.endFrenzy(); }
                    });
                    this.startFrenzy(inferredTier, 'powerup');
                }
                break;
            case 'pierce':
                // Bullets pierce through enemies
                this.player.powerups.push({
                    type: 'pierce',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: () => { this.player.weapon.pierce = false; }
                });
                this.player.weapon.pierce = true;
                break;
            case 'regen':
                // Health regeneration over time
                this.player.powerups.push({
                    type: 'regen',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: null // Regen handled in update loop
                });
                break;
            case 'doubleDamage':
                // Double damage to enemies
                this.player.powerups.push({
                    type: 'doubleDamage',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: () => { this.player.weapon.damageMultiplier = 1; }
                });
                this.player.weapon.damageMultiplier = 2;
                break;
            case 'freeze':
                // Slow down enemies
                this.player.powerups.push({
                    type: 'freeze',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: null // Freeze handled globally
                });
                break;
            case 'magnet':
                // Attract collectibles from further away
                this.player.powerups.push({
                    type: 'magnet',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: null // Magnet handled in collectible update
                });
                break;
            case 'godmode':
                // Invincibility + damage boost
                this.player.invulnerable = duration;
                this.player.powerups.push({
                    type: 'godmode',
                    expiresAt: this.gameTime + duration,
                    startedAt: this.gameTime,
                    duration,
                    effect: () => { 
                        this.player.weapon.damageMultiplier = 1;
                        this.player.weapon.fireRate = this.player.weapon.baseFireRate;
                    }
                });
                this.player.weapon.damageMultiplier = 3;
                this.player.weapon.fireRate = this.player.weapon.baseFireRate * 2.5;
                break;
        }
    }
    
    /**
     * Shoots a bullet from player toward mouse cursor
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @returns {boolean} True if bullet was fired
     */
    shoot(mouseX, mouseY) {
        if (!this.player || !this.player.weapon) return false;
        
        const now = this.gameTime;
        const weapon = this.player.weapon;
        const minInterval = 1000 / weapon.fireRate;
        
        if (now - weapon.lastFired < minInterval) {
            return false; // Fire rate limit
        }
        
        weapon.lastFired = now;
        
        // Calculate direction
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) return false; // Too close to aim
        
        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * weapon.bulletSpeed;
        const vy = Math.sin(angle) * weapon.bulletSpeed;
        
        // Check for power-up synergies
        const hasSpreadshot = this.player.powerups.some(p => p.type === 'spreadshot');
        const hasExplosive = this.player.powerups.some(p => p.type === 'explosive');
        const hasRapidfire = this.player.powerups.some(p => p.type === 'rapidfire');
        const hasUltimateCombo = hasSpreadshot && hasExplosive && hasRapidfire;
        
        // Create bullet(s) based on weapon type
        if (weapon.type === 'spread') {
            // Enhanced spread shot: 5 bullets with wider angle (or 7 with ultimate combo)
            const spreadCount = hasUltimateCombo ? 7 : 5;
            const spreadAngle = hasUltimateCombo ? 0.6 : 0.5; // Wider spread for ultimate
            const bulletColor = hasExplosive ? '#ff6b35' : '#38bdf8'; // Orange if explosive combo
            
            // Limit bullets based on quality
            const maxBulletsForSpread = Math.min(spreadCount, this.maxBullets - this.bullets.length);
            
            for (let i = -(spreadCount - 1) / 2; i <= (spreadCount - 1) / 2; i++) {
                if (this.bullets.length >= this.maxBullets) break;
                
                const bulletAngle = angle + i * spreadAngle;
                const bullet = this.bulletPool ? this.bulletPool.acquire() : {};
                bullet.x = this.player.x + Math.cos(angle) * this.player.radius;
                bullet.y = this.player.y + Math.sin(angle) * this.player.radius;
                bullet.vx = Math.cos(bulletAngle) * weapon.bulletSpeed;
                bullet.vy = Math.sin(bulletAngle) * weapon.bulletSpeed;
                        bullet.damage = weapon.damage;
                        bullet.radius = hasUltimateCombo ? 5 : 4;
                        bullet.color = bulletColor;
                        bullet.lifetime = window.CONFIG?.GAME?.BULLET_LIFETIME || 2000;
                        bullet.age = 0;
                        bullet.weaponType = hasExplosive ? 'explosive' : weapon.type;
                        bullet.isUltimate = hasUltimateCombo;
                        bullet.pierce = this.player.weapon.pierce || false;
                        
                        this.bullets.push(bullet);
            }
        } else {
            // Single bullet - check limit
            if (this.bullets.length >= this.maxBullets) {
                return false;
            }
            
            const bullet = this.bulletPool ? this.bulletPool.acquire() : {};
            bullet.x = this.player.x + Math.cos(angle) * this.player.radius;
            bullet.y = this.player.y + Math.sin(angle) * this.player.radius;
            bullet.vx = vx;
            bullet.vy = vy;
            bullet.damage = weapon.damage;
            bullet.radius = 4;
            bullet.color = '#facc15';
            bullet.lifetime = window.CONFIG?.GAME?.BULLET_LIFETIME || 2000;
            bullet.age = 0;
            bullet.weaponType = weapon.type || 'basic';
            bullet.pierce = this.player.weapon.pierce || false;
            
            this.bullets.push(bullet);
        }
        
        return true;
    }
    
    /**
     * Creates bullets from an explosion that target nearby enemies
     * @param {number} x - X coordinate of explosion
     * @param {number} y - Y coordinate of explosion
     * @param {number} count - Number of bullets to create
     */
    createExplosionBullets(x, y, count = 8) {
        if (!this.player || this.enemies.length === 0) return;
        
        const bulletSpeed = (window.CONFIG?.GAME?.BULLET_SPEED || 12) * 0.8; // Slightly slower than normal bullets
        const bulletDamage = window.CONFIG?.GAME?.BULLET_DAMAGE || 1;
        const maxBullets = this.maxBullets || 100;
        
        // Rainbow colors for explosion bullets
        const rainbowColors = [
            '#ff0000', // Red
            '#ff7f00', // Orange
            '#ffff00', // Yellow
            '#00ff00', // Green
            '#0000ff', // Blue
            '#4b0082', // Indigo
            '#9400d3'  // Violet
        ];
        
        // Find nearby enemies to target
        const nearbyEnemies = this.enemies.filter(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < 300; // Target enemies within 300 pixels
        });
        
        // Create bullets targeting nearby enemies
        const bulletsToCreate = Math.min(count, nearbyEnemies.length, maxBullets - this.bullets.length);
        
        for (let i = 0; i < bulletsToCreate && this.bullets.length < maxBullets; i++) {
            const targetEnemy = nearbyEnemies[i % nearbyEnemies.length];
            const dx = targetEnemy.x - x;
            const dy = targetEnemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const angle = Math.atan2(dy, dx);
                const vx = Math.cos(angle) * bulletSpeed;
                const vy = Math.sin(angle) * bulletSpeed;
                
                const bullet = this.bulletPool ? this.bulletPool.acquire() : {};
                bullet.x = x;
                bullet.y = y;
                bullet.vx = vx;
                bullet.vy = vy;
                bullet.damage = bulletDamage;
                bullet.radius = 4;
                bullet.color = rainbowColors[i % rainbowColors.length];
                bullet.lifetime = window.CONFIG?.GAME?.BULLET_LIFETIME || 2000;
                bullet.age = 0;
                bullet.weaponType = 'explosive'; // Mark as explosive for chain reactions
                bullet.isExplosionBullet = true; // Mark as explosion bullet
                
                this.bullets.push(bullet);
            }
        }
        
        // If there are fewer enemies than bullets requested, create additional bullets in random directions
        if (bulletsToCreate < count && this.bullets.length < maxBullets) {
            const remaining = Math.min(count - bulletsToCreate, maxBullets - this.bullets.length);
            for (let i = 0; i < remaining; i++) {
                const angle = (Math.PI * 2 * i) / remaining + Math.random() * 0.5;
                const vx = Math.cos(angle) * bulletSpeed;
                const vy = Math.sin(angle) * bulletSpeed;
                
                const bullet = this.bulletPool ? this.bulletPool.acquire() : {};
                bullet.x = x;
                bullet.y = y;
                bullet.vx = vx;
                bullet.vy = vy;
                bullet.damage = bulletDamage;
                bullet.radius = 4;
                bullet.color = rainbowColors[(bulletsToCreate + i) % rainbowColors.length];
                bullet.lifetime = window.CONFIG?.GAME?.BULLET_LIFETIME || 2000;
                bullet.age = 0;
                bullet.weaponType = 'explosive';
                bullet.isExplosionBullet = true;
                
                this.bullets.push(bullet);
            }
        }
    }
    
    /**
     * Updates bullets and handles collisions
     * @param {number} deltaTime - Time elapsed
     * @returns {Array|null} Array of kill events or null
     */
    updateBullets(deltaTime) {
        if (!this.player) return null;
        
        const gameConfig = window.CONFIG?.GAME || {};
        const chainRadius = gameConfig.CHAIN_EXPLOSION_RADIUS || 80;
        const killEvents = [];
        
        // Update bullets - use manual array management for better performance
        let writeIndex = 0;
        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx * deltaTime * 0.01;
            bullet.y += bullet.vy * deltaTime * 0.01;
            bullet.age += deltaTime;
            
            // Check if bullet should be removed
            let shouldRemove = false;
            
            // Remove if off-screen or expired
            if (bullet.age > bullet.lifetime ||
                bullet.x < -50 || bullet.x > this.config.canvas.width + 50 ||
                bullet.y < -50 || bullet.y > this.config.canvas.height + 50) {
                shouldRemove = true;
            }
            
            // Check collision with enemies
            if (!shouldRemove) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < bullet.radius + enemy.radius) {
                        // Hit!
                        const hasFreeze = this.player.powerups.some(p => p.type === 'freeze');
                        if (hasFreeze && !enemy.isBoss) {
                            enemy.speed *= 0.5; // Slow down enemies
                        }
                        
                        const damageMultiplier = this.player.weapon.damageMultiplier || 1;
                        enemy.health -= bullet.damage * damageMultiplier;
                        
                        // Create damage number
                        this.damageNumbers.push({
                            x: enemy.x,
                            y: enemy.y,
                            value: bullet.damage * damageMultiplier,
                            color: enemy.health <= 0 ? '#ef4444' : '#facc15',
                            life: 1000,
                            alpha: 1
                        });
                        
                        // Pierce bullets continue through enemies
                        const hasPierce = this.player.weapon.pierce || false;
                        if (!hasPierce) {
                            shouldRemove = true;
                        }
                        
                        // Check if enemy is dead
                        if (enemy.health <= 0) {
                            // Boss killed - spawn rewards
                            if (enemy.isBoss) {
                                this.bossActive = false;
                                // Spawn multiple power-ups
                                for (let p = 0; p < 3; p++) {
                                    setTimeout(() => {
                                        const angle = (Math.PI * 2 * p) / 3;
                                        const offsetX = Math.cos(angle) * 50;
                                        const offsetY = Math.sin(angle) * 50;
                                        const powerup = {
                                            x: enemy.x + offsetX,
                                            y: enemy.y + offsetY,
                                            radius: 16,
                                            color: '#ffd700',
                                            type: 'frenzy',
                                            rarity: 'legendary',
                                            rotation: 0,
                                            pulse: 0,
                                            spawnTime: this.gameTime
                                        };
                                        this.items.push(powerup);
                                    }, p * 200);
                                }
                            }
                            
                            // Kill streak tracking
                            const now = this.gameTime;
                            if (now - this.lastKillTime < 3000) {
                                this.killStreak++;
                            } else {
                                this.killStreak = 1;
                            }
                            this.lastKillTime = now;
                            
                            // Score bonus for kill streak with visual/audio feedback thresholds
                            const baseScore = enemy.isBoss ? 500 : 10;
                            const streakBonus = Math.floor(baseScore * this.killStreak * this.comboMultiplier);
                            this.score += streakBonus;
                            this.checkFrenzyTriggers();
                            
                            // Visual and audio feedback for milestones (5, 10, 20, etc.)
                            const killStreakMilestones = [5, 10, 20, 30, 50];
                            if (killStreakMilestones.includes(this.killStreak)) {
                                this.eventQueue.push({
                                    type: 'killstreakMilestone',
                                    killStreak: this.killStreak,
                                    score: streakBonus
                                });
                            }
                            
                            killEvents.push({
                                type: enemy.isBoss ? 'bossKilled' : 'enemyKilled',
                                x: enemy.x,
                                y: enemy.y,
                                enemy: enemy,
                                killStreak: this.killStreak,
                                score: streakBonus
                            });
                            
                            // Release enemy back to pool
                            if (this.enemyPool) {
                                this.enemyPool.release(enemy);
                            }
                            
                            // Check for chain explosions with enhanced radius for explosive rounds
                            if (bullet.weaponType === 'explosive') {
                                const enhancedChainRadius = chainRadius * 1.5; // Larger blast radius
                                for (let k = this.enemies.length - 1; k >= 0; k--) {
                                    if (j === k) continue;
                                    const otherEnemy = this.enemies[k];
                                    const chainDx = enemy.x - otherEnemy.x;
                                    const chainDy = enemy.y - otherEnemy.y;
                                    const chainDist = Math.sqrt(chainDx * chainDx + chainDy * chainDy);
                                    
                                    if (chainDist < enhancedChainRadius) {
                                        // Chain explosion - kill nearby enemy
                                        killEvents.push({
                                            type: 'enemyKilled',
                                            x: otherEnemy.x,
                                            y: otherEnemy.y,
                                            enemy: otherEnemy,
                                            killStreak: this.killStreak + 1,
                                            score: Math.floor((this.killStreak + 1) * 5 * this.comboMultiplier),
                                            chainExplosion: true
                                        });
                                        
                                        // Release chained enemy back to pool
                                        if (this.enemyPool) {
                                            this.enemyPool.release(otherEnemy);
                                        }
                                        
                                        this.enemies.splice(k, 1);
                                    }
                                }
                            }
                            
                            this.enemies.splice(j, 1);
                        }
                        break; // Bullet hit enemy, stop checking
                    }
                }
            }
            
            // Keep bullet if not removed
            if (!shouldRemove) {
                if (writeIndex !== i) {
                    this.bullets[writeIndex] = bullet;
                }
                writeIndex++;
            } else {
                // Release bullet back to pool
                if (this.bulletPool) {
                    this.bulletPool.release(bullet);
                }
            }
        }
        
        // Trim array to remove dead bullets
        this.bullets.length = writeIndex;
        
        return killEvents.length > 0 ? killEvents : null;
    }
}

// Make GameEngine available globally
window.GameEngine = GameEngine;
