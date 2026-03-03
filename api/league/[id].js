const API_BASE = "https://api.football-data.org/v4";

const LEAGUE_MAP = {
    "55": "SA",
    "47": "PL",
    "87": "PD"
};

function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 8 ? year : year - 1;
}

export default async function handler(req, res) {
    const leagueId = req.query.id;
    const token = process.env.FOOTBALL_DATA_TOKEN;

    if (!token) {
        return res.status(500).json({ error: "API token not configured" });
    }

    try {
        const competitionCode = LEAGUE_MAP[leagueId];
        if (!competitionCode) {
            return res.status(400).json({ error: "Unknown league" });
        }

        const season = getCurrentSeason();
        const url = `${API_BASE}/competitions/${competitionCode}/matches?season=${season}`;

        const response = await fetch(url, {
            headers: { "X-Auth-Token": token }
        });

        if (!response.ok) {
            return res.status(500).json({ error: "API error" });
        }

        const data = await response.json();

        const events = data.matches.map(match => ({
            id: match.id,
            startTimestamp: new Date(match.utcDate).getTime() / 1000,
            homeTeam: {
                id: match.homeTeam.id,
                name: match.homeTeam.name,
                shortName: match.homeTeam.shortName || match.homeTeam.name,
                crest: match.homeTeam.crest || ''
            },
            awayTeam: {
                id: match.awayTeam.id,
                name: match.awayTeam.name,
                shortName: match.awayTeam.shortName || match.awayTeam.name,
                crest: match.awayTeam.crest || ''
            },
            status: {
                type: match.status === "FINISHED" ? "finished" : 
                      match.status === "IN_PLAY" ? "inprogress" : "notstarted"
            },
            roundInfo: {
                round: match.matchday
            }
        }));

        const result = { events };
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        res.json(result);

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
}
