'use client';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodConsumption } from '@/lib/api/consumption';

interface HistoryTableProps {
  periods: PeriodConsumption[];
  caption?: string;
  isLoading?: boolean;
}

export function HistoryTable({ periods, caption, isLoading = false }: HistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="rounded-md border">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <Table>
      {caption ? <TableCaption>{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow>
          <TableHead>Periodo</TableHead>
          <TableHead className="text-right">Consumo (kWh)</TableHead>
          <TableHead className="text-right">Coste (€)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {periods.map((period) => (
          <TableRow key={period.period}>
            <TableCell className="font-medium">{period.period}</TableCell>
            <TableCell className="text-right">
              {period.consumptionKwh.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </TableCell>
            <TableCell className="text-right">
              {period.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
