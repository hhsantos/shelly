'use client';

import { useState } from 'react';

import { ErrorState } from '@/components/dashboard/error-state';
import { HistoryTable } from '@/components/dashboard/history-table';
import { PeriodSelect } from '@/components/dashboard/period-select';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonResponse, PeriodKey } from '@/lib/api/consumption';
import { useComparison } from '@/lib/hooks/use-consumption';

interface ComparisonViewProps {
  jwt: string;
}

function buildDeltaMetrics(data: ComparisonResponse | undefined) {
  return [
    {
      id: 'delta-consumption',
      title: 'Variación de consumo',
      value: data
        ? `${data.deltaConsumption.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
        : '--',
      trend: data ? data.deltaConsumption : undefined,
      suffix: ' kWh',
      description: `${data?.targetLabel ?? 'Periodo actual'} vs ${data?.baselineLabel ?? 'Periodo base'}`,
    },
    {
      id: 'delta-cost',
      title: 'Variación de coste',
      value: data ? `${data.deltaCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} €` : '--',
      trend: data ? data.deltaCost : undefined,
      suffix: ' €',
      description: `${data?.targetLabel ?? 'Periodo actual'} vs ${data?.baselineLabel ?? 'Periodo base'}`,
    },
  ];
}

export function ComparisonView({ jwt }: ComparisonViewProps) {
  const [baseline, setBaseline] = useState<PeriodKey>('month');
  const [target, setTarget] = useState<PeriodKey>('month');

  const { data, isLoading, isError, refetch, error } = useComparison({ jwt, baseline, target });

  if (isError) {
    return <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Comparativa por periodos</h1>
          <p className="text-sm text-muted-foreground">
            Compara periodos equivalentes para detectar incrementos de consumo y coste.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <PeriodSelect value={baseline} onChange={setBaseline} label="Periodo base" />
          <PeriodSelect value={target} onChange={setTarget} label="Periodo a comparar" />
        </div>
      </div>

      <SummaryCards metrics={buildDeltaMetrics(data)} isLoading={isLoading} />

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <HistoryTable periods={data.baseline} caption={data.baselineLabel} />
          <HistoryTable periods={data.target} caption={data.targetLabel} />
        </div>
      ) : null}
    </div>
  );
}
