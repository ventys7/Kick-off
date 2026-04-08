import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function formatCountdown(ms) {
    if (ms <= 0) return { parts: [], isLive: true };
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
        return {
            parts: [
                { value: String(days).padStart(2, '0'), label: 'GG' },
                { value: String(hours).padStart(2, '0'), label: 'HH' },
                { value: String(minutes).padStart(2, '0'), label: 'MM' },
            ],
            isLive: false,
        };
    } else if (hours > 0) {
        return {
            parts: [
                { value: String(hours).padStart(2, '0'), label: 'HH' },
                { value: String(minutes).padStart(2, '0'), label: 'MM' },
                { value: String(seconds).padStart(2, '0'), label: 'SS' },
            ],
            isLive: false,
        };
    } else {
        return {
            parts: [
                { value: String(minutes).padStart(2, '0'), label: 'MM' },
                { value: String(seconds).padStart(2, '0'), label: 'SS' },
            ],
            isLive: false,
        };
    }
}

function FlipDigit({ value, size = 'lg' }) {
    const [prev, setPrev] = useState(value);
    const [flipping, setFlipping] = useState(false);

    useEffect(() => {
        if (value !== prev) {
            setFlipping(true);
            const t = setTimeout(() => {
                setPrev(value);
                setFlipping(false);
            }, 150);
            return () => clearTimeout(t);
        }
    }, [value, prev]);

    const sizeClasses = {
        hero: 'text-[18vw] md:text-[14vw] leading-none font-black tracking-tighter',
        lg: 'text-6xl md:text-7xl font-black tracking-tighter leading-none',
        sm: 'text-3xl md:text-4xl font-bold tracking-tighter leading-none',
    };

    return (
        <span
            className={`inline-block ${sizeClasses[size]}`}
            style={{
                transform: flipping ? 'translateY(-4px)' : 'translateY(0)',
                opacity: flipping ? 0.7 : 1,
                transition: 'transform 0.12s ease-out, opacity 0.12s ease-out',
            }}
        >
            {value}
        </span>
    );
}

export default function CountdownDisplay({ targetTimestamp, size = 'lg' }) {
    const ms = targetTimestamp * 1000 - Date.now();
    const { parts, isLive } = formatCountdown(ms);

    if (isLive) {
        return (
            <span
                className={`font-black tracking-tighter ${size === 'hero' ? 'text-[14vw]' : size === 'lg' ? 'text-6xl' : 'text-3xl'}`}
                style={{ color: '#ffffff', animation: 'pulse-glow 1.5s infinite' }}
            >
                LIVE
            </span>
        );
    }

    return (
        <div className="flex items-end gap-2 md:gap-4">
            {parts.map((part, i) => (
                <React.Fragment key={part.label}>
                    <div className="flex flex-col items-center">
                        <div className="flex">
                            {part.value.split('').map((digit, di) => (
                                <FlipDigit key={`${part.label}-${di}`} value={digit} size={size} />
                            ))}
                        </div>
                        <span className="font-mono mt-1" style={{ fontSize: 10, color: '#88888D', letterSpacing: '0.15em' }}>
                            {part.label}
                        </span>
                    </div>
                    {i < parts.length - 1 && (
                        <span
                            className={`pb-4 font-black ${size === 'hero' ? 'text-4xl md:text-5xl' : 'text-2xl'}`}
                            style={{ color: '#88888D', marginBottom: size === 'hero' ? 16 : 8 }}
                        >
                            :
                        </span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
