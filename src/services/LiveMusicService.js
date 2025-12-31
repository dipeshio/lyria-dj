/**
 * LiveMusicService.js - React-compatible port of LiveMusicHelper
 * Handles WebSocket connection to Lyria RealTime API via @google/genai
 */
import { GoogleGenAI } from '@google/genai';
import fallbackService from './SimpleSynthService';

// Use the correct model path per Google documentation
const MODEL = 'models/lyria-realtime-exp';

class LiveMusicService extends EventTarget {
    constructor() {
        super();
        this.ai = null;
        this.session = null;
        this.sessionPromise = null;
        this.playbackState = 'stopped';
        this.audioContext = null;
        this.outputNode = null;
        this.nextStartTime = 0;
        this.bufferTime = 1.5;
        this.prompts = [];
        this.filteredPrompts = new Set();
        this.connectionError = true;
        this.useFallback = false;
        this.activeEngine = 'none'; // 'lyria', 'fallback', or 'none'
    }

    /**
     * Initialize the service with API key
     */
    init(apiKey) {
        if (!apiKey) {
            console.warn('No API key provided - music service will not connect');
            return;
        }

        // Use v1alpha API version per Google documentation
        this.ai = new GoogleGenAI({
            apiKey,
            apiVersion: 'v1alpha'
        });

        // Initialize Gemini model for text generation (prompt enhancement)
        // With @google/genai SDK, we access models via this.ai.models
        this.textModelName = 'gemini-3-flash-preview';
    }

    /**
     * Enhance a basic prompt with more descriptive detail
     */
    /**
     * Enhance a basic prompt with more descriptive detail
     */
    async enhancePrompt(basePrompt) {
        if (!this.ai) return basePrompt;

        try {
            console.log('✨ [AI] Enhancing prompt:', basePrompt);
            const result = await this.ai.models.generateContent({
                model: this.textModelName,
                contents: [{
                    role: 'user',
                    parts: [{
                        text: `Rewrite the following music description to be more detailed, creative, and suitable for an AI music generator. 
                        Keep it under 20 words. Focus on mood, instruments, and texture.
                        Input: "${basePrompt}"`
                    }]
                }]
            });

            // Handle various response formats safely
            let enhanced = basePrompt;
            if (typeof result.text === 'function') {
                enhanced = result.text();
            } else if (result.response && typeof result.response.text === 'function') {
                enhanced = result.response.text();
            } else if (result.text) {
                enhanced = result.text;
            }

            const cleanEnhanced = enhanced.trim().replace(/^"|"$/g, '');
            console.log('✅ [AI] Enhanced prompt:', cleanEnhanced);
            return cleanEnhanced;
        } catch (error) {
            console.error('❌ [AI] Failed to enhance prompt:', error);
            return basePrompt;
        }
    }

    /**
     * Generate a completely new creative prompt
     */
    async generateCreativePrompt() {
        if (!this.ai) return "Lofi hip hop beats to study to";

        try {
            console.log('🎲 [AI] Generating creative prompt...');
            const genres = ['Lofi', 'Jazz', 'Ambient', 'Synthwave', 'Classical', 'Techno', 'Cinematic'];
            const randomGenre = genres[Math.floor(Math.random() * genres.length)];

            const result = await this.ai.models.generateContent({
                model: this.textModelName,
                contents: [{
                    role: 'user',
                    parts: [{
                        text: `Generate a creative, short music description (under 15 words) for the genre: ${randomGenre}. 
                        Focus on unique textures and atmosphere. Do not include quotes.`
                    }]
                }]
            });
            // Handle various response formats safely
            let creative = "Atmospheric lofi";
            if (typeof result.text === 'function') {
                creative = result.text();
            } else if (result.response && typeof result.response.text === 'function') {
                creative = result.response.text();
            } else if (result.text) {
                creative = result.text;
            }

            const cleanCreative = creative.trim().replace(/^"|"$/g, '');
            console.log('✅ [AI] Generated prompt:', cleanCreative);
            return cleanCreative;
        } catch (error) {
            console.error('❌ [AI] Failed to generate prompt:', error);
            return "Atmospheric lofi beats with soft rain texture";
        }
    }

    /**
     * Ensure AudioContext is initialized (must be called after user gesture)
     */
    async ensureAudioContext() {
        if (this.audioContext) return;

        // Use 44100Hz sample rate per Google documentation
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
        this.outputNode = this.audioContext.createGain();
    }

    /**
     * Get or create a session
     */
    async getSession() {
        if (!this.sessionPromise) {
            this.sessionPromise = this.connect();
        }
        return this.sessionPromise;
    }

