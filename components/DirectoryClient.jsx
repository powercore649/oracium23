'use client';
import { useEffect, useMemo, useState } from 'react';
import ServerModal from '@/components/ServerModal';
import LoadingLogo from '@/components/LoadingLogo';

const SORTS = {
  bumps: (a, b) => b.bumpCount - a.bumpCount,
  members: (a, b) => (b.memberCount || 0) - (a.memberCount || 0),
  recent: () => 0,
};

export default function DirectoryClient() {
  const [servers, setServers] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(null);
  const [sort, setSort] = useState('bumps');
  const [hideNsfw, setHideNsfw] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const selectedServer = useMemo(
    () => (servers || []).find((s) => s.guildId === selectedId) || null,
    [servers, selectedId]
  );

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
    load();
    const interval = setInterval(load, 15000); // les compteurs de bump évoluent vite : on rafraîchit l'annuaire régulièrement
    return () => clearInterval(interval);
  }, []);

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
    if (tag) list = list.filter((s) => (s.tags || []).includes(tag));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort(SORTS[sort]);
  }, [servers, query, tag, sort, hideNsfw]);

  return (
    <div>
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Rechercher un serveur (nom ou description)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="bumps">Plus bumpés</option>
          <option value="members">Plus de membres</option>
        </select>
      </div>

      <div className="filters-bar">
        <button className={`filter-chip ${!tag ? 'active' : ''}`} onClick={() => setTag(null)}>Tous</button>
        {allTags.map((t) => (
          <button key={t} className={`filter-chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>
        ))}
        <button className={`filter-chip ${hideNsfw ? 'active' : ''}`} onClick={() => setHideNsfw((v) => !v)}>
          {hideNsfw ? 'NSFW masqué' : 'Afficher NSFW'}
        </button>
      </div>

      <div className="directory-grid">
        {error && <div className="empty-state">Impossible de charger l'annuaire pour le moment.</div>}
        {!error && servers === null && <LoadingLogo label="Chargement des serveurs…" />}
        {!error && servers !== null && filtered.length === 0 && (
          <div className="empty-state">Aucun serveur ne correspond à votre recherche.</div>
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
