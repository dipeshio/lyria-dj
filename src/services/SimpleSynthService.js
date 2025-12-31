/**
 * SimpleSynthService.js - Web Audio API based fallback synthesizer
 * Pure browser-based audio generation without external dependencies
 */

class SimpleSynthService extends EventTarget {
    constructor() {
        super();
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = [];
        this.playbackState = 'stopped';
        this.loopInterval = null;
        this.tempo = 90;
    }

    async init() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.3;
    }

    setPlaybackState(state) {
        this.playbackState = state;
        this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
    }

    async setWeightedPrompts(prompts) {
        console.log('SimpleSynth: Setting prompts (generating ambient)', prompts);
    }

    // Set tempo and restart loop if playing
    setTempo(newTempo) {
        this.tempo = newTempo;
        if (this.playbackState === 'playing') {
            this.stopLoop();
            this.startLoop();
        }
    }

    // Generate a lofi-style chord progression
    playChord(notes, duration) {
        const now = this.audioContext.currentTime;

        notes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = this.noteToFreq(note);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration);

            this.oscillators.push({ osc, gain });
        });
    }

    noteToFreq(note) {
        // A4 = 440Hz = MIDI 69
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    // Lofi chord progression: Cmaj7 -> Am7 -> Fmaj7 -> G7
    lofiProgression = [
        [60, 64, 67, 71],  // Cmaj7
        [57, 60, 64, 67],  // Am7
        [53, 57, 60, 64],  // Fmaj7
        [55, 59, 62, 65],  // G7
    ];

    startLoop() {
        let chordIndex = 0;
        const beatDuration = 60 / this.tempo;
        const chordDuration = beatDuration * 4; // 4 beats per chord

        const playNext = () => {
            if (this.playbackState !== 'playing') return;

            this.playChord(this.lofiProgression[chordIndex], chordDuration * 0.9);
            chordIndex = (chordIndex + 1) % this.lofiProgression.length;
        };

        playNext();
        this.loopInterval = setInterval(playNext, chordDuration * 1000);
    }

    stopLoop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }

        // Stop all oscillators
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
