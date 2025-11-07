import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { HistoryView } from '@/components/dashboard/history-view';
import { authConfig } from '@/lib/auth';

export default async function HistoryPage() {
  const session = await getServerSession(authConfig);

  if (!session?.jwt) {
    redirect('/');
  }

  return <HistoryView jwt={session.jwt} />;
}
