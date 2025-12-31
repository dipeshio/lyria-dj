/**
 * SimpleSynthService.js - Web Audio API based fallback synthesizer
 * Pure browser-based audio generation without external dependencies
 */

class SimpleSynthService extends EventTarget {
    constructor() {
        super();
        this.audioContext = null;
        this.masterGain = null;
        this.filter = null;
        this.oscillators = [];
        this.playbackState = 'stopped';
        this.loopInterval = null;
        this.tempo = 90;
        this.brightness = 0.5;
        this.density = 0.5;

        // Track the noise node separately
        this.noiseNode = null;
    }

    async init() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Master Chain: Components -> Master Filter -> Master Gain -> Destination
        this.filter = this.audioContext.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.updateFilter();

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;

        this.filter.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        await this.initNoise();
    }

    updateFilter() {
        if (!this.filter) return;
        // Map 0-1 brightness to 200Hz - 8000Hz log scale
        const freq = 200 * Math.pow(40, this.brightness);
        this.filter.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.1);
    }

    setParameters(config) {
        if (config.brightness !== undefined) {
            this.brightness = config.brightness;
            this.updateFilter();
        }
        if (config.density !== undefined) {
            this.density = config.density;
        }
    }

    // Create a continuous lofi crackle/noise
    async initNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // White noise with occasional "pops"
            data[i] = (Math.random() * 2 - 1) * 0.05;
            if (Math.random() > 0.9999) {
                data[i] += (Math.random() * 2 - 1) * 0.5; // Random pop
            }
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = 0.02; // Very subtle

        source.connect(noiseGain);
        noiseGain.connect(this.filter); // Connect to filtered chain

        this.noiseNode = { source, gain: noiseGain };
    }

    setPlaybackState(state) {
        this.playbackState = state;
        this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
    }

    async setWeightedPrompts(prompts) {
        console.log('SimpleSynth: Syncing mood with prompts', prompts);
        // We could adjust instrument types or scale here based on text
    }

    setTempo(newTempo) {
        this.tempo = newTempo;
        if (this.playbackState === 'playing') {
            this.stopLoop();
            this.startLoop();
        }
    }

    playDrum(type, time) {
        if (type === 'kick') {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.5);
        } else if (type === 'snare') {
            const noise = this.audioContext.createBufferSource();
            const buffer = this.audioContext.createBuffer(1, 44100 * 0.1, 44100);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(time);
            noise.stop(time + 0.1);
        }
    }

    playChord(notes, duration, time) {
        notes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            // Lofi electric piano style: mix of sine and triangle
            osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
            osc.frequency.value = this.noteToFreq(note);
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1, time + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
            osc.connect(gain);
            gain.connect(this.filter);
            osc.start(time);
            osc.stop(time + duration);
            this.oscillators.push({ osc, gain });
        });
    }

    noteToFreq(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    // Jazzy progression: Dm9 -> G13 -> Cmaj9 -> A7alt
    lofiProgression = [
        [50, 53, 57, 60, 64], // Dm9
        [55, 59, 63, 65, 69], // G13
        [48, 52, 55, 59, 62], // Cmaj9
        [45, 49, 52, 55, 58], // A7alt
    ];

    startLoop() {
        if (!this.audioContext) return;

        let step = 0;
        const beatDuration = 60 / this.tempo;

        // Start noise
        if (this.noiseNode) {
            try { this.noiseNode.source.start(); } catch { }
        }

        const playNext = () => {
            if (this.playbackState !== 'playing') return;
            const now = this.audioContext.currentTime;

            // Chord every 4 beats (start of measure)
            if (step % 16 === 0) {
                const chord = this.lofiProgression[Math.floor(step / 16) % this.lofiProgression.length];
                this.playChord(chord, beatDuration * 4, now);
            }

            // Simple Beat (Boom-Bap)
            if (step % 8 === 0) this.playDrum('kick', now);
            if (step % 8 === 4) this.playDrum('snare', now);

            // Random Melody (Pentatonic)
            if (Math.random() < this.density * 0.3) {
                const pentatonic = [0, 2, 4, 7, 9];
                const note = 72 + pentatonic[Math.floor(Math.random() * pentatonic.length)];
                this.playChord([note], beatDuration * 0.5, now);
            }

            step = (step + 1) % 64;
        };

        const stepDuration = beatDuration / 4; // 16th notes
        playNext();
        this.loopInterval = setInterval(playNext, stepDuration * 1000);
    }

    stopLoop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        if (this.noiseNode) {
            try { this.noiseNode.source.stop(); } catch { }
            this.initNoise(); // Re-prep for next time
        }
        this.oscillators.forEach(({ osc }) => {
            try { osc.stop(); } catch { }
        });
        this.oscillators = [];
    }

    async play() {
        await this.init();
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.setPlaybackState('playing');
        this.startLoop();
    }

    pause() {
        this.stopLoop();
        this.setPlaybackState('paused');
    }

    stop() {
        this.stopLoop();
        this.setPlaybackState('stopped');
    }

    async playPause() {
        if (this.playbackState === 'playing') {
            this.pause();
        } else {
            await this.play();
        }
    }
}

const simpleSynthService = new SimpleSynthService();
export default simpleSynthService;
