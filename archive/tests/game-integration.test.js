import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const REQUIRED_SCRIPTS = [
    'js/config.js',
    'js/utils.js',
    'js/gamification.js',
    'js/particle-system.js',
    'js/game-engine.js',
    'js/game-renderer.js',
    'js/audio-engine.js',
    'js/game.js',
    'js/game-loader.js'
];

function loadScript(dom, relativePath) {
    const absolute = path.join(ROOT_DIR, relativePath);
    const code = fs.readFileSync(absolute, 'utf8');
    dom.window.eval(code);
}

function createMockContext(window) {
    const noop = () => {};
    const gradientFactory = () => ({
        addColorStop: noop
    });
    
    return {
        canvas: { width: 800, height: 600 },
        scale: noop,
        clearRect: noop,
        fillRect: noop,
        strokeRect: noop,
        beginPath: noop,
        arc: noop,
        fill: noop,
        stroke: noop,
        save: noop,
        restore: noop,
        translate: noop,
        rotate: noop,
        moveTo: noop,
        lineTo: noop,
        closePath: noop,
        fillText: noop,
        strokeText: noop,
        measureText: () => ({ width: 10 }),
        createLinearGradient: gradientFactory,
        createRadialGradient: gradientFactory,
        setTransform: noop,
        drawImage: noop,
        globalAlpha: 1,
        font: '',
        textAlign: 'left',
        lineWidth: 1,
        strokeStyle: '#fff',
        fillStyle: '#fff',
        shadowBlur: 0,
        shadowColor: '#000',
        filter: 'none'
    };
}

describe('Game integration', () => {
    let dom;
    let canvas;

    beforeEach(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="gameLoadingOverlay"><p>Loading</p></div>
                    <div id="gameErrorOverlay"></div>
                    <div id="gameLoadingSpinner" class="opacity-0"></div>
                    <div id="gameClickHint"></div>
                    <progress id="gameInitProgress" max="100" value="0"></progress>
                    <dialog id="gameModal"></dialog>
                    <div id="gameHud" data-active="false" aria-hidden="true">
                        <div id="gameHudScore"></div>
                        <div id="gameHudLevel"></div>
                        <div id="gameHudDifficulty"></div>
                        <div id="gameHudLives"></div>
                        <div id="gameHudComboCard" data-active="false">
                            <span id="gameHudCombo"></span>
                            <span id="gameHudComboStreak"></span>
                        </div>
                        <div id="gameHudPowerups"></div>
                        <div id="gameHudStatus"><span id="gameHudStatusMessage"></span></div>
                    </div>
                    <div id="gamificationHUD"></div>
                    <div id="gameLoadingOverlayText"></div>
                    <canvas id="demo-canvas" width="800" height="450"></canvas>
                </body>
            </html>
        `, {
            runScripts: 'dangerously',
            pretendToBeVisual: true,
            url: 'https://digital-hazard.test'
        });

        const { window } = dom;
        global.window = window;
        global.document = window.document;
        global.localStorage = window.localStorage;
        if (!global.ResizeObserver) {
            global.ResizeObserver = class {
                observe() {}
                unobserve() {}
                disconnect() {}
            };
        }
        window.ResizeObserver = global.ResizeObserver;
        window.matchMedia = window.matchMedia || (() => ({
            matches: false,
            addListener() {},
            removeListener() {}
        }));
        window.requestAnimationFrame = () => 0;
        window.cancelAnimationFrame = () => {};
        window.devicePixelRatio = 1;
        window.Storage = {
            get(key, fallback) {
                try {
                    const raw = window.localStorage.getItem(key);
                    return raw ? JSON.parse(raw) : fallback;
                } catch (error) {
                    return fallback;
                }
            },
            set(key, value) {
                try {
                    window.localStorage.setItem(key, JSON.stringify(value));
                } catch (error) {
                    // Ignore storage errors in tests
                }
            }
        };
        window.DHUI = {
            createLoading: vi.fn(),
            createAlert: vi.fn()
        };

        const mockContext = createMockContext(window);
        window.HTMLCanvasElement.prototype.getContext = function() {
            return mockContext;
        };
        canvas = window.document.getElementById('demo-canvas');
        Object.defineProperty(canvas, 'offsetWidth', { value: 800, configurable: true });
        Object.defineProperty(canvas, 'offsetHeight', { value: 450, configurable: true });

        REQUIRED_SCRIPTS.forEach(script => loadScript(dom, script));

        window.audioEngine = {
            playSound: vi.fn(),
            syncWithGameEvent: vi.fn(),
            updateDifficulty: vi.fn(),
            startMusic: vi.fn()
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        dom?.window?.close();
        global.window = undefined;
        global.document = undefined;
        global.localStorage = undefined;
    });

    it('initializes the survival game with gamification hooks', async () => {
        await window.DHGameLoader.initGame('demo-canvas');

        expect(window.game).toBeDefined();
        expect(window.game.addPoints).toBeTypeOf('function');
        expect(window.survivalGame).toBeDefined();
        expect(window.survivalGame.engine).toBeDefined();
        expect(window.survivalGame.particles).toBeDefined();
        expect(window.survivalGame.renderer).toBeDefined();

        const initialPoints = window.game.points;
        window.game.addPoints(15, 'Test points');
        expect(window.game.points).toBeGreaterThan(initialPoints);
    });

    it('propagates frenzy events to gamification and audio systems', async () => {
        await window.DHGameLoader.initGame('demo-canvas');
        window.survivalGame.startGame();
        window.survivalGame.mouse = { x: 400, y: 250, down: false };

        const addPointsSpy = vi.spyOn(window.game, 'addPoints');
        const showScoreSpy = vi.spyOn(window.game, 'showScorePopup').mockImplementation(() => {});
        const unlockSpy = vi.spyOn(window.game, 'unlockAchievement').mockImplementation(() => {});
        const syncSpy = vi.spyOn(window.audioEngine, 'syncWithGameEvent');

        window.survivalGame.engine.startFrenzy(2, 'test');
        window.survivalGame.update(16);

        expect(window.survivalGame.engine.frenzy.active).toBe(true);
        expect(addPointsSpy).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Frenzy Tier'));
        expect(showScoreSpy).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Frenzy Tier'));
        expect(unlockSpy).toHaveBeenCalled();
        expect(syncSpy).toHaveBeenCalledWith('frenzy-start', expect.objectContaining({ tier: 2 }));
    });

    it('handles killstreak milestones across integrations', async () => {
        await window.DHGameLoader.initGame('demo-canvas');
        window.survivalGame.startGame();
        window.survivalGame.mouse = { x: 420, y: 260, down: false };

        const addPointsSpy = vi.spyOn(window.game, 'addPoints');
        const syncSpy = vi.spyOn(window.audioEngine, 'syncWithGameEvent');

        window.survivalGame.engine.eventQueue.push({
            type: 'killstreakMilestone',
            killStreak: 10,
            x: 320,
            y: 240
        });

        window.survivalGame.update(16);

        expect(addPointsSpy).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Kill streak'));
        expect(syncSpy).toHaveBeenCalledWith('killstreak', expect.objectContaining({ streak: 10 }));
    });
});
