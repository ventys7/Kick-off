import React from 'react';

function Spinner() {
    return (
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );
}

function MatchRow({ match }) {
    const home = match.homeTeam.shortName || match.homeTeam.name;
    const away = match.awayTeam.shortName || match.awayTeam.name;

    return (
        <div
            className="match-card relative flex items-center justify-between py-3 px-4"
            style={{ borderBottom: '1px solid #1E1E24' }}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                    src={`https://crests.football-data.org/${match.homeTeam.id}.png`}
                    alt={home}
                    style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="font-bold uppercase tracking-tight truncate" style={{ fontSize: 13, color: '#ffffff' }}>
                    {home}
                </span>
            </div>

            <span className="font-black mx-3 flex-shrink-0" style={{ fontSize: 10, color: '#88888D', letterSpacing: '0.2em' }}>
                VS
            </span>

            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                <span className="font-bold uppercase tracking-tight truncate text-right" style={{ fontSize: 13, color: '#ffffff' }}>
                    {away}
                </span>
                <img
                    src={`https://crests.football-data.org/${match.awayTeam.id}.png`}
                    alt={away}
                    style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
        </div>
    );
}

export default function LeaguePanel({ league, data, loading, onMoveUp, onMoveDown, isFirst, isLast, hasFormations }) {
    const inProgressRounds = data?.inProgressRounds || [];
    const roundsText = inProgressRounds.length > 1 
        ? inProgressRounds.sort((a, b) => a - b).join(', ') 
        : inProgressRounds[0] || '';

    return (
        <div style={{ background: '#0F0F12' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1E1E24' }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl">{league.flag}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-black uppercase tracking-tight text-white" style={{ fontSize: 15 }}>
                            {league.name}
                            {inProgressRounds.length > 0 && (
                                <span className="ml-2 text-white/60" style={{ fontSize: 11 }}>
                                    — IN CORSO GIORNATA {roundsText}
                                </span>
                            )}
                        </p>
                        <p className="mono">{league.country.toUpperCase()} // {league.code}</p>
                    </div>
                </div>
                <div className="flex gap-1 ml-2 md:hidden">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="w-7 h-7 flex items-center justify-center border text-sm transition-colors"
                        style={{
                            borderColor: isFirst ? '#1E1E24' : '#88888D',
                            background: 'transparent',
                            color: isFirst ? '#1E1E24' : '#88888D',
                            cursor: isFirst ? 'not-allowed' : 'pointer',
                        }}
                    >
                        ↑
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="w-7 h-7 flex items-center justify-center border text-sm transition-colors"
                        style={{
                            borderColor: isLast ? '#1E1E24' : '#88888D',
                            background: 'transparent',
                            color: isLast ? '#1E1E24' : '#88888D',
                            cursor: isLast ? 'not-allowed' : 'pointer',
                        }}
                    >
                        ↓
                    </button>
                </div>
            </div>

            <div className="px-5 pt-5 pb-6">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Spinner />
                        <span className="mono ml-3">CARICAMENTO...</span>
                    </div>
                ) : !data ? (
                    <div className="py-10 text-center">
                        <p className="font-bold text-white uppercase tracking-tight">NESSUNA PARTITA</p>
                        <p className="mono mt-1">STAGIONE TERMINATA</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <p className="mono">GIORNATA {data.round}</p>
                            {data.matches.length > 1 && (
                                <p className="mono mt-1">{data.matches.length} PARTITE CONTEMP.</p>
                            )}
                        </div>

                        <div className="mb-5" style={{ border: '1px solid #1E1E24' }}>
                            {data.matches.map(match => (
                                <MatchRow key={match.id} match={match} />
                            ))}
                        </div>

                        {hasFormations && (
                            <div className="text-center mb-4 py-2" style={{ background: 'transparent', border: 'none' }}>
                                <span className="font-bold" style={{ color: '#ffffff', fontSize: 12 }}>
                                    🔔 FORMAZIONI DISPONIBILI 📋
                                </span>
                            </div>
                        )}

                        <div className="text-center">
                            <CountdownDisplay targetTimestamp={data.startTimestamp} />
                            <p className="mono mt-3" style={{ color: '#AAAAAA', fontSize: 13 }}>
                                {new Date(data.startTimestamp * 1000).toLocaleDateString('it-IT', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }).toUpperCase()}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

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

function CountdownDisplay({ targetTimestamp }) {
    const ms = targetTimestamp * 1000 - Date.now();
    const { parts, isLive } = formatCountdown(ms);

    if (isLive) {
        return (
            <span className="font-black tracking-tighter text-3xl" style={{ color: '#ffffff', animation: 'pulse-glow 1.5s infinite' }}>
                LIVE
            </span>
        );
    }

    return (
        <div className="flex items-center justify-center gap-1 md:gap-2">
            {parts.map((part, i) => (
                <React.Fragment key={part.label}>
                    <div className="flex flex-col items-center">
                        <div className="flex">
                            {part.value.split('').map((digit, di) => (
                                <span key={`${part.label}-${di}`} className="font-black text-4xl md:text-5xl tracking-tighter leading-none">
                                    {digit}
                                </span>
                            ))}
                        </div>
                        <span className="font-mono" style={{ fontSize: 10, color: '#88888D', letterSpacing: '0.15em' }}>
                            {part.label}
                        </span>
                    </div>
                    {i < parts.length - 1 && (
                        <span className="font-black pb-3 text-xl" style={{ color: '#88888D' }}>:</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
