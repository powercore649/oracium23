'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { formatNumber, timeAgo, votes as votesStore } from '@/lib/utils';

const REPORT_REASONS = [
  { value: 'nsfw_not_tagged', label: 'Contenu NSFW non déclaré' },
  { value: 'scam', label: 'Arnaque / phishing' },
  { value: 'hate_speech', label: 'Haine / harcèlement' },
  { value: 'illegal', label: 'Contenu illégal' },
  { value: 'fake_description', label: 'Description trompeuse' },
  { value: 'other', label: 'Autre' },
];

export default function ServerDetailClient({ server }) {
  const { data: session, status } = useSession();
  const [voted,      setVoted]      = useState(() => votesStore.hasVoted(server.guildId));
  const [voteCount,  setVoteCount]  = useState(server.totalVotes || 0);
  const [copied,     setCopied]     = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);

  // Signalement
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState('idle'); // idle | sending | sent | error

  // Avis
  const [reviews, setReviews] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    fetch(`/api/reviews/${server.guildId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setReviews(data.reviews || []);
        setAvgRating(data.averageRating);
        setReviewCount(data.count || 0);
        const mine = session?.user?.discordId && data.reviews?.find((r) => r.userId === session.user.discordId);
        if (mine) { setMyRating(mine.rating); setMyComment(mine.comment || ''); }
      })
      .catch(() => {});
  }, [server.guildId, session?.user?.discordId]);

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

  const submitReport = async () => {
    if (status !== 'authenticated') { signIn('discord'); return; }
    setReportStatus('sending');
    try {
      const r = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: server.guildId, reason: reportReason, details: reportDetails }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'failed');
      setReportStatus('sent');
      setTimeout(() => { setReportOpen(false); setReportStatus('idle'); setReportDetails(''); }, 1800);
    } catch {
      setReportStatus('error');
    }
  };

  const submitReview = async () => {
    if (status !== 'authenticated') { signIn('discord'); return; }
    if (myRating < 1) return;
    setReviewStatus('sending');
    try {
      const r = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: server.guildId, rating: myRating, comment: myComment }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'failed');
      setReviewStatus('sent');
      // Recharge les avis pour refléter le tien immédiatement
      const refreshed = await fetch(`/api/reviews/${server.guildId}`, { cache: 'no-store' }).then((res) => res.json());
      setReviews(refreshed.reviews || []);
      setAvgRating(refreshed.averageRating);
      setReviewCount(refreshed.count || 0);
      setTimeout(() => setReviewStatus('idle'), 1800);
    } catch {
      setReviewStatus('error');
    }
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
              <button className="share-btn" onClick={() => setReportOpen(true)} style={{ marginLeft: 'auto' }}>
                🚩 Signaler
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modale de signalement */}
      {reportOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setReportOpen(false)}
        >
          <div
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, maxWidth: 440, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>🚩 Signaler ce serveur</div>
            {status !== 'authenticated' ? (
              <>
                <p style={{ fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 16 }}>
                  Connecte-toi avec Discord pour signaler un serveur.
                </p>
                <button className="discord-btn" onClick={() => signIn('discord')}>Se connecter avec Discord</button>
              </>
            ) : reportStatus === 'sent' ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-dim)' }}>✅ Signalement envoyé, merci — l'équipe va l'examiner.</p>
            ) : (
              <>
                <p style={{ fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 14 }}>
                  Explique ce qui ne va pas sur ce serveur. Vois aussi le{' '}
                  <a href="/reglement" style={{ color: 'var(--accent)' }}>règlement</a> pour ce qui est concerné.
                </p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="sort-select"
                  style={{ width: '100%', marginBottom: 10 }}
                >
                  {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value.slice(0, 500))}
                  placeholder="Détails (optionnel, 500 caractères max)"
                  rows={3}
                  className="search-input"
                  style={{ width: '100%', marginBottom: 14, resize: 'vertical' }}
                />
                {reportStatus === 'error' && (
                  <p style={{ fontSize: 12.5, color: '#f87171', marginBottom: 10 }}>
                    Une erreur est survenue (peut-être un signalement déjà envoyé récemment). Réessaie plus tard.
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="filter-chip" onClick={() => setReportOpen(false)}>Annuler</button>
                  <button className="share-btn" disabled={reportStatus === 'sending'} onClick={submitReport}>
                    {reportStatus === 'sending' ? 'Envoi…' : 'Envoyer le signalement'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

        {/* Avis et notes */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>⭐ Avis</div>
            {avgRating != null && (
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                <strong style={{ color: 'var(--text)' }}>{avgRating}</strong>/5 · {reviewCount} avis
              </div>
            )}
          </div>

          {/* Laisser un avis */}
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {status !== 'authenticated' ? (
              <button className="discord-btn" onClick={() => signIn('discord')}>Se connecter pour laisser un avis</button>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMyRating(n)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, padding: 0, color: n <= myRating ? '#fbbf24' : 'var(--border)' }}
                      aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value.slice(0, 500))}
                  placeholder="Ton avis (optionnel, 500 caractères max)"
                  rows={2}
                  className="search-input"
                  style={{ width: '100%', marginBottom: 10, resize: 'vertical' }}
                />
                <button className="share-btn" disabled={myRating < 1 || reviewStatus === 'sending'} onClick={submitReview}>
                  {reviewStatus === 'sending' ? 'Envoi…' : reviewStatus === 'sent' ? '✅ Avis publié !' : 'Publier mon avis'}
                </button>
              </>
            )}
          </div>

          {/* Liste des avis */}
          {reviews === null && <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Chargement des avis…</div>}
          {reviews?.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Aucun avis pour l'instant — sois le premier !</div>}
          {reviews?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 340, overflowY: 'auto' }}>
              {reviews.map((r) => (
                <div key={r.userId} style={{ display: 'flex', gap: 10 }}>
                  <div className="server-avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                    {r.avatar ? <img src={r.avatar} alt="" /> : (r.username || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.username || 'Utilisateur'}</span>
                      <span style={{ color: '#fbbf24', fontSize: 12 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
