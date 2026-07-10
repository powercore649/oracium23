'use client';
import { useState } from 'react';

const LINKS = [
  { href: '/', label: 'Annuaire' },
  { href: '/leaderboard', label: 'Classement' },
  { href: '/trending', label: 'Tendances' },
  { href: '/new', label: 'Nouveaux' },
  { href: '/stats', label: 'Statistiques' },
  { href: '/templates', label: 'Templates' },
];

// Barre de navigation partagée par toutes les pages publiques du site.
// `current` = le chemin de la page en cours, pour ne pas se relier soi-même.
// En dessous de 760px, les liens passent dans un menu hamburger.
export default function PublicNav({ current = '/' }) {
  const [open, setOpen] = useState(false);
  const links = LINKS.filter((l) => l.href !== current);

  return (
    <nav className="nav-public">
      <a className="brand" href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span className="brand-mark">B</span> Bumpify Directory
        <span className="version-badge">Bêta 2.1</span>
      </a>

      <div className="nav-links-desktop" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {links.map((l) => (
          <a key={l.href} href={l.href} className="filter-chip">{l.label}</a>
        ))}
        <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" /> Données en direct
        </span>
      </div>

      <button
        className="nav-hamburger"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      {open && (
        <div className="nav-mobile-panel">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="filter-chip" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span className="live-dot" /> Données en direct
          </span>
        </div>
      )}
    </nav>
  );
}
