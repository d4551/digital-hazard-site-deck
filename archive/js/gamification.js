/**
 * Unified Gamification Manager
 * -----------------------------------------
 * Provides a resilient, DOM-friendly gamification layer that works when served
 * as static assets. The implementation focuses on defensive coding so that
 * missing DOM nodes or optional scripts never break initialization.
 */

(function() {
    'use strict';

    const STORAGE_NS = 'dh';
    const STORAGE_KEYS = {
        STATE: `${STORAGE_NS}GamificationState`,
        POINTS: `${STORAGE_NS}Points`,
        BADGES: `${STORAGE_NS}Badges`,
        EGGS: `${STORAGE_NS}EasterEggs`,
        LEVEL: `${STORAGE_NS}Level`,
        XP: `${STORAGE_NS}XP`,
        QUESTS: `${STORAGE_NS}Quests`,
        ACHIEVEMENTS: `${STORAGE_NS}Achievements`,
        VIEWED_SLIDES: `${STORAGE_NS}ViewedSlides`,
        PARTICLES: `${STORAGE_NS}Particles`,
        HIGH_SCORE: `${STORAGE_NS}HighScore`,
        REBEL_ACTIONS: `${STORAGE_NS}RebelActions`,
        MANIFESTO: `${STORAGE_NS}ManifestoFragments`,
        DECK_VC: `${STORAGE_NS}DeckReferencesVC`,
        DECK_TECH: `${STORAGE_NS}DeckReferencesTech`,
        DECK_BOTH: `${STORAGE_NS}DeckReferencesBoth`,
        COMPASS: `${STORAGE_NS}CompassStats`
    };

    const DEFAULT_QUESTS = {
        viewAllSlides: { completed: false, progress: 0, target: 12 },
        findEasterEggs: { completed: false, progress: 0, target: 15 },
        reachCombo: { completed: false, progress: 0, target: 10 },
        manifestoCollector: { completed: false, progress: 0, target: 5 },
        deckExplorer: { completed: false, progress: 0, target: 10 },
        industryInsider: { completed: false, progress: 0, target: 7 },
        rebelActions: { completed: false, progress: 0, target: 10 },
        clickEasterEggs: { completed: false, progress: 0, target: 5 },
        timeSpent: { completed: false, progress: 0, target: 300 },
        konamiMaster: { completed: false, progress: 0, target: 1 }
    };

    const POWERUP_DEFAULTS = {
        multiplier: { duration: 15000, cooldown: 30000, active: false, cooldownEnds: 0 },
        reveal: { duration: 12000, cooldown: 25000, active: false, cooldownEnds: 0 },
        freeze: { duration: 8000, cooldown: 20000, active: false, cooldownEnds: 0 }
    };

    const XP_CONFIG = {
        base: window.CONFIG?.GAMIFICATION?.BASE_XP_AMOUNT || 100,
        multiplier: window.CONFIG?.GAMIFICATION?.BASE_XP_MULTIPLIER || 1.5
    };

    const SCORE_POPUP_TIMEOUT = 2000;
    const TOAST_TIMEOUT = 4000;

    class UnifiedGamificationManager {
        constructor() {
            this.points = 0;
            this.currentScore = 0;
            this.level = 1;
            this.xp = 0;
            this.xpToNext = this.calculateXPToNext(1);

            this.badges = [];
            this.achievements = [];
            this.questMap = cloneQuestState(DEFAULT_QUESTS);

            this.easterEggsFound = new Set();
            this.sectionsVisited = new Set();
            this.viewedSlides = new Set([0]);
            this.manifestoFragments = new Set();
            this.deckReferences = {
                vc: new Set(),
                tech: new Set(),
                both: new Set()
            };
            this.compassStats = new Set();
            this.rebelActions = 0;

            this.combo = 0;
            this.comboMultiplier = 1;
            this.comboTimeout = null;
            this.comboDecayMs = 4000;

            this.particleCount = 0;
            this.highScore = 0;
            this.totalSlides = 0;
            this.notificationQueue = [];
            this.notificationActive = false;

            this.powerups = clonePowerups(POWERUP_DEFAULTS);
            this.powerupCooldownInterval = null;
            this.powerupCooldownPaused = false;

            this.konamiSequence = [];
            this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
            this.konamiEnabled = false;
            this.konamiListener = null;

            // Debounced save state
            this._saveStateTimeout = null;
            this._saveStateDebounceMs = 500;
            this._criticalSave = false;

            this.loadState();
            this.updateAllDisplays();
            this.initKonamiCode();
            this.startPowerupCooldowns();
            this.initCleanupHandlers();
        }

        /* ---------- Persistence ---------- */

        getStorage(key, fallback) {
            if (window.Storage && typeof window.Storage === 'object' && typeof window.Storage.get === 'function') {
                try {
                    return window.Storage.get(key, fallback);
                } catch (error) {
                    console.warn(`[Gamification] Storage.get error:`, error);
                }
            }
            if (!supportsLocalStorage()) {
                return fallback;
            }
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (error) {
                console.warn(`[Gamification] Failed to read ${key}:`, error);
                return fallback;
            }
        }

        setStorage(key, value) {
            if (window.Storage && typeof window.Storage === 'object' && typeof window.Storage.set === 'function') {
                try {
                    return window.Storage.set(key, value);
                } catch (error) {
                    console.warn(`[Gamification] Storage.set error:`, error);
                }
            }
            if (!supportsLocalStorage()) {
                return false;
            }
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn(`[Gamification] Failed to write ${key}:`, error);
                return false;
            }
        }

        loadState() {
            const legacyPoints = parseInt(this.getStorage(STORAGE_KEYS.POINTS, '0'), 10);
            const savedState = this.getStorage(STORAGE_KEYS.STATE, null);

            const state = savedState || {
                points: isFiniteNumber(legacyPoints) ? legacyPoints : 0,
                badges: this.getStorage(STORAGE_KEYS.BADGES, []),
                level: parseInt(this.getStorage(STORAGE_KEYS.LEVEL, '1'), 10) || 1,
                xp: parseInt(this.getStorage(STORAGE_KEYS.XP, '0'), 10) || 0,
                quests: this.getStorage(STORAGE_KEYS.QUESTS, DEFAULT_QUESTS),
                achievements: this.getStorage(STORAGE_KEYS.ACHIEVEMENTS, []),
                viewedSlides: this.getStorage(STORAGE_KEYS.VIEWED_SLIDES, [0]),
                easterEggs: this.getStorage(STORAGE_KEYS.EGGS, []),
                particles: parseInt(this.getStorage(STORAGE_KEYS.PARTICLES, '0'), 10) || 0,
                highScore: parseInt(this.getStorage(STORAGE_KEYS.HIGH_SCORE, '0'), 10) || 0,
                rebelActions: parseInt(this.getStorage(STORAGE_KEYS.REBEL_ACTIONS, '0'), 10) || 0,
                manifesto: this.getStorage(STORAGE_KEYS.MANIFESTO, []),
                deckVC: this.getStorage(STORAGE_KEYS.DECK_VC, []),
                deckTech: this.getStorage(STORAGE_KEYS.DECK_TECH, []),
                deckBoth: this.getStorage(STORAGE_KEYS.DECK_BOTH, []),
                compass: this.getStorage(STORAGE_KEYS.COMPASS, [])
            };

            this.points = state.points || 0;
            this.badges = Array.isArray(state.badges) ? state.badges : [];
            this.level = Math.max(1, state.level || 1);
            this.xp = Math.max(0, state.xp || 0);
            this.questMap = mergeQuests(state.quests, DEFAULT_QUESTS);
            this.achievements = Array.isArray(state.achievements) ? state.achievements : [];
            this.viewedSlides = new Set(Array.isArray(state.viewedSlides) ? state.viewedSlides : [0]);
            this.easterEggsFound = new Set(Array.isArray(state.easterEggs) ? state.easterEggs : []);
            this.particleCount = state.particles || 0;
            this.highScore = state.highScore || 0;
            this.rebelActions = state.rebelActions || 0;
            this.manifestoFragments = new Set(Array.isArray(state.manifesto) ? state.manifesto : []);
            this.deckReferences = {
                vc: new Set(Array.isArray(state.deckVC) ? state.deckVC : []),
                tech: new Set(Array.isArray(state.deckTech) ? state.deckTech : []),
                both: new Set(Array.isArray(state.deckBoth) ? state.deckBoth : [])
            };
            this.compassStats = new Set(Array.isArray(state.compass) ? state.compass : []);

            this.currentScore = this.points;
            this.xpToNext = this.calculateXPToNext(this.level);
        }

        saveState(immediate = false) {
            // Clear existing debounce timeout
            if (this._saveStateTimeout) {
                clearTimeout(this._saveStateTimeout);
                this._saveStateTimeout = null;
            }

            // If immediate (critical save like beforeunload), save right away
            if (immediate || this._criticalSave) {
                this._criticalSave = false;
                this._performSave();
                return;
            }

            // Otherwise, debounce the save
            this._saveStateTimeout = setTimeout(() => {
                this._performSave();
                this._saveStateTimeout = null;
            }, this._saveStateDebounceMs);
        }

        _performSave() {
            const state = {
                points: this.points,
                badges: this.badges,
                level: this.level,
                xp: this.xp,
                quests: this.questMap,
                achievements: this.achievements,
                viewedSlides: Array.from(this.viewedSlides),
                easterEggs: Array.from(this.easterEggsFound),
                particles: this.particleCount,
                highScore: this.highScore,
                rebelActions: this.rebelActions,
                manifesto: Array.from(this.manifestoFragments),
                deckVC: Array.from(this.deckReferences.vc),
                deckTech: Array.from(this.deckReferences.tech),
                deckBoth: Array.from(this.deckReferences.both),
                compass: Array.from(this.compassStats)
            };

            this.setStorage(STORAGE_KEYS.STATE, state);
        }

        /* ---------- Points & XP ---------- */

        addPoints(points, title, description) {
            if (!isFiniteNumber(points)) {
                return;
            }

            this.points = Math.max(0, this.points + points);
            this.currentScore = Math.max(0, this.currentScore + points);
            this.updatePointsDisplay();

            if (points > 0) {
                this.addXP(points);
            }

            if (points !== 0) {
                this.showScorePopup(points);
            }

            if (title) {
                this.showToast(title, description || '');
            }

            this.checkBadges();
            this.saveState();
        }

        addXP(amount) {
            if (!isFiniteNumber(amount) || amount <= 0) {
                return;
            }

            this.xp += amount;
            while (this.xp >= this.xpToNext) {
                this.xp -= this.xpToNext;
                this.levelUp();
            }
            this.updateLevelDisplay();
        }

        levelUp() {
            this.level += 1;
            this.xpToNext = this.calculateXPToNext(this.level);
            this.showToast(`Level Up!`, `Welcome to level ${this.level}`);
            this.triggerMilestoneCelebration('level-up', `LEVEL ${this.level}`, 'Keep breaking the meta!');
        }

        calculateXPToNext(level) {
            const safeLevel = Math.max(1, level);
            return Math.round(XP_CONFIG.base * Math.pow(XP_CONFIG.multiplier, safeLevel - 1));
        }

        checkHighScore() {
            if (this.currentScore > this.highScore) {
                this.highScore = this.currentScore;
                this.setStorage(STORAGE_KEYS.HIGH_SCORE, this.highScore);
                this.showToast('New High Score!', `Score: ${this.currentScore}`);
            }
            return this.highScore;
        }

        /* ---------- Achievements & Quests ---------- */

        unlockAchievement(id, title, description, rewardPoints = 0) {
            if (!id || this.achievements.find((ach) => ach.id === id)) {
                return;
            }

            const achievement = {
                id,
                title,
                description,
                rewardPoints,
                unlockedAt: Date.now()
            };

            this.achievements.push(achievement);
            if (rewardPoints) {
                this.addPoints(rewardPoints);
            } else {
                this.updatePointsDisplay();
            }

            this.displayAchievementNotification(title || 'Achievement Unlocked!', description || '');
            this.saveState();
        }

        completeQuest(id) {
            const quest = this.questMap[id];
            if (!quest || quest.completed) {
                return;
            }

            quest.completed = true;
            this.unlockAchievement(`quest-${id}`, 'Quest Complete!', `Finished ${formatLabel(id)}`, quest.reward || 0);
            this.saveState();
        }

        updateQuestProgress(id, value) {
            const quest = this.questMap[id];
            if (!quest) {
                return;
            }

            const nextValue = Math.min(quest.target, value);
            if (quest.progress === nextValue) {
                return;
            }

            quest.progress = nextValue;
            if (!quest.completed && quest.progress >= quest.target) {
                this.completeQuest(id);
            }
            this.saveState();
        }

        checkBadges() {
            const badgeChecks = [
                { id: 'points-100', threshold: 100, label: 'Rebel Initiate' },
                { id: 'points-500', threshold: 500, label: 'Meta Breaker' },
                { id: 'points-1000', threshold: 1000, label: 'Systems Hacker' }
            ];

            badgeChecks.forEach(({ id, threshold, label }) => {
                if (this.points >= threshold && !this.badges.includes(id)) {
                    this.badges.push(id);
                    this.showToast(`Badge earned: ${label}`);
                }
            });

            this.checkRebelAchievements();
        }

        checkRebelAchievements() {
            if (this.rebelActions >= 10 && !this.achievements.find((a) => a.id === 'rebel-cause')) {
                this.unlockAchievement('rebel-cause', 'Rebel With a Cause', "You didn't just follow the path—you made your own", 500);
            }

            if (this.comboMultiplier >= 10 && this.rebelActions >= 5 && !this.achievements.find((a) => a.id === 'non-conformist')) {
                this.unlockAchievement('non-conformist', 'Non-Conformist', 'Combo 10x while acting like a rebel', 750);
            }
        }

        /* ---------- Tracking Helpers ---------- */

        viewSlide(index) {
            if (!Number.isInteger(index) || index < 0) {
                return;
            }
            this.viewedSlides.add(index);
            this.updateQuestProgress('viewAllSlides', this.viewedSlides.size);
            this.saveState();
        }

        visitSection(sectionId) {
            if (!sectionId) {
                return;
            }
            this.sectionsVisited.add(sectionId);
            if (this.sectionsVisited.size >= 5) {
                this.unlockAchievement('explorer', 'Explorer', 'Visited five sections', 250);
            }
            this.saveState();
        }

        discoverEasterEgg(eggId, eggName, points = 50) {
            if (!eggId || this.easterEggsFound.has(eggId)) {
                return;
            }
            this.easterEggsFound.add(eggId);
            this.addPoints(points, `Easter Egg Found`, eggName || eggId);
            this.updateQuestProgress('findEasterEggs', this.easterEggsFound.size);
            this.saveState();
        }

        foundEasterEgg(eggId, eggName, points = 50) {
            this.discoverEasterEgg(eggId, eggName, points);
        }

        collectManifestoFragment(fragmentId) {
            if (!fragmentId || this.manifestoFragments.has(fragmentId)) {
                return;
            }
            this.manifestoFragments.add(fragmentId);
            this.updateQuestProgress('manifestoCollector', this.manifestoFragments.size);
            this.rebelActions += 1;
            this.updateQuestProgress('rebelActions', this.rebelActions);
            this.checkRebelAchievements();
            this.saveState();
        }

        trackDeckReference(deckType, sourceId) {
            const bucket = this.deckReferences[deckType];
            if (!bucket || !sourceId) {
                return;
            }
            bucket.add(sourceId);
            const total = this.deckReferences.vc.size + this.deckReferences.tech.size;
            this.updateQuestProgress('deckExplorer', total);
            this.saveState();
        }

        trackCompassStat(statId) {
            if (!statId) {
                return;
            }
            this.compassStats.add(statId);
            this.updateQuestProgress('industryInsider', this.compassStats.size);
            this.saveState();
        }

        trackThinkDifferent(actionType) {
            if (!actionType) {
                return;
            }
            this.rebelActions += 1;
            this.updateQuestProgress('rebelActions', this.rebelActions);
            this.checkRebelAchievements();
            this.saveState();
        }

        incrementParticles(count = 1) {
            if (!isFiniteNumber(count)) {
                return;
            }
            this.particleCount = Math.max(0, this.particleCount + count);
            this.setStorage(STORAGE_KEYS.PARTICLES, this.particleCount);
        }

        /* ---------- Combo & Power-ups ---------- */

        incrementCombo(amount = 1) {
            if (!isFiniteNumber(amount)) {
                return;
            }
            this.combo = Math.max(0, this.combo + amount);
            this.comboMultiplier = Math.max(1, 1 + Math.floor(this.combo / 5));
            this.updateComboDisplay();
            this.updateQuestProgress('reachCombo', this.comboMultiplier);

            if (this.comboMultiplier >= 5 && !this.achievements.find((a) => a.id === 'combo-starter')) {
                this.unlockAchievement('combo-starter', 'Combo Starter', 'Reached 5x combo', 200);
            }
            if (this.comboMultiplier >= 10 && !this.achievements.find((a) => a.id === 'combo-master')) {
                this.unlockAchievement('combo-master', 'Combo Master', 'Reached 10x combo', 500);
            }
            if (this.comboMultiplier >= 20 && !this.achievements.find((a) => a.id === 'combo-legend')) {
                this.unlockAchievement('combo-legend', 'Combo Legend', 'Reached 20x combo', 1000);
            }

            this.scheduleComboDecay();
        }

        resetCombo() {
            this.combo = 0;
            this.comboMultiplier = 1;
            this.updateComboDisplay();
            if (this.comboTimeout) {
                clearTimeout(this.comboTimeout);
                this.comboTimeout = null;
            }
        }

        scheduleComboDecay() {
            if (this.comboTimeout) {
                clearTimeout(this.comboTimeout);
            }
            this.comboTimeout = setTimeout(() => {
                this.resetCombo();
            }, this.comboDecayMs);
        }

        activatePowerup(type) {
            const powerup = this.powerups[type];
            if (!powerup) {
                return;
            }
            const now = Date.now();
            if (powerup.active || now < powerup.cooldownEnds) {
                this.showToast('Power-up cooling down', null);
                return;
            }

            powerup.active = true;
            powerup.cooldownEnds = now + powerup.cooldown;
            this.startPowerupTimer(type, powerup.duration);
            this.showToast(`Power-up activated`, formatLabel(type));
        }

        startPowerupTimer(type, duration) {
            setTimeout(() => {
                const powerup = this.powerups[type];
                if (powerup) {
                    powerup.active = false;
                }
            }, duration);
        }

        startPowerupCooldowns() {
            if (this.powerupCooldownInterval) {
                clearInterval(this.powerupCooldownInterval);
            }
            this.powerupCooldownPaused = false;
            
            const checkCooldowns = () => {
                // Check if any powerup needs cooldown tracking
                const now = Date.now();
                let hasActiveCooldowns = false;
                
                Object.keys(this.powerups).forEach((type) => {
                    const powerup = this.powerups[type];
                    if (powerup.cooldownEnds && powerup.cooldownEnds > now) {
                        // Cooldown is still active
                        hasActiveCooldowns = true;
                    } else if (powerup.cooldownEnds && powerup.cooldownEnds <= now && powerup.cooldownEnds > 0) {
                        // Cooldown just ended
                        if (powerup.notifyReady !== true) {
                            powerup.notifyReady = true;
                            this.showToast(`${formatLabel(type)} ready`, 'Power-up cooled down');
                        }
                        powerup.cooldownEnds = 0;
                    } else if (powerup.cooldownEnds === 0 || !powerup.cooldownEnds) {
                        // No cooldown active
                        powerup.cooldownEnds = 0;
                    }
                });

                // Pause interval if no active cooldowns
                if (!hasActiveCooldowns && !this.powerupCooldownPaused) {
                    this.powerupCooldownPaused = true;
                    // Interval continues but we're tracking that it's paused
                }
                
                // Resume if cooldowns are active
                if (hasActiveCooldowns && this.powerupCooldownPaused) {
                    this.powerupCooldownPaused = false;
                }
            };
            
            // Start with normal frequency
            this.powerupCooldownInterval = setInterval(checkCooldowns, 1000);
        }

        /* ---------- UI Helpers ---------- */

        updateAllDisplays() {
            this.updatePointsDisplay();
            this.updateLevelDisplay();
            this.updateComboDisplay();
        }

        updatePointsDisplay() {
            const scoreEl = document.getElementById('discoveryScore');
            if (scoreEl) {
                scoreEl.textContent = formatNumber(this.points);
            }
        }

        updateLevelDisplay() {
            const levelEl = document.getElementById('levelNumber');
            const levelFill = document.getElementById('levelFill');
            const xpPercent = this.xpToNext ? Math.min(100, Math.round((this.xp / this.xpToNext) * 100)) : 0;

            if (levelEl) {
                levelEl.textContent = this.level;
            }
            if (levelFill) {
                levelFill.value = xpPercent;
            }
            const percentEl = document.getElementById('xpPercent');
            if (percentEl) {
                percentEl.textContent = `${xpPercent}%`;
            }
        }

        updateComboDisplay() {
            const comboEl = document.getElementById('comboNumber');
            const multiplierEl = document.getElementById('comboMultiplier');
            if (comboEl) {
                comboEl.textContent = this.combo;
            }
            if (multiplierEl) {
                multiplierEl.textContent = `×${this.comboMultiplier.toFixed(1)}`;
            }
        }

        showScorePopup(amount) {
            const popup = document.getElementById('scorePopup');
            const scoreNumber = document.getElementById('scoreNumber');
            if (!popup || !scoreNumber) {
                return;
            }

            popup.style.opacity = '1';
            popup.style.transform = 'translateY(0)';
            scoreNumber.textContent = amount > 0 ? `+${amount}` : `${amount}`;

            setTimeout(() => {
                popup.style.opacity = '0';
                popup.style.transform = 'translateY(20px)';
            }, SCORE_POPUP_TIMEOUT);
        }

        showToast(message, description) {
            if (!message) {
                return;
            }

            const toast = document.getElementById('achievementNotification');
            if (!toast) {
                console.info(`[Gamification] ${message}`, description || '');
                return;
            }

            this.queueNotification({
                title: message,
                description: description || ''
            });
        }

        displayAchievementNotification(title, description) {
            this.showToast(title, description);
        }

        triggerMilestoneCelebration(kind, title, subtitle) {
            const banner = document.getElementById('achievementNotification');
            if (!banner) {
                return;
            }
            this.queueNotification({
                title: title || formatLabel(kind),
                description: subtitle || ''
            });
        }

        queueNotification(payload) {
            this.notificationQueue.push(payload);
            if (!this.notificationActive) {
                this.flushNotificationQueue();
            }
        }

        flushNotificationQueue() {
            if (this.notificationQueue.length === 0) {
                this.notificationActive = false;
                return;
            }

            this.notificationActive = true;
            const toast = document.getElementById('achievementNotification');
            const titleEl = toast?.querySelector('#achievementTitle');
            const descEl = toast?.querySelector('#achievementDesc');

            const payload = this.notificationQueue.shift();

            if (toast && titleEl && descEl) {
                titleEl.textContent = payload.title || '';
                descEl.textContent = payload.description || '';
                toast.style.display = 'block';
                requestAnimationFrame(() => {
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateX(0)';
                });

                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        toast.style.display = 'none';
                        this.flushNotificationQueue();
                    }, 300);
                }, TOAST_TIMEOUT);
            } else {
                console.info('[Gamification]', payload.title, payload.description);
                setTimeout(() => this.flushNotificationQueue(), 10);
            }
        }

        /* ---------- Konami Code ---------- */

        initKonamiCode() {
            if (this.konamiEnabled) {
                return;
            }
            this.konamiEnabled = true;
            
            // Store listener reference for cleanup
            this.konamiListener = (event) => {
                this.konamiSequence.push(event.code);
                if (this.konamiSequence.length > this.konamiCode.length) {
                    this.konamiSequence.shift();
                }
                if (arraysEqual(this.konamiSequence, this.konamiCode)) {
                    this.foundEasterEgg('konami-code', 'Konami Code Master', 500);
                    this.konamiSequence = [];
                    this.triggerKonamiEffect();
                }
            };
            
            document.addEventListener('keydown', this.konamiListener);
        }

        triggerKonamiEffect() {
            this.addPoints(1000, 'Konami Code Activated', '+1000 bonus points!');
            if (window.DHAnimations && typeof window.DHAnimations.glitch === 'function') {
                window.DHAnimations.glitch(document.body, { duration: 1 });
            }
        }

        /* ---------- Cleanup ---------- */

        _cleanupIntervals() {
            if (this.powerupCooldownInterval) {
                clearInterval(this.powerupCooldownInterval);
                this.powerupCooldownInterval = null;
            }
            if (this.comboTimeout) {
                clearTimeout(this.comboTimeout);
                this.comboTimeout = null;
            }
            if (this._saveStateTimeout) {
                clearTimeout(this._saveStateTimeout);
                this._saveStateTimeout = null;
            }
        }

        _cleanupEventListeners() {
            if (this.konamiListener) {
                document.removeEventListener('keydown', this.konamiListener);
                this.konamiListener = null;
            }
        }

        initCleanupHandlers() {
            // Save state immediately on page unload (critical save)
            const beforeUnloadHandler = () => {
                this._criticalSave = true;
                this.saveState(true);
                this.dispose();
            };
            
            window.addEventListener('beforeunload', beforeUnloadHandler);
            this._beforeUnloadHandler = beforeUnloadHandler;
        }

        dispose() {
            // Perform critical save before cleanup
            this._criticalSave = true;
            this.saveState(true);
            
            // Clean up all resources
            this._cleanupIntervals();
            this._cleanupEventListeners();
            
            // Remove beforeunload handler if we added it
            if (this._beforeUnloadHandler) {
                window.removeEventListener('beforeunload', this._beforeUnloadHandler);
                this._beforeUnloadHandler = null;
            }
        }
    }

    /* ---------- Utility Helpers ---------- */

    function supportsLocalStorage() {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }
            const testKey = '__dh_test__';
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function formatNumber(value) {
        if (typeof window.formatNumber === 'function') {
            return window.formatNumber(value);
        }
        return new Intl.NumberFormat().format(value);
    }

    function formatLabel(id) {
        return id
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase());
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        return a.every((val, idx) => val === b[idx]);
    }

    function cloneQuestState(source) {
        const clone = {};
        Object.keys(source).forEach((key) => {
            clone[key] = { ...source[key] };
        });
        return clone;
    }

    function mergeQuests(saved, defaults) {
        const merged = cloneQuestState(defaults);
        if (!saved) {
            return merged;
        }
        Object.keys(saved).forEach((key) => {
            if (!merged[key]) {
                merged[key] = { completed: false, progress: 0, target: 1 };
            }
            merged[key] = {
                ...merged[key],
                ...saved[key]
            };
        });
        return merged;
    }

    function clonePowerups(source) {
        const clone = {};
        Object.keys(source).forEach((key) => {
            clone[key] = { ...source[key] };
        });
        return clone;
    }

    /* ---------- Bootstrap ---------- */

    const game = new UnifiedGamificationManager();
    window.UnifiedGamificationManager = UnifiedGamificationManager;
    window.game = game;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dispatchEvent(new Event('gamificationReady'));
        });
    } else {
        setTimeout(() => window.dispatchEvent(new Event('gamificationReady')), 0);
    }
})();
