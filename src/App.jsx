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

    // Listening duration timer
    const [listeningTime, setListeningTime] = useState(0);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Preset and prompt state
    const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
    const [customPrompt, setCustomPrompt] = useState('');

    // Control parameters - defaults per Lyria API docs
    const [bpm, setBpm] = useState(90);
    const [guidance, setGuidance] = useState(4.0);  // Default 4.0, range 0-6
    const [density, setDensity] = useState(0.5);    // Range 0-1
    const [brightness, setBrightness] = useState(0.5); // Range 0-1

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
            setActiveEngine(e.detail);
        };

        liveMusicService.addEventListener('playback-state-changed', handleStateChange);
        liveMusicService.addEventListener('error', handleError);
        liveMusicService.addEventListener('engine-changed', handleEngineChange);

        return () => {
            liveMusicService.removeEventListener('playback-state-changed', handleStateChange);
            liveMusicService.removeEventListener('error', handleError);
            liveMusicService.removeEventListener('engine-changed', handleEngineChange);
            liveMusicService.destroy();
        };
    }, []);

    // Listening timer effect
    useEffect(() => {
        if (playbackState === 'playing') {
            startTimeRef.current = Date.now() - listeningTime * 1000;
            timerRef.current = setInterval(() => {
                setListeningTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [playbackState]);

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
                <p
                    className="font-serif italic"
                    style={{ color: '#B1ADA1' }}
                >
                    Infinite AI-generated music, steered by you
                </p>
            </header>

            {/* Error Toast */}
            {error && (
                <div
                    className="fixed top-4 right-4 px-4 py-3 border font-serif text-sm max-w-sm"
                    style={{
                        backgroundColor: '#F5F3EE',
                        borderColor: '#C15F3C',
                        color: '#C15F3C'
                    }}
                >
                    {error}
                </div>
            )}

            {/* Main Content */}
            <main className="w-full max-w-4xl flex flex-col gap-12">

                {/* Preset Selector */}
                <section>
                    <PresetSelector
                        selectedPreset={selectedPreset}
                        onPresetChange={handlePresetChange}
                    />
                </section>

                {/* Custom Prompt Console */}
                <section>
                    <PromptConsole
                        onSubmit={handleCustomPrompt}
                        isPlaying={playbackState === 'playing'}
                    />
                </section>

                {/* Divider */}
                <hr style={{ borderColor: '#B1ADA1', borderWidth: '1px' }} />

                {/* Control Knobs */}
                <section>
                    <h2
                        className="text-sm uppercase tracking-widest mb-6"
                        style={{ color: '#B1ADA1' }}
                    >
                        Parameters
                    </h2>

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
