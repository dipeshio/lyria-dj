/**
 * PresetSelector.jsx - Radio group for music presets
 * Supports custom presets, saving, and deletion
 */
import { useState } from 'react';

// Default built-in presets
const PRESETS = [
    {
        id: 'lofi-study',
        name: 'Lofi Study',
        prompts: [
            { text: 'Lofi hip hop', weight: 1.5 },
            { text: 'Soft piano', weight: 0.8 },
            { text: 'Vinyl crackle', weight: 0.4 },
        ],
        description: 'Classic calm beats for studying'
    },
    {
        id: 'soft-classical',
        name: 'Soft Classical',
        prompts: [
            { text: 'Classical strings', weight: 1.5 },
            { text: 'Gentle orchestra', weight: 1.0 },
            { text: 'Piano sonata', weight: 0.6 },
        ],
        description: 'Elegant orchestration for relaxation'
    },
    {
        id: 'deep-ambient',
        name: 'Deep Ambient',
        prompts: [
            { text: 'Ambient soundscape', weight: 1.5 },
            { text: 'Ethereal pads', weight: 1.2 },
            { text: 'Drone textures', weight: 0.8 },
        ],
        description: 'Spacey, floating textures'
    },
    {
        id: 'chaos-jazz',
        name: 'Chaos Jazz',
        prompts: [
            { text: 'Free jazz', weight: 1.5 },
            { text: 'Experimental', weight: 1.0 },
            { text: 'Saxophone improvisation', weight: 0.8 },
        ],
        description: 'Unpredictable, energetic jazz'
    },
    {
        id: 'retrowave',
        name: 'Retrowave',
        prompts: [
            { text: 'Synthwave', weight: 1.5 },
            { text: 'Analog synthesizer', weight: 1.2 },
            { text: '80s nostalgic', weight: 0.8 },
        ],
        description: 'Neon-soaked 80s nostalgia'
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        prompts: [
            { text: 'Industrial cyberpunk', weight: 1.4 },
            { text: 'Glitch electronics', weight: 1.0 },
            { text: 'Dark synthesizer', weight: 0.9 },
        ],
        description: 'Gritty, futuristic cityscape'
    },
    {
        id: 'meditative',
        name: 'Meditative',
        prompts: [
            { text: 'Meditation music', weight: 1.5 },
            { text: 'Singing bowls', weight: 1.2 },
            { text: 'Focus', weight: 1.0 },
        ],
        description: 'Peaceful mindfulness'
    },
    {
        id: 'cinematic-drama',
        name: 'Cinematic',
        prompts: [
            { text: 'Movie soundtrack', weight: 1.5 },
            { text: 'Epic strings', weight: 1.2 },
            { text: 'Orchestral tension', weight: 0.9 },
        ],
        description: 'Epic scores for dramatic moments'
    },
    {
        id: 'forest-nature',
        name: 'Forest Walk',
        prompts: [
            { text: 'Nature sounds', weight: 1.5 },
            { text: 'Acoustic guitar', weight: 1.0 },
            { text: 'Birds chirping', weight: 0.8 },
        ],
        description: 'Organic acoustic vibes'
    },
    {
        id: '8-bit-adventure',
        name: '8-Bit',
        prompts: [
            { text: 'Chiptune', weight: 1.5 },
            { text: 'Game soundtrack', weight: 1.2 },
            { text: 'Upbeat electronic', weight: 0.9 },
        ],
        description: 'Retro game nostalgia'
    }
];

export default function PresetSelector({ presets = PRESETS, selectedPreset, onPresetChange, onSave, onDelete }) {
    const [isSaving, setIsSaving] = useState(false);
    const [newName, setNewName] = useState('');

    const handleSaveClick = (e) => {
        e.preventDefault();
        if (newName.trim()) {
            // We save the CURRENT presets of the active selection or just save it as a new empty wrapper?
            // "Save" usually means save the current STATE as a preset.
            // But here we rely on the parent app to know what the current "state" is if it's custom.
            // If checking the props, we might need prompts from somewhere.
            // Actually, if a user modified the prompts via the console, selectedPreset becomes null.
            // So we need to ask the user to provide prompts? Or better:
            // The App knows the current prompts. But we are inside PresetSelector.
            // User flow: 
            // 1. Type prompt in console -> "Custom" state
            // 2. Click "Save Preset" here -> Name it -> Save current custom prompt.

            // To simplify, we will assume the parent (App) handles grabbing the current active prompts
            // when we call onSave(name).
            onSave(newName.trim(), null); // Null prompts implies "use current active ones"
            setNewName('');
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm uppercase tracking-widest" style={{ color: '#B1ADA1' }}>
                    Mood Presets
                </h2>
                <div className="text-xs font-serif" style={{ color: '#B1ADA1' }}>
                    {presets.length}/10 slots used
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {presets.map((preset) => {
                    const isSelected = selectedPreset?.id === preset.id;
                    const isBuiltIn = PRESETS.some(p => p.id === preset.id);

                    return (
                        <div key={preset.id} className="relative group">
                            <button
                                onClick={() => onPresetChange(preset)}
                                className={`
                                    px-4 py-2 
                                    border font-serif text-sm
                                    transition-colors duration-150
                                    relative
                                `}
                                style={{
                                    backgroundColor: isSelected ? '#C15F3C' : 'transparent',
                                    borderColor: isSelected ? '#C15F3C' : '#1F1E1D',
                                    color: isSelected ? '#F5F3EE' : '#1F1E1D',
                                }}
                            >
                                {preset.name}
                                {!isBuiltIn && <span className="ml-1 text-[10px] opacity-70">★</span>}
                            </button>

                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                <div className="font-bold mb-1">{preset.name}</div>
                                <div className="opacity-80 mb-2 italic">{preset.description || 'Custom user preset'}</div>
                                <div className="border-t border-gray-600 pt-1 mt-1">
                                    {preset.prompts.map((p, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{p.text}</span>
                                            <span className="opacity-60">{p.weight}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>

                            {/* Delete Button (only for custom presets) */}
                            {!isBuiltIn && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete preset "${preset.name}"?`)) {
                                            onDelete(preset.id);
                                        }
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                    title="Delete preset"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Save New Preset Section */}
            {!selectedPreset && (
                <div className="mt-4 p-4 border border-dashed border-gray-400 rounded bg-gray-50 flex flex-col gap-2">
                    <span className="text-xs font-serif italic text-gray-600">
                        You are playing a custom prompt. Save it as a preset?
                    </span>

                    {!isSaving ? (
                        <button
                            onClick={() => setIsSaving(true)}
                            className="self-start text-xs uppercase tracking-wider font-bold text-terracotta hover:underline"
                            style={{ color: '#C15F3C' }}
                        >
                            + Save as Preset
                        </button>
                    ) : (
                        <form onSubmit={handleSaveClick} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Preset Name"
                                maxLength={15}
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:border-terracotta outline-none"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newName.trim()}
                                className="px-3 py-1 bg-[#1F1E1D] text-[#F5F3EE] text-xs uppercase rounded disabled:opacity-50"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsSaving(false); setNewName(''); }}
                                className="text-xs text-gray-500 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

export { PRESETS };
