'use client';

import { useMemo, useState } from 'react';

import { ConsumptionChart } from '@/components/dashboard/consumption-chart';
import { ErrorState } from '@/components/dashboard/error-state';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailySummary } from '@/lib/hooks/use-consumption';

interface DailySummaryProps {
  jwt: string;
}

const DAYS_TO_LIST = 7;

function buildDateOptions() {
  return Array.from({ length: DAYS_TO_LIST }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return {
      value: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }),
    };
  });
}

export function DailySummary({ jwt }: DailySummaryProps) {
  const options = useMemo(buildDateOptions, []);
  const [selectedDate, setSelectedDate] = useState(options[0]?.value ?? new Date().toISOString().slice(0, 10));

  const { data, isLoading, isError, error, refetch, isFetching } = useDailySummary({ jwt, date: selectedDate });

  const metrics = useMemo(
    () => [
      {
        id: 'consumption',
        title: 'Consumo diario',
        value: data
          ? `${data.totalConsumption.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`
          : '--',
        description: data ? `Registro del ${new Date(data.date).toLocaleDateString()}` : undefined,
        trend: data?.trendConsumption,
        suffix: '% vs día anterior',
      },
      {
        id: 'cost',
        title: 'Coste diario',
        value: data ? `${data.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} €` : '--',
        description: 'Incluye impuestos y cargos fijos',
        trend: data?.trendCost,
        suffix: '% vs día anterior',
      },
    ],
    [data],
  );

  if (isError) {
    return <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Resumen diario</h1>
          <p className="text-sm text-muted-foreground">Revisa el consumo y el coste total del día seleccionado.</p>
        </div>
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecciona un día" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SummaryCards metrics={metrics} isLoading={isLoading || isFetching} />

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : data ? (
        <ConsumptionChart data={data.breakdown} title="Consumo y coste por franja" />
      ) : null}
    </div>
  );
}
