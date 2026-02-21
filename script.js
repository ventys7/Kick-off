// League IDs for Sofascore API
const LEAGUES = {
    seriea: { id: 23, name: 'Serie A', elementId: 'seriea-content' },
    premier: { id: 17, name: 'Premier League', elementId: 'premier-content' },
    laliga: { id: 8, name: 'La Liga', elementId: 'laliga-content' }
};

// CORS proxy per aggirare il blocco di Sofascore
const CORS_PROXY = 'https://corsproxy.io/?';

// Cache per evitare troppe chiamate API
let cachedData = {};
const CACHE_DURATION = 60000; // 1 minuto

async function fetchLeagueData(leagueId) {
    const now = Date.now();
    
    // Controlla cache
    if (cachedData[leagueId] && (now - cachedData[leagueId].timestamp) < CACHE_DURATION) {
        return cachedData[leagueId].data;
    }
    
    try {
        // Raccoglie eventi da più giorni per avere dati completi
        const today = new Date();
        const allEvents = [];
        
        // Prendi eventi da -7 a +30 giorni per vedere giornate in corso e future
        for (let i = -7; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const url = `https://www.sofascore.com/api/v1/sport/football/scheduled-events/${dateStr}`;
            const proxiedUrl = CORS_PROXY + encodeURIComponent(url);
            
            try {
                const response = await fetch(proxiedUrl);
                if (!response.ok) continue;
                
                const data = await response.json();
                
                if (data.events) {
                    const leagueEvents = data.events.filter(event => 
                        event.tournament?.uniqueTournament?.id === leagueId
                    );
                    allEvents.push(...leagueEvents);
                }
            } catch (e) {
                continue;
            }
        }
        
        if (allEvents.length === 0) {
            return { events: [] };
        }
        
        const result = { events: allEvents };
        
        // Salva in cache
        cachedData[leagueId] = {
            data: result,
            timestamp: now
        };
        
        return result;
    } catch (error) {
        console.error(`Errore nel recupero dati per league ${leagueId}:`, error);
        console.error('Dettagli errore:', error.message);
        return null;
    }
}

function formatCountdown(milliseconds) {
    if (milliseconds <= 0) {
        return 'INIZIATA!';
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        const remainingHours = hours % 24;
        return `${days}g ${remainingHours}h`;
    } else if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('it-IT', options);
}

