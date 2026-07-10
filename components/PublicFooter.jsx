const SUPPORT_DISCORD = 'https://discord.gg/ts5mh326ew';

export default function PublicFooter() {
  return (
    <footer className="footer-pub" style={{ flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
      <span>Bumpify Directory — alimenté par de vraies données du réseau Bumpify</span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/cgu" style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>CGU</a>
        <a href="/reglement" style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>Règlement</a>
        <a href={SUPPORT_DISCORD} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>
          Support Discord ↗
        </a>
        <span className="mono">Bêta 2.1</span>
      </div>
    </footer>
  );
}
