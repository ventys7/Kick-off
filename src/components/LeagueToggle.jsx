import React from 'react';

export default function LeagueToggle({ league, active, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className={`toggle-switch relative px-4 py-3 border flex items-center gap-3 transition-all duration-200 w-full md:w-auto ${
                active ? 'border-white/25 bg-white/5' : 'border-white/6 bg-transparent opacity-40'
            }`}
        >
            <div className="relative flex-shrink-0" style={{ width: 32, height: 18 }}>
                <div
                    className="absolute inset-0 border transition-colors"
                    style={{
                        borderColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                        background: 'transparent',
                    }}
                />
                <div
                    className="absolute top-1 transition-transform duration-200"
                    style={{
                        width: 12,
                        height: 10,
                        background: active ? '#ffffff' : '#88888D',
                        transform: active ? 'translateX(16px)' : 'translateX(2px)',
                    }}
                />
            </div>

            <div className="text-left flex-1 md:flex-none">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{league.flag}</span>
                    <span
                        className="text-sm font-bold tracking-tight uppercase"
                        style={{ color: active ? '#ffffff' : '#88888D' }}
                    >
                        {league.name}
                    </span>
                </div>
                <p className="font-mono text-xs mt-0.5" style={{ color: '#88888D', fontSize: 10 }}>
                    {active ? 'ATTIVO' : 'DISATTIVATO'}
                </p>
            </div>
        </button>
    );
}
