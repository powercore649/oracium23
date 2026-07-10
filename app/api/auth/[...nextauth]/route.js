import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    // On garde l'ID Discord de l'utilisateur dans la session (utile plus
    // tard si on veut lier les votes/favoris à un vrai compte au lieu du
    // localStorage anonyme).
    async jwt({ token, profile }) {
      if (profile) token.discordId = profile.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.discordId = token.discordId;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
