'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import LoadingLogo from '@/components/LoadingLogo';
import { formatNumber } from '@/lib/utils';

export default function AccountClient() {
  const { data: session, status } = useSession();
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const load = () => {
    fetch('/api/account', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setAccount(data);
        setError(null);
        setLastSync(new Date());
      })
      .catch(() => setError('network_error'));
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    load();
    // Synchronisation automatique : le bot met à jour ces données en continu
    // (bumps, XP, coins...), donc on rafraîchit régulièrement plutôt que de
    // se fier à un chargement unique.
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'loading') {
    return <LoadingLogo label="Chargement de la session…" />;
  }

  if (status !== 'authenticated') {
    return (
      <div className="empty-state" style={{ maxWidth: 480, margin: '10vh auto', textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>Connecte-toi avec Discord pour voir ton compte.</p>
        <button className="filter-chip active" onClick={() => signIn('discord')}>
          Se connecter avec Discord
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 6vw 8vh', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        {session.user?.image && (
          <img src={session.user.image} alt="" style={{ width: 56, height: 56, borderRadius: '50%' }} />
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{session.user?.name}</div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {lastSync ? `Synchronisé à l'instant (${lastSync.toLocaleTimeString('fr-FR')})` : 'Synchronisation…'}
          </div>
        </div>
      </div>

      {error && (
        <div className="empty-state">
          Impossible de charger tes données pour le moment. Nouvel essai automatique dans 15s.
        </div>
      )}

      {!error && account === null && <LoadingLogo label="Chargement de tes statistiques…" />}

      {!error && account !== null && account.guilds.length === 0 && (
        <div className="empty-state">
          Aucune activité détectée sur un serveur du réseau Bumpify pour l'instant.
          Bump un serveur ou discute un peu pour voir apparaître tes stats ici.
        </div>
      )}

      {!error && account?.guilds?.length > 0 && (
        <div className="directory-grid">
          {account.guilds.map((g) => (
            <div className="server-card" key={g.guildId} style={{ cursor: 'default' }}>
              <div className="server-card-head">
                <div className="server-avatar">
                  {g.guildIcon
                    ? <img src={`https://cdn.discordapp.com/icons/${g.guildId}/${g.guildIcon}.png`} alt="" />
                    : g.guildName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="server-name">{g.guildName}</div>
                  <div className="server-meta">Niveau {g.level} · {formatNumber(g.totalXp)} XP</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 4 }}>
                <div className="stat-chip">
                  <div className="stat-chip-num">{formatNumber(g.bumps)}</div>
                  <div className="stat-chip-label">🚀 Bumps</div>
                </div>
                <div className="stat-chip">
                  <div className="stat-chip-num">{g.streak}</div>
                  <div className="stat-chip-label">🔥 Streak</div>
                </div>
                <div className="stat-chip">
                  <div className="stat-chip-num">{formatNumber(g.coins)}</div>
                  <div className="stat-chip-label">🪙 Coins</div>
                </div>
                <div className="stat-chip">
                  <div className="stat-chip-num">{formatNumber(g.reputation)}</div>
                  <div className="stat-chip-label">⭐ Réputation</div>
                </div>
              </div>

              {g.badges?.length > 0 && (
                <div className="server-tags" style={{ marginTop: 10 }}>
                  {g.badges.map((b) => (
                    <span key={b.name} className="tag-pill" style={{ borderColor: b.color, color: b.color }}>
                      {b.emoji} {b.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
