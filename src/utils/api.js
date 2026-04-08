const API_BASE = 'https://kick-off-tau.vercel.app/api/league';
const CACHE_KEY = 'kickoff_data_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

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

// Stale-while-revalidate: ritorna subito cache se esiste, aggiorna in background
export async function fetchLeagueData(leagueId) {
    const cached = getCachedData();

    if (cached[leagueId]) {
        fetchAndCache(leagueId).catch(() => {});
        return cached[leagueId];
    }

    return fetchAndCache(leagueId);
}

export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
}
