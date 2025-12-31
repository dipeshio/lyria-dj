/**
 * PresetSelector.jsx - Radio group for music presets
 */
import { useState } from 'react';

const PRESETS = [
    {
        id: 'lofi-study',
        name: 'Lofi Study',
        prompts: [
            { text: 'Lofi hip hop', weight: 1.5 },
            { text: 'Soft piano', weight: 0.8 },
            { text: 'Vinyl crackle', weight: 0.4 },
        ],
    },
    {
        id: 'soft-classical',
        name: 'Soft Classical',
        prompts: [
            { text: 'Classical strings', weight: 1.5 },
            { text: 'Gentle orchestra', weight: 1.0 },
            { text: 'Piano sonata', weight: 0.6 },
        ],
    },
    {
        id: 'deep-ambient',
        name: 'Deep Ambient',
        prompts: [
            { text: 'Ambient soundscape', weight: 1.5 },
            { text: 'Ethereal pads', weight: 1.2 },
            { text: 'Drone textures', weight: 0.8 },
        ],
    },
    {
        id: 'chaos-jazz',
        name: 'Chaos Jazz',
        prompts: [
            { text: 'Free jazz', weight: 1.5 },
            { text: 'Experimental', weight: 1.0 },
            { text: 'Saxophone improvisation', weight: 0.8 },
        ],
    },
    {
        id: 'retrowave',
        name: 'Retrowave',
        prompts: [
            { text: 'Synthwave', weight: 1.5 },
            { text: 'Analog synthesizer', weight: 1.2 },
            { text: '80s nostalgic', weight: 0.8 },
        ],
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        prompts: [
            { text: 'Industrial cyberpunk', weight: 1.4 },
            { text: 'Glitch electronics', weight: 1.0 },
            { text: 'Dark synthesizer', weight: 0.9 },
        ],
    },
    {
        id: 'meditative',
        name: 'Meditative',
        prompts: [
            { text: 'Meditation music', weight: 1.5 },
            { text: 'Singing bowls', weight: 1.2 },
            { text: 'Focus', weight: 1.0 },
        ],
    },
];

export default function PresetSelector({ selectedPreset, onPresetChange }) {
    return (
        <div className="w-full">
            <h2 className="text-sm uppercase tracking-widest mb-4" style={{ color: '#B1ADA1' }}>
                Mood Presets
            </h2>

            <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => {
                    const isSelected = selectedPreset?.id === preset.id;

                    return (
                        <button
                            key={preset.id}
                            onClick={() => onPresetChange(preset)}
                            className={`
                px-4 py-2 
                border font-serif text-sm
                transition-colors duration-150
                ${isSelected
                                    ? 'bg-terracotta border-terracotta text-paper'
                                    : 'bg-transparent border-charcoal text-charcoal hover:bg-charcoal hover:text-paper'
                                }
              `}
                            style={{
                                backgroundColor: isSelected ? '#C15F3C' : 'transparent',
                                borderColor: isSelected ? '#C15F3C' : '#1F1E1D',
                                color: isSelected ? '#F5F3EE' : '#1F1E1D',
                            }}
                        >
                            {preset.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { PRESETS };
