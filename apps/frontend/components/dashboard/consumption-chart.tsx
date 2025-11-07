'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodConsumption } from '@/lib/api/consumption';

interface ConsumptionChartProps {
  data: PeriodConsumption[];
  title: string;
  variant?: 'line' | 'bar';
}

const tooltipFormatter = (value: number, name: string) => [
  value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
  name,
];

export function ConsumptionChart({ data, title, variant = 'line' }: ConsumptionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" stroke="currentColor" />
              <YAxis stroke="currentColor" tickFormatter={(value) => `${value}`} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="consumptionKwh" stroke="#2563eb" name="Consumo (kWh)" />
              <Line type="monotone" dataKey="cost" stroke="#16a34a" name="Coste (€)" />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" stroke="currentColor" />
              <YAxis stroke="currentColor" tickFormatter={(value) => `${value}`} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="consumptionKwh" fill="#2563eb" name="Consumo (kWh)" />
              <Bar dataKey="cost" fill="#16a34a" name="Coste (€)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
