// lib/utils.js — Utilitaires partagés

export function timeAgo(dateStr) {
  if (!dateStr) return 'jamais';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function formatNumber(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// Score réseau (même formule que le bot)
export function computeScore(server) {
  const streakBonus   = Math.min((server.bumpStreak || 0) * 2, 100);
  const weeklyScore   = (server.weeklyBumps || 0) * 5;
  const voteScore     = (server.totalVotes || 0) * 3;
  const featuredBonus = server.featured ? 200 : 0;
  return weeklyScore + streakBonus + voteScore + featuredBonus;
}

// Taille du serveur
export function serverSize(memberCount) {
  if (!memberCount) return 'unknown';
  if (memberCount < 100)  return 'small';
  if (memberCount < 1000) return 'medium';
  if (memberCount < 10000)return 'large';
  return 'huge';
}

export const SIZE_LABELS = { small: '< 100', medium: '100–1k', large: '1k–10k', huge: '10k+', unknown: '?' };

// Trending : serveur qui a beaucoup de bumps cette semaine par rapport à son total
export function isTrending(server) {
  if (!server.weeklyBumps || !server.bumpCount) return false;
  const ratio = server.weeklyBumps / Math.max(server.bumpCount, 1);
  return server.weeklyBumps >= 5 && ratio > 0.3;
}

// Nouveau serveur (moins de 7 jours dans le réseau)
export function isNew(server) {
  if (!server.createdAt) return false;
  return Date.now() - new Date(server.createdAt).getTime() < 7 * 24 * 3600 * 1000;
}

// Favoris localStorage
export const favorites = {
  get: () => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('bumpify_favs') || '[]'); } catch { return []; }
  },
  toggle: (guildId) => {
    const favs = favorites.get();
    const idx  = favs.indexOf(guildId);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(guildId);
    localStorage.setItem('bumpify_favs', JSON.stringify(favs));
    return idx < 0; // true = ajouté
  },
  has: (guildId) => favorites.get().includes(guildId),
};

// Historique de recherche
export const searchHistory = {
  get: () => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('bumpify_search_history') || '[]'); } catch { return []; }
  },
  add: (q) => {
    if (!q?.trim()) return;
    const hist = searchHistory.get().filter(h => h !== q).slice(0, 7);
    hist.unshift(q);
    localStorage.setItem('bumpify_search_history', JSON.stringify(hist));
  },
  clear: () => localStorage.removeItem('bumpify_search_history'),
};

// Votes (cookie-based, sans compte)
export const votes = {
  get: () => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('bumpify_votes') || '[]'); } catch { return []; }
  },
  hasVoted: (guildId) => votes.get().includes(guildId),
  vote: (guildId) => {
    const v = votes.get();
    if (v.includes(guildId)) return false;
    v.push(guildId);
    localStorage.setItem('bumpify_votes', JSON.stringify(v));
    return true;
  },
};
