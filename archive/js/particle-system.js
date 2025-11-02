// Particle System - Visual effects (separation of concerns)
// Optimized with object pooling for better performance

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.explosions = [];
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.fullScreenFlash = null;
        
        // Object pool for particles (lazy initialization)
        this.particlePool = null;
        this.qualityLevel = 'high';
        
        const performanceConfig = window.CONFIG?.PERFORMANCE || {};
        const reducedCap = performanceConfig.PARTICLE_COUNT_REDUCED ?? 120;
        const normalCap = performanceConfig.PARTICLE_COUNT_NORMAL ?? 500;
        const mediumCap = Math.round((reducedCap + normalCap) / 2);
        const qualityMultipliers = performanceConfig.PARTICLE_QUALITY_MULTIPLIERS || {};
        
        this.qualityProfiles = {
            low: {
                multiplier: qualityMultipliers.LOW ?? 0.5,
                cap: reducedCap
            },
            medium: {
                multiplier: qualityMultipliers.MEDIUM ?? 0.75,
                cap: mediumCap
            },
            high: {
                multiplier: qualityMultipliers.HIGH ?? 1,
                cap: normalCap
            }
        };
        
        this.maxParticles = this.qualityProfiles.high.cap;
        this.maxBurst = performanceConfig.PARTICLE_BURST_CAP ?? Math.round(normalCap * 0.25);
        this.recoveryRate = performanceConfig.PARTICLE_RECOVERY_RATE ?? 0.25;
        this._burstDebt = 0;
        
        // Initialize pool if available
        if (typeof window.createParticlePool === 'function') {
            const poolSize = performanceConfig.PARTICLE_POOL_SIZE ?? 150;
            this.particlePool = window.createParticlePool(poolSize);
        }
    }
    
    setQuality(quality) {
        if (!this.qualityProfiles[quality]) {
            quality = 'high';
        }
        this.qualityLevel = quality;
        this.maxParticles = this.qualityProfiles[quality].cap;
    }
    
    acquireParticle() {
        if (this.particlePool) {
            return this.particlePool.acquire();
        }
        // Fallback: create new particle
        return {
            x: 0, y: 0,
            vx: 0, vy: 0,
            radius: 0,
            color: '#ffffff',
            life: 0,
            maxLife: 0,
            alpha: 1,
            gravity: 0,
            shrink: false,
            rotation: 0,
            rotationSpeed: 0
        };
    }
    
    releaseParticle(particle) {
        if (this.particlePool) {
            this.particlePool.release(particle);
        }
    }
    
    getQualityMultiplier() {
        return this.qualityProfiles[this.qualityLevel]?.multiplier ?? 1;
    }
    
    getAvailableSlots(cap) {
        const limit = typeof cap === 'number' ? cap : this.maxParticles;
        return Math.max(0, limit - this.particles.length);
    }
    
    recoverBurstBudget(deltaTime) {
        if (!Number.isFinite(this.maxBurst) || this.maxBurst <= 0) {
            this._burstDebt = 0;
            return;
        }
        const recoveryPerMs = (this.maxBurst * this.recoveryRate) / 1000;
        this._burstDebt = Math.max(0, this._burstDebt - recoveryPerMs * deltaTime);
    }
    
    spawnParticles(baseCount, initializer, options = {}) {
        if (typeof initializer !== 'function') {
            return 0;
        }
        
        const multiplier = typeof options.multiplier === 'number'
            ? options.multiplier
            : this.getQualityMultiplier();
        
        const available = this.getAvailableSlots(options.cap);
        if (available <= 0) {
            return 0;
        }
        
        let count = Math.floor(Math.max(0, baseCount) * multiplier);
        if (options.minCount) {
            count = Math.max(count, options.minCount);
        }
        count = Math.min(count, available);
        if (count <= 0) {
            return 0;
        }
        
        const burstCap = options.burstCap ?? this.maxBurst;
        if (Number.isFinite(burstCap)) {
            const remainingBurst = Math.max(0, burstCap - this._burstDebt);
            if (remainingBurst <= 0) {
                return 0;
            }
            count = Math.min(count, remainingBurst);
            this._burstDebt += count;
        }
        
        for (let i = 0; i < count; i++) {
            const particle = this.acquireParticle();
            initializer(particle, i, count);
            this.particles.push(particle);
        }
        
        return count;
    }
    
    createExplosion(x, y, color, count = 30, size = 5) {
        const layers = this.qualityLevel === 'low' ? 2 : 3;
        
        const computeLayerDistribution = (total, layerCount) => {
            const base = Math.max(1, Math.floor(total / layerCount));
            const remainder = total - base * layerCount;
            const distribution = new Array(layerCount).fill(base);
            for (let i = 0; i < remainder; i++) {
                distribution[i % layerCount] += 1;
            }
            return distribution;
        };
        
        const resolveLayerDetails = (index, distribution) => {
            let cumulative = 0;
            for (let layerIndex = 0; layerIndex < distribution.length; layerIndex++) {
                const layerCount = Math.max(1, distribution[layerIndex]);
                if (index < cumulative + layerCount) {
                    return {
                        layer: layerIndex,
                        offset: index - cumulative,
                        layerCount
                    };
                }
                cumulative += layerCount;
            }
            const lastLayer = distribution.length - 1;
            const lastCount = Math.max(1, distribution[lastLayer]);
            return {
                layer: lastLayer,
                offset: lastCount - 1,
                layerCount: lastCount
            };
        };
        
        let layerDistribution = null;
        const spawned = this.spawnParticles(count, (particle, index, total) => {
            if (!layerDistribution) {
                layerDistribution = computeLayerDistribution(total, layers);
            }
            
            const { layer, offset, layerCount } = resolveLayerDetails(index, layerDistribution);
            const layerSize = size * (1 + layer * 0.5);
            const speed = 4 + layer * 2;
            const angle = (Math.PI * 2 * offset) / layerCount + (layer * 0.3);
            const variance = Math.random() * 0.5;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle + variance) * speed;
            particle.vy = Math.sin(angle + variance) * speed;
            particle.radius = layerSize + Math.random() * layerSize * 0.5;
            particle.color = this.adjustColorBrightness(color, 1.2 - layer * 0.2);
            particle.life = 800 + Math.random() * 400;
            particle.maxLife = 1200;
            particle.alpha = 1;
            particle.gravity = 0.1;
            particle.shrink = true;
        }, { minCount: Math.min(8, count) });
        
        if (spawned >= 30) {
            this.addScreenShake(10);
        }
        
        return spawned;
    }
    
    createCollectExplosion(x, y, color) {
        const colors = [color, '#facc15', '#38bdf8', '#a855f7'];
        
        this.spawnParticles(25, (particle, index, total) => {
            const safeTotal = Math.max(1, total);
            const angle = (Math.PI * 2 * index) / safeTotal;
            const c = colors[index % colors.length];
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * (3 + Math.random() * 2);
            particle.vy = Math.sin(angle) * (3 + Math.random() * 2);
            particle.radius = 3 + Math.random() * 3;
            particle.color = c;
            particle.life = 400 + Math.random() * 200;
            particle.maxLife = 600;
            particle.alpha = 1;
            particle.gravity = -0.05;
            particle.shrink = true;
        }, { minCount: 6 });
    }
    
    createTrail(x, y, color) {
        const burstCap = Number.isFinite(this.maxBurst)
            ? Math.max(6, Math.floor(this.maxBurst * 0.25))
            : undefined;
        
        this.spawnParticles(3, (particle) => {
            particle.x = x + (Math.random() - 0.5) * 10;
            particle.y = y + (Math.random() - 0.5) * 10;
            particle.vx = (Math.random() - 0.5) * 2;
            particle.vy = (Math.random() - 0.5) * 2;
            particle.radius = 2 + Math.random() * 2;
            particle.color = color;
            particle.life = 200 + Math.random() * 100;
            particle.maxLife = 300;
            particle.alpha = 0.6;
            particle.gravity = 0;
            particle.shrink = true;
        }, { minCount: 1, burstCap });
    }
    
    createEnemyDeath(x, y, enemy = null) {
        const enemySize = enemy?.radius || 10;
        const enhancedCount = window.CONFIG?.GAME?.EXPLOSION_PARTICLE_COUNT_ENHANCED ?? 100;
        const explosionSize = 6 + enemySize * 0.3;
        const burstCap = Number.isFinite(this.maxBurst) ? Math.max(30, Math.floor(this.maxBurst * 0.6)) : undefined;
        
        // Rainbow explosion - create particles with rainbow colors
        const rainbowColors = [
            '#ff0000', // Red
            '#ff7f00', // Orange
            '#ffff00', // Yellow
            '#00ff00', // Green
            '#0000ff', // Blue
            '#4b0082', // Indigo
            '#9400d3'  // Violet
        ];
        
        // Create rainbow explosion particles
        const spawnedCore = this.spawnParticles(enhancedCount + enemySize * 2, (particle, index, total) => {
            const safeTotal = Math.max(1, total);
            const angle = (Math.PI * 2 * index) / safeTotal + (Math.random() * 0.5);
            const speed = 4 + Math.random() * 4;
            const colorIndex = Math.floor((index / safeTotal) * rainbowColors.length);
            const color = rainbowColors[colorIndex % rainbowColors.length];
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.radius = explosionSize + Math.random() * explosionSize * 0.5;
            particle.color = color;
            particle.life = 800 + Math.random() * 400;
            particle.maxLife = 1200;
            particle.alpha = 1;
            particle.gravity = 0.1;
            particle.shrink = true;
        }, { minCount: Math.min(8, enhancedCount + enemySize * 2) });
        
        const localizedBurstCap = (portion) => {
            if (!Number.isFinite(this.maxBurst)) {
                return undefined;
            }
            return Math.max(10, Math.floor(this.maxBurst * portion));
        };
        
        if (spawnedCore >= 80) {
            this.spawnParticles(15, (particle) => {
                const angle = Math.random() * Math.PI * 2;
                const speed = 8 + Math.random() * 5;
                const colorIndex = Math.floor(Math.random() * rainbowColors.length);
                particle.x = x;
                particle.y = y;
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;
                particle.radius = 4 + Math.random() * 4;
                particle.color = rainbowColors[colorIndex];
                particle.life = 100 + Math.random() * 100;
                particle.maxLife = 200;
                particle.alpha = 1;
                particle.gravity = 0;
                particle.shrink = true;
            }, { minCount: 4, burstCap });
        }
        
        this.spawnParticles(20, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const colorIndex = Math.floor(Math.random() * rainbowColors.length);
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 1;
            particle.radius = 4 + Math.random() * 4;
            particle.color = rainbowColors[colorIndex];
            particle.life = 1200 + Math.random() * 600;
            particle.maxLife = 1800;
            particle.alpha = 0.8;
            particle.gravity = -0.02;
            particle.shrink = false;
        }, { minCount: 5, burstCap: localizedBurstCap(0.5) });
        
        this.spawnParticles(25, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 3;
            const colorIndex = Math.floor(Math.random() * rainbowColors.length);
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.radius = 3 + Math.random() * 3;
            particle.color = rainbowColors[colorIndex];
            particle.life = 400 + Math.random() * 300;
            particle.maxLife = 700;
            particle.alpha = 1;
            particle.gravity = 0.05;
            particle.shrink = true;
        }, { minCount: 6, burstCap: localizedBurstCap(0.5) });
        
        this.spawnParticles(10, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const colorIndex = Math.floor(Math.random() * rainbowColors.length);
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.radius = 5 + Math.random() * 5;
            particle.color = rainbowColors[colorIndex];
            particle.life = 800 + Math.random() * 400;
            particle.maxLife = 1200;
            particle.alpha = 1;
            particle.gravity = 0.15;
            particle.shrink = false;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.1;
        }, { minCount: 4, burstCap: localizedBurstCap(0.4) });
        
        this.spawnParticles(15, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            const colorIndex = Math.floor(Math.random() * rainbowColors.length);
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * 5;
            particle.vy = Math.sin(angle) * 5;
            particle.radius = 2 + Math.random() * 2;
            particle.color = rainbowColors[colorIndex];
            particle.life = 600 + Math.random() * 300;
            particle.maxLife = 900;
            particle.alpha = 1;
            particle.gravity = 0.05;
            particle.shrink = false;
        }, { minCount: 5, burstCap: localizedBurstCap(0.4) });
        
        const shakeIntensity = Math.min(15, 8 + enemySize * 0.5);
        this.addScreenShake(shakeIntensity);
    }
    
    createGunMuzzleFlash(x, y, angle) {
        const flashDistance = 15;
        const flashX = x + Math.cos(angle) * flashDistance;
        const flashY = y + Math.sin(angle) * flashDistance;
        
        const burstCap = Number.isFinite(this.maxBurst)
            ? Math.max(10, Math.floor(this.maxBurst * 0.2))
            : undefined;
        
        this.spawnParticles(12, (particle) => {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.6;
            const speed = 4 + Math.random() * 3;
            particle.x = flashX;
            particle.y = flashY;
            particle.vx = Math.cos(spreadAngle) * speed;
            particle.vy = Math.sin(spreadAngle) * speed;
            particle.radius = 3 + Math.random() * 2;
            particle.color = '#ffffff';
            particle.life = 80 + Math.random() * 70;
            particle.maxLife = 150;
            particle.alpha = 1;
            particle.gravity = 0;
            particle.shrink = true;
        }, { minCount: 2, burstCap });
        
        this.spawnParticles(5, (particle) => {
            particle.x = flashX;
            particle.y = flashY;
            particle.vx = 0;
            particle.vy = 0;
            particle.radius = 6 + Math.random() * 4;
            particle.color = '#ffffff';
            particle.life = 30 + Math.random() * 30;
            particle.maxLife = 60;
            particle.alpha = 1;
            particle.gravity = 0;
            particle.shrink = true;
        }, { minCount: 1, burstCap });
    }
    
    createBulletImpact(x, y, color = '#facc15') {
        this.spawnParticles(12, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * (2 + Math.random() * 3);
            particle.vy = Math.sin(angle) * (2 + Math.random() * 3);
            particle.radius = 2 + Math.random() * 2;
            particle.color = color;
            particle.life = 100 + Math.random() * 50;
            particle.maxLife = 150;
            particle.alpha = 1;
            particle.gravity = 0.1;
            particle.shrink = true;
        }, { minCount: 2, burstCap: Number.isFinite(this.maxBurst) ? Math.max(8, Math.floor(this.maxBurst * 0.2)) : undefined });
    }
    
    createChainExplosion(x, y) {
        this.spawnParticles(8, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * (3 + Math.random() * 2);
            particle.vy = Math.sin(angle) * (3 + Math.random() * 2);
            particle.radius = 4 + Math.random() * 3;
            particle.color = '#ff6b35';
            particle.life = 300 + Math.random() * 200;
            particle.maxLife = 500;
            particle.alpha = 1;
            particle.gravity = 0.05;
            particle.shrink = true;
        }, { minCount: 2, burstCap: Number.isFinite(this.maxBurst) ? Math.max(8, Math.floor(this.maxBurst * 0.25)) : undefined });

        this.addScreenShake(5);
    }
    
    createKillStreakEffect(x, y, streak) {
        this.spawnParticles(20, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * (5 + streak * 0.5);
            particle.vy = Math.sin(angle) * (5 + streak * 0.5);
            particle.radius = 3 + Math.random() * 2;
            particle.color = `hsl(${330 + Math.random() * 30}, 100%, 60%)`;
            particle.life = 400 + streak * 50;
            particle.maxLife = 600;
            particle.alpha = 1;
            particle.gravity = -0.05;
            particle.shrink = true;
        }, { minCount: 4, burstCap: Number.isFinite(this.maxBurst) ? Math.max(12, Math.floor(this.maxBurst * 0.35)) : undefined });

        this.addScreenShake(8);
    }
    
    createFrenzyBurst(x, y, tier = 1) {
        const burstCap = Number.isFinite(this.maxBurst) ? Math.max(24, Math.floor(this.maxBurst * 0.65)) : undefined;
        const accentColor = tier >= 3 ? '#f97316' : '#38bdf8';
        const ringColor = tier >= 2 ? '#facc15' : '#38bdf8';
        
        this.spawnParticles(36 + tier * 12, (particle, index, total) => {
            const safeTotal = Math.max(1, total);
            const angle = (Math.PI * 2 * index) / safeTotal;
            const speed = 5 + tier * 1.5 + Math.random() * 2;
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.radius = 3 + Math.random() * 3;
            particle.color = accentColor;
            particle.life = 500 + Math.random() * 250;
            particle.maxLife = 800;
            particle.alpha = 1;
            particle.gravity = 0.02;
            particle.shrink = true;
        }, { minCount: 12, burstCap });
        
        this.spawnParticles(18 + tier * 6, (particle, index, total) => {
            const safeTotal = Math.max(1, total);
            const angle = (Math.PI * 2 * index) / safeTotal;
            const radius = 12 + tier * 3;
            particle.x = x + Math.cos(angle) * radius;
            particle.y = y + Math.sin(angle) * radius;
            particle.vx = Math.cos(angle) * (1 + tier * 0.3);
            particle.vy = Math.sin(angle) * (1 + tier * 0.3);
            particle.radius = 2 + Math.random() * 2;
            particle.color = ringColor;
            particle.life = 400 + Math.random() * 200;
            particle.maxLife = 700;
            particle.alpha = 0.9;
            particle.gravity = -0.01;
            particle.shrink = true;
        }, { minCount: 8, burstCap: Number.isFinite(this.maxBurst) ? Math.max(12, Math.floor(this.maxBurst * 0.5)) : undefined });
        
        this.addScreenShake(6 + tier * 2);
        
        if (tier >= 3) {
            this.fullScreenFlash = {
                active: true,
                color: '#f97316',
                alpha: 0.35,
                duration: 220,
                life: 220
            };
        }
    }
    
    createLevelUp() {
        const burstCap = Number.isFinite(this.maxBurst) ? Math.max(25, Math.floor(this.maxBurst * 0.75)) : undefined;
        const width = this.canvas?.width || 800;
        const height = this.canvas?.height || 600;
        
        this.spawnParticles(50, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            particle.x = Math.random() * width;
            particle.y = Math.random() * height;
            particle.vx = Math.cos(angle) * 4;
            particle.vy = Math.sin(angle) * 4;
            particle.radius = 4 + Math.random() * 4;
            particle.color = '#ffd700';
            particle.life = 1000;
            particle.maxLife = 1500;
            particle.alpha = 1;
            particle.gravity = -0.02;
            particle.shrink = false;
        }, { minCount: 10, burstCap });
        
        this.fullScreenFlash = {
            active: true,
            color: '#ffd700',
            alpha: 0.6,
            duration: 200,
            life: 200
        };
        
        this.addScreenShake(12);
    }
    
    createFullScreenKillStreak(streak) {
        const burstCap = Number.isFinite(this.maxBurst) ? Math.max(40, Math.floor(this.maxBurst * 0.85)) : undefined;
        const width = this.canvas?.width || 800;
        const height = this.canvas?.height || 600;
        
        this.spawnParticles(100, (particle) => {
            const angle = Math.random() * Math.PI * 2;
            particle.x = Math.random() * width;
            particle.y = Math.random() * height;
            particle.vx = Math.cos(angle) * (6 + streak * 0.3);
            particle.vy = Math.sin(angle) * (6 + streak * 0.3);
            particle.radius = 5 + Math.random() * 3;
            particle.color = '#ff0000';
            particle.life = 800 + streak * 100;
            particle.maxLife = 1200;
            particle.alpha = 1;
            particle.gravity = 0;
            particle.shrink = true;
        }, { minCount: 15, burstCap });
        
        this.fullScreenFlash = {
            active: true,
            color: '#ff0000',
            alpha: 0.4,
            duration: 300,
            life: 300
        };
        
        this.addScreenShake(15);
    }
    
    addScreenShake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }
    
    update(deltaTime) {
        const dt = Math.max(0, Math.min(deltaTime, 50));
        this.recoverBurstBudget(dt);
        
        // Update particles - use manual array management instead of filter() for better performance
        let writeIndex = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dt * 0.01;
            p.y += p.vy * dt * 0.01;
            p.vy += p.gravity * dt * 0.01;
            p.life -= dt;
            p.alpha = p.life / p.maxLife;
            
            if (p.shrink) {
                p.radius *= 0.98;
            }
            
            if (p.rotationSpeed) {
                p.rotation += p.rotationSpeed;
            }
            
            // Keep alive particles
            if (p.life > 0 && p.alpha > 0) {
                if (writeIndex !== i) {
                    this.particles[writeIndex] = p;
                }
                writeIndex++;
            } else {
                // Release dead particle back to pool
                this.releaseParticle(p);
            }
        }
        
        // Trim array to remove dead particles
        this.particles.length = writeIndex;
        
        // Update screen shake with directional component
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.9;
        }
        
        // Update full screen flash
        if (this.fullScreenFlash && this.fullScreenFlash.active) {
            this.fullScreenFlash.life -= dt;
            if (this.fullScreenFlash.life <= 0) {
                this.fullScreenFlash.active = false;
                this.fullScreenFlash = null;
            } else {
                this.fullScreenFlash.alpha = this.fullScreenFlash.life / this.fullScreenFlash.duration;
            }
        }
    }
    
    adjustColorBrightness(color, factor) {
        // Convert hex to RGB and adjust brightness
        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            return `rgb(${Math.min(255, Math.max(0, r * factor))}, ${Math.min(255, Math.max(0, g * factor))}, ${Math.min(255, Math.max(0, b * factor))})`;
        }
        return color;
    }
}

// Make ParticleSystem available globally
window.ParticleSystem = ParticleSystem;
