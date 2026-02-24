const API_BASE = "https://www.fotmob.com/api";

// Cache in memoria (per istanza serverless)
const cache = {};

function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return month >= 8
    ? `${year}/${year + 1}`
    : `${year - 1}/${year}`;
}

// Calcolo TTL adattivo
function calculateTTL(nextKickoff) {
  if (!nextKickoff) return 6 * 60 * 60 * 1000; // 6h default

  const now = Date.now();
  const diff = nextKickoff - now;

  if (diff < 30 * 60 * 1000) return 60 * 1000; // <30min → 1min
  if (diff < 2 * 60 * 60 * 1000) return 5 * 60 * 1000; // <2h → 5min
  if (diff < 24 * 60 * 60 * 1000) return 15 * 60 * 1000; // <24h → 15min

  return 60 * 60 * 1000; // default 1h
}

export default async function handler(req, res) {
  const leagueId = req.query.id;

  if (!leagueId) {
    return res.status(400).json({ error: "Missing league id" });
  }

  const now = Date.now();

  // Cache hit
  if (cache[leagueId] && now < cache[leagueId].expires) {
    return res.status(200).json(cache[leagueId].data);
  }

  try {
    const season = getCurrentSeason();
    const url = `${API_BASE}/leagues?id=${leagueId}&season=${encodeURIComponent(season)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("FotMob error");
    }

    const data = await response.json();

    const matches = data.fixtures?.allMatches || [];
    const nowSec = now / 1000;

    const futureMatches = matches
      .map(m => ({
        start: new Date(m.status.utcTime).getTime()
      }))
      .filter(m => m.start / 1000 > nowSec)
      .sort((a, b) => a.start - b.start);

    const nextKickoff = futureMatches.length
      ? futureMatches[0].start
      : null;

    const ttl = calculateTTL(nextKickoff);

    cache[leagueId] = {
      data,
      expires: now + ttl
    };

    // Cache header CDN
    res.setHeader("Cache-Control", `s-maxage=${Math.floor(ttl / 1000)}`);

    return res.status(200).json(data);

  } catch (err) {
    // Backoff 15 min in caso di errore
    cache[leagueId] = {
      data: { error: "temporary error" },
      expires: now + 15 * 60 * 1000
    };

    return res.status(500).json({ error: "API failure" });
  }
}
