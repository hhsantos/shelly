import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    jwt?: string;
    user?: {
      id: string | number;
      email?: string | null;
      username?: string | null;
    } | null;
  }

  interface User {
    id: string | number;
    email?: string | null;
    username?: string | null;
    jwt?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    jwt?: string;
    user?: {
      id: string | number;
      email?: string | null;
      username?: string | null;
    } | null;
  }
}
