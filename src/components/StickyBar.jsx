import React from 'react';
import { formatShortCountdown } from '@/utils/matchUtils';

export default function StickyBar({ visible, nextMatch }) {
    if (!nextMatch) return null;

    const { league, startTimestamp } = nextMatch;
    const countdown = formatShortCountdown(startTimestamp * 1000 - Date.now());

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 transition-transform duration-300"
            style={{
                background: '#0F0F12',
                borderBottom: '1px solid #1E1E24',
                height: 48,
                transform: visible ? 'translateY(0)' : 'translateY(-100%)',
            }}
        >
            <div className="flex items-center gap-3">
                <span className="text-base">{league.flag}</span>
                <span className="font-bold uppercase tracking-tight text-white" style={{ fontSize: 13 }}>
                    {league.name}
                </span>
                <span className="mono hidden md:block">// PROSSIMA</span>
            </div>

            <div className="flex items-center gap-3">
                <span className="font-black tracking-tighter text-white" style={{ fontSize: 18 }}>
                    {countdown}
                </span>
                <span className="mono hidden md:block" style={{ color: '#88888D', fontSize: 10 }}>
                    KICK-OFF
                </span>
            </div>
        </div>
    );
}
