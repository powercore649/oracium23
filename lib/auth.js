import DiscordProvider from 'next-auth/providers/discord';

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.discordId = profile.id;
        token.banner = profile.banner || null;
        token.accentColor = typeof profile.accent_color === 'number' ? profile.accent_color : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.discordId = token.discordId;
        session.user.bannerUrl = token.banner
          ? `https://cdn.discordapp.com/banners/${token.discordId}/${token.banner}.${token.banner.startsWith('a_') ? 'gif' : 'png'}?size=600`
          : null;
        session.user.accentColor = token.accentColor !== null
          ? `#${token.accentColor.toString(16).padStart(6, '0')}`
          : null;
      }
      return session;
    },
  },
};
