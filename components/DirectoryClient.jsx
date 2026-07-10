'use client';
import { useEffect, useMemo, useState } from 'react';
import ServerModal from '@/components/ServerModal';
import LoadingLogo from '@/components/LoadingLogo';
import { favorites, searchHistory } from '@/lib/utils';

const SORTS = {
  bumps: (a, b) => b.bumpCount - a.bumpCount,
  members: (a, b) => (b.memberCount || 0) - (a.memberCount || 0),
  recent: () => 0,
};

// `initialServers` : liste déjà filtrée/triée côté serveur (utilisé par les
// pages Tendances/Nouveaux). Quand elle est fournie, on l'utilise telle
// quelle au lieu de re-fetch /api/servers, sinon ces pages affichaient la
// liste complète de l'annuaire au lieu de leur propre sélection.
// `hideBanner` : masque la barre de recherche/tri (les pages Tendances et
// Nouveaux ont déjà leur propre tri côté serveur).
export default function DirectoryClient({ initialServers = null, hideBanner = false }) {
  const [servers, setServers] = useState(initialServers);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(null);
  const [sort, setSort] = useState('bumps');
  const [hideNsfw, setHideNsfw] = useState(true);
  const [favOnly, setFavOnly] = useState(false);
  const [favIds, setFavIds] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const selectedServer = useMemo(
    () => (servers || []).find((s) => s.guildId === selectedId) || null,
    [servers, selectedId]
  );

  useEffect(() => {
    setFavIds(favorites.get());
    setHistory(searchHistory.get());
  }, []);

  const toggleFavorite = (e, guildId) => {
    e.stopPropagation();
    favorites.toggle(guildId);
    setFavIds(favorites.get());
  };

  const load = () => {
    fetch('/api/servers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setServers(data);
        setError(null);
      })
      .catch(() => setError('network_error'));
  };

  useEffect(() => {
    if (initialServers) return; // déjà fourni par la page, pas de re-fetch de la liste complète
    load();
    const interval = setInterval(load, 15000); // les compteurs de bump évoluent vite : on rafraîchit l'annuaire régulièrement
    return () => clearInterval(interval);
  }, [initialServers]);

  const allTags = useMemo(() => {
    if (!servers) return [];
    const set = new Set();
    servers.forEach((s) => (s.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 14);
  }, [servers]);

  const filtered = useMemo(() => {
    if (!servers) return [];
    let list = servers;
    if (hideNsfw) list = list.filter((s) => !s.nsfw);
    if (favOnly) list = list.filter((s) => favIds.includes(s.guildId));
    if (tag) list = list.filter((s) => (s.tags || []).includes(tag));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort(SORTS[sort]);
  }, [servers, query, tag, sort, hideNsfw, favOnly, favIds]);

  return (
    <div>
      {!hideBanner && (
        <div className="search-bar" style={{ position: 'relative' }}>
          <input
            className="search-input"
            placeholder="Rechercher un serveur (nom ou description)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                searchHistory.add(query.trim());
                setHistory(searchHistory.get());
                setShowHistory(false);
              }
            }}
          />
          {showHistory && !query && history.length > 0 && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 5,
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
                padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: '100%',
              }}
            >
              {history.map((h) => (
                <button
                  key={h}
                  className="filter-chip"
                  style={{ padding: '3px 10px', fontSize: 12.5 }}
                  onMouseDown={() => { setQuery(h); setShowHistory(false); }}
                >
                  {h}
                </button>
              ))}
              <button
                className="filter-chip"
                style={{ padding: '3px 10px', fontSize: 12.5, opacity: 0.6 }}
                onMouseDown={() => { searchHistory.clear(); setHistory([]); }}
              >
                Effacer
              </button>
            </div>
          )}
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="bumps">Plus bumpés</option>
            <option value="members">Plus de membres</option>
          </select>
        </div>
      )}

      <div className="filters-bar">
        <button className={`filter-chip ${!tag && !favOnly ? 'active' : ''}`} onClick={() => { setTag(null); setFavOnly(false); }}>Tous</button>
        {allTags.map((t) => (
          <button key={t} className={`filter-chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>
        ))}
        <button className={`filter-chip ${hideNsfw ? 'active' : ''}`} onClick={() => setHideNsfw((v) => !v)}>
          {hideNsfw ? 'NSFW masqué' : 'Afficher NSFW'}
        </button>
        <button className={`filter-chip ${favOnly ? 'active' : ''}`} onClick={() => setFavOnly((v) => !v)}>
          {favOnly ? '★ Favoris' : '☆ Favoris'} {favIds.length > 0 ? `(${favIds.length})` : ''}
        </button>
      </div>

      <div className="directory-grid">
        {error && <div className="empty-state">Impossible de charger l'annuaire pour le moment.</div>}
        {!error && servers === null && <LoadingLogo label="Chargement des serveurs…" />}
        {!error && servers !== null && filtered.length === 0 && (
          <div className="empty-state">
            {favOnly ? "Tu n'as encore aucun serveur en favoris." : 'Aucun serveur ne correspond à votre recherche.'}
          </div>
        )}
        {filtered.map((s) => (
          <div className="server-card" key={s.guildId} onClick={() => setSelectedId(s.guildId)}>
            <div className="server-card-head">
              <div className="server-avatar">
                {s.icon
                  ? <img src={`https://cdn.discordapp.com/icons/${s.guildId}/${s.icon}.png`} alt="" />
                  : s.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="server-name">{s.name}</div>
                <div className="server-meta">{s.memberCount ?? '—'} membres · {s.presenceCount ?? '—'} en ligne</div>
              </div>
              <button
                className="filter-chip"
                style={{ marginLeft: 'auto', padding: '4px 10px' }}
                title={favIds.includes(s.guildId) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                onClick={(e) => toggleFavorite(e, s.guildId)}
              >
                {favIds.includes(s.guildId) ? '★' : '☆'}
              </button>
            </div>
            {s.description && <p className="server-desc">{s.description}</p>}
            {s.tags?.length > 0 && (
              <div className="server-tags">
                {s.tags.slice(0, 4).map((t) => <span className="tag-pill" key={t}>{t}</span>)}
              </div>
            )}
            <div className="server-footer">
              <span className="bump-badge"><span className="live-dot" /> {s.bumpCount} bumps</span>
              {s.inviteLink && (
                <a className="join-btn" href={s.inviteLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Rejoindre</a>
              )}
            </div>
          </div>
        ))}
      </div>

      <ServerModal server={selectedServer} onClose={() => setSelectedId(null)} />
    </div>
  );
}
