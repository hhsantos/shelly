import { ReactNode } from 'react';

import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Panel de consumo energético</h1>
            <p className="text-sm text-muted-foreground">
              Visualiza el rendimiento de tus instalaciones y toma decisiones informadas.
            </p>
          </div>
          <DashboardNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
