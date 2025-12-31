/**
 * PromptConsole.jsx - Custom prompt input with generate button
 */
import { useState } from 'react';

export default function PromptConsole({ onSubmit, isPlaying }) {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt.trim());
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-sm uppercase tracking-widest mb-4" style={{ color: '#B1ADA1' }}>
                Custom Prompt
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your soundscape... (e.g., Cyberpunk rain city)"
                        className="
              w-full h-24 p-4
              font-serif text-sm
              resize-none
              border border-charcoal
              bg-transparent
              placeholder:text-muted
              focus:border-terracotta
            "
                        style={{
                            borderColor: '#1F1E1D',
                            color: '#1F1E1D',
                        }}
                    />

                    {/* Character count */}
                    <span
                        className="absolute bottom-2 right-3 text-xs"
                        style={{ color: '#B1ADA1' }}
                    >
                        {prompt.length}/200
                    </span>
                </div>

                <div className="flex gap-4">
                    {/* Optimize Button */}
                    <button
                        type="button"
                        onClick={() => {
                            // Simple heuristic optimization since we don't have text-gen capability wired up yet
                            setPrompt(`High quality, professional audio, ${prompt.trim() || 'lofi hip hop'}, clear mixing, detailed instrumentation`);
                        }}
                        disabled={!prompt.trim()}
                        className="
                px-6 py-3
                font-serif text-xs uppercase tracking-widest
                border transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
              "
                        style={{
                            borderColor: '#B1ADA1',
                            color: '#1F1E1D',
                            backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            if (prompt.trim()) {
                                e.target.style.backgroundColor = '#E5E7EB';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Enhance prompt with better keywords"
                    >
                        ✨ Optimize
                    </button>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={!prompt.trim()}
                        className="
                px-6 py-3
                font-serif text-xs uppercase tracking-widest
                border transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
              "
                        style={{
                            borderColor: prompt.trim() ? '#1F1E1D' : '#B1ADA1',
                            color: prompt.trim() ? '#1F1E1D' : '#B1ADA1',
                            backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            if (prompt.trim()) {
                                e.target.style.backgroundColor = '#1F1E1D';
                                e.target.style.color = '#F5F3EE';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = prompt.trim() ? '#1F1E1D' : '#B1ADA1';
                        }}
                    >
                        {isPlaying ? 'Update Stream' : 'Generate'}
                    </button>
                </div>
            </form>
        </div>
    );
}
