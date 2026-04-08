const API_BASE = 'https://kick-off-tau.vercel.app/api/league';
const CACHE_KEY = 'kickoff_data_cache';
const CACHE_DURATION = 5 * 60 * 1000;

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

export async function fetchLeagueData(leagueId) {
    const cached = getCachedData();
    if (cached[leagueId]) {
        return cached[leagueId];
    }

    try {
        const response = await fetch(`${API_BASE}/${leagueId}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const newCache = { ...cached, [leagueId]: data };
        setCachedData(newCache);
        return data;
    } catch (error) {
        console.error(`Errore fetch league ${leagueId}:`, error);
        return cached[leagueId] || null;
    }
}

export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
}
