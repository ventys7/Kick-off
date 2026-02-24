// League IDs
const LEAGUES = {
    seriea: { id: 55, name: 'Serie A', elementId: 'seriea-content' },
    premier: { id: 47, name: 'Premier League', elementId: 'premier-content' },
    laliga: { id: 87, name: 'La Liga', elementId: 'laliga-content' }
};

let cachedData = {};
const CACHE_DURATION = 60000; // cache UI

async function fetchLeagueData(leagueId) {
    const now = Date.now();
    if (cachedData[leagueId] && (now - cachedData[leagueId].timestamp) < CACHE_DURATION) {
        return cachedData[leagueId].data;
    }

    try {
        const response = await fetch(`/api/league?id=${leagueId}`);
        if (!response.ok) return null;

        const raw = await response.json();
        const allMatches = raw.fixtures?.allMatches || [];
        const events = allMatches.map(match => ({
            id: match.id,
            startTimestamp: new Date(match.status.utcTime).getTime() / 1000,
            homeTeam: {
                id: match.home.id,
                name: match.home.name,
                shortName: match.home.shortName || match.home.name
            },
            awayTeam: {
                id: match.away.id,
                name: match.away.name,
                shortName: match.away.shortName || match.away.name
            },
            status: {
                type: match.status.finished ? 'finished' : (match.status.started ? 'inprogress' : 'notstarted')
            },
            roundInfo: { round: match.round }
        }));

        const result = { events };
        cachedData[leagueId] = { data: result, timestamp: now };
        return result;

    } catch (e) {
        console.error("Fetch error:", e);
        return null;
    }
}

function formatCountdown(milliseconds) {
    if (milliseconds <= 0) return 'INIZIATA!';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}g ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function updateLeagueTimer(league) {
    const element = document.getElementById(league.elementId);
    const data = await fetchLeagueData(league.id);

    if (!data || !data.events.length) {
        element.innerHTML = '<div class="error">Nessuna partita in programma</div>';
        return;
    }

    const now = Date.now() / 1000;
    const pastMatches = data.events.filter(e => e.startTimestamp <= now)
        .sort((a, b) => b.startTimestamp - a.startTimestamp);
    const futureMatches = data.events.filter(e => e.startTimestamp > now)
        .sort((a, b) => a.startTimestamp - b.startTimestamp);

    if (!futureMatches.length) {
        element.innerHTML = '<div class="error">Nessuna partita in programma</div>';
        return;
    }

    let lastStartedRound = null;
    if (pastMatches.length) {
        lastStartedRound = pastMatches[0].roundInfo?.round;
    }

    let nextRoundMatches;
    if (lastStartedRound) {
        const roundsMap = new Map();
        futureMatches.forEach(match => {
            const round = match.roundInfo?.round;
            if (round && round !== lastStartedRound) {
                if (!roundsMap.has(round)) roundsMap.set(round, []);
                roundsMap.get(round).push(match);
            }
        });
        if (roundsMap.size === 0) nextRoundMatches = [futureMatches[0]];
        else {
            const sortedRounds = Array.from(roundsMap)
                .sort((a, b) => a[1][0].startTimestamp - b[1][0].startTimestamp);
            nextRoundMatches = sortedRounds[0][1];
        }
    } else {
        const firstRound = futureMatches[0].roundInfo?.round;
        nextRoundMatches = futureMatches.filter(m => m.roundInfo?.round === firstRound);
    }

    nextRoundMatches.sort((a, b) => a.startTimestamp - b.startTimestamp);
    const firstMatchTime = nextRoundMatches[0].startTimestamp;
    const simultaneousMatches = nextRoundMatches.filter(m =>
        Math.abs(m.startTimestamp - firstMatchTime) < 60);

    const uniqueMatches = [];
    const seen = new Set();
    simultaneousMatches.forEach(m => {
        if (!seen.has(m.id)) {
            seen.add(m.id);
            uniqueMatches.push(m);
        }
    });

    const inProgressRounds = new Set();
    const roundsStatus = new Map();
    data.events.forEach(match => {
        const round = match.roundInfo?.round;
        if (!round) return;
        if (!roundsStatus.has(round)) {
            roundsStatus.set(round, { started: false, allFinished: true });
        }
        const status = roundsStatus.get(round);
        if (match.startTimestamp <= now) status.started = true;
        if (match.status?.type === 'inprogress' || match.startTimestamp > now) {
            status.allFinished = false;
        }
    });
    roundsStatus.forEach((status, round) => {
        if (status.started && !status.allFinished) inProgressRounds.add(round);
    });

    let inProgressBanner = '';
    if (inProgressRounds.size) {
        const sorted = Array.from(inProgressRounds).sort((a, b) => a - b);
        const txt = sorted.length === 1
            ? `Giornata ${sorted[0]}`
            : `Giornate ${sorted.join(', ')}`;
        inProgressBanner = `<div class="in-progress-banner">🟢 ${txt} in corso</div>`;
    }

    let matchesHTML = '';
    uniqueMatches.forEach(match => {
        matchesHTML += `
            <div class="match-item">
                <div class="team">
                    <img src="https://images.fotmob.com/image_resources/logo/teamlogo/${match.homeTeam.id}.png"
                         alt="${match.homeTeam.shortName}"
                         class="team-logo"
                         onerror="this.style.display='none'">
                    <span class="team-name">${match.homeTeam.shortName}</span>
                </div>
                <div class="vs">vs</div>
                <div class="team">
                    <img src="https://images.fotmob.com/image_resources/logo/teamlogo/${match.awayTeam.id}.png"
                         alt="${match.awayTeam.shortName}"
                         class="team-logo"
                         onerror="this.style.display='none'">
                    <span class="team-name">${match.awayTeam.shortName}</span>
                </div>
            </div>`;
    });

    element.innerHTML = `
        ${inProgressBanner}
        <div class="matchday-info">
            <div class="matchday-number">Giornata ${nextRoundMatches[0].roundInfo?.round}</div>
            ${uniqueMatches.length > 1 ? `<div class="multiple-matches">${uniqueMatches.length} partite contemporanee</div>` : ''}
        </div>
        <div class="next-match">${matchesHTML}<div class="match-time">${formatDateTime(firstMatchTime)}</div></div>
        <div class="countdown">
            <div class="countdown-label">Mancano</div>
            <div class="countdown-timer">${formatCountdown((firstMatchTime * 1000) - Date.now())}</div>
        </div>
    `;
}

async function updateAllTimers() {
    await Promise.all([
        updateLeagueTimer(LEAGUES.seriea),
        updateLeagueTimer(LEAGUES.premier),
        updateLeagueTimer(LEAGUES.laliga)
    ]);
}

updateAllTimers();
setInterval(updateAllTimers, 60000);
