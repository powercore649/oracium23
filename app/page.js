import DirectoryClient from '@/components/DirectoryClient';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Bumpify Directory',
  url: 'https://zyntra.dpdns.org',
  description: "L'annuaire des serveurs Discord propulsés par Bumpify, avec de vraies données en direct.",
};

export default function DirectoryHome() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="hex-field" />
      <PublicNav current="/" />

      <header className="hero">
        <h1>Trouvez votre prochain <span>serveur Discord</span>.</h1>
        <p className="lead">
          L'annuaire des serveurs propulsés par Bumpify — données réelles, mises à jour en direct
          depuis le réseau de bump : membres, description, tags et nombre de bumps.
        </p>
      </header>

      <DirectoryClient />

      <PublicFooter />
    </div>
  );
}
