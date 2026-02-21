// League IDs for Sofascore API
const LEAGUES = {
    seriea: { id: 23, name: 'Serie A', elementId: 'seriea-content' },
    premier: { id: 17, name: 'Premier League', elementId: 'premier-content' },
    laliga: { id: 8, name: 'La Liga', elementId: 'laliga-content' }
};

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
        // Ottieni la data corrente in formato YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // Sofascore API endpoint per gli eventi di un torneo
        const url = `https://api.sofascore.com/api/v1/unique-tournament/${leagueId}/events/next/0`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        
        // Salva in cache
        cachedData[leagueId] = {
            data: data,
            timestamp: now
        };
        
        return data;
    } catch (error) {
        console.error(`Errore nel recupero dati per league ${leagueId}:`, error);
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
        
        if (!data || !data.events || data.events.length === 0) {
            element.innerHTML = '<div class="error">Nessuna partita in programma</div>';
            return;
        }
        
        // Trova la prossima partita
        const now = Date.now() / 1000;
        const nextMatch = data.events.find(event => event.startTimestamp > now);
        
        if (!nextMatch) {
            element.innerHTML = '<div class="error">Nessuna partita in programma</div>';
            return;
        }
        
        // Estrai informazioni
        const homeTeam = nextMatch.homeTeam.name;
        const awayTeam = nextMatch.awayTeam.name;
        const startTime = nextMatch.startTimestamp;
        const roundInfo = nextMatch.roundInfo?.round || 'N/A';
        
        // Calcola countdown
        const timeUntilMatch = (startTime * 1000) - Date.now();
        const countdown = formatCountdown(timeUntilMatch);
        const isUrgent = timeUntilMatch < 3600000; // Meno di 1 ora
        
        // Genera HTML
        element.innerHTML = `
            <div class="matchday-info">
                <div class="matchday-number">Giornata ${roundInfo}</div>
            </div>
            <div class="next-match">
                <div class="match-teams">${homeTeam} vs ${awayTeam}</div>
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
