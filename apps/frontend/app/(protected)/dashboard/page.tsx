import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authConfig } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.jwt) {
    redirect('/');
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Panel privado</h1>
      <p className="text-muted-foreground">
        Tu token JWT de Strapi está disponible en el objeto de sesión y puede utilizarse
        para llamar a endpoints protegidos.
      </p>
      <code className="rounded bg-muted p-4 text-sm">
        {JSON.stringify({ jwt: session.jwt, user: session.user }, null, 2)}
      </code>
    </div>
  );
}
