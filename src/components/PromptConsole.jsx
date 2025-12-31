/**
 * PromptConsole.jsx - Custom prompt input with generate button
 */
import { useState } from 'react';

export default function PromptConsole({ onSubmit, isPlaying, onOptimize, onAutoGenerate }) {
    const [prompt, setPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt.trim());
        }
    };

    const handleOptimizeClick = async () => {
        if (!prompt.trim() || !onOptimize) return;

        setIsOptimizing(true);
        try {
            const enhanced = await onOptimize(prompt);
            if (enhanced) setPrompt(enhanced);
        } catch (error) {
            console.error('Optimization failed:', error);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAutoGenerateClick = async () => {
        if (!onAutoGenerate) return;

        setIsGenerating(true);
        try {
            const creative = await onAutoGenerate();
            if (creative) setPrompt(creative);
        } catch (error) {
            console.error('Auto-generation failed:', error);
        } finally {
            setIsGenerating(false);
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
              disabled:opacity-50
            "
                        style={{
                            borderColor: '#1F1E1D',
                            color: '#1F1E1D',
                        }}
                        disabled={isOptimizing || isGenerating}
                    />

                    {/* Character count */}
                    <span
                        className="absolute bottom-2 right-3 text-xs"
                        style={{ color: '#B1ADA1' }}
                    >
                        {prompt.length}/200
                    </span>
                </div>

                <div className="flex flex-wrap gap-4">
                    {/* Optimize Button */}
                    <button
                        type="button"
                        onClick={handleOptimizeClick}
                        disabled={!prompt.trim() || isOptimizing || isGenerating || !onOptimize}
                        className="
                flex items-center gap-2 px-6 py-3
                font-serif text-xs uppercase tracking-widest
                border transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
              "
                        style={{
                            borderColor: '#B1ADA1',
                            color: '#1F1E1D',
                            backgroundColor: 'transparent',
                        }}
                        title="Enhance prompt with better keywords using AI"
                    >
                        {isOptimizing ? (
                            <span className="animate-pulse">✨ Refining...</span>
                        ) : (
                            <>✨ Optimize</>
                        )}
                    </button>

                    {/* Auto-Generate Button */}
                    <button
                        type="button"
                        onClick={handleAutoGenerateClick}
                        disabled={isOptimizing || isGenerating || !onAutoGenerate}
                        className="
                flex items-center gap-2 px-6 py-3
                font-serif text-xs uppercase tracking-widest
                border transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
              "
                        style={{
                            borderColor: '#B1ADA1',
                            color: '#1F1E1D',
                            backgroundColor: 'transparent',
                        }}
                        title="Generate a completely new creative prompt"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse">🎲 Thinking...</span>
                        ) : (
                            <>🎲 Inspire Me</>
                        )}
                    </button>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={!prompt.trim() || isOptimizing || isGenerating}
                        className="
                ml-auto px-6 py-3
                font-serif text-xs uppercase tracking-widest
                border transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
              "
                        style={{
                            borderColor: prompt.trim() ? '#1F1E1D' : '#B1ADA1',
                            color: prompt.trim() ? '#C15F3C' : '#B1ADA1',
                            backgroundColor: prompt.trim() ? '#1F1E1D' : 'transparent',
                        }}
                    >
                        {isPlaying ? 'Update Stream' : 'Generate'}
                    </button>
                </div>
            </form>
        </div>
    );
}
