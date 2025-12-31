/**
 * App.jsx - Main PromptDJ Retro Dashboard
 * Claude Academic Retro aesthetic
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Knob from './components/Knob';
import PresetSelector, { PRESETS } from './components/PresetSelector';
import PromptConsole from './components/PromptConsole';
import PlayButton from './components/PlayButton';
import liveMusicService from './services/LiveMusicService';

export default function App() {
    // Playback state
    const [playbackState, setPlaybackState] = useState('stopped');
    const [error, setError] = useState(null);
    const [activeEngine, setActiveEngine] = useState('none');
    const [reconnectStatus, setReconnectStatus] = useState(null);

    // Listening duration timer
    const [listeningTime, setListeningTime] = useState(0);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Preset and prompt state
    const [customPresets, setCustomPresets] = useState(() => {
        const saved = localStorage.getItem('lyria-custom-presets');
        return saved ? JSON.parse(saved) : [];
    });

    // Combine built-in + custom
    const presets = [...PRESETS, ...customPresets];

    const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
    const [customPrompt, setCustomPrompt] = useState('');

    // Persist custom presets when changed
    useEffect(() => {
        localStorage.setItem('lyria-custom-presets', JSON.stringify(customPresets));
    }, [customPresets]);

    // Handle saving new preset
    const handleSavePreset = useCallback((name, prompts) => {
        if (presets.length >= 20) {
            setError('Max limit reached. Delete a custom preset to save new.');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const newPreset = {
            id: `custom-${Date.now()}`,
            name,
            prompts,
            isCustom: true
        };

        setCustomPresets(prev => [...prev, newPreset]);
        setSelectedPreset(newPreset);
    }, [presets]);

    // Handle deleting preset
    const handleDeletePreset = useCallback((id) => {
        setCustomPresets(prev => prev.filter(p => p.id !== id));
        if (selectedPreset?.id === id) {
            setSelectedPreset(PRESETS[0]); // Fallback safely
        }
    }, [selectedPreset]);

    // Control parameters - defaults per Lyria API docs
    const [bpm, setBpm] = useState(90);
    const [guidance, setGuidance] = useState(4.0);  // Default 4.0, range 0-6
    const [density, setDensity] = useState(0.5);    // Range 0-1
    const [brightness, setBrightness] = useState(0.5); // Range 0-1
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('lyria-volume');
        return saved ? parseFloat(saved) : 0.75;
    });

    // Auto-drift/Random tuning state
    const [isAutoDriftEnabled, setIsAutoDriftEnabled] = useState(false);
    const nextDriftTimeRef = useRef(180); // First drift at 3 minutes

    // Initialize music service
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY ||
            import.meta.env.GEMINI_API_KEY;

        if (apiKey) {
            liveMusicService.init(apiKey);
        } else {
            console.warn('VITE_GEMINI_API_KEY not found in environment');
        }

        // Listen for playback state changes
        const handleStateChange = (e) => {
            setPlaybackState(e.detail);
        };

        const handleError = (e) => {
            setError(e.detail);
            setTimeout(() => setError(null), 5000);
        };

        const handleEngineChange = (e) => {
            console.log(`🔌 [App] Engine changed to: ${e.detail}`);
            setActiveEngine(e.detail);
            // Clear reconnecting status when engine changes (either success or fallback)
            setReconnectStatus(null);
        };

        const handleReconnecting = (e) => {
            console.log(`🔄 [App] Reconnection event received:`, e.detail);
            setReconnectStatus(e.detail);
        };

        liveMusicService.addEventListener('playback-state-changed', handleStateChange);
        liveMusicService.addEventListener('error', handleError);
        liveMusicService.addEventListener('engine-changed', handleEngineChange);
        liveMusicService.addEventListener('reconnecting', handleReconnecting);

        return () => {
            liveMusicService.removeEventListener('playback-state-changed', handleStateChange);
            liveMusicService.removeEventListener('error', handleError);
            liveMusicService.removeEventListener('engine-changed', handleEngineChange);
            liveMusicService.removeEventListener('reconnecting', handleReconnecting);

            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Listening timer and auto-drift effect
    useEffect(() => {
        if (playbackState === 'playing') {
            startTimeRef.current = Date.now() - listeningTime * 1000;
            timerRef.current = setInterval(() => {
                const currentSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setListeningTime(currentSec);

                // Auto-drift logic (every 3 minutes / 180 seconds)
                if (isAutoDriftEnabled && currentSec >= nextDriftTimeRef.current) {
                    applyRandomTuning();
                    nextDriftTimeRef.current = currentSec + 180; // Schedule next drift
                }
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [playbackState, isAutoDriftEnabled]); // added dependency to restart timer with drift logic

    const applyRandomTuning = () => {
        console.log('🎲 [Auto-Drift] Applying random parameter tuning...');

        // Random BPM change (-10 to +10)
        const bpmDelta = Math.floor(Math.random() * 21) - 10;
        const newBpm = Math.min(200, Math.max(60, bpm + bpmDelta));
        setBpm(newBpm);
        liveMusicService.setTempo(newBpm);

        // Random Guidance change (-1 to +1)
        const guidanceDelta = (Math.random() * 2) - 1;
        const newGuidance = Math.min(6, Math.max(0, guidance + guidanceDelta));
        setGuidance(newGuidance);
        liveMusicService.setMusicConfig({ guidance: newGuidance });

        // Random Density change (-0.15 to +0.15)
        const densityDelta = (Math.random() * 0.3) - 0.15;
        const newDensity = Math.min(1, Math.max(0, density + densityDelta));
        setDensity(newDensity);
        liveMusicService.setMusicConfig({ density: newDensity });

        // Random Brightness change (-0.1 to +0.1)
        const brightnessDelta = (Math.random() * 0.2) - 0.1;
        const newBrightness = Math.min(1, Math.max(0, brightness + brightnessDelta));
        setBrightness(newBrightness);
        liveMusicService.setMusicConfig({ brightness: newBrightness });
    };

    // Update prompts when preset changes
    useEffect(() => {
        if (selectedPreset) {
            liveMusicService.setWeightedPrompts(selectedPreset.prompts);
        }
    }, [selectedPreset]);

    // Handle preset change
    const handlePresetChange = useCallback((preset) => {
        setSelectedPreset(preset);
        setCustomPrompt(''); // Clear custom prompt when preset selected
    }, []);

    // Handle custom prompt submission
    const handleCustomPrompt = useCallback((prompt) => {
        setCustomPrompt(prompt);
        setSelectedPreset(null); // Deselect preset when custom prompt used
        liveMusicService.setWeightedPrompts([
            { text: prompt, weight: 1.5 }
        ]);
    }, []);

    // Handle prompt optimization
    const handleOptimize = useCallback(async (currentPrompt) => {
        return await liveMusicService.enhancePrompt(currentPrompt);
    }, []);

    // Handle auto-generation
    const handleAutoGenerate = useCallback(async () => {
        const creativePrompt = await liveMusicService.generateCreativePrompt();
        // Automatically play the generated prompt
        setSelectedPreset(null);
        setCustomPrompt(creativePrompt);
        liveMusicService.setWeightedPrompts([
            { text: creativePrompt, weight: 1.5 }
        ]);
        return creativePrompt;
    }, []);

    // Handle play/pause
    const handlePlayPause = useCallback(() => {
        liveMusicService.playPause();
    }, []);

    // Handle BPM change
    const handleBpmChange = useCallback((newBpm) => {
        setBpm(newBpm);
        liveMusicService.setTempo(newBpm);
    }, []);

    // Handle real-time parameter changes
    const handleGuidanceChange = useCallback((value) => {
        setGuidance(value);
        liveMusicService.setMusicConfig({ guidance: value });
    }, []);

    const handleDensityChange = useCallback((value) => {
        setDensity(value);
        liveMusicService.setMusicConfig({ density: value });
    }, []);

    const handleBrightnessChange = useCallback((value) => {
        setBrightness(value);
        liveMusicService.setMusicConfig({ brightness: value });
    }, []);

    const handleVolumeChange = useCallback((e) => {
        const value = parseFloat(e.target.value);
        setVolume(value);
        localStorage.setItem('lyria-volume', value);
        liveMusicService.setVolume(value);
    }, []);

    // Format listening time as MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center p-8 lg:p-12"
            style={{ backgroundColor: '#F5F3EE' }}
        >
            {/* Header */}
            <header className="w-full max-w-4xl mb-12 text-center">
                <h1
                    className="text-3xl lg:text-4xl font-serif font-bold tracking-tight mb-2"
                    style={{ color: '#1F1E1D' }}
                >
                    PromptDJ Retro
                </h1>
                <p className="font-serif italic text-sm" style={{ color: '#B1ADA1' }}>
                    AI-Powered Lofi Station • {activeEngine === 'lyria' ? 'Connected to Lyria' : 'Local Synth Fallback'}
                </p>
            </header>

            {/* Error Toast */}
            {/* Error Toast */}
            {error && (
                <div
                    className="fixed top-4 right-4 px-4 py-3 border font-serif text-sm max-w-sm z-50"
                    style={{
                        backgroundColor: '#F5F3EE',
                        borderColor: '#C15F3C',
                        color: '#C15F3C'
                    }}
                >
                    {error}
                </div>
            )}

            {/* Reconnecting Banner */}
            {reconnectStatus && (
                <div
                    className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 border flex items-center gap-4 z-50 shadow-lg animate-pulse"
                    style={{
                        backgroundColor: '#1F1E1D',
                        borderColor: '#E8A735', // Yellow/Gold for warning
                        color: '#F5F3EE'
                    }}
                >
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold uppercase tracking-wider">Connection Lost</span>
                        <span className="text-xs text-[#E8A735]">
                            Reconnecting (Attempt {reconnectStatus.attempt}/{reconnectStatus.max})...
                        </span>
                    </div>
                </div>
            )}

            {/* Fallback Mode Indicator */}
            {activeEngine === 'fallback' && !reconnectStatus && (
                <div
                    className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 border flex items-center gap-4 z-50 shadow-lg"
                    style={{
                        backgroundColor: '#1F1E1D',
                        borderColor: '#C15F3C',
                        color: '#F5F3EE'
                    }}
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-wider text-terracotta">Connection Lost</span>
                        <span className="text-xs opacity-70">Using local fallback synth</span>
                    </div>
                    <button
                        onClick={async () => {
                            const success = await liveMusicService.reconnect();
                            if (success) {
                                setError(null);
                            } else {
                                setError('Reconnection failed. Try refreshing.');
                            }
                        }}
                        className="px-3 py-1 bg-terracotta text-white text-xs uppercase font-bold rounded hover:bg-opacity-80 transition-opacity"
                    >
                        Reconnect
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main className="w-full max-w-4xl flex flex-col gap-12">

                {/* Preset Selector */}
                <section>
                    <PresetSelector
                        presets={presets}
                        selectedPreset={selectedPreset}
                        onPresetChange={handlePresetChange}
                        onSave={handleSavePreset}
                        onDelete={handleDeletePreset}
                    />
                </section>

                {/* Custom Prompt Console */}
                <section>
                    <PromptConsole
                        onSubmit={handleCustomPrompt}
                        onOptimize={handleOptimize}
                        onAutoGenerate={handleAutoGenerate}
                        isPlaying={playbackState === 'playing'}
                    />
                </section>

                {/* Divider */}
                <hr style={{ borderColor: '#B1ADA1', borderWidth: '1px' }} />

                {/* Control Knobs */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm uppercase tracking-widest" style={{ color: '#B1ADA1' }}>
                            Parameters
                        </h2>

                        {/* Auto-Drift Toggle */}
                        <button
                            onClick={() => setIsAutoDriftEnabled(!isAutoDriftEnabled)}
                            className={`
                                flex items-center gap-2 px-3 py-1 
                                text-xs font-serif uppercase tracking-wider
                                border transition-all duration-300
                            `}
                            style={{
                                backgroundColor: isAutoDriftEnabled ? '#1F1E1D' : 'transparent',
                                borderColor: isAutoDriftEnabled ? '#1F1E1D' : '#B1ADA1',
                                color: isAutoDriftEnabled ? '#F5F3EE' : '#B1ADA1',
                            }}
                            title="Automatically varies parameters every 3 minutes"
                        >
                            <span className={`w-2 h-2 rounded-full ${isAutoDriftEnabled ? 'animate-pulse bg-terracotta' : 'bg-gray-400'}`}></span>
                            Auto-Drift: {isAutoDriftEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                        <Knob
                            label="BPM"
                            min={60}
                            max={200}
                            step={1}
                            value={bpm}
                            onChange={handleBpmChange}
                            defaultValue={90}
                            formatValue={(v) => Math.round(v).toString()}
                            tooltip="Beats per minute. Stop/Play required to apply."
                        />

                        <Knob
                            label="Guidance"
                            min={0}
                            max={6}
                            step={0.1}
                            value={guidance}
                            onChange={handleGuidanceChange}
                            defaultValue={4.0}
                            formatValue={(v) => v.toFixed(1)}
                            tooltip="How strictly the model follows your prompt (Higher = stricter)"
                        />

                        <Knob
                            label="Density"
                            min={0}
                            max={1}
                            step={0.01}
                            value={density}
                            onChange={handleDensityChange}
                            defaultValue={0.5}
                            formatValue={(v) => v.toFixed(2)}
                            tooltip="Note density: Sparser (low) vs Busier (high)"
                        />

                        <Knob
                            label="Brightness"
                            min={0}
                            max={1}
                            step={0.01}
                            value={brightness}
                            onChange={handleBrightnessChange}
                            defaultValue={0.5}
                            formatValue={(v) => v.toFixed(2)}
                            tooltip="Tonal quality: Darker (low) vs Brighter (high)"
                        />
                    </div>
                </section>

                {/* Divider */}
                <hr style={{ borderColor: '#B1ADA1', borderWidth: '1px' }} />

                {/* Play Button and Status */}
                <section className="flex flex-col items-center gap-4">
                    <PlayButton
                        playbackState={playbackState}
                        onClick={handlePlayPause}
                    />

                    {/* Volume Slider */}
                    <div className="flex items-center gap-3 w-48">
                        <span className="text-xs font-serif" style={{ color: '#B1ADA1' }}>🔈</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-2 appearance-none rounded cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #C15F3C ${volume * 100}%, #B1ADA1 ${volume * 100}%)`,
                            }}
                            title={`Volume: ${Math.round(volume * 100)}%`}
                        />
                        <span className="text-xs font-serif" style={{ color: '#B1ADA1' }}>🔊</span>
                    </div>

                    {/* Listening Timer */}
                    {playbackState === 'playing' && (
                        <div
                            className="flex items-center gap-3 font-serif text-sm"
                            style={{ color: '#B1ADA1' }}
                        >
                            <span className="tabular-nums">⏱ {formatTime(listeningTime)}</span>
                            <span>•</span>
                            <span className="italic">{selectedPreset?.name || customPrompt || 'Custom'}</span>
                        </div>
                    )}
                </section>

                {/* Active Prompt Display (when not playing) */}
                {playbackState !== 'playing' && (selectedPreset || customPrompt) && (
                    <section className="text-center">
                        <p
                            className="font-serif text-sm italic"
                            style={{ color: '#B1ADA1' }}
                        >
                            Ready: {selectedPreset?.name || `"${customPrompt}"`}
                        </p>
                    </section>
                )}
            </main>

            {/* Footer with Engine Indicator */}
            <footer
                className="mt-16 text-center font-serif text-xs"
                style={{ color: '#B1ADA1' }}
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span
                        className="px-2 py-1 text-xs uppercase tracking-wider"
                        style={{
                            backgroundColor: activeEngine === 'lyria' ? '#C15F3C' :
                                activeEngine === 'fallback' ? '#B1ADA1' : 'transparent',
                            color: activeEngine === 'none' ? '#B1ADA1' : '#F5F3EE',
                            border: '1px solid',
                            borderColor: activeEngine === 'lyria' ? '#C15F3C' : '#B1ADA1'
                        }}
                    >
                        {activeEngine === 'lyria' ? '🎵 Lyria AI' :
                            activeEngine === 'fallback' ? '🎹 Fallback Synth' :
                                '○ Ready'}
                    </span>
                </div>
                Powered by Google Lyria RealTime
            </footer>
        </div>
    );
}
