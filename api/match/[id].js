const API_BASE = "https://api.football-data.org/v4";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const matchId = req.query.id;
    const token = process.env.FOOTBALL_DATA_TOKEN;

    if (!token) {
        return res.status(500).json({ error: "API token not configured" });
    }

    if (!matchId) {
        return res.status(400).json({ error: "Match ID required" });
    }

    try {
        const url = `${API_BASE}/matches/${matchId}`;
        
        const response = await fetch(url, {
            headers: { "X-Auth-Token": token }
        });

        if (!response.ok) {
            return res.status(500).json({ error: "API error" });
        }

        const match = await response.json();

        const result = {
            id: match.id,
            startTimestamp: new Date(match.utcDate).getTime() / 1000,
            homeTeam: {
                id: match.homeTeam.id,
                name: match.homeTeam.name,
                shortName: match.homeTeam.shortName || match.homeTeam.name,
                crest: match.homeTeam.crest || '',
                lineup: match.homeTeam.lineup || [],
                bench: match.homeTeam.bench || []
            },
            awayTeam: {
                id: match.awayTeam.id,
                name: match.awayTeam.name,
                shortName: match.awayTeam.shortName || match.awayTeam.name,
                crest: match.awayTeam.crest || '',
                lineup: match.awayTeam.lineup || [],
                bench: match.awayTeam.bench || []
            },
            status: {
                type: match.status === "FINISHED" ? "finished" : 
                      match.status === "IN_PLAY" ? "inprogress" : "notstarted"
            },
            roundInfo: {
                round: match.matchday
            }
        };

        res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate');
        res.json(result);

    } catch (err) {
        console.error('Match API error:', err);
        res.status(500).json({ error: "Server error" });
    }
}