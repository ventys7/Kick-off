const API_BASE = 'https://kick-off-tau.vercel.app/api/league';
const MATCH_API_BASE = 'https://kick-off-tau.vercel.app/api/match';
const CACHE_KEY = 'kickoff_data_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const LINEUPS_CACHE_KEY = 'kickoff_lineups_cache';
const LINEUPS_CACHE_DURATION = 3 * 60 * 1000;

export function getCachedData() {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (!stored) return {};
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp > CACHE_DURATION) return {};
        return parsed.data || {};
    } catch {
        return {};
    }
}

export function setCachedData(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

async function fetchAndCache(leagueId) {
    try {
        const response = await fetch(`${API_BASE}/${leagueId}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (data.error) throw new Error();

        const cached = getCachedData();
        const newCache = { ...cached, [leagueId]: data };
        setCachedData(newCache);
        return data;
    } catch (error) {
        console.error(`Errore fetch league ${leagueId}`);
        return null;
    }
}

export async function fetchLeagueData(leagueId) {
    const cached = getCachedData();
    if (cached[leagueId]) {
        fetchAndCache(leagueId).catch(() => {});
        return cached[leagueId];
    }
    return fetchAndCache(leagueId);
}

export function getLineupsCache() {
    try {
        const stored = localStorage.getItem(LINEUPS_CACHE_KEY);
        if (!stored) return {};
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp > LINEUPS_CACHE_DURATION) return {};
        return parsed.data || {};
    } catch {
        return {};
    }
}

function setLineupsCache(data) {
    localStorage.setItem(LINEUPS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

export async function fetchMatchFormations(matchId) {
    const cached = getLineupsCache();
    if (cached[matchId] !== undefined) {
        return cached[matchId];
    }

    try {
        const response = await fetch(`${MATCH_API_BASE}/${matchId}`);
        if (!response.ok) {
            const result = null;
            const newCache = { ...cached, [matchId]: result };
            setLineupsCache(newCache);
            return result;
        }
        const match = await response.json();
        
        const hasHomeLineup = match.homeTeam?.lineup?.length > 0;
        const hasAwayLineup = match.awayTeam?.lineup?.length > 0;
        const hasLineups = hasHomeLineup || hasAwayLineup;

        const result = {
            hasLineups,
            homeLineup: match.homeTeam?.lineup || [],
            awayLineup: match.awayTeam?.lineup || [],
            homeBench: match.homeTeam?.bench || [],
            awayBench: match.awayTeam?.bench || []
        };

        const newCache = { ...cached, [matchId]: result };
        setLineupsCache(newCache);
        return result;
    } catch (error) {
        console.error(`Errore fetch formazioni match ${matchId}`);
        const result = null;
        const newCache = { ...cached, [matchId]: result };
        setLineupsCache(newCache);
        return result;
    }
}

export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
}