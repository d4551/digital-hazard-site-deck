// Audio Engine - Chiptune music and sound effects using Web Audio API
// Uses config.js for constants

(function() {
    'use strict';
    
    class AudioEngine {
        constructor() {
            this.audioContext = null;
            this.musicPlaying = false;
            this.muted = false;
            this.musicVolume = 0.5;
            this.sfxVolume = 0.7;
            this.sequencerInterval = null;
            this.musicNodes = [];
            this.currentPattern = 0;
            this.currentTempo = 140;
            this.beatIndex = 0;
            this.patternVariations = [];
            this.gameDifficulty = 1.0;
            
            // Load preferences
            this.loadPreferences();
        }
        
        async init() {
            try {
                // Check if audio is enabled
                if (!window.CONFIG?.GAME?.AUDIO_ENABLED) {
                    return false;
                }
                
                // Check for reduced motion preference
                if (window.CONFIG?.FEATURES?.REDUCED_MOTION) {
                    return false;
                }
                
                // Create audio context (requires user interaction on some browsers)
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) {
                    console.warn('AudioEngine: Web Audio API not supported');
                    return false;
                }
                
                // Initialize on first user interaction
                if (!this.audioContext) {
                    // Wait for user interaction
                    return new Promise((resolve) => {
                        const initOnInteraction = () => {
                            try {
                                this.audioContext = new AudioContextClass();
                                
                                // Resume context if suspended (required by some browsers)
                                if (this.audioContext.state === 'suspended') {
                                    this.audioContext.resume();
                                }
                                
                                // Update preferences from config
                                this.musicVolume = window.CONFIG?.GAME?.MUSIC_VOLUME || 0.5;
                                this.sfxVolume = window.CONFIG?.GAME?.SFX_VOLUME || 0.7;
                                
                                resolve(true);
                            } catch (error) {
                                console.warn('AudioEngine: Error initializing', error);
                                resolve(false);
                            }
                        };
                        
                        // Try to initialize on various user interactions
                        const events = ['click', 'keydown', 'touchstart'];
                        const initOnce = () => {
                            initOnInteraction();
                            events.forEach(e => document.removeEventListener(e, initOnce));
                        };
                        events.forEach(e => document.addEventListener(e, initOnce, { once: true }));
                        
                        // Also try immediately (might work if already interacted)
                        setTimeout(() => {
                            if (!this.audioContext) {
                                try {
                                    this.audioContext = new AudioContextClass();
                                    if (this.audioContext.state === 'suspended') {
                                        this.audioContext.resume();
                                    }
                                    events.forEach(e => document.removeEventListener(e, initOnce));
                                    resolve(true);
                                } catch (e) {
                                    // Will wait for user interaction
                                }
                            }
                        }, 100);
                    });
                }
                
                return true;
            } catch (error) {
                console.warn('AudioEngine: Initialization error', error);
                return false;
            }
        }
        
        startMusic(track = 'gameplay', difficulty = 1.0) {
            // Ensure audio context exists and is running
            if (!this.audioContext) {
                console.warn('AudioEngine: No audio context, cannot start music');
                return;
            }
            
            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('AudioEngine: Context resumed, starting music');
                    this._startMusicInternal(track, difficulty);
                }).catch(e => {
                    console.warn('AudioEngine: Could not resume context', e);
                });
                return;
            }
            
            this._startMusicInternal(track, difficulty);
        }
        
        _startMusicInternal(track = 'gameplay', difficulty = 1.0) {
            if (this.muted || this.musicPlaying) {
                if (this.musicPlaying) {
                    console.log('AudioEngine: Music already playing');
                }
                return;
            }
            
            this.stopMusic();
            this.musicPlaying = true;
            this.gameDifficulty = difficulty;
            
            // Update tempo based on difficulty if scaling is enabled
            if (window.CONFIG?.GAME?.TEMPO_SCALING_ENABLED) {
                const baseTempo = window.CONFIG?.GAME?.CHIPTUNE_TEMPO || 140;
                this.currentTempo = Math.min(180, baseTempo + (difficulty - 1.0) * 20);
            } else {
                this.currentTempo = window.CONFIG?.GAME?.CHIPTUNE_TEMPO || 140;
            }
            
            console.log(`AudioEngine: Starting ${track} music at tempo ${this.currentTempo} BPM`);
            
            if (track === 'gameplay') {
                this.playGameplayMusic();
            } else if (track === 'menu') {
                this.playMenuMusic();
            }
        }
        
        updateDifficulty(difficulty, score = 0) {
            this.gameDifficulty = difficulty;
            if (window.CONFIG?.GAME?.TEMPO_SCALING_ENABLED && this.musicPlaying) {
                const baseTempo = window.CONFIG?.GAME?.CHIPTUNE_TEMPO || 140;
                // EXTREME aggressive scaling for urgent, dramatic feel
                const scoreBoost = Math.min(80, Math.floor(score / 250)); // +1 BPM per 250 points, max +80 (MUCH more aggressive)
                const difficultyBoost = (difficulty - 1.0) * 50; // Increased dramatically from 35 to 50
                const intensityBoost = Math.min(30, Math.floor(score / 1000)); // Extra boost for high scores
                const newTempo = Math.min(280, baseTempo + difficultyBoost + scoreBoost + intensityBoost); // Max tempo 280 BPM - EXTREME
                
                // Update tempo if change is significant (lower threshold for smoother transitions)
                if (Math.abs(newTempo - this.currentTempo) > 1) {
                    this.currentTempo = newTempo;
                    console.log(`AudioEngine: Tempo escalated to ${newTempo} BPM - EXTREME INTENSITY!`);
                }
            }
        }
        
        // Add event sync method for game events
        syncWithGameEvent(eventType, payload = {}) {
            if (!this.audioContext || this.muted || !this.musicPlaying) return;
            
            // Helper to play drum sound
            const playDrumSync = (type, gainNode) => {
                const oscillator = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const now = this.audioContext.currentTime;
                
                if (type === 'kick') {
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(80, now);
                    oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.12);
                    gain.gain.setValueAtTime(gainNode.gain.value * 0.9, now);
                    gain.gain.linearRampToValueAtTime(gainNode.gain.value * 0.5, now + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                    oscillator.start(now);
                    oscillator.stop(now + 0.12);
                } else if (type === 'snare') {
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(250, now);
                    oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.06);
                    gain.gain.setValueAtTime(gainNode.gain.value * 0.7, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                    oscillator.start(now);
                    oscillator.stop(now + 0.06);
                } else if (type === 'hihat') {
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.linearRampToValueAtTime(1200, now + 0.02);
                    gain.gain.setValueAtTime(gainNode.gain.value * 0.4, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
                    oscillator.start(now);
                    oscillator.stop(now + 0.03);
                }
                
                gain.connect(gainNode);
                this.musicNodes.push({ oscillator, gain });
            };
            
            // Sync percussion hits with game events for more immersive feel
            if (eventType === 'enemyKilled' && this.currentTempo > 160) {
                // Quick drum hit on enemy kill at high tempo
                const gain = this.audioContext.createGain();
                gain.gain.value = this.musicVolume * 0.2;
                gain.connect(this.audioContext.destination);
                playDrumSync('snare', gain);
            } else if (eventType === 'killstreak') {
                const gain = this.audioContext.createGain();
                gain.gain.value = this.musicVolume * 0.28;
                gain.connect(this.audioContext.destination);
                playDrumSync('kick', gain);
                playDrumSync('snare', gain);
                const streak = payload.streak || 0;
                this.currentTempo = Math.min(300, this.currentTempo + Math.min(12, streak));
            } else if (eventType === 'frenzy-start') {
                const tier = payload.tier || 1;
                const gain = this.audioContext.createGain();
                gain.gain.value = this.musicVolume * 0.35;
                gain.connect(this.audioContext.destination);
                playDrumSync('kick', gain);
                playDrumSync('snare', gain);
                this.currentTempo = Math.min(300, this.currentTempo + tier * 18);
                this.gameDifficulty += 0.3 * tier;
            } else if (eventType === 'frenzy-extend') {
                const tier = payload.tier || 1;
                const gain = this.audioContext.createGain();
                gain.gain.value = this.musicVolume * 0.18;
                gain.connect(this.audioContext.destination);
                playDrumSync('hihat', gain);
                this.currentTempo = Math.min(300, this.currentTempo + 6 * tier);
            } else if (eventType === 'frenzy-end') {
                this.currentTempo = Math.max(window.CONFIG?.GAME?.CHIPTUNE_TEMPO || 140, this.currentTempo - 20);
            } else if (eventType === 'levelup') {
                // Melodic accent on level up
                const oscillator = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                oscillator.type = 'square';
                oscillator.frequency.value = 880; // A5
                oscillator.frequency.linearRampToValueAtTime(1318.51, this.audioContext.currentTime + 0.15); // E6
                gain.gain.value = this.musicVolume * 0.3;
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.connect(gain);
                gain.connect(this.audioContext.destination);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
                this.musicNodes.push({ oscillator, gain });
            }
        }
        
        stopMusic() {
            this.musicPlaying = false;
            if (this.sequencerInterval) {
                clearInterval(this.sequencerInterval);
                this.sequencerInterval = null;
            }
            this.musicNodes.forEach(node => {
                try {
                    if (node.oscillator) node.oscillator.stop();
                    if (node.gain) node.gain.disconnect();
                } catch (e) {
                    // Already stopped
                }
            });
            this.musicNodes = [];
        }
        
        playGameplayMusic() {
            if (!this.audioContext) {
                console.error('AudioEngine: Cannot play music - no audio context');
                return;
            }
            
            if (this.audioContext.state !== 'running') {
                console.warn(`AudioEngine: Context state is ${this.audioContext.state}, attempting to resume...`);
                this.audioContext.resume().then(() => {
                    console.log('AudioEngine: Context resumed, retrying playGameplayMusic');
                    this.playGameplayMusic();
                }).catch(e => {
                    console.error('AudioEngine: Failed to resume context', e);
                });
                return;
            }
            
            console.log('AudioEngine: Starting gameplay music with 5 channels');
            
            const channels = window.CONFIG?.GAME?.CHIPTUNE_CHANNELS || 5;
            const tempo = this.currentTempo;
            const beatDuration = 60000 / tempo; // ms per beat
            const stepDuration = beatDuration / 4; // 16th note duration
            
            console.log(`AudioEngine: Tempo=${tempo} BPM, Beat duration=${beatDuration}ms, Step duration=${stepDuration}ms`);
            
            // Create gain nodes for each channel - MORE DRAMATIC BALANCE
            const leadGain = this.audioContext.createGain();
            leadGain.gain.value = this.musicVolume * 0.28; // Increased from 0.22 - more prominent
            leadGain.connect(this.audioContext.destination);
            
            const bassGain = this.audioContext.createGain();
            bassGain.gain.value = this.musicVolume * 0.35; // Increased from 0.32 - more punch
            bassGain.connect(this.audioContext.destination);
            
            const harmonyGain = this.audioContext.createGain();
            harmonyGain.gain.value = this.musicVolume * 0.20; // Increased from 0.18
            harmonyGain.connect(this.audioContext.destination);
            
            const percussionGain = this.audioContext.createGain();
            percussionGain.gain.value = this.musicVolume * 0.25; // Increased from 0.18 - DRAMATIC drums
            percussionGain.connect(this.audioContext.destination);
            
            // Arpeggio channel (5th channel) - MORE PRESENT
            const arpGain = this.audioContext.createGain();
            arpGain.gain.value = this.musicVolume * 0.15; // Increased from 0.1 - more texture
            arpGain.connect(this.audioContext.destination);
            
            // Pattern variations (multiple melody patterns)
            const pattern1 = {
                lead: [
                    { freq: 523.25, start: 0, duration: 2 }, // C5
                    { freq: 587.33, start: 2, duration: 2 }, // D5
                    { freq: 659.25, start: 4, duration: 2 }, // E5
                    { freq: 523.25, start: 6, duration: 2 }, // C5
                    { freq: 659.25, start: 8, duration: 4 }, // E5
                    { freq: 587.33, start: 12, duration: 2 }, // D5
                    { freq: 523.25, start: 14, duration: 2 }  // C5
                ],
                bass: [
                    { freq: 130.81, start: 0, duration: 4 }, // C3
                    { freq: 146.83, start: 4, duration: 4 }, // D3
                    { freq: 164.81, start: 8, duration: 4 }, // E3
                    { freq: 130.81, start: 12, duration: 4 }  // C3
                ],
                harmony: [
                    { freq: 329.63, start: 0, duration: 8 }, // E4
                    { freq: 392.00, start: 8, duration: 8 }  // G4
                ],
                arp: [
                    { freqs: [261.63, 329.63, 392.00], start: 0, duration: 4 }, // C-E-G arpeggio
                    { freqs: [293.66, 349.23, 440.00], start: 4, duration: 4 }, // D-F#-A arpeggio
                    { freqs: [261.63, 329.63, 392.00], start: 8, duration: 4 }, // C-E-G
                    { freqs: [246.94, 311.13, 369.99], start: 12, duration: 4 }  // B-D#-F#
                ],
                drums: [
                    { type: 'kick', start: 0 }, { type: 'snare', start: 4 },
                    { type: 'kick', start: 8 }, { type: 'snare', start: 12 },
                    { type: 'kick', start: 16 }
                ]
            };
            
            const pattern2 = {
                lead: [
                    { freq: 659.25, start: 0, duration: 1 }, // E5 (faster)
                    { freq: 698.46, start: 1, duration: 1 }, // F5
                    { freq: 783.99, start: 2, duration: 2 }, // G5
                    { freq: 880.00, start: 4, duration: 1 }, // A5 (higher!)
                    { freq: 659.25, start: 5, duration: 1 }, // E5
                    { freq: 783.99, start: 6, duration: 1 }, // G5
                    { freq: 587.33, start: 7, duration: 1 }, // D5
                    { freq: 659.25, start: 8, duration: 2 }, // E5
                    { freq: 523.25, start: 10, duration: 2 }  // C5
                ],
                bass: [
                    { freq: 164.81, start: 0, duration: 4 }, // E3
                    { freq: 174.61, start: 4, duration: 4 }, // F3
                    { freq: 196.00, start: 8, duration: 4 }, // G3
                    { freq: 164.81, start: 12, duration: 4 }  // E3
                ],
                harmony: [
                    { freq: 392.00, start: 0, duration: 8 }, // G4
                    { freq: 440.00, start: 8, duration: 8 }  // A4
                ],
                arp: [
                    { freqs: [329.63, 392.00, 493.88], start: 0, duration: 2 }, // E-G-B arpeggio
                    { freqs: [349.23, 415.30, 523.25], start: 2, duration: 2 }, // F-A-C arpeggio
                    { freqs: [392.00, 466.16, 587.33], start: 4, duration: 2 }, // G-B-D arpeggio
                    { freqs: [329.63, 392.00, 493.88], start: 6, duration: 2 }, // E-G-B
                    { freqs: [261.63, 329.63, 392.00], start: 8, duration: 4 }  // C-E-G
                ],
                drums: [
                    { type: 'kick', start: 0 }, { type: 'snare', start: 2 },
                    { type: 'kick', start: 4 }, { type: 'snare', start: 6 },
                    { type: 'kick', start: 8 }, { type: 'snare', start: 10 },
                    { type: 'kick', start: 12 }, { type: 'snare', start: 14 },
                    { type: 'hihat', start: 1 }, { type: 'hihat', start: 3 },
                    { type: 'hihat', start: 5 }, { type: 'hihat', start: 7 }
                ]
            };
            
            // Add more manic pattern variations with fast arpeggios
            const pattern3 = {
                lead: [
                    { freq: 783.99, start: 0, duration: 1 }, // G5
                    { freq: 880.00, start: 1, duration: 1 }, // A5
                    { freq: 987.77, start: 2, duration: 1 }, // B5 (very high!)
                    { freq: 1108.73, start: 3, duration: 1 }, // C6 (even higher!)
                    { freq: 783.99, start: 4, duration: 1 }, // G5
                    { freq: 659.25, start: 5, duration: 1 }, // E5
                    { freq: 783.99, start: 6, duration: 2 }, // G5
                    { freq: 880.00, start: 8, duration: 1 }, // A5
                    { freq: 987.77, start: 9, duration: 1 }, // B5
                    { freq: 783.99, start: 10, duration: 2 }  // G5
                ],
                bass: [
                    { freq: 196.00, start: 0, duration: 2 }, // G3
                    { freq: 220.00, start: 2, duration: 2 }, // A3
                    { freq: 246.94, start: 4, duration: 2 }, // B3
                    { freq: 196.00, start: 6, duration: 2 }, // G3
                    { freq: 220.00, start: 8, duration: 2 }  // A3
                ],
                harmony: [
                    { freq: 392.00, start: 0, duration: 4 }, // G4
                    { freq: 440.00, start: 4, duration: 4 },  // A4
                    { freq: 493.88, start: 8, duration: 4 }   // B4
                ],
                arp: [
                    { freqs: [392.00, 493.88, 587.33], start: 0, duration: 1 }, // Fast G-B-D arpeggio
                    { freqs: [440.00, 554.37, 659.25], start: 1, duration: 1 }, // Fast A-C#-E
                    { freqs: [493.88, 622.25, 739.99], start: 2, duration: 1 }, // Fast B-D#-F#
                    { freqs: [392.00, 493.88, 587.33], start: 3, duration: 1 }, // G-B-D
                    { freqs: [329.63, 415.30, 493.88], start: 4, duration: 1 }, // E-G#-B
                    { freqs: [392.00, 493.88, 587.33], start: 5, duration: 1 }, // G-B-D
                    { freqs: [440.00, 554.37, 659.25], start: 6, duration: 2 }, // A-C#-E
                    { freqs: [392.00, 493.88, 587.33], start: 8, duration: 2 }   // G-B-D
                ],
                drums: [
                    { type: 'kick', start: 0 }, { type: 'snare', start: 1 },
                    { type: 'kick', start: 2 }, { type: 'snare', start: 3 },
                    { type: 'kick', start: 4 }, { type: 'snare', start: 5 },
                    { type: 'kick', start: 6 }, { type: 'snare', start: 7 },
                    { type: 'kick', start: 8 }, { type: 'snare', start: 9 },
                    { type: 'hihat', start: 0 }, { type: 'hihat', start: 2 },
                    { type: 'hihat', start: 4 }, { type: 'hihat', start: 6 },
                    { type: 'hihat', start: 8 }
                ]
            };
            
            // Add EXTREME 4th and 5th patterns for URGENT, DRAMATIC feel
            const pattern4 = {
                lead: [
                    { freq: 1174.66, start: 0, duration: 1 }, // D6 - HIGHER!
                    { freq: 1318.51, start: 1, duration: 1 }, // E6 - VERY HIGH!
                    { freq: 1479.98, start: 2, duration: 1 }, // F#6 - EXTREME!
                    { freq: 1661.22, start: 3, duration: 1 }, // G#6 - OVER THE TOP!
                    { freq: 1174.66, start: 4, duration: 1 }, // D6
                    { freq: 987.77, start: 5, duration: 1 }, // B5
                    { freq: 1318.51, start: 6, duration: 1 }, // E6
                    { freq: 1479.98, start: 7, duration: 1 }, // F#6
                    { freq: 1661.22, start: 8, duration: 1 }, // G#6 - DRAMATIC CLIMAX
                    { freq: 1318.51, start: 9, duration: 1 }, // E6
                    { freq: 1174.66, start: 10, duration: 1 }, // D6
                    { freq: 987.77, start: 11, duration: 2 }, // B5
                ],
                bass: [
                    { freq: 246.94, start: 0, duration: 1 }, // B3
                    { freq: 261.63, start: 1, duration: 1 }, // C4
                    { freq: 293.66, start: 2, duration: 1 }, // D4
                    { freq: 246.94, start: 3, duration: 1 }, // B3
                    { freq: 196.00, start: 4, duration: 1 }, // G3
                    { freq: 246.94, start: 5, duration: 1 }, // B3
                    { freq: 261.63, start: 6, duration: 1 }, // C4
                    { freq: 329.63, start: 7, duration: 1 }  // E4
                ],
                harmony: [
                    { freq: 493.88, start: 0, duration: 4 }, // B4
                    { freq: 523.25, start: 4, duration: 4 }  // C5
                ],
                arp: [
                    { freqs: [493.88, 622.25, 739.99, 880.00], start: 0, duration: 1 }, // B-D#-F#-A
                    { freqs: [523.25, 659.25, 783.99, 932.33], start: 1, duration: 1 }, // C-E-G-A#
                    { freqs: [587.33, 739.99, 880.00, 1046.50], start: 2, duration: 1 }, // D-F#-A-C
                    { freqs: [493.88, 622.25, 739.99, 880.00], start: 3, duration: 1 }, // B-D#-F#-A
                    { freqs: [392.00, 493.88, 587.33, 698.46], start: 4, duration: 1 }, // G-B-D-F
                    { freqs: [493.88, 622.25, 739.99, 880.00], start: 5, duration: 1 }, // B-D#-F#-A
                    { freqs: [523.25, 659.25, 783.99, 932.33], start: 6, duration: 1 }, // C-E-G-A#
                    { freqs: [659.25, 830.61, 987.77, 1174.66], start: 7, duration: 1 } // E-G#-B-D
                ],
                drums: [
                    { type: 'kick', start: 0 }, { type: 'snare', start: 1 },
                    { type: 'kick', start: 2 }, { type: 'snare', start: 3 },
                    { type: 'kick', start: 4 }, { type: 'snare', start: 5 },
                    { type: 'kick', start: 6 }, { type: 'snare', start: 7 },
                    { type: 'hihat', start: 0 }, { type: 'hihat', start: 1 },
                    { type: 'hihat', start: 2 }, { type: 'hihat', start: 3 },
                    { type: 'hihat', start: 4 }, { type: 'hihat', start: 5 },
                    { type: 'hihat', start: 6 }, { type: 'hihat', start: 7 }
                ]
            };
            
            // Add 5th EXTREME pattern for maximum intensity
            const pattern5 = {
                lead: [
                    { freq: 1479.98, start: 0, duration: 1 }, // F#6
                    { freq: 1661.22, start: 1, duration: 1 }, // G#6
                    { freq: 1760.00, start: 2, duration: 1 }, // A6 - EXTREME!
                    { freq: 1975.53, start: 3, duration: 1 }, // B6 - OVER THE TOP!
                    { freq: 1479.98, start: 4, duration: 1 }, // F#6
                    { freq: 1318.51, start: 5, duration: 1 }, // E6
                    { freq: 1661.22, start: 6, duration: 1 }, // G#6
                    { freq: 1760.00, start: 7, duration: 1 }, // A6
                    { freq: 1479.98, start: 8, duration: 1 }, // F#6
                    { freq: 1318.51, start: 9, duration: 1 }, // E6
                    { freq: 1174.66, start: 10, duration: 1 }, // D6
                    { freq: 987.77, start: 11, duration: 1 }, // B5
                    { freq: 1318.51, start: 12, duration: 1 }, // E6
                    { freq: 1479.98, start: 13, duration: 1 }, // F#6
                    { freq: 1661.22, start: 14, duration: 1 }, // G#6
                    { freq: 1975.53, start: 15, duration: 1 }  // B6 - DRAMATIC FINALE
                ],
                bass: [
                    { freq: 246.94, start: 0, duration: 2 }, // B3
                    { freq: 261.63, start: 2, duration: 2 }, // C4
                    { freq: 293.66, start: 4, duration: 2 }, // D4
                    { freq: 329.63, start: 6, duration: 2 }, // E4
                    { freq: 246.94, start: 8, duration: 2 }, // B3
                    { freq: 293.66, start: 10, duration: 2 }, // D4
                    { freq: 329.63, start: 12, duration: 2 }, // E4
                    { freq: 369.99, start: 14, duration: 2 }  // F#4
                ],
                harmony: [
                    { freq: 493.88, start: 0, duration: 4 }, // B4
                    { freq: 523.25, start: 4, duration: 4 }, // C5
                    { freq: 587.33, start: 8, duration: 4 }, // D5
                    { freq: 659.25, start: 12, duration: 4 }  // E5
                ],
                arp: [
                    { freqs: [493.88, 622.25, 739.99, 880.00, 987.77], start: 0, duration: 1 }, // 5-note arp!
                    { freqs: [523.25, 659.25, 783.99, 932.33, 1046.50], start: 1, duration: 1 },
                    { freqs: [587.33, 739.99, 880.00, 1046.50, 1174.66], start: 2, duration: 1 },
                    { freqs: [659.25, 830.61, 987.77, 1174.66, 1318.51], start: 3, duration: 1 },
                    { freqs: [493.88, 622.25, 739.99, 880.00, 987.77], start: 4, duration: 1 },
                    { freqs: [523.25, 659.25, 783.99, 932.33, 1046.50], start: 5, duration: 1 },
                    { freqs: [587.33, 739.99, 880.00, 1046.50, 1174.66], start: 6, duration: 1 },
                    { freqs: [659.25, 830.61, 987.77, 1174.66, 1318.51], start: 7, duration: 1 }
                ],
                drums: [
                    { type: 'kick', start: 0 }, { type: 'snare', start: 1 },
                    { type: 'kick', start: 2 }, { type: 'snare', start: 3 },
                    { type: 'kick', start: 4 }, { type: 'snare', start: 5 },
                    { type: 'kick', start: 6 }, { type: 'snare', start: 7 },
                    { type: 'kick', start: 8 }, { type: 'snare', start: 9 },
                    { type: 'kick', start: 10 }, { type: 'snare', start: 11 },
                    { type: 'kick', start: 12 }, { type: 'snare', start: 13 },
                    { type: 'kick', start: 14 }, { type: 'snare', start: 15 },
                    { type: 'hihat', start: 0 }, { type: 'hihat', start: 1 },
                    { type: 'hihat', start: 2 }, { type: 'hihat', start: 3 },
                    { type: 'hihat', start: 4 }, { type: 'hihat', start: 5 },
                    { type: 'hihat', start: 6 }, { type: 'hihat', start: 7 },
                    { type: 'hihat', start: 8 }, { type: 'hihat', start: 9 },
                    { type: 'hihat', start: 10 }, { type: 'hihat', start: 11 },
                    { type: 'hihat', start: 12 }, { type: 'hihat', start: 13 },
                    { type: 'hihat', start: 14 }, { type: 'hihat', start: 15 }
                ]
            };
            
            this.patternVariations = [pattern1, pattern2, pattern3, pattern4, pattern5];
            
            let stepIndex = 0;
            
            // ADSR envelope helper
            const createEnvelope = (gainNode, attack = 0.01, decay = 0.05, sustain = 0.7, release = 0.1) => {
                const now = this.audioContext.currentTime;
                const peakLevel = gainNode.gain.value;
                const sustainLevel = peakLevel * sustain;
                
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(peakLevel, now + attack);
                gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
                return { sustainLevel, release, peakLevel };
            };
            
            const scheduleNote = (freq, duration, gainNode, waveType = 'square', envelope = true) => {
                const oscillator = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const now = this.audioContext.currentTime;
                
                oscillator.type = waveType;
                oscillator.frequency.value = freq;
                
                if (envelope) {
                    const attack = 0.005;
                    const decay = 0.02;
                    const sustain = 0.6;
                    const release = 0.05;
                    const peakLevel = gainNode.gain.value * 0.8;
                    const sustainLevel = peakLevel * sustain;
                    const durationSeconds = duration * stepDuration / 1000;
                    
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(peakLevel, now + attack);
                    gain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
                    gain.gain.setValueAtTime(sustainLevel, now + durationSeconds - release);
                    gain.gain.linearRampToValueAtTime(0, now + durationSeconds);
                } else {
                    gain.gain.setValueAtTime(gainNode.gain.value, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + duration * stepDuration / 1000);
                }
                
                oscillator.connect(gain);
                gain.connect(gainNode);
                
                oscillator.start(now);
                oscillator.stop(now + duration * stepDuration / 1000);
                
                this.musicNodes.push({ oscillator, gain });
            };
            
            const playDrum = (type, gainNode) => {
                const oscillator = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const now = this.audioContext.currentTime;
                
                if (type === 'kick') {
                    // DRAMATIC kick with EXTREME punch
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(100, now); // Higher initial - more punch
                    oscillator.frequency.exponentialRampToValueAtTime(25, now + 0.15); // Deeper drop
                    gain.gain.setValueAtTime(gainNode.gain.value * 1.1, now); // LOUDER
                    gain.gain.linearRampToValueAtTime(gainNode.gain.value * 0.6, now + 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                    oscillator.start(now);
                    oscillator.stop(now + 0.15);
                } else if (type === 'snare') {
                    // DRAMATIC snare with more CRACK
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(300, now); // Higher initial
                    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.08); // More range
                    gain.gain.setValueAtTime(gainNode.gain.value * 0.9, now); // LOUDER
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                    oscillator.start(now);
                    oscillator.stop(now + 0.08);
                } else if (type === 'hihat') {
                    // DRAMATIC hi-hat with more CRISP
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(1200, now); // Higher initial - more crisp
                    oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.04);
                    gain.gain.setValueAtTime(gainNode.gain.value * 0.6, now); // LOUDER
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
                    oscillator.start(now);
                    oscillator.stop(now + 0.04);
                }
                
                gain.connect(gainNode);
                this.musicNodes.push({ oscillator, gain });
            };
            
            const playArpeggio = (freqs, duration, gainNode) => {
                // Play arpeggio notes in URGENT, DRAMATIC quick succession
                const noteDuration = duration * stepDuration / freqs.length / 1000;
                // Make arpeggios FASTER at high tempo for more intensity
                const speedMultiplier = this.currentTempo > 220 ? 0.7 : (this.currentTempo > 180 ? 0.85 : 1.0);
                const actualNoteDuration = noteDuration * speedMultiplier;
                
                freqs.forEach((freq, index) => {
                    const now = this.audioContext.currentTime + (index * actualNoteDuration);
                    const oscillator = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.value = freq;
                    
                    // LOUDER arpeggios at high tempo
                    const peakMultiplier = this.currentTempo > 220 ? 0.8 : 0.6;
                    const peakLevel = gainNode.gain.value * peakMultiplier;
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(peakLevel, now + actualNoteDuration * 0.15); // Faster attack
                    gain.gain.setValueAtTime(peakLevel, now + actualNoteDuration * 0.75);
                    gain.gain.linearRampToValueAtTime(0, now + actualNoteDuration);
                    
                    oscillator.connect(gain);
                    gain.connect(gainNode);
                    
                    oscillator.start(now);
                    oscillator.stop(now + actualNoteDuration);
                    
                    this.musicNodes.push({ oscillator, gain });
                });
            };
            
            const playLoop = () => {
                if (!this.musicPlaying) return;
                
                const patternLength = 16; // 16 steps per pattern
                const currentPattern = this.patternVariations[this.currentPattern % this.patternVariations.length];
                const step = stepIndex % patternLength;
                
                // EXTREME pattern switching for urgent, dramatic feel
                let switchInterval = 16;
                if (this.currentTempo > 240) {
                    switchInterval = 2; // INSANE switching at extreme tempo - pattern 4 and 5
                    if (this.currentPattern < 3) {
                        this.currentPattern = 3 + Math.floor(Math.random() * 2); // Force pattern 4 or 5
                    }
                } else if (this.currentTempo > 200) {
                    switchInterval = 4; // Very fast switching
                } else if (this.currentTempo > 180) {
                    switchInterval = 6; // Fast switching
                } else if (this.currentTempo > 160) {
                    switchInterval = 8; // Moderate switching
                }
                
                if (stepIndex > 0 && stepIndex % switchInterval === 0 && window.CONFIG?.GAME?.PATTERN_VARIATIONS) {
                    // URGENT pattern selection - prefer intense patterns at higher tempos
                    if (this.currentTempo > 240) {
                        // At extreme tempo, only use pattern 4 and 5
                        this.currentPattern = 3 + Math.floor(Math.random() * 2);
                    } else if (this.currentTempo > 200) {
                        // At very high tempo, prefer pattern 3, 4, or 5
                        this.currentPattern = 2 + Math.floor(Math.random() * 3);
                    } else if (this.currentTempo > 180) {
                        // At high tempo, prefer pattern 3 and 4
                        this.currentPattern = 2 + Math.floor(Math.random() * 2);
                    } else {
                        // Normal tempo - cycle through all patterns
                        this.currentPattern = (this.currentPattern + 1) % this.patternVariations.length;
                    }
                }
                
                // Play lead notes with EXTREME vibrato and intensity at high tempo
                currentPattern.lead.forEach(note => {
                    if (note.start === step) {
                        scheduleNote(note.freq, note.duration, leadGain, 'square', true);
                        // Add DRAMATIC note doubles/triples for extreme intensity
                        if (this.currentTempo > 220 && note.duration >= 2) {
                            // Triple strike for maximum drama
                            setTimeout(() => {
                                if (this.musicPlaying) {
                                    scheduleNote(note.freq * 1.03, 1, leadGain, 'square', true);
                                }
                            }, note.duration * stepDuration / 3);
                            setTimeout(() => {
                                if (this.musicPlaying) {
                                    scheduleNote(note.freq * 1.05, 1, leadGain, 'square', true);
                                }
                            }, note.duration * stepDuration * 2 / 3);
                        } else if (this.currentTempo > 180 && note.duration >= 2) {
                            // Double strike for high tempo
                            setTimeout(() => {
                                if (this.musicPlaying) {
                                    scheduleNote(note.freq * 1.02, 1, leadGain, 'square', true);
                                }
                            }, note.duration * stepDuration / 2);
                        }
                    }
                });
                
                // Play bass notes
                currentPattern.bass.forEach(note => {
                    if (note.start === step) {
                        scheduleNote(note.freq, note.duration, bassGain, 'triangle', true);
                    }
                });
                
                // Play harmony notes
                if (channels >= 3 && currentPattern.harmony) {
                    currentPattern.harmony.forEach(note => {
                        if (note.start === step) {
                            scheduleNote(note.freq, note.duration, harmonyGain, 'sawtooth', true);
                        }
                    });
                }
                
                // Play arpeggio notes (5th channel)
                if (channels >= 5 && currentPattern.arp) {
                    currentPattern.arp.forEach(arp => {
                        if (arp.start === step) {
                            playArpeggio(arp.freqs, arp.duration, arpGain);
                        }
                    });
                }
                
                // Play drums
                if (channels >= 4 && currentPattern.drums) {
                    currentPattern.drums.forEach(drum => {
                        if (drum.start === step) {
                            playDrum(drum.type, percussionGain);
                        }
                    });
                }
                
                stepIndex++;
                
                // Loop
                setTimeout(playLoop, stepDuration);
            };
            
            // Start the loop
            console.log('AudioEngine: Starting music loop, pattern count:', this.patternVariations.length);
            playLoop();
        }
        
        playMenuMusic() {
            if (!this.audioContext) return;
            
            // Calmer menu music
            const melodyGain = this.audioContext.createGain();
            melodyGain.gain.value = this.musicVolume * 0.2;
            melodyGain.connect(this.audioContext.destination);
            
            const melodyNotes = [
                { freq: 440, duration: 2 }, // A4
                { freq: 493.88, duration: 2 }, // B4
                { freq: 523.25, duration: 4 }  // C5
            ];
            
            let index = 0;
            const playLoop = () => {
                if (!this.musicPlaying) return;
                
                const note = melodyNotes[index % melodyNotes.length];
                const oscillator = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                oscillator.type = 'triangle';
                oscillator.frequency.value = note.freq;
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(melodyGain.gain.value, this.audioContext.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + note.duration * 0.01);
                
                oscillator.connect(gain);
                gain.connect(melodyGain);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + note.duration * 0.01);
                
                index++;
                setTimeout(playLoop, note.duration * 50);
            };
            
            playLoop();
        }
        
        playSound(type) {
            if (!this.audioContext || this.muted) return;
            
            const duration = 0.1;
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            gain.gain.value = this.sfxVolume;
            gain.connect(this.audioContext.destination);
            
            switch(type) {
                case 'shoot':
                    // Short square wave burst
                    oscillator.type = 'square';
                    oscillator.frequency.value = 800;
                    gain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                    break;
                    
                case 'collect':
                    // Pleasant ascending chime
                    oscillator.type = 'triangle';
                    oscillator.frequency.value = 523.25; // C5
                    gain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                    
                case 'enemyKilled':
                    // Short descending tone
                    oscillator.type = 'square';
                    oscillator.frequency.value = 400;
                    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + duration);
                    gain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                    
                case 'explosion':
                    // Noise burst with frequency sweep
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.value = 200;
                    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
                    gain.gain.setValueAtTime(this.sfxVolume * 0.8, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    break;
                    
                case 'powerup':
                case 'powerup-health':
                case 'powerup-speed':
                    // Ascending harmonic series
                    oscillator.type = 'triangle';
                    oscillator.frequency.value = 261.63; // C4
                    oscillator.frequency.linearRampToValueAtTime(523.25, this.audioContext.currentTime + duration);
                    gain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                    
                case 'powerup-rapidfire':
                    // Fast ascending burst
                    oscillator.type = 'square';
                    oscillator.frequency.value = 440;
                    oscillator.frequency.linearRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
                    gain.gain.setValueAtTime(this.sfxVolume * 0.8, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                    break;
                    
                case 'powerup-spreadshot':
                    // Multi-tone burst (simulated with frequency sweep)
                    oscillator.type = 'square';
                    oscillator.frequency.value = 523.25; // C5
                    oscillator.frequency.linearRampToValueAtTime(659.25, this.audioContext.currentTime + 0.08);
                    gain.gain.setValueAtTime(this.sfxVolume * 0.7, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.12);
                    break;
                    
                case 'powerup-explosive':
                    // Deep power sound
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.value = 130.81; // C3
                    oscillator.frequency.linearRampToValueAtTime(196.00, this.audioContext.currentTime + 0.15);
                    gain.gain.setValueAtTime(this.sfxVolume * 0.9, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    break;
                    
                case 'powerup-frenzy':
                    // Aggressive arpeggio burst
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.value = 392.00; // G4
                    oscillator.frequency.linearRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
                    gain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.18);
                    break;
                    
                case 'powerup-shield':
                    // Shimmering sound
                    oscillator.type = 'triangle';
                    oscillator.frequency.value = 659.25; // E5
                    oscillator.frequency.linearRampToValueAtTime(783.99, this.audioContext.currentTime + 0.1);
                    gain.gain.setValueAtTime(this.sfxVolume * 0.6, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                    break;
                    
                case 'powerup-multiplier':
                    // Rising fanfare
                    oscillator.type = 'square';
                    oscillator.frequency.value = 523.25; // C5
                    oscillator.frequency.linearRampToValueAtTime(659.25, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.linearRampToValueAtTime(783.99, this.audioContext.currentTime + 0.2);
                    gain.gain.setValueAtTime(this.sfxVolume * 0.8, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);
                    break;
                    
                case 'powerup-expire':
                    // Warning descending tone
                    oscillator.type = 'square';
                    oscillator.frequency.value = 440;
                    oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.2);
                    gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    break;
                    
                case 'levelup':
                    // Melodic fanfare
                    oscillator.type = 'square';
                    oscillator.frequency.value = 523.25; // C5
                    oscillator.frequency.linearRampToValueAtTime(659.25, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.linearRampToValueAtTime(783.99, this.audioContext.currentTime + 0.2);
                    gain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    break;
                    
                case 'hit':
                    // Harsh beep
                    oscillator.type = 'square';
                    oscillator.frequency.value = 200;
                    gain.gain.setValueAtTime(this.sfxVolume * 0.6, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                    break;
                    
                default:
                    // Generic beep
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 440;
                    gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            }
            
            oscillator.connect(gain);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + (duration * 2));
        }
        
        setMusicVolume(volume) {
            this.musicVolume = Math.max(0, Math.min(1, volume));
            this.savePreferences();
        }
        
        setSFXVolume(volume) {
            this.sfxVolume = Math.max(0, Math.min(1, volume));
            this.savePreferences();
        }
        
        toggleMute() {
            this.muted = !this.muted;
            if (this.muted) {
                this.stopMusic();
            } else if (this.musicPlaying) {
                this.startMusic('gameplay');
            }
            this.savePreferences();
        }
        
        loadPreferences() {
            if (!window.CONFIG?.FEATURES?.LOCAL_STORAGE_SUPPORT) return;
            
            try {
                const prefs = localStorage.getItem('dhAudioPrefs');
                if (prefs) {
                    const parsed = JSON.parse(prefs);
                    this.muted = parsed.muted || false;
                    this.musicVolume = parsed.musicVolume ?? (window.CONFIG?.GAME?.MUSIC_VOLUME || 0.5);
                    this.sfxVolume = parsed.sfxVolume ?? (window.CONFIG?.GAME?.SFX_VOLUME || 0.7);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
        
        savePreferences() {
            if (!window.CONFIG?.FEATURES?.LOCAL_STORAGE_SUPPORT) return;
            
            try {
                const prefs = {
                    muted: this.muted,
                    musicVolume: this.musicVolume,
                    sfxVolume: this.sfxVolume
                };
                localStorage.setItem('dhAudioPrefs', JSON.stringify(prefs));
            } catch (e) {
                // Ignore storage errors
            }
        }
    }
    
    // Make AudioEngine available globally
    window.AudioEngine = AudioEngine;
})();
