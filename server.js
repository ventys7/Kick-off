const express = require("express");

const app = express();
const PORT = 3000;

const API_BASE = "https://api.football-data.org/v4";
const API_TOKEN = "a88e43e5191141e2b2b2501d42f67541";
const CACHE_DURATION = 5 * 60 * 1000;

const cache = {};

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

app.get("/league/:id", async (req, res) => {
    const leagueId = req.params.id;
    const now = Date.now();

    if (cache[leagueId] && now - cache[leagueId].timestamp < CACHE_DURATION) {
        return res.json(cache[leagueId].data);
    }

    try {
        const competitionCode = LEAGUE_MAP[leagueId];
        if (!competitionCode) {
            return res.status(400).json({ error: "Unknown league" });
        }

        const season = getCurrentSeason();
        const url = `${API_BASE}/competitions/${competitionCode}/matches?season=${season}`;

        const response = await fetch(url, {
            headers: { "X-Auth-Token": API_TOKEN }
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
                shortName: match.homeTeam.shortName || match.homeTeam.name
            },
            awayTeam: {
                id: match.awayTeam.id,
                name: match.awayTeam.name,
                shortName: match.awayTeam.shortName || match.awayTeam.name
            },
            status: {
                type: match.status === "FINISHED" ? "finished" : (match.status === "IN_PLAY" ? "inprogress" : "notstarted")
            },
            roundInfo: {
                round: match.matchday
            }
        }));

        const result = { events };

        cache[leagueId] = {
            data: result,
            timestamp: now
        };

        res.json(result);

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
