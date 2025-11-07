import Credentials from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';

export const authConfig: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Strapi',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const baseUrl = process.env.SHELLY_BASE_URL;
        if (!baseUrl) {
          throw new Error('SHELLY_BASE_URL no está configurado.');
        }

        const response = await fetch(`${baseUrl}/api/auth/local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          jwt: data.jwt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.jwt = (user as any).jwt;
        token.user = {
          id: (user as any).id,
          email: (user as any).email,
          username: (user as any).username,
        };
      }

      if (trigger === 'update' && session) {
        token.user = { ...token.user, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      session.jwt = token.jwt as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

export default authConfig;
