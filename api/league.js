const API_BASE = "https://www.fotmob.com/api";

// Cache in memoria per funzionalità edge
const cache = {};

function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return month >= 8
        ? `${year}/${year + 1}`
        : `${year - 1}/${year}`;
}

function calculateTTL(nextKickoff) {
    if (!nextKickoff) return 60 * 60 * 1000; // default 1h

    const now = Date.now();
    const diff = nextKickoff - now;

    if (diff < 30 * 60 * 1000) return 60 * 1000;
    if (diff < 2 * 60 * 60 * 1000) return 5 * 60 * 1000;
    if (diff < 24 * 60 * 60 * 1000) return 15 * 60 * 1000;
    return 60 * 60 * 1000;
}

export default async function handler(req, res) {
    const leagueId = req.query.id;
    if (!leagueId) return res.status(400).json({ error: "Missing league id" });

    const now = Date.now();
    // Cache hit
    if (cache[leagueId] && now < cache[leagueId].expires) {
        res.setHeader("Cache-Control", `s-maxage=${Math.floor((cache[leagueId].expires - now) / 1000)}`);
        return res.status(200).json(cache[leagueId].data);
    }

    try {
        const season = getCurrentSeason();
        const url = `${API_BASE}/leagues?id=${leagueId}&season=${encodeURIComponent(season)}`;
        const fetchRes = await fetch(url);

        if (!fetchRes.ok) throw new Error("FotMob API error");

        const data = await fetchRes.json();

        const allMatches = data.fixtures?.allMatches || [];
        const nowSec = now / 1000;

        const futureMatches = allMatches
            .map(m => ({ start: new Date(m.status.utcTime).getTime() }))
            .filter(m => m.start / 1000 > nowSec)
            .sort((a, b) => a.start - b.start);

        const nextKickoff = futureMatches.length ? futureMatches[0].start : null;
        const ttl = calculateTTL(nextKickoff);

        cache[leagueId] = { data, expires: now + ttl };

        res.setHeader("Cache-Control", `s-maxage=${Math.floor(ttl / 1000)}`);
        return res.status(200).json(data);

    } catch (error) {
        cache[leagueId] = { data: { error: "temporary error" }, expires: now + 15 * 60 * 1000 };
        return res.status(500).json({ error: "API failure" });
    }
}
