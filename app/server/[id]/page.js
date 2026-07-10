export const dynamic = 'force-dynamic';
import { fetchServers } from '@/lib/bridge';
import { computeScore, formatNumber, isTrending, isNew, timeAgo } from '@/lib/utils';
import ServerDetailClient from '@/components/ServerDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 30;

export async function generateMetadata({ params }) {
  const servers = await fetchServers().catch(() => []);
  const server  = servers.find(s => s.guildId === params.id);
  if (!server) return { title: 'Serveur introuvable — Bumpify' };
  return { title: `${server.guildName} — Bumpify Directory`, description: server.description || 'Serveur Discord' };
}

export default async function ServerDetailPage({ params }) {
  const servers = await fetchServers().catch(() => []);
  const server  = servers.find(s => s.guildId === params.id);
  if (!server) notFound();

  const sorted = [...servers].sort((a, b) => computeScore(b) - computeScore(a));
  const rank   = sorted.findIndex(s => s.guildId === params.id) + 1;

  return (
    <ServerDetailClient
      server={{ ...server, score: computeScore(server), rank, trending: isTrending(server), isNew: isNew(server) }}
    />
  );
}
