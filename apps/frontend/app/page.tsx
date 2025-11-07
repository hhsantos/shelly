'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <section className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-semibold">Bienvenido a Shelly</h1>
        <p className="text-muted-foreground">
          Esta interfaz en Next.js 13 consume el backend de Strapi usando NextAuth.
          Configura tus variables de entorno y autentícate para ver contenido protegido.
        </p>
      </section>

      {status === 'authenticated' ? (
        <div className="space-y-4 text-center">
          <p>
            Sesión iniciada como <strong>{session?.user?.email}</strong>.
          </p>
          <Button variant="secondary" onClick={() => signOut({ callbackUrl: '/' })}>
            Cerrar sesión
          </Button>
        </div>
      ) : (
        <div className="space-y-2 text-center">
          <Button onClick={() => signIn('credentials')}>Iniciar sesión</Button>
          <p className="text-sm text-muted-foreground">
            Asegúrate de crear un usuario en Strapi con rol autorizado.
          </p>
        </div>
      )}
    </main>
  );
}
