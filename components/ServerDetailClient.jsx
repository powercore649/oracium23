'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatNumber, timeAgo, votes as votesStore } from '@/lib/utils';

export default function ServerDetailClient({ server }) {
  const [voted,      setVoted]      = useState(() => votesStore.hasVoted(server.guildId));
  const [voteCount,  setVoteCount]  = useState(server.totalVotes || 0);
  const [copied,     setCopied]     = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);

  const icon = server.guildIcon
    ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.guildIcon}.webp?size=128`
    : null;
  const initials = (server.guildName || '?').slice(0, 2).toUpperCase();
  const streakPct = Math.min(100, (server.bumpStreak || 0) / 30 * 100);

  const handleVote = async () => {
    if (voted) return;
    const added = votesStore.vote(server.guildId);
    if (!added) return;
    setVoted(true);
    setVoteCount(v => v + 1);
    await fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guildId: server.guildId }) }).catch(() => {});
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/server/${server.guildId}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeImgUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/badge/${server.guildId}`;
  const badgeMarkdown = `[![Bumpify](${badgeImgUrl})](${typeof window !== 'undefined' ? window.location.origin : ''}/server/${server.guildId})`;

  const handleCopyBadge = async () => {
    await navigator.clipboard.writeText(badgeMarkdown).catch(() => {});
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2000);
  };

  return (
    <main>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 6vw 0', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ color: 'var(--text-faint)', fontSize: 13, textDecoration: 'none' }}>← Annuaire</Link>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div className="detail-avatar">
            {icon
              ? <Image src={icon} alt={server.guildName} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 20 }} />
              : initials}
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700 }}>{server.guildName}</h1>
              {server.featured && <span className="featured-badge">⭐ Featured</span>}
              {server.trending && <span className="trending-badge">🔥 Trending</span>}
              {server.isNew    && <span className="new-badge">✨ Nouveau</span>}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 16, maxWidth: 540 }}>
              {server.description || 'Aucune description.'}
            </p>
            {(server.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {server.tags.map(t => (
                  <Link key={t} href={`/?tags=${t}`} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: 'var(--surface-3)', color: 'var(--text-dim)', textDecoration: 'none' }}>
                    {t}
                  </Link>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {server.inviteLink && (
                <a href={server.inviteLink} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                  Rejoindre →
                </a>
              )}
              <button className={`vote-btn ${voted ? 'voted' : ''}`} onClick={handleVote} disabled={voted}>
                👍 {voted ? 'Voté !' : 'Voter'} · {formatNumber(voteCount)}
              </button>
              <button className={`share-btn ${copied ? 'copied' : ''}`} onClick={handleShare}>
                {copied ? '✅ Lien copié !' : '🔗 Partager'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 6vw 8vh', position: 'relative', zIndex: 1 }}>
        <div className="detail-stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: '👥 Membres',     value: formatNumber(server.memberCount) },
            { label: '🚀 Bumps totaux',value: formatNumber(server.bumpCount)   },
            { label: '📅 Cette semaine',value: formatNumber(server.weeklyBumps)},
            { label: '👍 Votes',       value: formatNumber(voteCount)           },
            { label: '⭐ Score réseau', value: formatNumber(server.score)       },
            { label: '🏆 Rang',        value: `#${server.rank}`                },
          ].map(s => (
            <div key={s.label} className="detail-stat">
              <div className="detail-stat-num">{s.value}</div>
              <div className="detail-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Streak bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>🔥 Streak de bumps</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--line)' }}>
              {server.bumpStreak || 0} / 30 jours
            </span>
          </div>
          <div className="streak-bar">
            <div className="streak-fill" style={{ width: `${streakPct}%` }} />
          </div>
          {server.lastBump && (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
              Dernier bump {timeAgo(server.lastBump)}
            </p>
          )}
        </div>

        {/* Langue */}
        {server.language && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 13.5, marginBottom: 24 }}>
            <span>🌍</span>
            <span>Langue : <strong style={{ color: 'var(--text)' }}>{server.language.toUpperCase()}</strong></span>
          </div>
        )}

        {/* Badge embarquable */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>🏷️ Badge embarquable</div>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 14 }}>
            Affiche les stats en direct de ton serveur sur ton propre site ou dans ton README GitHub.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeImgUrl} alt="Badge Bumpify" style={{ marginBottom: 14, display: 'block' }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ fontSize: 11.5, background: 'var(--surface-3, #1a1c22)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
              {badgeMarkdown}
            </code>
            <button className={`share-btn ${badgeCopied ? 'copied' : ''}`} onClick={handleCopyBadge}>
              {badgeCopied ? '✅ Copié !' : '📋 Copier (Markdown)'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
