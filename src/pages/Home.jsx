import React, { useState, useEffect, useCallback } from 'react';
import LeagueToggle from '@/components/LeagueToggle';
import LeaguePanel from '@/components/LeaguePanel';
import StickyBar from '@/components/StickyBar';
import { fetchLeagueData } from '@/utils/api';
import { findNextMatches } from '@/utils/matchUtils';

const LEAGUES = [
    { key: 'seriea', id: 55, name: 'Serie A', country: 'Italia', flag: '🇮🇹', code: 'SA' },
    { key: 'premier', id: 47, name: 'Premier League', country: 'Inghilterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'PL' },
    { key: 'laliga', id: 87, name: 'La Liga', country: 'Spagna', flag: '🇪🇸', code: 'PD' },
];

const STORAGE_KEY = 'kickoff_disabled_leagues';

function getDisabledLeagues() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveDisabledLeagues(disabled) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disabled));
}

function Spinner() {
    return (
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );
}

export default function Home() {
    const [disabledLeagues, setDisabledLeagues] = useState(getDisabledLeagues);
    const [leagueData, setLeagueData] = useState({});
    const [loading, setLoading] = useState({});
    const [tick, setTick] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    const enabledLeagues = LEAGUES.filter(l => !disabledLeagues.includes(l.key));

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchAll = useCallback(async () => {
        if (isFetching) return;
        setIsFetching(true);

        for (const league of enabledLeagues) {
            if (leagueData[league.id]) continue;
            setLoading(prev => ({ ...prev, [league.id]: true }));
            const data = await fetchLeagueData(league.id);
            if (data?.events) {
                const nextInfo = findNextMatches(data.events);
                setLeagueData(prev => ({ ...prev, [league.id]: nextInfo }));
            }
            setLoading(prev => ({ ...prev, [league.id]: false }));
        }
        setInitialLoading(false);
        setIsFetching(false);
    }, [enabledLeagues, isFetching, leagueData]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const toggleLeague = (key) => {
        setDisabledLeagues(prev => {
            const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
            saveDisabledLeagues(next);
            return next;
        });
    };

    const allNextMatches = enabledLeagues
        .map(l => {
            const data = leagueData[l.id];
            if (!data) return null;
            return { ...data, league: l };
        })
        .filter(Boolean)
        .sort((a, b) => a.startTimestamp - b.startTimestamp);

    const globalNext = allNextMatches[0] || null;

    if (initialLoading && Object.keys(leagueData).length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
                <div className="text-center">
                    <Spinner />
                    <p className="mono mt-4">CARICAMENTO...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <StickyBar visible={false} nextMatch={globalNext} />

            <header className="relative px-6 pt-12 pb-8 md:px-16 md:pt-16">
                <div className="text-center">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none">
                        KICK-OFF
                    </h1>
                    <p className="mono mt-4">
                        {new Date().toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
                    </p>
                </div>
                <div className="mt-8" style={{ height: '1px', background: '#1E1E24' }} />
            </header>

            <section className="px-6 py-6 md:px-16">
                <p className="mono mb-4">CAMPIONATI // FILTRO ATTIVO</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {LEAGUES.map(league => (
                        <LeagueToggle
                            key={league.key}
                            league={league}
                            active={!disabledLeagues.includes(league.key)}
                            onToggle={() => toggleLeague(league.key)}
                        />
                    ))}
                </div>
                <div className="mt-6" style={{ height: '1px', background: '#1E1E24' }} />
            </section>

            <section className="px-6 pb-24 md:px-16">
                {enabledLeagues.length === 0 ? (
                    <div className="py-32 text-center">
                        <p className="text-5xl mb-6">⚽</p>
                        <p className="text-white text-xl font-bold tracking-tight">NESSUN CAMPIONATO ATTIVO</p>
                        <p className="mono mt-2">ATTIVA ALMENO UN CAMPIONATO DAI TOGGLE SOPRA</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: '#1E1E24' }}>
                        {LEAGUES.map(league => {
                            const isDisabled = disabledLeagues.includes(league.key);
                            if (isDisabled) return null;
                            return (
                                <LeaguePanel
                                    key={league.key}
                                    league={league}
                                    data={leagueData[league.id]}
                                    loading={loading[league.id]}
                                />
                            );
                        })}
                    </div>
                )}
            </section>

            <footer className="px-6 py-8 md:px-16" style={{ borderTop: '1px solid #1E1E24' }}>
                <p className="mono text-center">KICK-OFF TIMER</p>
            </footer>
        </div>
    );
}
