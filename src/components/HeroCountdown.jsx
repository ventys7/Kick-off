import React from 'react';
import CountdownDisplay from './CountdownDisplay';

function formatDateTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function TeamCrest({ teamId, name, size = 40 }) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                <img
                    src={`https://crests.football-data.org/${teamId}.png`}
                    alt={name}
                    style={{ width: size, height: size, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1E1E24&color=fff&size=${size}`; }}
                />
            </div>
            <span
                className="font-bold uppercase tracking-tight text-center"
                style={{ fontSize: 'clamp(12px, 2vw, 18px)', color: '#ffffff', maxWidth: 140 }}
            >
                {name}
            </span>
        </div>
    );
}

export default function HeroCountdown({ nextMatch }) {
    if (!nextMatch) return null;

    const { matches, league, round, startTimestamp, inProgressRounds } = nextMatch;
    const primaryMatch = matches[0];

    return (
        <section className="relative overflow-hidden px-6 py-12 md:px-16 md:py-20" style={{ background: '#0F0F12' }}>
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
                }}
            />

            <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
                <div className="flex items-center gap-4">
                    <div style={{ width: 1, height: 40, background: '#1E1E24' }} />
                    <div>
                        <p className="mono mb-1">PROSSIMA PARTITA</p>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{league.flag}</span>
                            <span className="font-bold text-white uppercase tracking-tight text-sm md:text-base">
                                {league.name}
                            </span>
                            <span className="mono">// GIORNATA {round}</span>
                        </div>
                    </div>
                </div>

                {inProgressRounds && inProgressRounds.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: '#ffffff', animation: 'pulse-glow 1.5s infinite' }} />
                        <span className="mono text-white text-xs">
                            GIORNATA {inProgressRounds.join(', ')} IN CORSO
                        </span>
                    </div>
                )}
            </div>

            <div className="relative z-10 flex items-center justify-center gap-6 md:gap-16 mb-10 md:mb-14">
                {primaryMatch && (
                    <>
                        <TeamCrest teamId={primaryMatch.homeTeam.id} name={primaryMatch.homeTeam.shortName || primaryMatch.homeTeam.name} size={56} />
                        <div className="text-center">
                            <p className="font-black uppercase tracking-widest" style={{ fontSize: 'clamp(10px, 1.5vw, 14px)', color: '#88888D', letterSpacing: '0.3em' }}>
                                VS
                            </p>
                            {matches.length > 1 && (
                                <p className="mono mt-2">+{matches.length - 1} PARTITE</p>
                            )}
                        </div>
                        <TeamCrest teamId={primaryMatch.awayTeam.id} name={primaryMatch.awayTeam.shortName || primaryMatch.awayTeam.name} size={56} />
                    </>
                )}
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div>
                    <CountdownDisplay targetTimestamp={startTimestamp} size="hero" />
                </div>
                <p className="mono mt-6">{formatDateTime(startTimestamp).toUpperCase()}</p>
            </div>
        </section>
    );
}
