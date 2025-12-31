/**
 * PlayButton.jsx - Play/Pause control styled in Claude aesthetic
 */

const STATES = {
    stopped: { label: 'Play', icon: '▶' },
    loading: { label: 'Loading...', icon: '◐' },
    playing: { label: 'Pause', icon: '❚❚' },
    paused: { label: 'Resume', icon: '▶' },
};

export default function PlayButton({ playbackState = 'stopped', onClick }) {
    const state = STATES[playbackState] || STATES.stopped;
    const isActive = playbackState === 'playing';
    const isLoading = playbackState === 'loading';

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`
        relative flex items-center justify-center gap-3
        w-40 h-14
        font-serif text-sm uppercase tracking-widest
        border-2 transition-all duration-200
        disabled:cursor-wait
        ${isLoading ? 'animate-pulse' : ''}
      `}
            style={{
                borderColor: isActive ? '#C15F3C' : '#1F1E1D',
                backgroundColor: isActive ? '#C15F3C' : 'transparent',
                color: isActive ? '#F5F3EE' : '#1F1E1D',
            }}
            onMouseEnter={(e) => {
                if (!isActive && !isLoading) {
                    e.currentTarget.style.backgroundColor = '#1F1E1D';
                    e.currentTarget.style.color = '#F5F3EE';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1F1E1D';
                }
            }}
        >
            <span className="text-lg">{state.icon}</span>
            <span>{state.label}</span>

            {/* Active indicator dot */}
            {isActive && (
                <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: '#F5F3EE' }}
                />
            )}
        </button>
    );
}
