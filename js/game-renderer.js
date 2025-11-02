// Game Renderer - Visual rendering (separation of concerns)
// Optimized with grid caching for better performance

class GameRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Cache grid rendering to offscreen canvas
        this.gridCache = null;
        this.gridCacheDirty = true;
        this.lastCanvasSize = { width: 0, height: 0 };
    }
    
    clear() {
        // Clear with transparency to show 3D background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderGrid() {
        // Check if canvas size changed or cache is dirty
        const canvasChanged = 
            this.canvas.width !== this.lastCanvasSize.width ||
            this.canvas.height !== this.lastCanvasSize.height;
        
        if (!this.gridCache || canvasChanged || this.gridCacheDirty) {
            // Create or resize offscreen canvas for grid
            if (!this.gridCache || canvasChanged) {
                this.gridCache = document.createElement('canvas');
                this.gridCache.width = this.canvas.width;
                this.gridCache.height = this.canvas.height;
                this.lastCanvasSize = { width: this.canvas.width, height: this.canvas.height };
            }
            
            const gridCtx = this.gridCache.getContext('2d');
            gridCtx.clearRect(0, 0, this.gridCache.width, this.gridCache.height);
            
            // Draw grid to cache
            gridCtx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            gridCtx.lineWidth = 1;
            for (let x = 0; x < this.gridCache.width; x += 50) {
                gridCtx.beginPath();
                gridCtx.moveTo(x, 0);
                gridCtx.lineTo(x, this.gridCache.height);
                gridCtx.stroke();
            }
            for (let y = 0; y < this.gridCache.height; y += 50) {
                gridCtx.beginPath();
                gridCtx.moveTo(0, y);
                gridCtx.lineTo(this.gridCache.width, y);
                gridCtx.stroke();
            }
            
            this.gridCacheDirty = false;
        }
        
        // Draw cached grid
        this.ctx.drawImage(this.gridCache, 0, 0);
    }
    
    renderMenu(canvas) {
        // Fully transparent background - let 3D show through completely
        // No overlay needed - 3D background is visible
        
        // Title with glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = window.CONFIG?.COLORS?.PRIMARY || '#f97316';
        this.ctx.fillStyle = window.CONFIG?.COLORS?.PRIMARY || '#f97316';
        this.ctx.font = 'bold 48px Rajdhani, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HAZARD SURVIVAL', this.canvas.width / 2, this.canvas.height / 2 - 80);
        this.ctx.shadowBlur = 0;
        
        // Instructions
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.font = '20px Inter, sans-serif';
        this.ctx.fillText('Shoot enemies • Collect items • Survive!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // Controls - more prominent
        this.ctx.font = 'bold 18px Inter, sans-serif';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText('Click or Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.font = '16px Inter, sans-serif';
        this.ctx.fillText('WASD or Arrow Keys to Move', this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.fillText('Click or Hold Mouse to Shoot', this.canvas.width / 2, this.canvas.height / 2 + 75);
        this.ctx.fillText('Press P to Pause', this.canvas.width / 2, this.canvas.height / 2 + 100);
        
        // First-time instructions indicator
        const hasPlayed = localStorage.getItem('dhHasPlayed');
        if (!hasPlayed) {
            this.ctx.fillStyle = '#facc15';
            this.ctx.font = '14px Inter, sans-serif';
            this.ctx.fillText('💡 First time? Hover over this canvas for tips!', this.canvas.width / 2, this.canvas.height / 2 + 110);
        }
    }
    
    renderGame(game, particles, screenShake, mouse) {
        // Fully transparent background - 3D shows through completely
        // Clear canvas but don't add any overlay - let 3D background be fully visible
        
        // Calculate mouse angle for weapon direction - always point toward mouse or movement direction
        if (game.player && mouse && mouse.x !== undefined && mouse.y !== undefined) {
            // Prefer mouse position if available, otherwise use last known angle
            if (mouse.x > 0 && mouse.y > 0) {
                const dx = mouse.x - game.player.x;
                const dy = mouse.y - game.player.y;
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    game.mouseAngle = Math.atan2(dy, dx);
                }
            } else {
                // If no mouse, keep last angle or default to right
                game.mouseAngle = game.mouseAngle || 0;
            }
        } else {
            game.mouseAngle = game.mouseAngle || 0;
        }
        
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(screenShake.x, screenShake.y);
        
        // Visual motion blur effect for fast-moving objects
        const animationSpeed = game.animationSpeedMultiplier || 1.0;
        if (animationSpeed > 1.5) {
            // Apply subtle motion blur at high speed
            this.ctx.globalAlpha = 0.7;
            this.ctx.filter = `blur(${Math.min(2, (animationSpeed - 1.5) * 2)}px)`;
        } else {
            this.ctx.globalAlpha = 1.0;
            this.ctx.filter = 'none';
        }
        
        // Render cached grid (optimized - only redraws when canvas size changes)
        this.renderGrid();
        
        // Render bullets with trail effect
        this.renderBullets(game.bullets || []);
        
        // Reset filter after bullets
        this.ctx.filter = 'none';
        
        // View frustum culling - only render objects in viewport
        const viewportMargin = 50; // Margin for objects partially off-screen
        const viewportBounds = {
            left: -viewportMargin,
            right: this.canvas.width + viewportMargin,
            top: -viewportMargin,
            bottom: this.canvas.height + viewportMargin
        };
        
        const isInViewport = (x, y, radius) => {
            return x + radius >= viewportBounds.left &&
                   x - radius <= viewportBounds.right &&
                   y + radius >= viewportBounds.top &&
                   y - radius <= viewportBounds.bottom;
        };
        
        // Render collectibles with pulse animation (only if in viewport)
        game.collectibles.forEach(item => {
            if (!isInViewport(item.x, item.y, item.radius)) return;
            
            this.ctx.save();
            this.ctx.translate(item.x, item.y);
            this.ctx.rotate(item.rotation);
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 1;
            this.ctx.fillStyle = item.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = item.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, item.radius * pulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Render enemies with pulse and health bars (only if in viewport)
        game.enemies.forEach(enemy => {
            if (!isInViewport(enemy.x, enemy.y, enemy.radius * 1.5)) return;
            
            enemy.pulse = (enemy.pulse || 0) + 0.1;
            const pulse = Math.sin(enemy.pulse) * 0.15 + 1;
            this.ctx.fillStyle = enemy.color;
            this.ctx.shadowBlur = enemy.isBoss ? 40 : 20;
            this.ctx.shadowColor = enemy.color;
            
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            if (enemy.rotation !== undefined) {
                this.ctx.rotate(enemy.rotation);
            }
            
            const size = enemy.radius * pulse;
            
            // Draw different shapes based on enemy type
            switch(enemy.shape || 'circle') {
                case 'triangle':
                    this.ctx.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
                        const x = Math.cos(angle) * size;
                        const y = Math.sin(angle) * size;
                        if (i === 0) this.ctx.moveTo(x, y);
                        else this.ctx.lineTo(x, y);
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                case 'square':
                    this.ctx.fillRect(-size, -size, size * 2, size * 2);
                    break;
                case 'diamond':
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -size);
                    this.ctx.lineTo(size, 0);
                    this.ctx.lineTo(0, size);
                    this.ctx.lineTo(-size, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                case 'hexagon':
                    this.ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                        const x = Math.cos(angle) * size;
                        const y = Math.sin(angle) * size;
                        if (i === 0) this.ctx.moveTo(x, y);
                        else this.ctx.lineTo(x, y);
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                default: // circle
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                    this.ctx.fill();
            }
            
            this.ctx.restore();
            
            // Health bar for tanks and bosses
            if ((enemy.type === 'tank' || enemy.isBoss) && enemy.maxHealth > 1) {
                const healthPercent = enemy.health / enemy.maxHealth;
                const barWidth = enemy.radius * 2;
                const barHeight = enemy.isBoss ? 8 : 4;
                const barY = enemy.y - enemy.radius - (enemy.isBoss ? 12 : 8);
                
                // Background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(enemy.x - barWidth / 2, barY, barWidth, barHeight);
                
                // Health
                this.ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
                this.ctx.fillRect(enemy.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
                
                // Boss label
                if (enemy.isBoss) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 14px Rajdhani, sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('BOSS', enemy.x, barY - 2);
                }
            }
            
            // Danger indicator
            this.ctx.strokeStyle = enemy.color;
            this.ctx.lineWidth = enemy.isBoss ? 4 : 2;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius * pulse * (enemy.isBoss ? 1.5 : 1.3), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });
        
        // Render power-ups with rotation, rarity-based visuals, and attraction effect (only if in viewport)
        game.items.forEach(item => {
            if (!isInViewport(item.x, item.y, item.radius * 2)) return;
            
            item.pulse = (item.pulse || 0) + 0.08; // Faster pulse
            const pulse = Math.sin(item.pulse) * 0.3 + 1;
            
            // Rarity-based glow intensity
            const glowIntensity = item.rarity === 'epic' ? 40 : (item.rarity === 'rare' ? 30 : 20);
            const spawnAge = game.gameTime - (item.spawnTime || 0);
            const spawnPulse = spawnAge < 500 ? Math.sin(spawnAge * 0.02) * 0.5 + 1 : 1;
            
            this.ctx.save();
            this.ctx.translate(item.x, item.y);
            this.ctx.rotate(item.rotation);
            this.ctx.fillStyle = item.color;
            this.ctx.shadowBlur = glowIntensity;
            this.ctx.shadowColor = item.color;
            
            // Outer glow ring for epic/rare
            if (item.rarity !== 'common') {
                this.ctx.strokeStyle = item.color;
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, item.radius * pulse * spawnPulse * 1.5, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
            
            // Star shape
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const radius = item.radius * pulse * spawnPulse;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // Inner bright core
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, item.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        });
        
        // Render player trail
        if (game.player && game.player.trail) {
            game.player.trail.forEach((point, i) => {
                this.ctx.globalAlpha = point.alpha * 0.5;
                this.ctx.fillStyle = game.player.color;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, game.player.radius * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1;
        }
        
        // Render player with weapon
        if (game.player) {
            const alpha = game.player.invulnerable > 0 ? 0.5 : 1;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = game.player.color;
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = game.player.color;
            
            // Visual control feedback - direction indicators when moving
            const movementSmoothing = window.CONFIG?.GAME?.MOVEMENT_SMOOTHING !== false;
            if (movementSmoothing && (game.player.velocityX !== 0 || game.player.velocityY !== 0)) {
                const speed = Math.sqrt(game.player.velocityX * game.player.velocityX + game.player.velocityY * game.player.velocityY);
                if (speed > 0.1) {
                    // Draw motion trail streaks for direction feedback
                    this.ctx.strokeStyle = game.player.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.globalAlpha = alpha * 0.4;
                    this.ctx.shadowBlur = 10;
                    const trailLength = speed * 10;
                    const angle = Math.atan2(-game.player.velocityY, -game.player.velocityX);
                    const endX = game.player.x - Math.cos(angle) * trailLength;
                    const endY = game.player.y - Math.sin(angle) * trailLength;
                    this.ctx.beginPath();
                    this.ctx.moveTo(game.player.x, game.player.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.shadowBlur = 30;
                }
            }
            
            // Player with glow pulse
            const glow = Math.sin(Date.now() * 0.015) * 0.3 + 1;
            this.ctx.beginPath();
            this.ctx.arc(game.player.x, game.player.y, game.player.radius * glow, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Weapon/gun pointing toward mouse - always visible and correctly oriented
            if (game.mouseAngle !== undefined) {
                this.ctx.save();
                this.ctx.translate(game.player.x, game.player.y);
                this.ctx.rotate(game.mouseAngle);
                
                // Gun barrel (longer for visibility)
                this.ctx.fillStyle = '#333';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = game.player.color;
                this.ctx.fillRect(0, -2, game.player.radius + 12, 4);
                
                // Gun glow
                this.ctx.fillStyle = game.player.color;
                this.ctx.globalAlpha = 0.7;
                this.ctx.fillRect(0, -1.5, game.player.radius + 10, 3);
                
                // Power-up indicator on gun
                const hasRapidfire = game.player.powerups?.some(p => p.type === 'rapidfire');
                if (hasRapidfire) {
                    this.ctx.fillStyle = '#ff6b35';
                    this.ctx.globalAlpha = 0.8;
                    this.ctx.fillRect(game.player.radius + 8, -1, 4, 2);
                }
                
                this.ctx.globalAlpha = alpha;
                this.ctx.restore();
                this.ctx.shadowBlur = 30;
            }
            
            // Shield indicator with power-up aura
            if (game.player.invulnerable > 0) {
                this.ctx.strokeStyle = '#facc15';
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#facc15';
                this.ctx.beginPath();
                this.ctx.arc(game.player.x, game.player.y, game.player.radius * 1.5, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
            
            // Power-up auras with combination synergy effects
            if (game.player.powerups && game.player.powerups.length > 0) {
                // Check for power-up combinations for synergy effects
                const powerupTypes = game.player.powerups.map(p => p.type);
                const hasRapidfire = powerupTypes.includes('rapidfire');
                const hasSpreadshot = powerupTypes.includes('spreadshot');
                const hasExplosive = powerupTypes.includes('explosive');
                
                // Ultimate combo: All three weapon power-ups
                const hasUltimateCombo = hasRapidfire && hasSpreadshot && hasExplosive;
                
                if (hasUltimateCombo) {
                    // Special synergy aura - rainbow/energy effect
                    const time = Date.now() * 0.005;
                    const pulse = Math.sin(time) * 0.15 + 1;
                    const hue = (time * 50) % 360;
                    const synergyColor = `hsl(${hue}, 100%, 60%)`;
                    
                    this.ctx.strokeStyle = synergyColor;
                    this.ctx.lineWidth = 4;
                    this.ctx.globalAlpha = 0.8;
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = synergyColor;
                    this.ctx.beginPath();
                    this.ctx.arc(game.player.x, game.player.y, game.player.radius * 1.8 * pulse, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    // Inner ring
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.globalAlpha = 0.6;
                    this.ctx.beginPath();
                    this.ctx.arc(game.player.x, game.player.y, game.player.radius * 1.5 * pulse, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                    this.ctx.globalAlpha = alpha;
                }
                
                // Individual power-up auras
                game.player.powerups.forEach(powerup => {
                    const timeLeft = powerup.expiresAt - game.gameTime;
                    const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 1;
                    const auraAlpha = Math.min(1, timeLeft / 2000); // Fade out in last 2 seconds
                    
                    let auraColor = '#ffffff';
                    let auraRadius = game.player.radius * 1.3;
                    
                    switch(powerup.type) {
                        case 'rapidfire':
                            auraColor = '#ff6b35';
                            auraRadius = game.player.radius * 1.4;
                            break;
                        case 'spreadshot':
                            auraColor = '#38bdf8';
                            break;
                        case 'explosive':
                            auraColor = '#dc2626';
                            auraRadius = game.player.radius * 1.5;
                            break;
                        case 'speed':
                            auraColor = '#38bdf8';
                            break;
                        case 'multiplier':
                            auraColor = '#a855f7';
                            auraRadius = game.player.radius * 1.6;
                            break;
                    }
                    
                    // Enhanced aura for weapon combinations
                    if ((hasSpreadshot && hasExplosive && powerup.type === 'spreadshot') ||
                        (hasRapidfire && hasSpreadshot && powerup.type === 'rapidfire')) {
                        auraColor = '#ffd700'; // Gold for synergy
                        auraRadius *= 1.2;
                    }
                    
                    this.ctx.strokeStyle = auraColor;
                    this.ctx.lineWidth = hasUltimateCombo ? 1.5 : 2;
                    this.ctx.globalAlpha = hasUltimateCombo ? auraAlpha * 0.4 : auraAlpha * 0.6;
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = auraColor;
                    this.ctx.beginPath();
                    this.ctx.arc(game.player.x, game.player.y, auraRadius * pulse, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                });
                
                this.ctx.globalAlpha = alpha;
            }
            
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        }
        
        // Render damage numbers with crit indicators
        if (game.damageNumbers) {
            game.damageNumbers.forEach(dmg => {
                this.ctx.save();
                this.ctx.globalAlpha = dmg.alpha;
                const isCrit = dmg.value > 1 || dmg.color === '#ffffff';
                const fontSize = isCrit ? 20 : 16;
                this.ctx.font = `bold ${fontSize}px Rajdhani, sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.shadowBlur = isCrit ? 15 : 5;
                this.ctx.shadowColor = isCrit ? '#ffffff' : dmg.color;
                const text = isCrit ? `CRIT! -${dmg.value}` : `-${dmg.value}`;
                this.ctx.fillStyle = dmg.color;
                this.ctx.fillText(text, dmg.x, dmg.y);
                if (isCrit) {
                    // Add extra glow ring
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeText(text, dmg.x, dmg.y);
                }
                this.ctx.restore();
            });
        }
        
        // Render particles
        particles.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = p.radius * 2;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Render full screen flash effect
        if (particles.fullScreenFlash && particles.fullScreenFlash.active) {
            this.ctx.save();
            this.ctx.globalAlpha = particles.fullScreenFlash.alpha;
            this.ctx.fillStyle = particles.fullScreenFlash.color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        
        // Reset filter and alpha after all rendering
        this.ctx.filter = 'none';
        this.ctx.globalAlpha = 1.0;
        
        this.ctx.restore();
    }
    
    renderBullets(bullets) {
        // View frustum culling for bullets
        const viewportMargin = 50;
        const viewportBounds = {
            left: -viewportMargin,
            right: this.canvas.width + viewportMargin,
            top: -viewportMargin,
            bottom: this.canvas.height + viewportMargin
        };
        
        bullets.forEach(bullet => {
            // Skip bullets outside viewport
            if (bullet.x + bullet.radius < viewportBounds.left ||
                bullet.x - bullet.radius > viewportBounds.right ||
                bullet.y + bullet.radius < viewportBounds.top ||
                bullet.y - bullet.radius > viewportBounds.bottom) {
                return;
            }
            
            // Longer, more visible bullet trail with glow
            const trailLength = 12; // Increased from 8
            const prevX = bullet.x - bullet.vx * 0.08;
            const prevY = bullet.y - bullet.vy * 0.08;
            
            // Enhanced trail gradient with glow
            const gradient = this.ctx.createLinearGradient(prevX, prevY, bullet.x, bullet.y);
            gradient.addColorStop(0, 'rgba(250, 204, 21, 0)');
            gradient.addColorStop(0.3, 'rgba(250, 204, 21, 0.4)');
            gradient.addColorStop(0.6, 'rgba(250, 204, 21, 0.8)');
            gradient.addColorStop(1, bullet.color);
            
            // Outer glow
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = bullet.color;
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 4; // Thicker trail
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(prevX, prevY);
            this.ctx.lineTo(bullet.x, bullet.y);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            // Bullet core with glow
            this.ctx.save();
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = bullet.color;
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner bright core
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        });
    }
    
    renderUI(game) {
        // UI with backdrop for readability
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
        this.ctx.fillRect(0, 0, 200, 120);
        this.ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, 200, 120);
        
        // Score
        this.ctx.fillStyle = '#facc15';
        this.ctx.font = 'bold 24px Rajdhani, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${game.score}`, 10, 30);
        
        // Combo
        if (game.combo > 1) {
            this.ctx.fillStyle = '#a855f7';
            this.ctx.font = 'bold 20px Rajdhani, sans-serif';
            this.ctx.fillText(`COMBO x${game.comboMultiplier.toFixed(1)}`, 10, 55);
        }
        
        // Kill Streak
        if (game.killStreak > 1) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 18px Rajdhani, sans-serif';
            this.ctx.fillText(`KILL STREAK: ${game.killStreak}`, 10, 130);
        }
        
        // Active Power-ups indicator
        if (game.player?.powerups && game.player.powerups.length > 0) {
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
            this.ctx.fillRect(0, this.canvas.height - 60, 250, 60);
            
            this.ctx.font = 'bold 14px Rajdhani, sans-serif';
            this.ctx.fillStyle = '#facc15';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('POWER-UPS:', 10, this.canvas.height - 40);
            
            game.player.powerups.forEach((powerup, index) => {
                const timeLeft = powerup.expiresAt - game.gameTime;
                const timePercent = timeLeft / (window.CONFIG?.GAME?.POWERUP_DURATION_BASE || 10000);
                const x = 10 + (index % 3) * 80;
                const y = this.canvas.height - 20 + Math.floor(index / 3) * 20;
                
                // Power-up icon/name
                const icons = {
                    rapidfire: '⚡',
                    spreadshot: '💥',
                    explosive: '💣',
                    speed: '⚡',
                    multiplier: '⭐',
                    shield: '🛡'
                };
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Rajdhani, sans-serif';
                this.ctx.fillText(`${icons[powerup.type] || '•'}`, x, y);
                
                // Time bar
                const barWidth = 60;
                const barHeight = 4;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(x + 15, y - 8, barWidth, barHeight);
                
                const barColor = timePercent > 0.3 ? '#22c55e' : (timePercent > 0.1 ? '#f59e0b' : '#ef4444');
                this.ctx.fillStyle = barColor;
                this.ctx.fillRect(x + 15, y - 8, barWidth * Math.max(0, timePercent), barHeight);
            });
        }
    }
    
    renderDamageNumbers(damageNumbers) {
        damageNumbers.forEach(dmg => {
            this.ctx.save();
            this.ctx.globalAlpha = dmg.alpha;
            this.ctx.fillStyle = dmg.color;
            this.ctx.font = 'bold 16px Rajdhani, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`-${dmg.value}`, dmg.x, dmg.y);
            this.ctx.restore();
        });
    }
}

// Make GameRenderer available globally
window.GameRenderer = GameRenderer;