    /**
     * Connect to the Lyria RealTime API
     */
    async connect() {
        if (!this.ai) {
            throw new Error('Service not initialized. Call init() with API key first.');
        }

        console.log('🎵 [Lyria] Attempting to connect...');

        try {
            this.sessionPromise = this.ai.live.music.connect({
                model: MODEL,
                callbacks: {
                    onmessage: async (message) => {
                        if (message.setupComplete) {
                            console.log('✅ [Lyria] Connection established and setup complete!');
                            this.connectionError = false;
                            this.activeEngine = 'lyria';
                            this.dispatchEvent(new CustomEvent('engine-changed', { detail: 'lyria' }));
                        }

                        if (message.filteredPrompt) {
                            console.log('⚠️ [Lyria] Prompt filtered:', message.filteredPrompt.text);
                            this.filteredPrompts.add(message.filteredPrompt.text);
                            this.dispatchEvent(new CustomEvent('filtered-prompt', {
                                detail: message.filteredPrompt
                            }));
                        }

                        if (message.serverContent?.audioChunks) {
                            console.log('🔊 [Lyria] Received audio chunk:', message.serverContent.audioChunks.length, 'chunks');
                            await this.processAudioChunks(message.serverContent.audioChunks);
                        }
                    },
                    onerror: (error) => {
                        console.error('❌ [Lyria] WebSocket Error:', error);
                        this.handleConnectionFailure(`Connection error: ${error?.message || 'Unknown error'}`);
                    },
                    onclose: (event) => {
                        console.warn('🔌 [Lyria] WebSocket Closed:', event?.reason || 'No reason provided');
                        this.handleConnectionFailure('Connection closed by server. Switching to fallback engine.');
                    },
                },
            });

            return this.sessionPromise;
        } catch (error) {
            console.error('❌ [Lyria] Connection failed:', error);
            this.connectionError = true;
            throw error;
        }
    }

    /**
     * Force reset and reconnect to Lyria
     */
    async reconnect() {
        console.log('🔄 [Lyria] Reconnecting...');
        this.sessionPromise = null;
        this.connectionError = false;

        // Stop fallback if active
        if (this.fallbackService && this.activeEngine === 'fallback') {
            this.fallbackService.stop();
        }

        try {
            await this.connect();

            // Re-send current prompts if connection succeeds
            if (this.lastPrompts) {
                await this.setWeightedPrompts(this.lastPrompts);
            }

            // Config will be re-sent by UI components usually, but we could store it.
            // For now, let's assume basic reconnection is enough to start fresh

            return true;
        } catch (error) {
            console.error('❌ [Lyria] Reconnect failed:', error);
            return false;
        }
    }

