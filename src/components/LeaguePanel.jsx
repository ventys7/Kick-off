import React from 'react';
import { motion } from 'framer-motion';
import CountdownDisplay from './CountdownDisplay';
import { Loader2 } from 'lucide-react';

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
                    src={`https://crests.football-data.org/${match.homeTeam.id}.svg`}
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
                    src={`https://crests.football-data.org/${match.awayTeam.id}.svg`}
                    alt={away}
                    style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
        </div>
    );
}

export default function LeaguePanel({ league, data, loading }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3 }}
            className="league-panel-enter"
            style={{ background: '#0F0F12', transformOrigin: 'top' }}
        >
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1E1E24' }}>
                <div className="flex items-center gap-3">
                    <span className="text-xl">{league.flag}</span>
                    <div>
                        <p className="font-black uppercase tracking-tight text-white" style={{ fontSize: 15 }}>
                            {league.name}
                        </p>
                        <p className="mono">{league.country.toUpperCase()} // {league.code}</p>
                    </div>
                </div>

                {data?.inProgressRounds?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5" style={{ background: '#ffffff', animation: 'pulse-glow 1.5s infinite' }} />
                        <span className="mono text-white" style={{ fontSize: 10 }}>LIVE</span>
                    </div>
                )}
            </div>

            <div className="px-5 pt-5 pb-6">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                        <span className="mono ml-3">CARICAMENTO DATI...</span>
                    </div>
                ) : !data ? (
                    <div className="py-10 text-center">
                        <p className="font-bold text-white uppercase tracking-tight">NESSUNA PARTITA</p>
                        <p className="mono mt-1">STAGIONE TERMINATA</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="mono">GIORNATA {data.round}</p>
                            {data.matches.length > 1 && (
                                <p className="mono">{data.matches.length} PARTITE CONTEMP.</p>
                            )}
                        </div>

                        <div className="mb-5" style={{ border: '1px solid #1E1E24' }}>
                            {data.matches.map(match => (
                                <MatchRow key={match.id} match={match} />
                            ))}
                        </div>

                        <CountdownDisplay targetTimestamp={data.startTimestamp} size="lg" />

                        <p className="mono mt-3" style={{ color: '#88888D', fontSize: 11 }}>
                            {new Date(data.startTimestamp * 1000).toLocaleDateString('it-IT', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            }).toUpperCase()}
                        </p>
                    </>
                )}
            </div>
        </motion.div>
    );
}
