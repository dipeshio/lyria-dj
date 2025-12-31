/**
 * Knob.jsx - SVG-based rotary dial component
 * Uses requestAnimationFrame for smooth visual updates
 * Hold Shift for fine control, double-click to reset
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export default function Knob({
    label,
    min = 0,
    max = 1,
    value,
    onChange,
    step = 0.01,
    defaultValue,
    formatValue = (v) => v.toFixed(2)
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isFineMode, setIsFineMode] = useState(false);
    const dragStartY = useRef(0);
    const dragStartValue = useRef(0);
    const rafId = useRef(null);
    const knobRef = useRef(null);

    // Normalize value to 0-1 range for rotation calculation
    const normalizedValue = (value - min) / (max - min);

    // Rotation range: 270 degrees (-135 to +135)
    const rotationRange = 270;
    const minRotation = -135;
    const rotation = minRotation + (normalizedValue * rotationRange);

    const handlePointerDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        setIsActive(true);
        setIsFineMode(e.shiftKey);
        dragStartY.current = e.clientY;
        dragStartValue.current = value;
        document.body.classList.add('dragging');

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }, [value]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Shift') setIsFineMode(true);
    }, []);

    const handleKeyUp = useCallback((e) => {
        if (e.key === 'Shift') setIsFineMode(false);
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (rafId.current) cancelAnimationFrame(rafId.current);

        rafId.current = requestAnimationFrame(() => {
            const deltaY = dragStartY.current - e.clientY;
            const range = max - min;
            // Normal: 200px for full range, Fine mode (Shift): 800px for full range
            const pixelsPerRange = e.shiftKey ? 800 : 200;
            const sensitivity = range / pixelsPerRange;
            let newValue = dragStartValue.current + (deltaY * sensitivity);

            // Clamp to range and snap to step
            newValue = Math.max(min, Math.min(max, newValue));
            newValue = Math.round(newValue / step) * step;

            onChange(newValue);
        });
    }, [min, max, step, onChange]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
        setIsFineMode(false);
        document.body.classList.remove('dragging');

        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);

        // Keep active briefly for visual feedback
        setTimeout(() => setIsActive(false), 150);
    }, [handlePointerMove, handleKeyDown, handleKeyUp]);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        // Fine control with Shift key on wheel too
        const multiplier = e.shiftKey ? 0.0002 : 0.001;
        const delta = e.deltaY * -multiplier;
        const range = max - min;
        let newValue = value + (delta * range);

        newValue = Math.max(min, Math.min(max, newValue));
        newValue = Math.round(newValue / step) * step;

        onChange(newValue);

        setIsActive(true);
        setTimeout(() => setIsActive(false), 150);
    }, [value, min, max, step, onChange]);

    // Double-click to reset to default
    const handleDoubleClick = useCallback(() => {
        const resetValue = defaultValue !== undefined ? defaultValue : (min + max) / 2;
        onChange(resetValue);
    }, [defaultValue, min, max, onChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            document.body.classList.remove('dragging');
        };
    }, []);

    const strokeColor = isActive ? '#C15F3C' : '#1F1E1D';
    const trackColor = '#B1ADA1';

    return (
        <div className="flex flex-col items-center gap-3 select-none">
            {/* Fine mode indicator */}
            {isFineMode && isDragging && (
                <span className="text-xs uppercase tracking-wider" style={{ color: '#C15F3C' }}>
                    Fine
                </span>
            )}

            {/* SVG Knob */}
            <svg
                ref={knobRef}
                width="80"
                height="80"
                viewBox="0 0 80 80"
                className="cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={handlePointerDown}
                onWheel={handleWheel}
                onDoubleClick={handleDoubleClick}
                title="Drag to adjust. Hold Shift for fine control. Double-click to reset."
            >
                {/* Outer ring track (background) */}
                <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke={trackColor}
                    strokeWidth="2"
                    strokeDasharray="4 2"
                />

                {/* Main dial circle */}
                <circle
                    cx="40"
                    cy="40"
                    r="28"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                    style={{ transition: 'stroke 0.15s ease' }}
                />

                {/* Value arc indicator */}
                <path
                    d={describeArc(40, 40, 28, -135, rotation)}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ transition: 'stroke 0.15s ease' }}
                />

                {/* Pointer/notch indicator */}
                <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '40px 40px' }}>
                    <line
                        x1="40"
                        y1="16"
                        x2="40"
                        y2="24"
                        stroke={strokeColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ transition: 'stroke 0.15s ease' }}
                    />
                </g>

                {/* Center dot */}
                <circle
                    cx="40"
                    cy="40"
                    r="3"
                    fill={strokeColor}
                    style={{ transition: 'fill 0.15s ease' }}
                />
            </svg>

            {/* Value display */}
            <span className="font-serif text-sm tabular-nums" style={{ color: '#1F1E1D' }}>
                {formatValue(value)}
            </span>

            {/* Label */}
            <span className="knob-label font-serif">
                {label}
            </span>
        </div>
    );
}

/**
 * Helper function to describe an SVG arc path
 */
function describeArc(cx, cy, radius, startAngle, endAngle) {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const startX = cx + radius * Math.cos(startRad);
    const startY = cy + radius * Math.sin(startRad);
    const endX = cx + radius * Math.cos(endRad);
    const endY = cy + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
}