    /**
     * Process incoming audio chunks
     */
    async processAudioChunks(audioChunks) {
        if (this.playbackState === 'paused' || this.playbackState === 'stopped') return;

        for (const chunk of audioChunks) {
            if (!chunk.data) continue;

            const audioBuffer = await this.decodeAudioData(chunk.data);
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);

            if (this.nextStartTime === 0) {
                this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
                setTimeout(() => {
                    if (this.playbackState === 'loading') {
                        this.setPlaybackState('playing');
                    }
                }, this.bufferTime * 1000);
            }

            // Reset if we've fallen behind
            if (this.nextStartTime < this.audioContext.currentTime - 0.1) {
                this.nextStartTime = this.audioContext.currentTime;
            }

            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
        }
    }

    /**
     * Decode base64 audio data to AudioBuffer
     */
    async decodeAudioData(base64Data) {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 16-bit PCM stereo at 44100Hz per Google documentation
        const samples = bytes.length / 4; // 2 bytes per sample, 2 channels
        const audioBuffer = this.audioContext.createBuffer(2, samples, 44100);

        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = audioBuffer.getChannelData(1);

        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < samples; i++) {
            leftChannel[i] = dataView.getInt16(i * 4, true) / 32768;
            rightChannel[i] = dataView.getInt16(i * 4 + 2, true) / 32768;
        }

        return audioBuffer;
    }

    /**
     * Set playback state and emit event
     */
    setPlaybackState(state) {
        this.playbackState = state;
        this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
    }

    /**
     * Handle connection failure by switching to fallback
     */
    handleConnectionFailure(message) {
        this.connectionError = true;
        this.useFallback = true;
        this.activeEngine = 'fallback';
        this.dispatchEvent(new CustomEvent('engine-changed', { detail: 'fallback' }));

        // Stop Lyria playback if it was active
        if (this.session) {
            try { this.session.stop(); } catch { }
            this.session = null;
            this.sessionPromise = null;
        }
        this.nextStartTime = 0;
        try {
            this.outputNode.disconnect();
        } catch { }
        if (this.audioContext) {
            this.outputNode = this.audioContext.createGain();
        }

        // Transfer state to fallback service
        fallbackService.setWeightedPrompts(this.prompts);

        this.dispatchEvent(new CustomEvent('error', {
            detail: message
        }));

        // If we were trying to play, switch to fallback play
        if (this.playbackState === 'loading' || this.playbackState === 'playing') {
            fallbackService.play();
            this.setPlaybackState('playing');
        } else {
            this.setPlaybackState('stopped');
        }
    }

    /**
     * Set weighted prompts for music generation
     */
    async setWeightedPrompts(prompts) {
        this.prompts = prompts;
        console.log('🎶 [Prompts] Setting weighted prompts:', prompts);

        if (this.useFallback) {
            console.log('🎹 [Fallback] Forwarding prompts to fallback service');
            return fallbackService.setWeightedPrompts(prompts);
        }

        const activePrompts = prompts.filter(p =>
            !this.filteredPrompts.has(p.text) && p.weight > 0
        );

        if (activePrompts.length === 0 && this.playbackState === 'playing') {
            this.dispatchEvent(new CustomEvent('error', {
                detail: 'At least one active prompt is required.'
            }));
            this.pause();
            return;
        }

        if (!this.session) {
            console.log('⏳ [Lyria] No session yet, prompts will be sent on play');
            return;
        }

        try {
            console.log('📤 [Lyria] Sending prompts to API:', activePrompts);
            await this.session.setWeightedPrompts({
                weightedPrompts: activePrompts.map(p => ({
                    text: p.text,
                    weight: p.weight,
                })),
            });
            console.log('✅ [Lyria] Prompts sent successfully');
        } catch (error) {
            console.error('❌ [Lyria] Failed to set prompts:', error);
            this.dispatchEvent(new CustomEvent('error', { detail: error.message }));
            this.pause();
        }
    }

    /**
     * Set tempo (BPM)
     */
    setTempo(bpm) {
        console.log('🎚️ [Tempo] Setting tempo to:', bpm, 'BPM');
        if (this.useFallback) {
            console.log('🎹 [Fallback] Updating fallback synth tempo');
            fallbackService.setTempo(bpm);
        }
        // Note: BPM requires stop/play or reset_context for Lyria
    }

    /**
     * Set music generation configuration (guidance, density, brightness, etc.)
     * These parameters update in real-time for Lyria API
     */
    async setMusicConfig(config) {
        console.log('🎛️ [Config] Setting music generation config:', config);

        if (this.useFallback || !this.session) {
            console.log('⏳ [Config] No active Lyria session, config will be applied on play');
            return;
        }

        try {
            await this.session.setMusicGenerationConfig({
                musicGenerationConfig: config
            });
            console.log('✅ [Lyria] Config updated successfully');
        } catch (error) {
            console.error('❌ [Lyria] Failed to set config:', error);
        }
    }

    /**
     * Start playback
     */
    async play() {
        console.log('▶️ [Play] Starting playback...');
        await this.ensureAudioContext();

        if (this.useFallback) {
            console.log('🎹 [Fallback] Using fallback synth');
            return fallbackService.play();
        }

        try {
            this.setPlaybackState('loading');
            console.log('🔗 [Lyria] Getting session...');
            this.session = await this.getSession();

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Set prompts before playing
            if (this.prompts && this.prompts.length > 0) {
                console.log('📤 [Lyria] Sending initial prompts:', this.prompts);
                await this.session.setWeightedPrompts({
                    weightedPrompts: this.prompts.map(p => ({
                        text: p.text,
                        weight: p.weight,
                    })),
                });
            }

            console.log('🎵 [Lyria] Calling session.play()...');
            await this.session.play();
            console.log('✅ [Lyria] Playback started!');

            this.outputNode.connect(this.audioContext.destination);
            this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
        } catch (error) {
            console.error('❌ [Lyria] Failed to start playback:', error);
            this.dispatchEvent(new CustomEvent('error', {
                detail: `Failed to start: ${error.message}`
            }));
            this.stop();
        }
    }

    /**
     * Pause playback
     */
    pause() {
        if (this.useFallback) {
            return fallbackService.pause();
        }

        if (this.session) this.session.pause();
        this.setPlaybackState('paused');
        this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
        this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        this.nextStartTime = 0;
        this.outputNode = this.audioContext.createGain();
    }

    /**
     * Stop playback completely
     */
    stop() {
        if (this.useFallback) {
            return fallbackService.stop();
        }

        if (this.session) this.session.stop();
        this.setPlaybackState('stopped');
        this.nextStartTime = 0;
        this.session = null;
        this.sessionPromise = null;

        try {
            this.outputNode.disconnect();
        } catch { }

        if (this.audioContext) {
            this.outputNode = this.audioContext.createGain();
        }
    }

    /**
     * Toggle play/pause
     */
    async playPause() {
        if (this.useFallback) {
            return fallbackService.playPause();
        }

        switch (this.playbackState) {
            case 'playing':
                return this.pause();
            case 'paused':
            case 'stopped':
                return this.play();
            case 'loading':
                return this.stop();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Singleton instance
const liveMusicService = new LiveMusicService();

export default liveMusicService;
export { LiveMusicService };
