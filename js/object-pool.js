// Object Pool - Performance optimization to reduce GC pressure
// Reuses objects instead of creating/destroying them

class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            if (this.resetFn) {
                this.resetFn(obj);
            }
            this.pool.push(obj);
        }
    }
    
    releaseAll() {
        this.active.forEach(obj => {
            if (this.resetFn) {
                this.resetFn(obj);
            }
            this.pool.push(obj);
        });
        this.active.clear();
    }
    
    getActiveCount() {
        return this.active.size;
    }
    
    getPoolSize() {
        return this.pool.length;
    }
}

// Create specialized pools for game entities
window.ObjectPool = ObjectPool;

// Particle pool factory
window.createParticlePool = function(initialSize = 50) {
    return new ObjectPool(
        () => ({
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
        }),
        (p) => {
            p.x = 0;
            p.y = 0;
            p.vx = 0;
            p.vy = 0;
            p.life = 0;
            p.alpha = 1;
        },
        initialSize
    );
};

// Bullet pool factory
window.createBulletPool = function(initialSize = 20) {
    return new ObjectPool(
        () => ({
            x: 0, y: 0,
            vx: 0, vy: 0,
            damage: 1,
            radius: 4,
            color: '#facc15',
            lifetime: 2000,
            age: 0,
            weaponType: 'basic'
        }),
        (b) => {
            b.age = 0;
            b.lifetime = 2000;
        },
        initialSize
    );
};

// Enemy pool factory
window.createEnemyPool = function(initialSize = 10) {
    return new ObjectPool(
        () => ({
            x: 0, y: 0,
            type: 'normal',
            radius: 10,
            color: '#ef4444',
            speed: 1.5,
            pulse: 0,
            health: 1,
            maxHealth: 1
        }),
        (e) => {
            e.pulse = 0;
            e.health = 1;
            e.maxHealth = 1;
        },
        initialSize
    );
};

// Collectible pool factory
window.createCollectiblePool = function(initialSize = 20) {
    return new ObjectPool(
        () => ({
            x: 0, y: 0,
            radius: 8,
            color: '#facc15',
            rotation: 0,
            speed: 1
        }),
        (c) => {
            c.rotation = 0;
        },
        initialSize
    );
};