async function updateLeagueTimer(league) {
    const element = document.getElementById(league.elementId);
    
    try {
        const data = await fetchLeagueData(league.id);
        
        if (!data) {
            element.innerHTML = '<div class="error">Errore di connessione. Verifica la rete.</div>';
            return;
        }
        
        if (!data.events || data.events.length === 0) {
            element.innerHTML = '<div class="error">Nessuna partita in programma</div>';
            console.log(`Nessun evento trovato per ${league.name}`);
            return;
        }
        
        const now = Date.now() / 1000;
        
        // Separa partite passate e future
        const pastMatches = data.events.filter(e => e.startTimestamp <= now).sort((a, b) => b.startTimestamp - a.startTimestamp);
        const futureMatches = data.events.filter(e => e.startTimestamp > now).sort((a, b) => a.startTimestamp - b.startTimestamp);
        
        if (futureMatches.length === 0) {
            element.innerHTML = '<div class="error">Nessuna partita in programma</div>';
            return;
        }
        
        // Trova l'ultima giornata iniziata (se esiste)
        let lastStartedRound = null;
        if (pastMatches.length > 0) {
            lastStartedRound = pastMatches[0].roundInfo?.round;
        }
        
        // Trova la prossima giornata
        let nextRoundMatches;
        if (lastStartedRound) {
            // Cerca la prima giornata futura diversa dall'ultima iniziata
            const roundsMap = new Map();
            futureMatches.forEach(match => {
                const round = match.roundInfo?.round;
                if (round && round !== lastStartedRound) {
                    if (!roundsMap.has(round)) {
                        roundsMap.set(round, []);
                    }
                    roundsMap.get(round).push(match);
                }
            });
            
            if (roundsMap.size === 0) {
                // Se non ci sono giornate diverse, prendi la prima futura
                nextRoundMatches = [futureMatches[0]];
            } else {
                // Prendi la giornata con la prima partita cronologicamente
                const sortedRounds = Array.from(roundsMap.entries())
                    .sort((a, b) => a[1][0].startTimestamp - b[1][0].startTimestamp);
                nextRoundMatches = sortedRounds[0][1];
            }
        } else {
            // Nessuna partita iniziata, prendi la prima giornata futura
            const firstRound = futureMatches[0].roundInfo?.round;
            nextRoundMatches = futureMatches.filter(m => m.roundInfo?.round === firstRound);
        }
        
        // Ordina per timestamp
        nextRoundMatches.sort((a, b) => a.startTimestamp - b.startTimestamp);
        
        // Trova le partite che iniziano allo stesso momento della prima
        const firstMatchTime = nextRoundMatches[0].startTimestamp;
        const simultaneousMatches = nextRoundMatches.filter(m => 
            Math.abs(m.startTimestamp - firstMatchTime) < 60 // Entro 1 minuto
        );
        
        // Rimuovi duplicati basandoti sull'ID dell'evento
        const uniqueMatches = [];
        const seenIds = new Set();
        simultaneousMatches.forEach(match => {
            if (!seenIds.has(match.id)) {
                seenIds.add(match.id);
                uniqueMatches.push(match);
            }
        });
        
        const roundInfo = nextRoundMatches[0].roundInfo?.round || 'N/A';
        const startTime = firstMatchTime;
        const timeUntilMatch = (startTime * 1000) - Date.now();
        const countdown = formatCountdown(timeUntilMatch);
        const isUrgent = timeUntilMatch < 3600000;
        
        // Controlla tutte le giornate in corso
        let inProgressBanner = '';
        const inProgressRounds = new Set();
        
        // Trova tutte le giornate che hanno partite già iniziate ma non tutte completate
        const roundsStatus = new Map();
        data.events.forEach(match => {
            const round = match.roundInfo?.round;
            if (!round) return;
            
            if (!roundsStatus.has(round)) {
                roundsStatus.set(round, { started: false, allFinished: true });
            }
            
            const status = roundsStatus.get(round);
            if (match.startTimestamp <= now) {
                status.started = true;
            }
            if (match.status?.type === 'inprogress' || match.startTimestamp > now) {
                status.allFinished = false;
            }
        });
        
        // Trova le giornate in corso (iniziate ma non finite)
        roundsStatus.forEach((status, round) => {
            if (status.started && !status.allFinished) {
                inProgressRounds.add(round);
            }
        });
        
        if (inProgressRounds.size > 0) {
            const rounds = Array.from(inProgressRounds).sort((a, b) => a - b);
            const roundsText = rounds.length === 1 
                ? `Giornata ${rounds[0]}` 
                : `Giornate ${rounds.join(', ')}`;
            inProgressBanner = `
                <div class="in-progress-banner">
                    🟢 ${roundsText} in corso
                </div>
            `;
        }
        
        // Genera HTML per le partite
        let matchesHTML = '';
        uniqueMatches.forEach(match => {
            const homeTeam = match.homeTeam.shortName || match.homeTeam.name;
            const awayTeam = match.awayTeam.shortName || match.awayTeam.name;
            const homeId = match.homeTeam.id;
            const awayId = match.awayTeam.id;
            
            matchesHTML += `
                <div class="match-item">
                    <div class="team">
                        <img src="https://api.sofascore.app/api/v1/team/${homeId}/image" 
                             alt="${homeTeam}" 
                             class="team-logo"
                             onerror="this.style.display='none'">
                        <span class="team-name">${homeTeam}</span>
                    </div>
                    <div class="vs">vs</div>
                    <div class="team">
                        <img src="https://api.sofascore.app/api/v1/team/${awayId}/image" 
                             alt="${awayTeam}" 
                             class="team-logo"
                             onerror="this.style.display='none'">
                        <span class="team-name">${awayTeam}</span>
                    </div>
                </div>
            `;
        });
        
        // Genera HTML completo
        element.innerHTML = `
            ${inProgressBanner}
            <div class="matchday-info">
                <div class="matchday-number">Giornata ${roundInfo}</div>
                ${uniqueMatches.length > 1 ? `<div class="multiple-matches">${uniqueMatches.length} partite contemporanee</div>` : ''}
            </div>
            <div class="next-match">
                ${matchesHTML}
                <div class="match-time">${formatDateTime(startTime)}</div>
            </div>
            <div class="countdown">
                <div class="countdown-label">Mancano</div>
                <div class="countdown-timer ${isUrgent ? 'urgent' : ''}">${countdown}</div>
            </div>
        `;
        
    } catch (error) {
        console.error(`Errore aggiornamento ${league.name}:`, error);
        element.innerHTML = '<div class="error">Errore nel caricamento</div>';
    }
}

async function updateAllTimers() {
    await Promise.all([
        updateLeagueTimer(LEAGUES.seriea),
        updateLeagueTimer(LEAGUES.premier),
        updateLeagueTimer(LEAGUES.laliga)
    ]);
}

// Inizializza
updateAllTimers();

// Aggiorna ogni secondo per il countdown
setInterval(updateAllTimers, 1000);

// Forza aggiornamento dati dall'API ogni minuto
setInterval(() => {
    cachedData = {};
}, 60000);
