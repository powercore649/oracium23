import TemplatesClient from '@/components/TemplatesClient';
import PublicNav from '@/components/PublicNav';

export const metadata = {
  title: 'Templates de serveur Discord — Bumpify Directory',
};

export default function TemplatesPage() {
  return (
    <div>
      <div className="hex-field" />
      <PublicNav current="/templates" />

      <header className="hero">
        <h1>Templates de <span>serveur Discord</span>.</h1>
        <p className="lead">
          Chaque lien ci-dessous a été vérifié manuellement — cliquez, choisissez un nom, et Discord
          crée immédiatement un nouveau serveur avec la structure complète (salons, catégories, rôles).
        </p>
      </header>

      <TemplatesClient />

      <footer className="footer-pub">
        <span>Templates vérifiés manuellement — liste amenée à s'enrichir</span>
        <span className="mono">Bêta 2.1</span>
      </footer>
    </div>
  );
}
