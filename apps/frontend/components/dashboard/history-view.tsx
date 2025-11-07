'use client';

import { useState } from 'react';

import { ConsumptionChart } from '@/components/dashboard/consumption-chart';
import { ErrorState } from '@/components/dashboard/error-state';
import { HistoryTable } from '@/components/dashboard/history-table';
import { PeriodSelect } from '@/components/dashboard/period-select';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodConsumption, PeriodKey } from '@/lib/api/consumption';
import { useHistory } from '@/lib/hooks/use-consumption';

interface HistoryViewProps {
  jwt: string;
}

function buildFallbackData(): PeriodConsumption[] {
  return Array.from({ length: 6 }).map((_, index) => ({
    period: `Periodo ${index + 1}`,
    consumptionKwh: 0,
    cost: 0,
  }));
}

export function HistoryView({ jwt }: HistoryViewProps) {
  const [range, setRange] = useState<PeriodKey>('month');
  const { data, isLoading, isError, refetch, error } = useHistory({ jwt, range });

  if (isError) {
    return <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  }

  const periods = data?.periods ?? buildFallbackData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Histórico de consumo</h1>
          <p className="text-sm text-muted-foreground">
            Analiza la evolución del consumo y coste por periodos.
          </p>
        </div>
        <PeriodSelect value={range} onChange={setRange} label="Agrupar por" />
      </div>

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <ConsumptionChart data={periods} title="Consumo y coste acumulados" variant="bar" />
      )}

      <HistoryTable
        periods={periods}
        caption="Valores agregados en el periodo seleccionado"
        isLoading={isLoading}
      />
    </div>
  );
}
