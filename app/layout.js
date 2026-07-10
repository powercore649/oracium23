import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import SiteCustomizer from '@/components/SiteCustomizer';
import AuthProvider from '@/components/AuthProvider';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const body = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata = {
  title: 'Bumpify Directory — Trouvez votre prochain serveur Discord',
  description: "L'annuaire des serveurs Discord propulsés par Bumpify, avec de vraies données en direct.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <AuthProvider>
          {children}
          <SiteCustomizer />
        </AuthProvider>
      </body>
    </html>
  );
}
