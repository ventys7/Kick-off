export function formatCountdown(milliseconds) {
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

export function formatShortCountdown(milliseconds) {
    if (milliseconds <= 0) return 'LIVE';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}g ${hours}h`;
    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatDateTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateTimeShort(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).toUpperCase();
}

export function findNextMatches(events) {
    if (!events || events.length === 0) return null;
    const now = Date.now() / 1000;

    const pastMatches = events
        .filter(e => e.startTimestamp <= now)
        .sort((a, b) => b.startTimestamp - a.startTimestamp);
    const futureMatches = events
        .filter(e => e.startTimestamp > now)
        .sort((a, b) => a.startTimestamp - b.startTimestamp);

    if (futureMatches.length === 0) return null;

    const lastStartedRound = pastMatches.length > 0 ? pastMatches[0].roundInfo?.round : null;

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

        if (roundsMap.size === 0) {
            nextRoundMatches = [futureMatches[0]];
        } else {
            const sorted = Array.from(roundsMap.entries())
                .sort((a, b) => a[1][0].startTimestamp - b[1][0].startTimestamp);
            nextRoundMatches = sorted[0][1];
        }
    } else {
        const firstRound = futureMatches[0].roundInfo?.round;
        nextRoundMatches = futureMatches.filter(m => m.roundInfo?.round === firstRound);
    }

    nextRoundMatches.sort((a, b) => a.startTimestamp - b.startTimestamp);
    const firstMatchTime = nextRoundMatches[0].startTimestamp;
    const simultaneousMatches = nextRoundMatches.filter(m => 
        Math.abs(m.startTimestamp - firstMatchTime) < 60
    );

    const uniqueMatches = [];
    const seenIds = new Set();
    simultaneousMatches.forEach(match => {
        if (!seenIds.has(match.id)) {
            seenIds.add(match.id);
            uniqueMatches.push(match);
        }
    });

    const roundsStatus = new Map();
    events.forEach(match => {
        const round = match.roundInfo?.round;
        if (!round) return;
        if (!roundsStatus.has(round)) roundsStatus.set(round, { started: false, allFinished: true });
        const status = roundsStatus.get(round);
        if (match.startTimestamp <= now) status.started = true;
        if (match.status?.type === 'inprogress' || match.startTimestamp > now) status.allFinished = false;
    });

    const inProgressRounds = [];
    roundsStatus.forEach((status, round) => {
        if (status.started && !status.allFinished) inProgressRounds.push(round);
    });

    return {
        matches: uniqueMatches,
        round: nextRoundMatches[0].roundInfo?.round,
        startTimestamp: firstMatchTime,
        inProgressRounds,
    };
}
