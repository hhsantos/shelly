import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { ComparisonView } from '@/components/dashboard/comparison-view';
import { authConfig } from '@/lib/auth';

export default async function ComparisonPage() {
  const session = await getServerSession(authConfig);

  if (!session?.jwt) {
    redirect('/');
  }

  return <ComparisonView jwt={session.jwt} />;
}
