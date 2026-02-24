// ============================
// CONFIG
// ============================

const LEAGUES = {
  seriea: { id: 55, elementId: "seriea-content" },
  premier: { id: 47, elementId: "premier-content" },
  laliga: { id: 87, elementId: "laliga-content" }
};

let nextKickoffs = {};
let schedulerTimeout = null;

// ============================
// UTIL
// ============================

function formatCountdown(ms) {
  if (ms <= 0) return "INIZIATA!";

  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d}g ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatDateTime(ts) {
  return new Date(ts).toLocaleString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ============================
// CREATE DOM ONCE
// ============================

function createLeagueUI(league) {
  const container = document.getElementById(league.elementId);

  container.innerHTML = `
    <div class="matchday-number"></div>
    <div class="match-item">
      <div class="team home"></div>
      <div class="vs">vs</div>
      <div class="team away"></div>
    </div>
    <div class="match-time"></div>
    <div class="countdown">
      <div class="countdown-label">Mancano</div>
      <div class="countdown-timer">--</div>
    </div>
  `;
}

// ============================
// FETCH FROM VERCEL API
// ============================

async function fetchLeagueData(leagueId) {
  const response = await fetch(`/api/league?id=${leagueId}`);
  if (!response.ok) return null;
  return await response.json();
}

// ============================
// UPDATE SINGLE LEAGUE
// ============================

async function updateLeague(league) {
  const data = await fetchLeagueData(league.id);
  if (!data?.fixtures?.allMatches) return;

  const now = Date.now();

  const futureMatches = data.fixtures.allMatches
    .map(match => ({
      start: new Date(match.status.utcTime).getTime(),
      home: match.home.name,
      away: match.away.name,
      round: match.round
    }))
    .filter(m => m.start > now)
    .sort((a, b) => a.start - b.start);

  if (!futureMatches.length) return;

  const nextMatch = futureMatches[0];
  nextKickoffs[league.id] = nextMatch.start;

  const container = document.getElementById(league.elementId);

  container.querySelector(".matchday-number").textContent =
    `Giornata ${nextMatch.round || "N/A"}`;

  container.querySelector(".home").textContent = nextMatch.home;
  container.querySelector(".away").textContent = nextMatch.away;

  container.querySelector(".match-time").textContent =
    formatDateTime(nextMatch.start);
}

// ============================
// COUNTDOWN LOOP (UI only)
// ============================

function updateCountdowns() {
  const now = Date.now();

  Object.values(LEAGUES).forEach(league => {
    const kickoff = nextKickoffs[league.id];
    if (!kickoff) return;

    const el = document.querySelector(
      `#${league.elementId} .countdown-timer`
    );

    if (!el) return;

    const diff = kickoff - now;
    el.textContent = formatCountdown(diff);

    if (diff < 3600000) {
      el.classList.add("urgent");
    } else {
      el.classList.remove("urgent");
    }
  });
}

setInterval(updateCountdowns, 1000);

// ============================
// SMART SCHEDULER (FRONTEND LIGHT)
// ============================

function scheduleNextUpdate() {
  if (schedulerTimeout) clearTimeout(schedulerTimeout);

  let interval = 30 * 60 * 1000; // fallback 30min

  const now = Date.now();

  Object.values(nextKickoffs).forEach(kickoff => {
    const diff = kickoff - now;

    if (diff < 30 * 60 * 1000) {
      interval = Math.min(interval, 2 * 60 * 1000);
    } else if (diff < 2 * 60 * 60 * 1000) {
      interval = Math.min(interval, 5 * 60 * 1000);
    } else if (diff < 24 * 60 * 60 * 1000) {
      interval = Math.min(interval, 15 * 60 * 1000);
    }
  });

  schedulerTimeout = setTimeout(updateAll, interval);
}

// ============================
// MASTER UPDATE
// ============================

async function updateAll() {
  await Promise.all(Object.values(LEAGUES).map(updateLeague));
  scheduleNextUpdate();
}

// ============================
// INIT
// ============================

Object.values(LEAGUES).forEach(createLeagueUI);
updateAll();
