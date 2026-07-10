import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Indispensable : cette route dépend de la session (cookies) et fait un
// fetch no-store vers le bridge — jamais de pré-génération statique.
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, must-revalidate' };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const bridgeUrl = process.env.BRIDGE_URL;
  if (!bridgeUrl) {
    console.error('❌ /api/account : BRIDGE_URL manquant.');
    return NextResponse.json({ error: 'BRIDGE_URL manquant côté serveur' }, { status: 500, headers: NO_STORE_HEADERS });
  }

  try {
    const res = await fetch(`${bridgeUrl}/public/user/${session.user.discordId}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'bridge_error');
    return NextResponse.json(data, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error('❌ /api/account a échoué. BRIDGE_URL =', bridgeUrl);
    console.error(err);
    return NextResponse.json({
      error: err.message,
      cause: err.cause ? String(err.cause) : null,
    }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
