'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface SummaryMetric {
  id: string;
  title: string;
  value: string;
  description?: string;
  trend?: number;
  suffix?: string;
}

interface SummaryCardsProps {
  metrics: SummaryMetric[];
  isLoading?: boolean;
}

export function SummaryCards({ metrics, isLoading = false }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const trend = metric.trend ?? 0;
        const isPositive = trend >= 0;
        return (
          <Card key={metric.id}>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              {metric.description ? <CardDescription>{metric.description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold">{metric.value}</p>
              {metric.trend !== undefined ? (
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {isPositive ? (
                    <TrendingUp aria-hidden className="h-4 w-4" />
                  ) : (
                    <TrendingDown aria-hidden className="h-4 w-4" />
                  )}
                  {Math.abs(trend).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                  {metric.suffix}
                </span>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
