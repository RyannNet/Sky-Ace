import React, { useState, useRef, useEffect } from 'react';
import { ControlsState } from '../types';

interface JoystickProps {
    controls: React.MutableRefObject<ControlsState>;
}

export const MobileControls: React.FC<JoystickProps> = ({ controls }) => {
    const joyRef = useRef<HTMLDivElement>(null);
    const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });
    const [active, setActive] = useState(false);
    const origin = useRef({ x: 0, y: 0 });

    const handleStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        origin.current = { x: touch.clientX, y: touch.clientY };
        setActive(true);
    };

    const handleMove = (e: React.TouchEvent) => {
        if (!active) return;
        const touch = e.touches[0];
        
        // Calculate delta
        let dx = touch.clientX - origin.current.x;
        let dy = touch.clientY - origin.current.y;
        
        // Clamp radius
        const maxRadius = 50;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxRadius;
            dy = Math.sin(angle) * maxRadius;
        }

        setJoyPos({ x: dx, y: dy });

        // Update Global Controls (Normalized -1 to 1)
        controls.current.joyRoll = dx / maxRadius; // Right/Left
        controls.current.joyPitch = dy / maxRadius; // Up/Down (inverted logic handled in game loop)
    };

    const handleEnd = () => {
        setActive(false);
        setJoyPos({ x: 0, y: 0 });
        controls.current.joyRoll = 0;
        controls.current.joyPitch = 0;
    };

    // Throttle Logic
    const throttleInterval = useRef<any>(null);
    const changeThrottle = (delta: number) => {
        if (throttleInterval.current) clearInterval(throttleInterval.current);
        throttleInterval.current = setInterval(() => {
            if (delta > 0) controls.current.throttleUp = true;
            else controls.current.throttleDown = true;
        }, 16);
    };
    const stopThrottle = () => {
        if (throttleInterval.current) clearInterval(throttleInterval.current);
        controls.current.throttleUp = false;
        controls.current.throttleDown = false;
    };

    return (
        <div className="absolute inset-0 z-40 pointer-events-none select-none">
            {/* Throttle Control (Left Side) */}
            <div className="absolute bottom-12 left-8 pointer-events-auto flex flex-col gap-4">
                <button 
                    className="w-16 h-16 bg-slate-800/80 border border-slate-500 rounded-full flex items-center justify-center text-amber-500 font-bold active:bg-amber-500 active:text-black transition-colors"
                    onTouchStart={() => changeThrottle(1)}
                    onTouchEnd={stopThrottle}
                >
                    PWR+
                </button>
                <button 
                    className="w-16 h-16 bg-slate-800/80 border border-slate-500 rounded-full flex items-center justify-center text-slate-300 font-bold active:bg-red-500 active:text-black transition-colors"
                    onTouchStart={() => changeThrottle(-1)}
                    onTouchEnd={stopThrottle}
                >
                    PWR-
                </button>
            </div>

            {/* Virtual Joystick (Right Side) */}
            <div 
                className="absolute bottom-12 right-12 w-40 h-40 bg-slate-900/30 backdrop-blur-sm border-2 border-white/10 rounded-full flex items-center justify-center pointer-events-auto touch-none"
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            >
                <div className="absolute w-2 h-2 bg-white/20 rounded-full"></div>
                <div 
                    className={`w-16 h-16 rounded-full shadow-xl border border-white/30 backdrop-blur-md flex items-center justify-center transition-transform duration-75 ${active ? 'bg-amber-500/80 scale-90' : 'bg-white/20'}`}
                    style={{ transform: `translate(${joyPos.x}px, ${joyPos.y}px)` }}
                >
                    {active && <div className="w-full h-full rounded-full bg-white/20 animate-pulse"></div>}
                </div>
            </div>
        </div>
    );
};