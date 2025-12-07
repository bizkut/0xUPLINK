/**
 * Audio Manager - Web Audio API sound effects
 * Uses procedurally generated synth sounds for game events
 */

// Sound definitions: frequency, waveform type, duration
const SOUNDS = {
    // Success/Positive
    hack_success: { freq: 880, type: 'sine', duration: 0.15, gain: 0.3 },
    download: { freq: 660, type: 'sine', duration: 0.2, gain: 0.25 },
    credits: { freq: 1047, type: 'sine', duration: 0.1, gain: 0.2 },
    connect: { freq: 523, type: 'sine', duration: 0.12, gain: 0.2 },

    // Failure/Negative  
    hack_fail: { freq: 220, type: 'sawtooth', duration: 0.3, gain: 0.25 },
    disconnect: { freq: 330, type: 'square', duration: 0.2, gain: 0.2 },
    trace_warning: { freq: 440, type: 'square', duration: 0.4, gain: 0.3 },
    damage: { freq: 180, type: 'sawtooth', duration: 0.25, gain: 0.3 },

    // Alerts
    alert: { freq: 523, type: 'triangle', duration: 0.25, gain: 0.25 },
    notification: { freq: 784, type: 'sine', duration: 0.1, gain: 0.15 },
    ghost_spawn: { freq: 392, type: 'sine', duration: 0.5, gain: 0.2, sweep: true },

    // UI Feedback
    keypress: { freq: 2000, type: 'sine', duration: 0.02, gain: 0.05 },
    command: { freq: 1200, type: 'sine', duration: 0.05, gain: 0.1 },
    error: { freq: 150, type: 'sawtooth', duration: 0.15, gain: 0.2 },
    click: { freq: 1800, type: 'sine', duration: 0.03, gain: 0.08 },
    hover: { freq: 2200, type: 'sine', duration: 0.02, gain: 0.04 }
};

export class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.volume = this.loadVolume();
        this.muted = this.loadMuted();
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
            this.initialized = true;
            console.log('[Audio] Initialized');
        } catch (e) {
            console.warn('[Audio] Web Audio API not supported:', e);
        }
    }

    /**
     * Play a sound by name
     */
    play(soundName) {
        if (!this.initialized || !this.context) return;
        if (this.muted) return;

        const sound = SOUNDS[soundName];
        if (!sound) {
            console.warn(`[Audio] Unknown sound: ${soundName}`);
            return;
        }

        try {
            // Resume context if suspended (browser autoplay policy)
            if (this.context.state === 'suspended') {
                this.context.resume();
            }

            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.type = sound.type;
            oscillator.frequency.setValueAtTime(sound.freq, this.context.currentTime);

            // Optional frequency sweep for special sounds
            if (sound.sweep) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    sound.freq * 2,
                    this.context.currentTime + sound.duration
                );
            }

            // Envelope: quick attack, gradual release
            const now = this.context.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(sound.gain * this.volume, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now);
            oscillator.stop(now + sound.duration + 0.05);

            // Cleanup
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (e) {
            // Silently fail - audio is non-critical
        }
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain && !this.muted) {
            this.masterGain.gain.value = this.volume;
        }
        this.saveVolume();
    }

    /**
     * Get current volume
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Mute audio
     */
    mute() {
        this.muted = true;
        if (this.masterGain) {
            this.masterGain.gain.value = 0;
        }
        this.saveMuted();
    }

    /**
     * Unmute audio
     */
    unmute() {
        this.muted = false;
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
        this.saveMuted();
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        if (this.muted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.muted;
    }

    /**
     * Check if muted
     */
    isMuted() {
        return this.muted;
    }

    // Persistence
    loadVolume() {
        const saved = localStorage.getItem('uplink_audio_volume');
        return saved !== null ? parseFloat(saved) : 0.5;
    }

    saveVolume() {
        localStorage.setItem('uplink_audio_volume', this.volume.toString());
    }

    loadMuted() {
        return localStorage.getItem('uplink_audio_muted') === 'true';
    }

    saveMuted() {
        localStorage.setItem('uplink_audio_muted', this.muted.toString());
    }
}

// Singleton instance
export const audio = new AudioManager();
